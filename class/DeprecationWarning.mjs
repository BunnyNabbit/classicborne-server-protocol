export class DeprecationWarning {
	static warnedIds = new Set()
	/**Sends a {@link uniqueId | unique} {@link message | warning} to the console. Uses {@link warnedIds} for checking duplicates and adding warned {@link uniqueId} values.
	 *
	 * @param {any} uniqueId - The unique identifier of the message.
	 * @param {string} message - The message to display.
	 */
	static warn(uniqueId, message) {
		if (this.warnedIds.has(uniqueId)) return
		this.warnedIds.add(uniqueId)
		console.warn(`DeprecationWarning: ${message}`)
	}
}

export default DeprecationWarning
