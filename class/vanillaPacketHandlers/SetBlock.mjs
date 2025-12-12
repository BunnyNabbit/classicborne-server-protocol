import { BasePacketHandler } from "../BasePacketHandler.mjs"
/** @import { SmartBuffer } from "smart-buffer" */
/** @import { Client } from "../Client.mjs" */
/** I handle block changes coming from the client. */
export class SetBlock extends BasePacketHandler {
	/**
	 * @param {Client} client
	 */
	constructor(client) {
		super(SetBlock.packetId, client)
	}
	static packetId = 0x05
	/** The size of the packet including the packet ID. */
	packetSize = 9
	/**
	 * @param {SmartBuffer} buffer
	 */
	onPacket(buffer) {
		this.client.emit("setBlock", {
			x: buffer.readUInt16BE(),
			y: buffer.readUInt16BE(),
			z: buffer.readUInt16BE(),
			mode: buffer.readUInt8(),
			type: buffer.readUInt8(),
		})
	}
}

export default SetBlock
