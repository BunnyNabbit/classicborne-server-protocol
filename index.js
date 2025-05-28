const net = require("net")
const { SmartBuffer } = require("smart-buffer")
const EventEmitter = require("events").EventEmitter
const utils = require("./utils.js")
const Client = require("./class/Client.cjs")
const DataTypes = require("./class/DataTypes.cjs")
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
	},
	{
		name: "SetHotbar",
		version: 0
	}
]
const maxBuffer = 5000
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
			const username = DataTypes.readString(socket.buffer)
			const key = DataTypes.readString(socket.buffer)
			const padding = socket.buffer.readUInt8()
			if (padding == 0x42 && socket.client.server.cpeEnabled) {
				// ExtInfo
				socket.client.cpeNegotiating = true
				const buffer = new SmartBuffer({ size: 67 }).writeUInt8(0x10)
				buffer.writeBuffer(DataTypes.padString(socket.client.server.appName))
				buffer.writeUInt16BE(extensions.length)
				socket.write(buffer.toBuffer())
				extensions.forEach(extension => {
					// ExtEntry
					const buffer = new SmartBuffer({ size: 69 }).writeUInt8(0x11)
					buffer.writeBuffer(DataTypes.padString(extension.name))
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
			const message = DataTypes.readString(socket.buffer)
			socket.client.emit("message", message)
			break
		case 0x08:
			const heldBlock = socket.buffer.readUInt8()
			const position = {
				x: DataTypes.readFixedShort(socket.buffer),
				y: DataTypes.readFixedShort(socket.buffer),
				z: DataTypes.readFixedShort(socket.buffer),
			}
			const orientation = {
				yaw: socket.buffer.readUInt8(),
				pitch: socket.buffer.readUInt8()
			}
			socket.client.emit("position", position, orientation, heldBlock)
			break
		// Extensions
		case 0x10: // ExtInfo
			socket.client.appName = DataTypes.readString(socket.buffer)
			socket.client.cpeExtensionsCount = socket.buffer.readInt16BE()
			if (socket.client.cpeExtensionsCount == 0) socket.client.emit("extensions", [])
			break
		case 0x11: // ExtInfo
			if (socket.client.authed) return socket.destroy()
			if (!socket.client.cpeExtensions) return socket.destroy()
			const extension = {
				name: DataTypes.readString(socket.buffer),
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
			if (socket.client.getChecked || !socket.client.server.httpServer) return // can trigger multiple times
			socket.client.getChecked = true
			socket.client.server.httpServer.upgradeSocketToHttp(socket, socket.buffer.toBuffer())
			socket.client.usingWebSocket = true
			return
	}
	socket.client.getChecked = true
	socket.buffer = SmartBuffer.fromBuffer(socket.buffer.readBuffer(socket.buffer.remaining()))
	if (socket.buffer.remaining()) tcpPacketHandler(socket)
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
module.exports = class Server extends EventEmitter {
	constructor(port = 25565, host) {
		super()
		this.tcpServer = net.createServer()
		this.tcpServer.listen(port, host)
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
			setTimeout(() => {
				if (!client.authed) {
					socket.destroy()
				}
			}, this.connectionTimeout)
		})
		this.utils = utils
		this.cpeEnabled = true
		this.appName = "Classicborne Protocol"
		this.extensions = extensions
		this.isTrustedWebSocketProxy = isTrustedWebSocketProxy
		this.connectionTimeout = 30 * 1000
	}
	setupWebSocketServer() {
		const UpgradingHttpServer = require("./UpgradingHttpServer.js")
		this.httpServer = new UpgradingHttpServer()
	}
}