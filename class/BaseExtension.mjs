// @ts-check
/** @import { Client } from "./Client.mjs" */

export class BaseExtension {
	/**
	 * @param {Client} client
	 * @param {number} version - The extension version.
	 */
	constructor(client, version) {
		this.client = client
		this.version = version
	}

	/**The packet IDs that the extension ????
	 * @type {number[]}
	 */
	static packetIds = []
	/**The extension versions this implementation supports.
	 * @type {number[]}
	 */
	static supportedVersions = []
}
