// @ts-check
import { SmartBuffer } from "smart-buffer"
import { CodePage437 } from "./CodePage437.mjs"
/**Namespace for data type handling
 * @namespace
 */
export class DataTypes {
	/**@todo Yet to be documented.
	 * @param {SmartBuffer} buffer 
	 * @returns 
	 */
	static readString(buffer) {
		return CodePage437.from(buffer.readBuffer(64)).trim()
	}
	/**@todo Yet to be documented.
	 * @param {SmartBuffer} buffer 
	 * @returns 
	 */
	static readFixedShort(buffer) {
		const data = buffer.readUInt16BE()
		if (data & 0x8000) {
			return -((~data & 0xffff) + 1) / 32
		} else {
			return data / 32
		}
	}
	/**@todo Yet to be documented.
	 * @param {number} number 
	 * @returns 
	 */
	static fixedShort(number) {
		let multipliedValue = Math.round(number * 32)
		let bitwiseResult = multipliedValue & 0b111111111111111
		if (Math.sign(multipliedValue) == -1) bitwiseResult |= 0b1000000000000000
		return bitwiseResult
	}
	/**@todo Yet to be documented.
	 * @param {string} string 
	 * @returns 
	 */
	static padString(string) {
		const buffer = new SmartBuffer({ size: 64 })
		buffer.writeBuffer(CodePage437.to(string))
		buffer.writeBuffer(Buffer.alloc(64 - buffer.writeOffset, DataTypes.spaceCharacterByte))
		return buffer.toBuffer()
	}
	static spaceCharacterByte = 0x20
}

export default DataTypes
