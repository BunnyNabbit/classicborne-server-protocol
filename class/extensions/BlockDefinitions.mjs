// @ts-check
import { SmartBuffer } from "smart-buffer"
import { DataTypes } from "../DataTypes.mjs"
import { BaseExtension } from "../BaseExtension.mjs"
/** @import { Client } from "../Client.mjs" */

/** I define BlockDefinitions. */
export class BlockDefinitions extends BaseExtension {
	/**
	 * @param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}
	static defineBlockPacketIdentifier = 0x23
	/**
	 * @param {{ id: number; name: string; collision: number; speed: number; topTexture: number; sideTexture: number; bottomTexture: number; transmitLight: number; walkSound: number; fullBright: number; shape: number; draw: number; fogDensity: number; fogR: number; fogG: number; fogB: number; }} block
	 */
	defineBlock(block) {
		const buffer = new SmartBuffer({ size: 80 }).writeUInt8(BlockDefinitions.defineBlockPacketIdentifier)
		buffer.writeUInt8(block.id)
		buffer.writeBuffer(DataTypes.padString(block.name ?? ""))
		buffer.writeUInt8(block.collision ?? 2)
		buffer.writeUInt8(block.speed ?? 128)
		buffer.writeUInt8(block.topTexture ?? 0)
		buffer.writeUInt8(block.sideTexture ?? 0)
		buffer.writeUInt8(block.bottomTexture ?? 0)
		buffer.writeUInt8(block.transmitLight ?? 0)
		buffer.writeUInt8(block.walkSound ?? 0)
		buffer.writeUInt8(block.fullBright ?? 0)
		buffer.writeUInt8(block.shape ?? 16)
		buffer.writeUInt8(block.draw ?? 0)
		buffer.writeUInt8(block.fogDensity ?? 0)
		buffer.writeUInt8(block.fogR ?? 0)
		buffer.writeUInt8(block.fogG ?? 0)
		buffer.writeUInt8(block.fogB ?? 0)
		this.client.socket.write(buffer.toBuffer())
	}
}

export default BlockDefinitions
