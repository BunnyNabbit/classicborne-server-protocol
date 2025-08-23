// Bare minimum server operation
import { Server } from "classicborne-server-protocol"
const server = new Server(25565)

const bounds = { x: 512, y: 512, z: 512 }
const emptyLevelBuffer = server.utils.processLevel(Buffer.alloc(bounds.x * bounds.y * bounds.z), bounds.x, bounds.y, bounds.z)

server.on("clientConnected", async (client, authInfo) => {
	console.log(emptyLevelBuffer)
	client.serverIdentification("Empty", "So cool!", 0x00)
	client.loadLevel(await emptyLevelBuffer, bounds.x, bounds.y, bounds.z, true)
	client.configureSpawn(0, authInfo.username, 0, 0, 0, 0, 0)
})
