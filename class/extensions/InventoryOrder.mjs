// @ts-check
import { SmartBuffer } from "smart-buffer"
/** @import { Client } from "../Client.mjs" */

import { BaseExtension } from "../BaseExtension.mjs"

/** I define InventoryOrder. */
export class InventoryOrder extends BaseExtension {
	/**
	 * @param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}
	/**
	 * @param {number} id
	 * @param {number} order
	 */
	setInventoryOrder(id, order) {
		const buffer = new SmartBuffer({ size: 3 }).writeUInt8(44)
		buffer.writeUInt8(order)
		buffer.writeUInt8(id)
		this.client.socket.write(buffer.toBuffer())
	}
}

export default InventoryOrder
