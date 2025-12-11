// @ts-check
import { BaseExtension } from "../BaseExtension.mjs"
/** @import { Client } from "../Client.mjs" */

/** I define HeldBlock. */
export class HeldBlock extends BaseExtension {
	/**
	 * @param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}
}

export default HeldBlock
