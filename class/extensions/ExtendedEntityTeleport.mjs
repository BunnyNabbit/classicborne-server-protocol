// @ts-check
import { SmartBuffer } from "smart-buffer"
import { DataTypes } from "../DataTypes.mjs"
import { BaseExtension } from "../BaseExtension.mjs"
import { TeleportBehavior } from "../TeleportBehavior.mjs"
/** @import {Client} from "../Client.mjs" */

/** I define ExtEntityTeleport. */
export class ExtendedEntityTeleport extends BaseExtension {
	/**@param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}
	static extendedTeleportPacketIdentifier = 0x36
	/**@param {number} id
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {number} yaw
	 * @param {number} pitch
	 * @param {TeleportBehavior} teleportBehavior
	 */
	extendedPositionUpdate(id, x, y, z, yaw, pitch, teleportBehavior) {
		const buffer = new SmartBuffer({ size: 11 }).writeUInt8(ExtendedEntityTeleport.extendedTeleportPacketIdentifier)
		buffer.writeInt8(id)
		buffer.writeBuffer(teleportBehavior.toBuffer())
		buffer.writeUInt16BE(DataTypes.fixedShort(x))
		buffer.writeUInt16BE(DataTypes.fixedShort(y))
		buffer.writeUInt16BE(DataTypes.fixedShort(z))
		buffer.writeUInt8(yaw)
		buffer.writeUInt8(pitch)
		this.client.socket.write(buffer.toBuffer())
	}
}

export default ExtendedEntityTeleport
