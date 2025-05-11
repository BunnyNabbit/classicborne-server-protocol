const DataTypes = require("./DataTypes.cjs")
const utils = require("../utils.js")
const { EventEmitter } = require("events")
const { SmartBuffer } = require("smart-buffer")

/** Represents a client */
class Client extends EventEmitter {
	/**Creates a Client instance
	 * @param {Socket} socket - The socket of the client
	 * @param {Server} server - The server instance
	 */
	constructor(socket, server) {
		super()
		this.socket = socket
		this.server = server
		this.usingWebSocket = false
		this.packetSizes = JSON.parse(JSON.stringify(Client.defaultPacketSizes))
		this.authed = false
		this.cpeNegotiating = false
		this.address = socket.remoteAddress
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
	async loadLevel(data, x, y, z, processed = false, callback, preFinalize) {
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
		buffer.writeBuffer(DataTypes.padString(username))
		buffer.writeUInt16BE(DataTypes.fixedShort(x))
		buffer.writeUInt16BE(DataTypes.fixedShort(y))
		buffer.writeUInt16BE(DataTypes.fixedShort(z))
		buffer.writeUInt8(yaw)
		buffer.writeUInt8(pitch)
		this.socket.write(buffer.toBuffer())
	}
	serverIdentification(serverName, motd, userType) {
		const buffer = new SmartBuffer({ size: 131 }).writeUInt8(0x00).writeUInt8(0x07)
		buffer.writeBuffer(DataTypes.padString(serverName))
		buffer.writeBuffer(DataTypes.padString(motd))
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
		buffer.writeUInt16BE(DataTypes.fixedShort(x))
		buffer.writeUInt16BE(DataTypes.fixedShort(y))
		buffer.writeUInt16BE(DataTypes.fixedShort(z))
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
		buffer.writeBuffer(DataTypes.padString(block.name ?? ""))
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
		buffer.writeBuffer(DataTypes.padString(block.name ?? ""))
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
		texturePackBuffer.writeBuffer(DataTypes.padString(url))
		this.socket.write(texturePackBuffer.toBuffer())
	}
	setEnvironmentProperties(environment) {
		for (const [key, value] of Object.entries(environment)) {
			const propertyIndex = Client.environmentProperties.indexOf(key)
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
		buffer.writeBuffer(DataTypes.padString(username))
		buffer.writeBuffer(DataTypes.padString(skin))
		buffer.writeUInt16BE(DataTypes.fixedShort(x))
		buffer.writeUInt16BE(DataTypes.fixedShort(y))
		buffer.writeUInt16BE(DataTypes.fixedShort(z))
		buffer.writeUInt8(yaw)
		buffer.writeUInt8(pitch)
		this.socket.write(buffer.toBuffer())
	}
	addPlayerName(id, username, listName, groupName = "", groupOrder = 0) {
		const buffer = new SmartBuffer({ size: 196 }).writeUInt8(0x16)
		buffer.writeInt16BE(id)
		buffer.writeBuffer(DataTypes.padString(username))
		buffer.writeBuffer(DataTypes.padString(listName))
		buffer.writeBuffer(DataTypes.padString(groupName))
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
	static environmentProperties = ["sidesId", "edgeId", "edgeHeight", "cloudsHeight", "maxFog", "cloudsSpeed", "weatherFade", "useExponentialFog", "sidesOffset"]
	static defaultPacketSizes = {
		0x00: 131,
		0x0d: 66,
		0x08: 10,
		0x05: 9,
		0x47: 1
	}
}

module.exports.Client = Client
module.exports = Client
