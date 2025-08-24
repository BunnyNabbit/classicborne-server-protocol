import { SmartBuffer } from "smart-buffer"
import { CodePage437 } from "./CodePage437.mjs"
/**Namespace for data type handling
 * @namespace
 */
export class DataTypes {
	/** */
	static readString(buffer) {
		return CodePage437.from(buffer.readBuffer(64)).trim()
	}

	static readFixedShort(buffer) {
		const data = buffer.readUInt16BE()
		if (data & 0x8000) {
			return -((~data & 0xffff) + 1) / 32
		} else {
			return data / 32
		}
	}

	static fixedShort(num) {
		let multipliedValue = Math.round(num * 32)
		let bitwiseResult = multipliedValue & 0b111111111111111
		if (Math.sign(multipliedValue) == -1) bitwiseResult |= 0b1000000000000000
		return bitwiseResult
	}

	static padString(string) {
		const buffer = new SmartBuffer({ size: 64 })
		buffer.writeBuffer(CodePage437.to(string))
		buffer.writeBuffer(Buffer.alloc(64 - buffer.writeOffset, DataTypes.spaceCharacterByte))
		return buffer.toBuffer()
	}
	static spaceCharacterByte = 0x20
}

export default DataTypes
