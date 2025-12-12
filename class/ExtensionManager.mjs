// @ts-check
/** @import { Client } from "./Client.mjs" */
/** @import { BaseExtension } from "./BaseExtension.mjs" */
/** @import { defaultExtensions } from "./extensions/extensionTypes.mts" */
/** @import * as extensions from "./extensions/index.mjs" */

/** I manage the currently applied Classic Protocol Extension extensions for a {@link Client}.
 * 
 * In the `classicborne` ecosystem, clear communication is valued. This means that some extensions have the same name as described in their Classic Protocol Extension. However, some are either unclear or misleading, so they may be referred to as differently in `classicborne-server-protocol`. This is of course no exception when retriving extensions from me. See the {@link extensions} namespace for what these extensions are called.
 * @extends {Map<keyof defaultExtensions, BaseExtension>}
 */
export class ExtensionManager extends Map {
	/**
	 * @param {Client?} client
	 */
	constructor(client) {
		super()
		this.client = client
	}
	/**
	 * @template {keyof defaultExtensions} K
	 * @param {K} key - Name of the extension.
	 * @returns {defaultExtensions[K]} The extension instance.
	 */
	get(key) {
		const extensionInstance = super.get(key)
		if (typeof extensionInstance === "undefined") throw new Error(`Extension "${key}" is not loaded.`)
		return /** @type {defaultExtensions[K]} */ (extensionInstance)
	}
}

export default ExtensionManager
