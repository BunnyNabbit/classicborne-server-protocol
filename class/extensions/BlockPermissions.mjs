// @ts-check
import { SmartBuffer } from "smart-buffer"
import { BaseExtension } from "../BaseExtension.mjs"
/** @import {Client} from "../Client.mjs" */

/** I define BlockPermissions. */
export class BlockPermissions extends BaseExtension {
	/**@param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}
	static setBlockPermissionPacketIdentifier = 0x1c
	/**@param {number} id
	 * @param {number} allowPlacement
	 * @param {number} allowDeletion
	 */
	setBlockPermission(id, allowPlacement, allowDeletion) {
		const buffer = new SmartBuffer({ size: 4 }).writeUInt8(BlockPermissions.setBlockPermissionPacketIdentifier)
		buffer.writeUInt8(id)
		buffer.writeUInt8(allowPlacement)
		buffer.writeUInt8(allowDeletion)
		this.client.socket.write(buffer.toBuffer())
	}
}

export default BlockPermissions
