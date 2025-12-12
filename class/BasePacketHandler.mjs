// @ts-check
import { Client } from "./Client.mjs"
/** @import { SmartBuffer } from "smart-buffer" */
/** I handle protocol packets coming from a client. I am often applied to clients via protocol extensions, but I am also used as the basis for handling Classic protocol packets. When I handle a packet, I typically emit an event on my client. */
export class BasePacketHandler {
	/**
	 * @param {number} packetId - The packet ID to handle.
	 * @param {Client} client - The client to listen and act on for packets.
	 */
	constructor(packetId, client) {
		this.packetId = packetId
		this.client = client
	}
	/** The size of the packet including the packet ID. */
	packetSize = 0
	/**Handles a given packet by using the socket's buffer.
	 * 
	 * The SmartBuffer instance is readily placed at the start of the packet, but please be as so kind and move the cursor appropriately to the end of the handled packet. This is a whole partial buffer as it was received by the socket. It's intended for situations where a socket is to be upgraded from a TCP socket to a WebSocket.
	 * @param {SmartBuffer} buffer
	 * @abstract
	 */
	onPacket(buffer) {
		throw new Error(`onPacket is an abstract method of ${this.constructor.name} and must be implemented.`)
	}
}

export default BasePacketHandler
