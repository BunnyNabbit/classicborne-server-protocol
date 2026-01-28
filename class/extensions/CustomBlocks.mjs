// @ts-check
import { SmartBuffer } from "smart-buffer"
import { CustomBlockSupportLevel } from "./packetHandlers/CustomBlockSupportLevel.mjs"
import { BaseExtension } from "../BaseExtension.mjs"
/** @import {Client} from "../Client.mjs" */

/** I define CustomBlocks. */
export class CustomBlocks extends BaseExtension {
	/**@param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
		client.packetHandlers.set(CustomBlockSupportLevel.packetId, new CustomBlockSupportLevel(client))
	}
	/**Sends CustomBlocks support level.
	 *
	 * @param {number} supportLevel
	 */
	sendSupportLevel(supportLevel) {
		const blockSupportBuffer = new SmartBuffer({ size: 2 }).writeUInt8(0x13).writeUInt8(supportLevel)
		this.client.socket.write(blockSupportBuffer.toBuffer())
	}
}

export default CustomBlocks
