// @ts-check
import { SmartBuffer } from "smart-buffer"
import { DataTypes } from "../DataTypes.mjs"
import { BaseExtension } from "../BaseExtension.mjs"
/** @import {Client} from "../Client.mjs" */

/**I define ExtPlayerList. I'm an extension which separates entities and the player list apart.
 *
 * If I am accepted as an extension, {@link Client.configureSpawn} shouldn't be called. Instead, use my {@link configureSpawn} method.
 */
export class ExtendedPlayerList extends BaseExtension {
	/**@param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}

	static addPlayerNamePacketIdentifier = 0x16
	static removePlayerNamePacketIdentifier = 0x18
	/**Adds a player name to the player list. Updates entries if {@link id} is already defined.
	 *
	 * @param {number} id - The identifier for the player list entry. Does not need to match with an entity's ID.in a level.
	 * @param {string} username - The name used for tab completions.
	 * @param {string} listName - The name to display on the player list.
	 * @param {string} [groupName=""] - The name of the entry's group. Default is `""`
	 * @param {number} [groupOrder=0] - The order of the entry's group. Default is `0`
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
	/**Removes an entry from the player list by its {@link id}.
	 *
	 * @param {number} id
	 */
	removePlayerName(id) {
		const buffer = new SmartBuffer({ size: 3 }).writeUInt8(ExtendedPlayerList.removePlayerNamePacketIdentifier)
		buffer.writeInt16BE(id)
		this.client.socket.write(buffer.toBuffer())
	}
	/**Creates an entity. Different from {@link Client.configureSpawn} as this method requires a string for a skin.
	 *
	 * @param {number} id
	 * @param {string} username
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {number} yaw
	 * @param {number} pitch
	 * @param {string} skin - The skin to use for the entity model. Clients may interpret this differently. It's typical for this to accept usernames or URLs.
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
