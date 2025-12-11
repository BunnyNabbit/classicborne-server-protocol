// @ts-check
import { SmartBuffer } from "smart-buffer"
import { DataTypes } from "../DataTypes.mjs"
import { BaseExtension } from "../BaseExtension.mjs"
/** @import { Client } from "../Client.mjs" */

/** I define ClickDistance. */
export class ClickDistance extends BaseExtension {
	/**
	 * @param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}
	static setClickDistancePacketIdentifier = 0x12
	/**
	 * @param {number} distance
	 */
	setClickDistance(distance) {
		const buffer = new SmartBuffer({ size: 3 }).writeUInt8(ClickDistance.setClickDistancePacketIdentifier)
		buffer.writeInt16BE(distance)
		this.client.socket.write(buffer.toBuffer())
	}
}

export default ClickDistance
