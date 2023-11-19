const net = require("net")
const SmartBuffer = require("smart-buffer").SmartBuffer
const EventEmitter = require("events").EventEmitter

const knownPacketSizes = {
	0x00: 131,
	0x0d: 66,
	0x08: 10,
	0x05: 9
}
const maxBuffer = 5000
const gzipSync = require("zlib").gzipSync
function readString(buffer) {
	return buffer.readString(64, "ascii").trim()
}
function tcpPacketHandler(socket, data) {
	if (data) socket.buffer.writeBuffer(data)
	socket.buffer.readOffset = 0
	const length = socket.buffer.remaining()
	const type = socket.buffer.readUInt8()
	const size = knownPacketSizes[type]
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
			break;
		case 0x0d:
			socket.buffer.readUInt8()
			const message = readString(socket.buffer)
			socket.client.emit("message", message)
			break;
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
	}
	message(message) {
		const buffer = new SmartBuffer({ size: 66 }).writeUInt8(0x0d).writeInt8(-1).writeString(message, "ascii")
		buffer.writeString(" ".repeat(66 - buffer.writeOffset))
		this.socket.write(buffer.toBuffer())
	}
	loadLevel(data, x, y, z) {
		const initializeBuffer = new SmartBuffer({ size: 1 }).writeUInt8(0x02)
		this.socket.write(initializeBuffer.toBuffer())
		// TODO: This STUPID. doesn't chunk the compressed payload.
		let compressedPayloadBuffer = new SmartBuffer()
		compressedPayloadBuffer.writeInt32BE(64*64*64)
		compressedPayloadBuffer.writeBuffer(data)
		compressedPayloadBuffer = gzipSync(compressedPayloadBuffer.toBuffer())
		const dataChunkBuffer = new SmartBuffer({ size: 1028 }).writeUInt8(0x03)
		dataChunkBuffer.writeUInt16BE(compressedPayloadBuffer.length + 4)
		dataChunkBuffer.writeBuffer(compressedPayloadBuffer)
		dataChunkBuffer.writeBuffer(Buffer.alloc(1027 - dataChunkBuffer.writeOffset))
		dataChunkBuffer.writeUInt8(99)
		console.log(dataChunkBuffer.length)
		this.socket.write(dataChunkBuffer.toBuffer())

		const finalizeBuffer = new SmartBuffer({ size: 7 }).writeUInt8(0x04)
		finalizeBuffer.writeInt16BE(64)
		finalizeBuffer.writeInt16BE(64)
		finalizeBuffer.writeInt16BE(64)
		this.socket.write(finalizeBuffer.toBuffer())
	}
	disconnect(message) {
		const buffer = new SmartBuffer({ size: 65 }).writeUInt8(0x0e).writeString(message, "ascii")
		buffer.writeString(" ".repeat(65 - buffer.writeOffset))
		this.socket.write(buffer.toBuffer())
	}
	configureSpawn(id, username, x, y, z, yaw, pitch) {
		const buffer = new SmartBuffer({ size: 74 }).writeUInt8(0x07)
		buffer.writeInt8(-1)
		buffer.writeBuffer(padString(username))
		buffer.writeUInt16BE(0)
		buffer.writeUInt16BE(0)
		buffer.writeUInt16BE(0)
		buffer.writeUInt8(0)
		buffer.writeUInt8(0)
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
				console.log(data)
				console.log(data.length)
				tcpPacketHandler(socket, data)
			})
			socket.on("error", () => {
				return socket.destroy()
			})
			socket.once('close', () => {
			})
		})
	}
}