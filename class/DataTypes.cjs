const { SmartBuffer } = require("smart-buffer")
/**Namespace for data type handling
 * @namespace
 */
class DataTypes {
	static readString(buffer) {
		return buffer.readString(64, "ascii").trim()
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
		const buffer = new SmartBuffer({ size: 64 }).writeString(string, "ascii")
		buffer.writeString(" ".repeat(64 - buffer.writeOffset))
		return buffer.toBuffer()
	}
}

module.exports.DataTypes = DataTypes
module.exports = DataTypes
