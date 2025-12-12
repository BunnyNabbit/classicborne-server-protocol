import net from "node:net"
import { SmartBuffer } from "smart-buffer"
import { TypedEmitter } from "tiny-typed-emitter"
import * as utils from "../utils.mjs"
import { Client } from "./Client.mjs"
import { DataTypes } from "./DataTypes.mjs"
/** @import { extension } from "../types.mts" */

/** @type {extension[]} */
const extensions = [
	{
		name: "ClickDistance",
		version: 1,
	},
	{
		name: "BlockDefinitions",
		version: 1,
	},
	{
		name: "BlockDefinitionsExt",
		version: 2,
	},
	{
		name: "InventoryOrder",
		version: 1,
	},
	{
		name: "CustomBlocks",
		version: 1,
	},
	{
		name: "EnvMapAspect",
		version: 1,
	},
	{
		name: "BlockPermissions",
		version: 1,
	},
	{
		name: "HeldBlock",
		version: 1,
	},
	{
		name: "ExtPlayerList",
		version: 2,
	},
	{
		name: "EntityProperty",
		version: 1,
	},
	{
		name: "SetHotbar",
		version: 0,
	},
	{
		name: "FullCP437",
		version: 1,
	},
	{
		name: "ExtEntityTeleport",
		version: 1,
	},
]
function isTrustedWebSocketProxy(remoteAddress) {
	if (remoteAddress == "::ffff:34.223.5.250") return true // ClassiCube's WebSocket proxy
	return false
}
/** Impostor for WebSocket to make it compatible with the TCP server. */
export class SocketImpostor extends TypedEmitter {
	/**Creates a new SocketImpostor instance.
	 * @param {WebSocket} websocket - The WebSocket to wrap.
	 */
	constructor(websocket) {
		super()
		this.websocket = websocket
		websocket.on("message", (data) => {
			this.emit("data", data)
		})
		this.buffer = new SmartBuffer()
	}
	/** @type {Client} */
	client = null
	/**Writes data to the WebSocket.
	 * @param {Buffer} buffer - The buffer to write.
	 */
	write(buffer) {
		try {
			this.websocket.send(buffer)
		} catch (error) {
			console.error(error)
		}
	}
	/** Closes the WebSocket connection. */
	destroy() {
		this.websocket.close()
	}
}
/**Represents a Minecraft Classic server.
 * @extends {TypedEmitter<{"clientConnected": (player: Client, authInfo: {username: string, key: string, extensions: extension[]?}) => void}>}
 */
export class Server extends TypedEmitter {
	/**Creates a new Server instance.
	 * @param {number} [port] The port to listen on. Defaults to 25565.
	 * @param {string} [host] The host to listen on. Defaults to all interfaces.
	 */
	constructor(port = 25565, host) {
		super()
		this.tcpServer = net.createServer()
		this.tcpServer.listen(port, host)
		this.tcpServer.on("connection", (socket) => {
			const client = new Client(socket, this)
			socket.client = client
			socket.buffer = new SmartBuffer() // TODO: move to client? it causes type errors.
			const currenzHandler = (data) => {
				Server.tcpPacketHandler(client, data)
			}
			socket.on("data", currenzHandler)
			socket.on("error", () => {
				return socket.destroy()
			})
			socket.once("close", () => {
				client.emit("close")
			})
			socket.once("upgradeWebSocket", (webSocket, request) => {
				socket.removeListener("data", currenzHandler)
				client.socket = new SocketImpostor(webSocket)
				client.socket.client = client
				client.socket.on("data", (data) => {
					Server.tcpPacketHandler(client, data)
				})
				client.httpRequest = request
			})
			setTimeout(() => {
				if (!client.authed) socket.destroy()
			}, this.connectionTimeout)
		})
		this.utils = utils
		this.cpeEnabled = true
		this.appName = "Classicborne Protocol"
		this.extensions = extensions
		this.isTrustedWebSocketProxy = isTrustedWebSocketProxy
		this.connectionTimeout = 30 * 1000
	}
	/**Sets up a WebSocket server and allow WebSocket connections under the same port.
	 * @returns {Promise<UpgradingHttpServer>} The UpgradingHttpServer instance.
	 */
	async setupWebSocketServer() {
		const { UpgradingHttpServer } = await import("./UpgradingHttpServer.mjs")
		this.httpServer = new UpgradingHttpServer()
		return this.httpServer
	}
	/**Handles incoming packets from the client.
	 * @param {Client} client - A client instance.
	 * @param {Buffer} [data] - The data received from the client.
	 * @returns
	 */
	static tcpPacketHandler(client, data) {
		const socket = client.socket
		if (data) socket.buffer.writeBuffer(data)
		socket.buffer.readOffset = 0
		const receivedBufferRemaining = socket.buffer.remaining()
		const type = socket.buffer.readUInt8()
		const packetHandler = client.packetHandlers.get(type)
		if (packetHandler) {
			if (receivedBufferRemaining < packetHandler.packetSize) {
				socket.buffer.writeOffset = receivedBufferRemaining // we are expecting the buffer to be expanded, so set the writeOffset to end of the buffer
				if (socket.buffer.remaining() > Server.maximumBufferSize) return socket.destroy()
				return
			}
			if (packetHandler.onPacket(socket.buffer) == Server.websocketUpgradeFlag) return
		} else {
			return client.disconnect(`Handler ${type} was not found.`)
		}
		client.getChecked = true
		socket.buffer = SmartBuffer.fromBuffer(socket.buffer.readBuffer(socket.buffer.remaining()))
		if (socket.buffer.remaining()) Server.tcpPacketHandler(client)
	}
	static maximumBufferSize = 5000
	static websocketUpgradeFlag = "upgrade"
}

export default Server
