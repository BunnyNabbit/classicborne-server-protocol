const SmartBuffer = require("smart-buffer").SmartBuffer
const gzip = require("zlib").gzip

function processLevel(data, x, y, z) {
	return new Promise(resolve => {
		let compressedPayloadBuffer = new SmartBuffer({ size: data.length + 4 })
		compressedPayloadBuffer.writeInt32BE(x * y * z)
		compressedPayloadBuffer.writeBuffer(data)
		gzip(compressedPayloadBuffer.toBuffer(), (err, result) => {
			if (err) throw err
			resolve(result)
		})
	})
}

module.exports = {
	processLevel
}
