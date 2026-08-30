// @ts-check
import { SmartBuffer } from "smart-buffer"
import { DataTypes } from "../DataTypes.mjs"
import { BaseExtension } from "../BaseExtension.mjs"
/** @import { Client } from "../Client.mjs" */
/** @import { selection } from "./extensionTypes.mjs" */

/** I define SelectionCuboid. */
export class SelectionCuboid extends BaseExtension {
	/**
	 * @param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}
	static addSelectionPacketIdentifier = 0x1a
	/**
	 * @param {selection} selection - The selection.
	 */
	addSelection(selection) {
		const buffer = new SmartBuffer({ size: 86 }).writeUInt8(SelectionCuboid.addSelectionPacketIdentifier)
		buffer.writeUInt8(selection.id)
		buffer.writeBuffer(DataTypes.padString(selection.name ?? ""))
		buffer.writeUInt16BE(selection.startX)
		buffer.writeUInt16BE(selection.startY)
		buffer.writeUInt16BE(selection.startZ)
		buffer.writeUInt16BE(selection.endX)
		buffer.writeUInt16BE(selection.endY)
		buffer.writeUInt16BE(selection.endZ)
		buffer.writeUInt16BE(selection.red ?? 128)
		buffer.writeUInt16BE(selection.green ?? 128)
		buffer.writeUInt16BE(selection.blue ?? 128)
		buffer.writeUInt16BE(selection.opacity ?? 128)
		this.client.socket.write(buffer.toBuffer())
	}
	static removeSelectionPacketIdentifier = 0x1b
	/**
	 * @param {selection | number} selection - The selection or selection ID.
	 */
	removeSelection(selection) {
		let selectionId
		if (typeof selection === "number") {
			selectionId = selection
		} else {
			selectionId = selection.id
		}
		const buffer = new SmartBuffer({ size: 2 }).writeUInt8(SelectionCuboid.removeSelectionPacketIdentifier)
		buffer.writeUInt8(selectionId)
		this.client.socket.write(buffer.toBuffer())
	}
}

export default SelectionCuboid
