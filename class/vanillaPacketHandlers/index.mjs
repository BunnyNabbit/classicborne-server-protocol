import { Connection } from "./Connection.mjs"
import { Message } from "./Message.mjs"
import { PositionUpdate } from "./PositionUpdate.mjs"
import { SetBlock } from "./SetBlock.mjs"
import { WebSocketUpgrade } from "./WebSocketUpgrade.mjs"
/** @import { BasePacketHandler } from "../BasePacketHandler.mjs" */

/** @type {typeof BasePacketHandler[]} */
export const vanillaPacketHandlers = [PositionUpdate, SetBlock, Message, WebSocketUpgrade, Connection]

export default vanillaPacketHandlers
