// @ts-check
import { BasePacketHandler } from "../../BasePacketHandler.mjs"
/** @import { SmartBuffer } from "smart-buffer" */
/** @import { Client } from "../../Client.mjs" */
/**I handle CPE identification packets from the client.*/
export class CustomBlockSupportLevel extends BasePacketHandler {
	/**
	 * @param {Client} client
	 */
	constructor(client) {
		super(CustomBlockSupportLevel.packetId, client)
	}
	static packetId = 0x13
	/** @type {number?} */
	supportLevel = null
	/** The size of the packet including the packet ID. */
	packetSize = 2
	/**
	 * @param {SmartBuffer} buffer
	 */
	onPacket(buffer) {
		const supportLevel = buffer.readUInt8()
		if (this.supportLevel != null) {
			this.supportLevel = supportLevel
		}
	}
}

export default CustomBlockSupportLevel
