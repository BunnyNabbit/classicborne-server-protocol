const net = require("net")
const SmartBuffer = require("smart-buffer").SmartBuffer
const EventEmitter = require("events").EventEmitter
const utils = require("./utils.js")
const extensions = [
	{
		name: "ClickDistance",
		version: 1
	},
	{
		name: "BlockDefinitions",
		version: 1
	},
	{
		name: "BlockDefinitionsExt",
		version: 2
	},
	{
		name: "InventoryOrder",
		version: 1
	},
	{
		name: "CustomBlocks",
		version: 1
	},
	{
		name: "EnvMapAspect",
		version: 1
	},
	{
		name: "BlockPermissions",
		version: 1
	},
	{
		name: "HeldBlock",
		version: 1
	},
	{
		name: "ExtPlayerList",
		version: 2
	},
	{
		name: "EntityProperty",
		version: 1
	}
]
const defaultPacketSizes = {
	0x00: 131,
	0x0d: 66,
	0x08: 10,
	0x05: 9,
	0x47: 1
}
const maxBuffer = 5000
const environmentProperties = ["sidesId", "edgeId", "edgeHeight", "cloudsHeight", "maxFog", "cloudsSpeed", "weatherFade", "useExponentialFog", "sidesOffset"]
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
	let integer = Math.abs(Math.trunc(num))
	let sign
	if (Math.sign(num) == -1) {
		sign = 1
		integer = Math.max(integer - 1, 0)
	} else {
		sign = 0
	}
	return (fraction | (integer << 5) | sign << 15)
}
function tcpPacketHandler(socket, data) {
	if (data) socket.buffer.writeBuffer(data)
	socket.buffer.readOffset = 0
	const length = socket.buffer.remaining()
	const type = socket.buffer.readUInt8()
	const size = socket.client.packetSizes[type]
	if (!size || length < size) {
		socket.buffer.writeOffset = length // we are expecting the buffer to be expanded, so set the writeOffset to end of the buffer
		if (socket.buffer.remaining() > maxBuffer) return socket.destroy()
		return
	}
	switch (type) {
		case 0x00:
			if (socket.client.authed || socket.client.cpeNegotiating) {
				return socket.destroy()
			}
			const version = socket.buffer.readUInt8()
			if (version !== 0x07) return socket.destroy()
			const username = readString(socket.buffer)
			const key = readString(socket.buffer)
			const padding = socket.buffer.readUInt8()
			if (padding == 0x42 && socket.client.server.cpeEnabled) {
				// ExtInfo
				socket.client.cpeNegotiating = true
				const buffer = new SmartBuffer({ size: 67 }).writeUInt8(0x10)
				buffer.writeBuffer(padString(socket.client.server.appName))
				buffer.writeUInt16BE(extensions.length)
				socket.write(buffer.toBuffer())
				extensions.forEach(extension => {
					// ExtEntry
					const buffer = new SmartBuffer({ size: 69 }).writeUInt8(0x11)
					buffer.writeBuffer(padString(extension.name))
					buffer.writeInt32BE(extension.version)
					socket.write(buffer.toBuffer())
				})
				socket.client.packetSizes[0x10] = 67
				socket.client.packetSizes[0x11] = 69
				socket.client.cpeExtensions = []
				socket.client.cpeExtensionsCount = 0
				socket.client.once("extensions", (extensions) => {
					socket.client.authed = true
					socket.client.server.emit("clientConnected", socket.client, {
						username, key, extensions
					})
					// resolve()
				})
				// new Promise((resolve) => {

				// })
			} else {
				socket.client.authed = true
				socket.client.server.emit("clientConnected", socket.client, {
					username, key
				})
			}
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
			const heldBlock = socket.buffer.readUInt8()
			const position = {
				x: readFixedShort(socket.buffer),
				y: readFixedShort(socket.buffer),
				z: readFixedShort(socket.buffer),
			}
			const orientation = {
				yaw: socket.buffer.readUInt8(),
				pitch: socket.buffer.readUInt8()
			}
			socket.client.emit("position", position, orientation, heldBlock)
			break
		// Extensions
		case 0x10: // ExtInfo
			socket.client.appName = readString(socket.buffer)
			socket.client.cpeExtensionsCount = socket.buffer.readInt16BE()
			if (socket.client.cpeExtensionsCount == 0) socket.client.emit("extensions", [])
			break
		case 0x11: // ExtInfo
			if (socket.client.authed) return socket.destroy()
			if (!socket.client.cpeExtensions) return socket.destroy()
			const extension = {
				name: readString(socket.buffer),
				version: socket.buffer.readInt32BE()
			}
			switch (extension.name) {
				case "CustomBlocks":
					socket.client.packetSizes[0x13] = 2
					break
			}
			socket.client.cpeExtensions.push(extension)
			if (socket.client.cpeExtensionsCount == socket.client.cpeExtensions.length) socket.client.emit("extensions", socket.client.cpeExtensions)
			break
		case 0x13: // CustomBlockSupportLevel 
			const customBlocksSupportLevel = socket.buffer.readUInt8()
			if (socket.client.customBlockSupport != null) {
				socket.client.customBlockSupport = customBlocksSupportLevel
			}
			break
		case 0x47: // part of GET for WebSocket
			if (socket.client.getChecked || !socket.client.server.httpServer || !socket.client.server.isTrustedWebSocketProxy(socket.remoteAddress)) return // can trigger multiple times
			socket.client.getChecked = true
			socket.client.server.httpServer.upgradeSocketToHttp(socket, socket.buffer.toBuffer())
			socket.client.usingWebSocket = true
			return
	}
	socket.client.getChecked = true
	socket.buffer = SmartBuffer.fromBuffer(socket.buffer.readBuffer(socket.buffer.remaining()))
	if (socket.buffer.remaining()) tcpPacketHandler(socket)
}
function padString(string) {
	const buffer = new SmartBuffer({ size: 64 }).writeString(string, "ascii")
	buffer.writeString(" ".repeat(64 - buffer.writeOffset))
	return buffer.toBuffer()
}
function isTrustedWebSocketProxy(remoteAddress) {
	if (remoteAddress == "::ffff:34.223.5.250") return true // ClassiCube's WebSocket proxy
	return false
}
class SocketImpostor extends EventEmitter {
	constructor(websocket) {
		super()
		this.websocket = websocket
		websocket.on("message", data => {
			this.emit("data", data)
		})
		this.buffer = new SmartBuffer()
	}
	write(buffer) {
		try {
			this.websocket.send(buffer)
		} catch (error) {
			console.error(error)
		}
	}
	destroy() {
		this.websocket.close()
	}
}
class Client extends EventEmitter {
	constructor(socket, server) {
		super()
		this.socket = socket
		this.server = server
		this.usingWebSocket = false
		this.packetSizes = JSON.parse(JSON.stringify(defaultPacketSizes))
		this.authed = false
		this.cpeNegotiating = false
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
	async loadLevel(data, x, y, z, processed = false, callback, preFinalize) { // Unprocessed data means the data is just an uncompressed buffer of block types with the volume count missing.
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
		if (preFinalize) preFinalize()
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
	updateUserType(userType) {
		const buffer = new SmartBuffer({ size: 2 }).writeUInt8(0x0f)
		buffer.writeInt8(userType)
		this.socket.write(buffer.toBuffer())
	}
	// Extensions
	setClickDistance(distance) {
		const buffer = new SmartBuffer({ size: 3 }).writeUInt8(0x12)
		buffer.writeInt16BE(distance)
		this.socket.write(buffer.toBuffer())
	}
	defineBlock(block) {
		const buffer = new SmartBuffer({ size: 80 }).writeUInt8(0x23)
		buffer.writeUInt8(block.id)
		buffer.writeBuffer(padString(block.name ?? ""))
		buffer.writeUInt8(block.collision ?? 2)
		buffer.writeUInt8(block.speed ?? 128)
		buffer.writeUInt8(block.topTexture ?? 0)
		buffer.writeUInt8(block.sideTexture ?? 0)
		buffer.writeUInt8(block.bottomTexture ?? 0)
		buffer.writeUInt8(block.transmitLight ?? 0)
		buffer.writeUInt8(block.walkSound ?? 0)
		buffer.writeUInt8(block.fullBright ?? 0)
		buffer.writeUInt8(block.shape ?? 16)
		buffer.writeUInt8(block.draw ?? 0)
		buffer.writeUInt8(block.fogDensity ?? 0)
		buffer.writeUInt8(block.fogR ?? 0)
		buffer.writeUInt8(block.fogG ?? 0)
		buffer.writeUInt8(block.fogB ?? 0)
		this.socket.write(buffer.toBuffer())
	}
	defineBlockExt(block) {
		const buffer = new SmartBuffer({ size: 88 }).writeUInt8(0x25)
		buffer.writeUInt8(block.id)
		buffer.writeBuffer(padString(block.name ?? ""))
		buffer.writeUInt8(block.collision ?? 2)
		buffer.writeUInt8(block.speed ?? 128)
		buffer.writeUInt8(block.topTexture ?? 0)
		buffer.writeUInt8(block.leftTexture ?? 0)
		buffer.writeUInt8(block.rightTexture ?? 0)
		buffer.writeUInt8(block.frontTexture ?? 0)
		buffer.writeUInt8(block.backTexture ?? 0)
		buffer.writeUInt8(block.bottomTexture ?? 0)
		buffer.writeUInt8(block.transmitLight ?? 0)
		buffer.writeUInt8(block.walkSound ?? 0)
		buffer.writeUInt8(block.fullBright ?? 0)
		buffer.writeUInt8(block.minX ?? 0)
		buffer.writeUInt8(block.minY ?? 0)
		buffer.writeUInt8(block.minZ ?? 0)
		buffer.writeUInt8(block.maxX ?? 16)
		buffer.writeUInt8(block.maxY ?? 16)
		buffer.writeUInt8(block.maxZ ?? 16)
		buffer.writeUInt8(block.draw ?? 0)
		buffer.writeUInt8(block.fogDensity ?? 0)
		buffer.writeUInt8(block.fogR ?? 0)
		buffer.writeUInt8(block.fogG ?? 0)
		buffer.writeUInt8(block.fogB ?? 0)
		this.socket.write(buffer.toBuffer())
	}
	removeBlockDefinition(blockId) {
		const buffer = new SmartBuffer({ size: 2 }).writeUInt8(0x24)
		buffer.writeUInt8(blockId)
		this.socket.write(buffer.toBuffer())
	}
	setInventoryOrder(id, order) {
		const buffer = new SmartBuffer({ size: 3 }).writeUInt8(0x2c)
		buffer.writeUInt8(order)
		buffer.writeUInt8(id)
		this.socket.write(buffer.toBuffer())
	}
	customBlockSupport(level) {
		const blockSupportBuffer = new SmartBuffer({ size: 2 }).writeUInt8(0x13).writeUInt8(level)
		this.socket.write(blockSupportBuffer.toBuffer())
	}
	texturePackUrl(url) {
		const texturePackBuffer = new SmartBuffer({ size: 65 }).writeUInt8(0x28)
		texturePackBuffer.writeBuffer(padString(url))
		this.socket.write(texturePackBuffer.toBuffer())
	}
	setEnvironmentProperties(environment) {
		for (const [key, value] of Object.entries(environment)) {
			const propertyIndex = environmentProperties.indexOf(key)
			if (propertyIndex !== -1) {
				const environmentPropertyBuffer = new SmartBuffer({ size: 6 }).writeUInt8(0x29)
				environmentPropertyBuffer.writeUInt8(propertyIndex)
				environmentPropertyBuffer.writeInt32BE(value)
				this.socket.write(environmentPropertyBuffer.toBuffer())
			}
		}
	}
	setBlockPermission(id, allowPlacement, allowDeletion) {
		const blockPermissionBuffer = new SmartBuffer({ size: 4 }).writeUInt8(0x1C)
		blockPermissionBuffer.writeUInt8(id)
		blockPermissionBuffer.writeUInt8(allowPlacement)
		blockPermissionBuffer.writeUInt8(allowDeletion)
		this.socket.write(blockPermissionBuffer.toBuffer())
	}
	configureSpawnExt(id, username, x, y, z, yaw, pitch, skin) {
		const buffer = new SmartBuffer({ size: 138 }).writeUInt8(0x21)
		buffer.writeInt8(id)
		buffer.writeBuffer(padString(username))
		buffer.writeBuffer(padString(skin))
		buffer.writeUInt16BE(fixedShort(x))
		buffer.writeUInt16BE(fixedShort(y))
		buffer.writeUInt16BE(fixedShort(z))
		buffer.writeUInt8(yaw)
		buffer.writeUInt8(pitch)
		this.socket.write(buffer.toBuffer())
	}
	addPlayerName(id, username, listName, groupName = "", groupOrder = 0) {
		const buffer = new SmartBuffer({ size: 196 }).writeUInt8(0x16)
		buffer.writeInt16BE(id)
		buffer.writeBuffer(padString(username))
		buffer.writeBuffer(padString(listName))
		buffer.writeBuffer(padString(groupName))
		buffer.writeUInt8(groupOrder)
		this.socket.write(buffer.toBuffer())
	}
	removePlayerName(id) {
		const buffer = new SmartBuffer({ size: 3 }).writeUInt8(0x18)
		buffer.writeInt16BE(id)
		this.socket.write(buffer.toBuffer())
	}
	setEntityProperty(id, propertyType, value) {
		const buffer = new SmartBuffer({ size: 7 }).writeUInt8(0x2a)
		buffer.writeUInt8(id)
		buffer.writeUInt8(propertyType)
		buffer.writeUInt32BE(value)
		this.socket.write(buffer.toBuffer())
	}
}

module.exports = class Server extends EventEmitter {
	constructor(port) {
		super()
		this.tcpServer = net.createServer()
		this.tcpServer.listen(port)
		this.tcpServer.on('connection', (socket) => {
			const client = new Client(socket, this)
			socket.client = client
			socket.buffer = new SmartBuffer()
			const currenzHandler = (data) => {
				tcpPacketHandler(socket, data)
			}
			socket.on('data', currenzHandler)
			socket.on("error", () => {
				return socket.destroy()
			})
			socket.once('close', () => {
				client.emit("close")
			})
			socket.once("upgradeWebSocket", (webSocket, request) => {
				socket.removeListener("data", currenzHandler)
				client.socket = new SocketImpostor(webSocket)
				client.socket.client = client
				client.socket.on("data", (data) => {
					tcpPacketHandler(client.socket, data)
				})
				client.httpRequest = request
			})
		})
		this.utils = utils
		this.cpeEnabled = true
		this.appName = "Classicborne Protocol"
		this.extensions = extensions
		this.isTrustedWebSocketProxy = isTrustedWebSocketProxy
	}
	setupWebSocketServer() {
		const UpgradingHttpServer = require("./UpgradingHttpServer.js")
		this.httpServer = new UpgradingHttpServer()
	}
}