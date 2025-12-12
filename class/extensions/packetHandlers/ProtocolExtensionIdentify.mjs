// @ts-check
import { BasePacketHandler } from "../../BasePacketHandler.mjs"
import { DataTypes } from "../../DataTypes.mjs"
/** @import { SmartBuffer } from "smart-buffer" */
/** @import { Client } from "../../Client.mjs" */
/**I handle CPE identification packets from the client.*/
export class ProtocolExtensionIdentify extends BasePacketHandler {
	/**
	 * @param {Client} client
	 */
	constructor(client) {
		super(ProtocolExtensionIdentify.packetId, client)
	}
	static packetId = 0x10
	/** The size of the packet including the packet ID. */
	packetSize = 67
	/**
	 * @param {SmartBuffer} buffer
	 */
	onPacket(buffer) {
		this.client.appName = DataTypes.readString(buffer)
		this.client.cpeExtensionsCount = buffer.readInt16BE()
		if (this.client.cpeExtensionsCount == 0) this.client.emit("extensions", [])
	}
}

export default ProtocolExtensionIdentify
