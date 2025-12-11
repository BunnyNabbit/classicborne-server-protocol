// @ts-check
import { SmartBuffer } from "smart-buffer"
import { DataTypes } from "../DataTypes.mjs"
import { BaseExtension } from "../BaseExtension.mjs"
/** @import { Client } from "../Client.mjs" */

/** I define EnvMapAspect. */
export class LevelEnvironment extends BaseExtension {
	/**
	 * @param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, version)
	}
	static texturePackUrlPacketIdentifier = 0x28

	texturePackUrl(url) {
		const texturePackBuffer = new SmartBuffer({ size: 65 }).writeUInt8(LevelEnvironment.texturePackUrlPacketIdentifier)
		texturePackBuffer.writeBuffer(DataTypes.padString(url))
		this.client.socket.write(texturePackBuffer.toBuffer())
	}
	static environmentPropertiesPacketIdentifier = 0x29

	setEnvironmentProperties(environment) {
		for (const [key, value] of Object.entries(environment)) {
			const propertyIndex = LevelEnvironment.environmentProperties.indexOf(key)
			if (propertyIndex !== -1) {
				const environmentPropertyBuffer = new SmartBuffer({ size: 6 }).writeUInt8(LevelEnvironment.environmentPropertiesPacketIdentifier)
				environmentPropertyBuffer.writeUInt8(propertyIndex)
				environmentPropertyBuffer.writeInt32BE(value)
				this.client.socket.write(environmentPropertyBuffer.toBuffer())
			}
		}
	}
	static environmentProperties = ["sidesId", "edgeId", "edgeHeight", "cloudsHeight", "maxFog", "cloudsSpeed", "weatherFade", "useExponentialFog", "sidesOffset"]
}

export default LevelEnvironment
