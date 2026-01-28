export class DeprecationWarning {
	static warnedIds = new Set()
	/**/
	static warn(uniqueId, message) {
		if (this.warnedIds.has(uniqueId)) return
		this.warnedIds.add(uniqueId)
		console.warn(`DeprecationWarning: ${message}`)
	}
}

export default DeprecationWarning
