import { BasePacketHandler } from "../BasePacketHandler.mjs"
import { DataTypes } from "../DataTypes.mjs"
/** @import { SmartBuffer } from "smart-buffer" */
/** @import { Client } from "../Client.mjs" */
/**I handle chat messages coming from the client.*/
export class Message extends BasePacketHandler {
	/**
	 * @param {Client} client
	 */
	constructor(client) {
		super(Message.packetId, client)
	}
	static packetId = 0x0d
	/** The size of the packet including the packet ID. */
	packetSize = 66
	/**
	 * @param {SmartBuffer} buffer
	 */
	onPacket(buffer) {
		buffer.readUInt8()
		const message = DataTypes.readString(buffer)
		this.client.emit("message", message)
	}
}

export default Message
