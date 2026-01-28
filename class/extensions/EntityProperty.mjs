// @ts-check
import { SmartBuffer } from "smart-buffer"
import { BaseExtension } from "../BaseExtension.mjs"
/** @import {Client} from "../Client.mjs" */

/** I define EntityProperty. */
export class EntityProperty extends BaseExtension {
	/**@param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}
	/**@param {number} id
	 * @param {number} propertyType
	 * @param {number} value
	 */
	setEntityProperty(id, propertyType, value) {
		const buffer = new SmartBuffer({ size: 7 }).writeUInt8(0x2a)
		buffer.writeUInt8(id)
		buffer.writeUInt8(propertyType)
		buffer.writeUInt32BE(value)
		this.client.socket.write(buffer.toBuffer())
	}
}

export default EntityProperty
