// @ts-check
import { SmartBuffer } from "smart-buffer"
import { DataTypes } from "../DataTypes.mjs"
import { BaseExtension } from "../BaseExtension.mjs"
/** @import {Client} from "../Client.mjs" */

/** I define BlockDefinitionsExt. */
export class BlockDefinitionsExtended extends BaseExtension {
	/**@param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}
	static defineBlockPacketIdentifier = 0x25
	/** @param {{ id: number; name: string; collision: number; speed: number; topTexture: number; leftTexture: number; rightTexture: number; frontTexture: number; backTexture: number; bottomTexture: number; transmitLight: number; walkSound: number; fullBright: number; minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number; draw: number; fogDensity: number; fogR: number; fogG: number; fogB: number }} block */
	defineBlock(block) {
		const buffer = new SmartBuffer({ size: 88 }).writeUInt8(BlockDefinitionsExtended.defineBlockPacketIdentifier)
		buffer.writeUInt8(block.id)
		buffer.writeBuffer(DataTypes.padString(block.name ?? ""))
		buffer.writeUInt8(block.collision ?? 2)
		buffer.writeUInt8(block.speed ?? 128)
		buffer.writeUInt8(block.topTexture ?? 0)
		buffer.writeUInt8(block.leftTexture ?? 0)
		buffer.writeUInt8(block.rightTexture ?? 0)
		buffer.writeUInt8(block.frontTexture ?? 0)
		buffer.writeUInt8(block.backTexture ?? 0)
		buffer.writeUInt8(block.bottomTexture ?? 0)
		buffer.writeUInt8(block.transmitLight ?? 0)
		buffer.writeUInt8(block.walkSound ?? 0)
		buffer.writeUInt8(block.fullBright ?? 0)
		buffer.writeUInt8(block.minX ?? 0)
		buffer.writeUInt8(block.minY ?? 0)
		buffer.writeUInt8(block.minZ ?? 0)
		buffer.writeUInt8(block.maxX ?? 16)
		buffer.writeUInt8(block.maxY ?? 16)
		buffer.writeUInt8(block.maxZ ?? 16)
		buffer.writeUInt8(block.draw ?? 0)
		buffer.writeUInt8(block.fogDensity ?? 0)
		buffer.writeUInt8(block.fogR ?? 0)
		buffer.writeUInt8(block.fogG ?? 0)
		buffer.writeUInt8(block.fogB ?? 0)
		this.client.socket.write(buffer.toBuffer())
	}
}

export default BlockDefinitionsExtended
