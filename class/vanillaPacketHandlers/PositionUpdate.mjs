import { BasePacketHandler } from "../BasePacketHandler.mjs"
import { DataTypes } from "../DataTypes.mjs"
/** @import { SmartBuffer } from "smart-buffer" */
/** @import { Client } from "../Client.mjs" */
/**I handle position updates coming from the client.*/
export class PositionUpdate extends BasePacketHandler {
	/**
	 * @param {Client} client
	 */
	constructor(client) {
		super(PositionUpdate.packetId, client)
	}
	static packetId = 0x08
	/** The size of the packet including the packet ID. */
	packetSize = 10
	/**
	 * @param {SmartBuffer} buffer
	 */
	onPacket(buffer) {
		const heldBlock = buffer.readUInt8()
		const position = {
			x: DataTypes.readFixedShort(buffer),
			y: DataTypes.readFixedShort(buffer),
			z: DataTypes.readFixedShort(buffer),
		}
		const orientation = {
			yaw: buffer.readUInt8(),
			pitch: buffer.readUInt8(),
		}
		this.client.emit("position", position, orientation, heldBlock)
	}
}

export default PositionUpdate
