const { SmartBuffer } = require("smart-buffer")
const CodePage437 = require("./CodePage437.cjs")
/**Namespace for data type handling
 * @namespace
 */
class DataTypes {

	static readString(buffer) {
		return CodePage437.from(buffer.readBuffer(64)).trim()
	}

	static readFixedShort(buffer) {
		const data = buffer.readUInt16BE()
		const fraction = (data << 27) >>> 27
		let integer = (data << 17) >>> 22
		const sign = data >>> 15
		if (sign) {
			integer = -(integer + 1)
			return integer - (fraction / 32)
		} else {
			return integer + (fraction / 32)
		}
	}

	static fixedShort(num) {
		const fraction = Math.abs((num - Math.trunc(num)) * 32)
		let integer = Math.abs(Math.trunc(num))
		let sign
		if (Math.sign(num) == -1) {
			sign = 1
			integer = Math.max(integer - 1, 0)
		} else {
			sign = 0
		}
		return (fraction | (integer << 5) | sign << 15)
	}
	
	static padString(string) {
		const buffer = new SmartBuffer({ size: 64 })
		buffer.writeBuffer(CodePage437.to(string))
		buffer.writeBuffer(Buffer.alloc(64 - buffer.writeOffset, 0x20))
		return buffer.toBuffer()
	}
}

module.exports.DataTypes = DataTypes
module.exports = DataTypes
