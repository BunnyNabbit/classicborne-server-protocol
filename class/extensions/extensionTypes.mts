import { BlockDefinitions } from "./BlockDefinitions.mjs"
import { BlockDefinitionsExtended } from "./BlockDefinitionsExtended.mjs"
import { BlockPermissions } from "./BlockPermissions.mjs"
import { ClickDistance } from "./ClickDistance.mjs"
import { CustomBlocks } from "./CustomBlocks.mjs"
import { EntityProperty } from "./EntityProperty.mjs"
import { ExtendedEntityTeleport } from "./ExtendedEntityTeleport.mjs"
import { ExtendedPlayerList } from "./ExtendedPlayerList.mjs"
import { FullCodePage437 } from "./FullCodePage437.mjs"
import { HeldBlock } from "./HeldBlock.mjs"
import { InventoryOrder } from "./InventoryOrder.mjs"
import { LevelEnvironment } from "./LevelEnvironment.mjs"
import { SelectionCuboid } from "./SelectionCuboid.mjs"
import { SetHotbar } from "./SetHotbar.mjs"

export type defaultExtensions = {
	BlockDefinitions: BlockDefinitions
	BlockDefinitionsExtended: BlockDefinitionsExtended
	BlockPermissions: BlockPermissions
	ClickDistance: ClickDistance
	CustomBlocks: CustomBlocks
	EntityProperty: EntityProperty
	ExtendedEntityTeleport: ExtendedEntityTeleport
	ExtendedPlayerList: ExtendedPlayerList
	FullCodePage437: FullCodePage437
	HeldBlock: HeldBlock
	InventoryOrder: InventoryOrder
	LevelEnvironment: LevelEnvironment
	SelectionCuboid: SelectionCuboid
	SetHotbar: SetHotbar
}

export interface selection {
	/** A byte. */
	id: number
	name?: string
	startX: number
	startY: number
	startZ: number
	endX: number
	endY: number
	endZ: number
	/** A color component of 0 to 255. */
	red?: number
	/** A color component of 0 to 255. */
	green?: number
	/** A color component of 0 to 255. */
	blue?: number
	/** The opacity from 0 to 255. 255 is fully opaque. */
	opacity?: number
}
