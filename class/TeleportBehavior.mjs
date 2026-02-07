import { SmartBuffer } from "smart-buffer"

export class TeleportBehavior {
	/**/
	constructor() {
		this.æffectsPosition = false
		this.æffectsOrientation = false
		this.interpolatesOrientation = false
		this.moveMode = TeleportBehavior.moveMode.absoluteInstant
	}
	/**Set move mode of teleport behavior.
	 *
	 * @param {number} mode - The move mode. See {@link moveMode}.
	 * @returns {TeleportBehavior}
	 */
	setMoveMode(mode = TeleportBehavior.moveMode.absoluteInstant) {
		this.moveMode = mode
		return this
	}
	/** @todo Yet to be documented. */
	setAffectsPosition(affects = true) {
		this.æffectsPosition = affects
		return this
	}
	/** @todo Yet to be documented. */
	setAffectsOrientation(affects = true) {
		this.æffectsOrientation = affects
		return this
	}
	/** @todo Yet to be documented. */
	setInterpolatesOrientation(interpolates = true) {
		this.interpolatesOrientation = interpolates
		return this
	}
	/** @todo Yet to be documented. */
	toBuffer() {
		const buffer = new SmartBuffer({ size: 1 })
		let byte = 0
		if (this.æffectsPosition) byte |= 1 << 0
		byte |= (this.moveMode & 3) << 1
		if (this.æffectsOrientation) byte |= 1 << 4
		if (this.interpolatesOrientation) byte |= 1 << 5
		buffer.writeUInt8(byte)
		return buffer.toBuffer()
	}

	static moveMode = {
		/** Instantly move to position with no interpolation. */
		absoluteInstant: 0,
		/** Move to position with interpolation. */
		absoluteSmooth: 1,
		/** Move relative to position with interpolation. */
		relativeSmooth: 2,
		/** Instantly move relative to position with no interpolation. */
		relativeInstant: 3,
	}
}

export default TeleportBehavior
