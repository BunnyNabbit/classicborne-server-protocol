// @ts-check
import { SmartBuffer } from "smart-buffer"
import { BaseExtension } from "../BaseExtension.mjs"
/** @import { Client } from "../Client.mjs" */

/** I define EnvMapAspect. */
export class SetHotbar extends BaseExtension {
	/**
	 * @param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}
	static setHotbarPacketIdentifier = 0x2d
	/**
	 * @param {number} blockId
	 * @param {number} hotbarIndex
	 */
	setHotbar(blockId, hotbarIndex) {
		const buffer = new SmartBuffer({ size: 3 }).writeUInt8(SetHotbar.setHotbarPacketIdentifier)
		buffer.writeUInt8(blockId)
		buffer.writeUInt8(hotbarIndex)
		this.client.socket.write(buffer.toBuffer())
	}
}

export default SetHotbar
