import { BasePacketHandler } from "../BasePacketHandler.mjs"
import { DataTypes } from "../DataTypes.mjs"
import { SmartBuffer } from "smart-buffer"
import { CpeBase } from "../extensions/CpeBase.mjs"

/** @import {Client} from "../Client.mjs" */
/** I handle connections coming from the client. */
export class Connection extends BasePacketHandler {
	/** @param {Client} client */
	constructor(client) {
		super(Connection.packetId, client)
	}
	static packetId = 0x00
	/** The size of the packet including the packet ID. */
	packetSize = 131
	/** @param {SmartBuffer} buffer */
	onPacket(buffer) {
		const client = this.client
		const socket = client.socket
		const server = client.server
		if (client.authed || client.cpeNegotiating) return socket.destroy()
		const version = buffer.readUInt8()
		if (version !== 0x07) return socket.destroy()
		const username = DataTypes.readString(buffer)
		const key = DataTypes.readString(buffer)
		const padding = buffer.readUInt8()
		if (padding == Connection.cpeIdentifier && client.server.cpeEnabled) {
			// ExtInfo
			client.cpeNegotiating = true
			const buffer = new SmartBuffer({ size: 67 }).writeUInt8(0x10)
			buffer.writeBuffer(DataTypes.padString(server.appName))
			buffer.writeUInt16BE(server.extensions.length)
			socket.write(buffer.toBuffer())
			server.extensions.forEach((extension) => {
				// ExtEntry
				const buffer = new SmartBuffer({ size: 69 }).writeUInt8(0x11)
				buffer.writeBuffer(DataTypes.padString(extension.name))
				buffer.writeInt32BE(extension.version)
				socket.write(buffer.toBuffer())
			})
			new CpeBase(client, 1)
			client.cpeExtensions = []
			client.cpeExtensionsCount = 0
			client.once("extensions", (extensions) => {
				client.authed = true
				client.server.emit("clientConnected", client, {
					username,
					key,
					extensions,
				})
			})
		} else {
			client.authed = true
			// TODO: optional typing for extensions.
			client.server.emit("clientConnected", client, {
				username,
				key,
			})
		}
	}
	static cpeIdentifier = 0x42
}

export default Connection
