const net = require("net")
const SmartBuffer = require("smart-buffer").SmartBuffer
const EventEmitter = require("events").EventEmitter
const utils = require("./utils.js")

const defaultPacketSizes = {
	0x00: 131,
	0x0d: 66,
	0x08: 10,
	0x05: 9
}
const maxBuffer = 5000
function readString(buffer) {
	return buffer.readString(64, "ascii").trim()
}
function readFixedShort(buffer) {
	const data = buffer.readUInt16BE()
	const fraction = (data << 27) >>> 27
	let integer = (data << 17) >>> 22
	const sign = data >>> 15
	if (sign) {
		integer = -(integer + 1)
		return integer - (fraction / 32)
	} else {
		return integer + (fraction / 32)
	}
}
function fixedShort(num) {
	const fraction = Math.abs((num - Math.trunc(num)) * 32)
	console.log("fraction", fraction)
	let integer = Math.abs(Math.trunc(num))
	let sign
	if (Math.sign(num) == -1) {
		sign = 1
		integer = Math.max(integer - 1, 0)
	} else {
		sign = 0
	}
	console.log((fraction | (integer << 5) | sign << 15).toString(2))
	return (fraction | (integer << 5) | sign << 15)
}
function tcpPacketHandler(socket, data) {
	if (data) socket.buffer.writeBuffer(data)
	socket.buffer.readOffset = 0
	const length = socket.buffer.remaining()
	const type = socket.buffer.readUInt8()
	const size = socket.client.packetSizes[type]
	if (!size || length < size) {
		console.log("not enough", { size, bufferLength: length, type })
		if (socket.buffer.remaining() > maxBuffer) return socket.destroy()
		return
	}
	switch (type) {
		case 0x00:
			if (socket.authed) {
				console.log("attempted reauth")
				return socket.destroy()
			}
			socket.authed = true
			const version = socket.buffer.readUInt8()
			if (version !== 0x07) return socket.destroy()
			const username = readString(socket.buffer)
			const key = readString(socket.buffer)
			socket.buffer.readUInt8() // unused byte
			socket.client.server.emit("clientConnected", socket.client, {
				username, key
			})
			break
		case 0x05:
			socket.client.emit("setBlock", {
				x: socket.buffer.readUInt16BE(),
				y: socket.buffer.readUInt16BE(),
				z: socket.buffer.readUInt16BE(),
				mode: socket.buffer.readUInt8(),
				type: socket.buffer.readUInt8()
			})
			break
		case 0x0d:
			socket.buffer.readUInt8()
			const message = readString(socket.buffer)
			socket.client.emit("message", message)
			break
		case 0x08:
			socket.buffer.readInt8() // unused
			const position = {
				x: readFixedShort(socket.buffer),
				y: readFixedShort(socket.buffer),
				z: readFixedShort(socket.buffer),
			}
			const orientation = {
				yaw: socket.buffer.readUInt8(),
				pitch: socket.buffer.readUInt8()
			}
			socket.client.emit("position", position, orientation)
			break
	}
	socket.buffer.readOffset = size
	socket.buffer = SmartBuffer.fromBuffer(socket.buffer.readBuffer(socket.buffer.remaining()))
	if (socket.buffer.remaining()) tcpPacketHandler(socket)
}
function padString(string) {
	const buffer = new SmartBuffer({ size: 64 }).writeString(string, "ascii")
	buffer.writeString(" ".repeat(64 - buffer.writeOffset))
	return buffer.toBuffer()
}
class Client extends EventEmitter {
	constructor(socket, server) {
		super()
		this.socket = socket
		this.server = server
		this.packetSizes = JSON.parse(JSON.stringify(defaultPacketSizes))
	}
	message(message, messageType = -1, continueAdornment = ">") {
		const asciiBuffer = SmartBuffer.fromBuffer(Buffer.from(message, "ascii"))
		const continueAsciiBuffer = Buffer.from(continueAdornment, "ascii")
		if (continueAsciiBuffer.length > 63) throw new Error("Continue adornment must not be over 63 characters long.")
		let writeContinueAdornment = false
		while (asciiBuffer.remaining()) {
			const buffer = new SmartBuffer({ size: 66 }).writeUInt8(0x0d).writeInt8(messageType)
			if (writeContinueAdornment) buffer.writeBuffer(continueAsciiBuffer)
			buffer.writeBuffer(asciiBuffer.readBuffer(66 - buffer.writeOffset))
			buffer.writeString(" ".repeat(66 - buffer.writeOffset)) // padding
			this.socket.write(buffer.toBuffer())
			writeContinueAdornment = true
		}
	}
	async loadLevel(data, x, y, z, processed = false, callback) { // Unprocessed data means the data is just an uncompressed buffer of block types with the volume count missing.
		const initializeBuffer = new SmartBuffer({ size: 1 }).writeUInt8(0x02)
		this.socket.write(initializeBuffer.toBuffer())

		let compressedPayloadBuffer = new Promise(async (resolve) => {
			let compressedPayloadBuffer = null
			if (processed) {
				compressedPayloadBuffer = SmartBuffer.fromBuffer(data)
				resolve(compressedPayloadBuffer)
			} else {
				resolve(SmartBuffer.fromBuffer(await utils.processLevel(data, x, y, z)))
			}
		})
		compressedPayloadBuffer = await compressedPayloadBuffer

		while (compressedPayloadBuffer.remaining()) {
			const remaining = compressedPayloadBuffer.remaining()
			const dataChunkBuffer = new SmartBuffer({ size: 1028 }).writeUInt8(0x03)
			dataChunkBuffer.writeUInt16BE(Math.min(remaining, 1024))
			dataChunkBuffer.writeBuffer(compressedPayloadBuffer.readBuffer(Math.min(remaining, 1024)))
			dataChunkBuffer.writeBuffer(Buffer.alloc(1024 - Math.min(remaining, 1024)))
			dataChunkBuffer.writeUInt8((remaining / compressedPayloadBuffer.length) * 255) // Progress
			this.socket.write(dataChunkBuffer.toBuffer())
		}

		const finalizeBuffer = new SmartBuffer({ size: 7 }).writeUInt8(0x04)
		finalizeBuffer.writeInt16BE(x)
		finalizeBuffer.writeInt16BE(y)
		finalizeBuffer.writeInt16BE(z)
		this.socket.write(finalizeBuffer.toBuffer())
		if (callback) callback()
	}
	disconnect(message) {
		const buffer = new SmartBuffer({ size: 65 }).writeUInt8(0x0e).writeString(message, "ascii")
		buffer.writeString(" ".repeat(65 - buffer.writeOffset))
		this.socket.write(buffer.toBuffer())
	}
	configureSpawn(id, username, x, y, z, yaw, pitch) {
		const buffer = new SmartBuffer({ size: 74 }).writeUInt8(0x07)
		buffer.writeInt8(id)
		buffer.writeBuffer(padString(username))
		buffer.writeUInt16BE(fixedShort(x))
		buffer.writeUInt16BE(fixedShort(y))
		buffer.writeUInt16BE(fixedShort(z))
		buffer.writeUInt8(yaw)
		buffer.writeUInt8(pitch)
		this.socket.write(buffer.toBuffer())
	}
	serverIdentification(serverName, motd, userType) {
		const buffer = new SmartBuffer({ size: 131 }).writeUInt8(0x00).writeUInt8(0x07)
		buffer.writeBuffer(padString(serverName))
		buffer.writeBuffer(padString(motd))
		buffer.writeUInt8(userType)
		this.socket.write(buffer.toBuffer())
	}
	setBlock(type, x, y, z) {
		const buffer = new SmartBuffer({ size: 8 }).writeUInt8(0x06)
		buffer.writeUInt16BE(x)
		buffer.writeUInt16BE(y)
		buffer.writeUInt16BE(z)
		buffer.writeUInt8(type)
		this.socket.write(buffer.toBuffer())
	}
	absolutePositionUpdate(id, x, y, z, yaw, pitch) {
		const buffer = new SmartBuffer({ size: 10 }).writeUInt8(0x08)
		buffer.writeInt8(id)
		buffer.writeUInt16BE(fixedShort(x))
		buffer.writeUInt16BE(fixedShort(y))
		buffer.writeUInt16BE(fixedShort(z))
		buffer.writeUInt8(yaw)
		buffer.writeUInt8(pitch)
		this.socket.write(buffer.toBuffer())
	}
	despawnPlayer(id) {
		const buffer = new SmartBuffer({ size: 2 }).writeUInt8(0x0c)
		buffer.writeInt8(id)
		this.socket.write(buffer.toBuffer())
	}
}

return module.exports = class Server extends EventEmitter {
	constructor(port) {
		super()
		this.tcpServer = net.createServer()
		this.tcpServer.listen(port)
		this.tcpServer.on('connection', (socket) => {
			const client = new Client(socket, this)
			socket.client = client
			socket.authed = false
			socket.buffer = new SmartBuffer()
			socket.on('data', (data) => {
				tcpPacketHandler(socket, data)
			})
			socket.on("error", () => {
				return socket.destroy()
			})
			socket.once('close', () => {
				client.emit("close")
			})
		})
		this.utils = utils
	}
}