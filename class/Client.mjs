import { DataTypes } from "./DataTypes.mjs"
import * as utils from "../utils.mjs"
import { TypedEmitter } from "tiny-typed-emitter"
import { SmartBuffer } from "smart-buffer"
import { CodePage437 } from "./CodePage437.mjs"
import { ExtensionManager } from "./ExtensionManager.mjs"
import { vanillaPacketHandlers } from "./vanillaPacketHandlers/index.mjs"
/** @import { BasePacketHandler } from "./BasePacketHandler.mjs" */
/** @import { TeleportBehavior } from "./TeleportBehavior.mjs" */
/** @import { extension } from "../types.mts" */
/** @import { Server, SocketImpostor } from "./Server.mjs" */
/** @import { Socket } from "node:net" */

/**I represent a client to act on a Server instance.  
 * Server initializes me on any connection attempt, so I may not be a valid Minecraft Classic client. If my socket doesn't respond back regarding authentication, the Server will destroy me and send my socket a kick message, assuming my socket is a Classic client. Otherwise the kick message text is somewhat readable.
 * 
 * But if authentication succeeds, the server will emit a "clientConnected" event. This by itself won't do much because I still need an implementation of Minecraft Classic. Whoever seeing this can interpret that as they will. It's never argued what makes a Minecraft Classic server. But based on other implementations, it's based on using all available packets, such as chat messages, level downloads and block changes. `classicborne-server-protocol` is intended to be a low-level network library, so it doesn't come with Minecraft-like systems. For a batteries included server software, check out [`classicborne`](https://classicborne.bunnynabbit.com/).
 * 
 * My socket may be either TCP or WebSocket-based. It will be expected that the network layer used will be whatever. For this reason, I provide {@link Client#address} for getting the socket's address.
 * 
 * Right now, my packets are handled by the server class. But it is expected that this may change later.
 * @extends {TypedEmitter<{"extensions": (extensions: extension[]) => void; "close": () => void }>}
 */
export class Client extends TypedEmitter {
	/**Creates a Client instance
	 * @param {Socket|SocketImpostor} socket - The socket of the client
	 * @param {Server} server - The server instance
	 */
	constructor(socket, server) {
		super()
		/** @type {Socket|SocketImpostor} */
		this.socket = socket
		this.server = server
		this.usingWebSocket = false
		this.authed = false
		this.cpeNegotiating = false
		/** The remote address of the client. This can be either the TCP socket address or the address resolved on WebSocket. For WebSockets, it's based on trust. There's the ClassiCube proxy and all of its forwarded addresses are trusted and will be used as the address. But if a proxy isn't trusted, it assumes that the proxy is a client and uses the proxy's address instead. */
		// @ts-ignore
		this.address = socket.remoteAddress
		this.httpRequest = undefined
		this.getChecked = false
		this.appName = ""
		this.cpeExtensionsCount = 0
		/**
		 * @type {extension[]}
		 * @deprecated Use {@link Client#extensions}.
		 */
		this.cpeExtensions
		/** @type {ExtensionManager} */
		this.extensions = new ExtensionManager(this)
		/** @type {Map<number, BasePacketHandler>} */
		this.packetHandlers = new Map()
		vanillaPacketHandlers.forEach((handlerClass) => {
			const handler = new handlerClass(this)
			this.packetHandlers.set(handler.packetId, handler)
		})
	}

	message(message, messageType = -1, continueAdornment = ">") {
		const cp437Buffer = SmartBuffer.fromBuffer(CodePage437.to(message))
		const continueAdornmentBuffer = CodePage437.to(continueAdornment)
		if (continueAdornmentBuffer.length > 63) throw new Error("Continue adornment must not be over 63 characters long.")
		let writeContinueAdornment = false
		while (cp437Buffer.remaining()) {
			const buffer = new SmartBuffer({ size: 66 }).writeUInt8(0x0d).writeInt8(messageType)
			if (writeContinueAdornment) buffer.writeBuffer(continueAdornmentBuffer)
			buffer.writeBuffer(cp437Buffer.readBuffer(66 - buffer.writeOffset))
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
		const buffer = new SmartBuffer({ size: 65 }).writeUInt8(0x0e).writeBuffer(CodePage437.to(message))
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
}

export default Client
