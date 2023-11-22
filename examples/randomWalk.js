const Server = require("classicborne-server-protocol")
const server = new Server(25565)

const bounds = [256, 256, 256]
const emptyLevelBuffer = server.utils.processLevel(Buffer.alloc(bounds[0] * bounds[1] * bounds[2]), bounds[0], bounds[1], bounds[2])

function randomIntFromInterval(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}
function randomWool() {
	return randomIntFromInterval(21, 33)
}
const walkOffsets = [[-1, 0, 0], [0, -1, 0], [0, 0, -1], [1, 0, 0], [0, 1, 0], [0, 0, 1]]
class Walker {
	constructor(client) {
		this.client = client
		this.walkDistance = 1
		this.randomizePosition()
	}
	randomizePosition() {
		this.position = [randomIntFromInterval(0, bounds[0] - 1), randomIntFromInterval(0, bounds[1] - 1), randomIntFromInterval(0, bounds[2] - 1)]
	}
	tick() {
		this.position = walkOffsets[randomIntFromInterval(0, walkOffsets.length - 1)].map((offset, index) => this.position[index] + offset)
		if (!this.position.every((position, index) => position >= 0 && position < bounds[index])) this.randomizePosition()
		this.client.setBlock(randomWool(), this.position[0], this.position[1], this.position[2])
	}
}

server.on("clientConnected", async (client, authInfo) => {
	client.serverIdentification("Random Walk", "So cool!", 0x00)
	client.loadLevel(await emptyLevelBuffer, bounds[0], bounds[1], bounds[2], true, () => {
		client.configureSpawn(0, authInfo.username, 0, 0, 0, 0, 0)
		const walkers = [new Walker(client), new Walker(client), new Walker(client), new Walker(client), new Walker(client)]
		const interval = setInterval(() => {
			if (client.socket.destroyed) return clearInterval(interval)
			walkers.forEach(walker => walker.tick())
		}, 50)
	})
})
