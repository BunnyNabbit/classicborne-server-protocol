// @ts-check
import { BaseExtension } from "../BaseExtension.mjs"
import { ProtocolExtensionIdentify } from "./packetHandlers/ProtocolExtensionIdentify.mjs"
import { DefineProtocolExtension } from "./packetHandlers/DefineProtocolExtension.mjs"
/** @import {Client} from "../Client.mjs" */

/** I am a psuedo-extension. While I am not truly a CPE extension, I exist to provide communication for initial CPE client connections. Because of this, a client isn't able to request this extension, only indirectly. Actually, I am not even added to the client's extension manager. My constructor is only used to provide packet handlers. */
export class CpeBase extends BaseExtension {
	/**@param {Client} client
	 * @param {number} version
	 */
	constructor(client, version) {
		super(client, 1)
		client.packetHandlers.set(ProtocolExtensionIdentify.packetId, new ProtocolExtensionIdentify(client))
		client.packetHandlers.set(DefineProtocolExtension.packetId, new DefineProtocolExtension(client))
	}
}

export default CpeBase
