// @ts-check
import { SmartBuffer } from "smart-buffer"
import { DataTypes } from "../DataTypes.mjs"
import { BaseExtension } from "../BaseExtension.mjs"
/** @import { Client } from "../Client.mjs" */

/** I define ExtPlayerList. */
export class ExtendedPlayerList extends BaseExtension {
	/**
	 * @param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}

	static addPlayerNamePacketIdentifier = 0x16
	static removePlayerNamePacketIdentifier = 0x18
	/**@todo Yet to be documented.
	 * @param {number} id
	 * @param {string} username
	 * @param {string} listName
	 */
	addPlayerName(id, username, listName, groupName = "", groupOrder = 0) {
		const buffer = new SmartBuffer({ size: 196 }).writeUInt8(ExtendedPlayerList.addPlayerNamePacketIdentifier)
		buffer.writeInt16BE(id)
		buffer.writeBuffer(DataTypes.padString(username))
		buffer.writeBuffer(DataTypes.padString(listName))
		buffer.writeBuffer(DataTypes.padString(groupName))
		buffer.writeUInt8(groupOrder)
		this.client.socket.write(buffer.toBuffer())
	}
	/**@todo Yet to be documented.
	 * @param {number} id
	 */
	removePlayerName(id) {
		const buffer = new SmartBuffer({ size: 3 }).writeUInt8(ExtendedPlayerList.removePlayerNamePacketIdentifier)
		buffer.writeInt16BE(id)
		this.client.socket.write(buffer.toBuffer())
	}
	/**@todo Yet to be documented.
	 * @param {number} id
	 * @param {string} username
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {number} yaw
	 * @param {number} pitch
	 * @param {string} skin
	 */
	configureSpawn(id, username, x, y, z, yaw, pitch, skin) {
		const buffer = new SmartBuffer({ size: 138 }).writeUInt8(33)
		buffer.writeInt8(id)
		buffer.writeBuffer(DataTypes.padString(username))
		buffer.writeBuffer(DataTypes.padString(skin))
		buffer.writeUInt16BE(DataTypes.fixedShort(x))
		buffer.writeUInt16BE(DataTypes.fixedShort(y))
		buffer.writeUInt16BE(DataTypes.fixedShort(z))
		buffer.writeUInt8(yaw)
		buffer.writeUInt8(pitch)
		this.client.socket.write(buffer.toBuffer())
	}
}

export default ExtendedPlayerList
