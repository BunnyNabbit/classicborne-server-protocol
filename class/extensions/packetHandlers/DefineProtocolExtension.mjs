// @ts-check
import { BasePacketHandler } from "../../BasePacketHandler.mjs"
import { DataTypes } from "../../DataTypes.mjs"
import { BlockDefinitions } from "../BlockDefinitions.mjs"
import { BlockDefinitionsExtended } from "../BlockDefinitionsExtended.mjs"
import { BlockPermissions } from "../BlockPermissions.mjs"
import { ClickDistance } from "../ClickDistance.mjs"
import { CustomBlocks } from "../CustomBlocks.mjs"
import { EntityProperty } from "../EntityProperty.mjs"
import { ExtendedEntityTeleport } from "../ExtendedEntityTeleport.mjs"
import { ExtendedPlayerList } from "../ExtendedPlayerList.mjs"
import { FullCodePage437 } from "../FullCodePage437.mjs"
import { HeldBlock } from "../HeldBlock.mjs"
import { InventoryOrder } from "../InventoryOrder.mjs"
import { LevelEnvironment } from "../LevelEnvironment.mjs"
import { SelectionCuboid } from "../SelectionCuboid.mjs"
import { SetHotbar } from "../SetHotbar.mjs"
/** @import {SmartBuffer} from "smart-buffer" */
/** @import {Client} from "../../Client.mjs" */
/** I handle CPE extension definition packets from the client. */
export class DefineProtocolExtension extends BasePacketHandler {
	/** @param {Client} client */
	constructor(client) {
		super(DefineProtocolExtension.packetId, client)
	}
	static packetId = 0x11
	/** The size of the packet including the packet ID. */
	packetSize = 69
	/** @param {SmartBuffer} buffer */
	onPacket(buffer) {
		const socket = this.client.socket
		if (this.client.authed) return socket.destroy()
		if (!this.client.cpeExtensions) return socket.destroy()
		const extension = {
			name: DataTypes.readString(buffer),
			version: buffer.readInt32BE(),
		}
		// TODO: Use dynamic imports.
		switch (extension.name) {
			case "BlockDefinitions":
				this.client.extensions.set("BlockDefinitions", new BlockDefinitions(this.client, extension.version))
				break
			case "BlockDefinitionsExt":
				this.client.extensions.set("BlockDefinitionsExtended", new BlockDefinitionsExtended(this.client, extension.version))
				break
			case "BlockPermissions":
				this.client.extensions.set("BlockPermissions", new BlockPermissions(this.client, extension.version))
				break
			case "ClickDistance":
				this.client.extensions.set("ClickDistance", new ClickDistance(this.client, extension.version))
				break
			case "CustomBlocks":
				this.client.extensions.set("CustomBlocks", new CustomBlocks(this.client, extension.version))
				break
			case "EntityProperty":
				this.client.extensions.set("EntityProperty", new EntityProperty(this.client, extension.version))
				break
			case "ExtEntityTeleport":
				this.client.extensions.set("ExtendedEntityTeleport", new ExtendedEntityTeleport(this.client, extension.version))
				break
			case "ExtPlayerList":
				this.client.extensions.set("ExtendedPlayerList", new ExtendedPlayerList(this.client, extension.version))
				break
			case "FullCP437":
				this.client.extensions.set("FullCodePage437", new FullCodePage437(this.client, extension.version))
				break
			case "HeldBlock":
				this.client.extensions.set("HeldBlock", new HeldBlock(this.client, extension.version))
				break
			case "InventoryOrder":
				this.client.extensions.set("InventoryOrder", new InventoryOrder(this.client, extension.version))
				break
			case "EnvMapAspect":
				this.client.extensions.set("LevelEnvironment", new LevelEnvironment(this.client, extension.version))
				break
			case "SelectionCuboid":
				this.client.extensions.set("SelectionCuboid", new SelectionCuboid(this.client, extension.version))
				break
			case "SetHotbar":
				this.client.extensions.set("SetHotbar", new SetHotbar(this.client, extension.version))
				break
		}
		this.client.cpeExtensions.push(extension)
		if (this.client.cpeExtensionsCount == this.client.cpeExtensions.length) this.client.emit("extensions", this.client.cpeExtensions)
	}
}

export default DefineProtocolExtension
