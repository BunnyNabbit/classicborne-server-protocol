// @ts-check
import { BasePacketHandler } from "../BasePacketHandler.mjs"
/** @import { SmartBuffer } from "smart-buffer" */
/** @import { Client } from "../Client.mjs" */
/**I handle GET requests from the client.*/
export class WebSocketUpgrade extends BasePacketHandler {
	/**
	 * @param {Client} client
	 */
	constructor(client) {
		super(WebSocketUpgrade.packetId, client)
	}
	static packetId = 0x47
	/** The size of the packet excluding the packet ID. */
	packetSize = 9
	/**
	 * @param {SmartBuffer} buffer
	 */
	onPacket(buffer) {
		if (this.client.getChecked || !this.client.server.httpServer) return // can trigger multiple times
		this.client.getChecked = true
		this.client.server.httpServer.upgradeSocketToHttp(this, buffer.toBuffer())
		this.client.usingWebSocket = true
		return
	}
}

export default WebSocketUpgrade
