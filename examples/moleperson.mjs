// Moleperson game

import { createNoise2D, createNoise3D } from "simplex-noise"
import { Server } from "classicborne-server-protocol"
const server = new Server(25565)

const bounds = [256, 256, 256]
function clamp(number, min, max) {
	return Math.min(Math.max(number, min), max)
}
function createTerrain(params = { baseLayerScale: 0.01, amplifierLayerScale: 0.01, carverLayerScale: 0.03, weirdLayerScale: 0.05 }) {
	const levelBuffer = Buffer.alloc(bounds[0] * bounds[1] * bounds[2])
	const baseLayer = createNoise2D()
	const amplifierLayer = createNoise2D()
	const weirdLayer = createNoise2D()
	const carverLayer = createNoise3D()
	for (let x = 0; x < bounds[0]; x++) {
		for (let z = 0; z < bounds[2]; z++) {
			const columnHeight = clamp(Math.floor((baseLayer(x * params.baseLayerScale, z * params.baseLayerScale) + 8) * 12 * Math.max(amplifierLayer(x * params.amplifierLayerScale, z * params.amplifierLayerScale) * 2, 0.9) + weirdLayer(x * params.weirdLayerScale, z * params.weirdLayerScale) * 5), 4, bounds[1])
			for (let y = 0; y < columnHeight; y++) {
				const carve = carverLayer(x * params.carverLayerScale, y * params.carverLayerScale, z * params.carverLayerScale)
				if (carve < 0.5) {
					let blockType = 3 // Dirt
					if (y == columnHeight - 1) blockType = 2 // Grass
					if (y < columnHeight * 0.8) {
						blockType = 1 // Stone
						if (carve < -0.3) blockType = 12 // Sand
					}
					setBlock(levelBuffer, [x, y, z], blockType)
				}
			}
		}
	}
	return levelBuffer
}
const noop = () => {}
function setBlock(level, position, block, clientWrite = noop) {
	level.writeUInt8(block, position[0] + bounds[2] * (position[2] + bounds[0] * position[1]))
	clientWrite(block, position[0], position[1], position[2])
}
function getBlock(level, position) {
	return level.readUInt8(position[0] + bounds[2] * (position[2] + bounds[0] * position[1]))
}

function randomIntFromInterval(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

const wanderOffsets = [
	[1, 0, 0],
	[0, 0, 1],
	[-1, 0, 0],
	[0, 0, -1],
]
const gravity = [0, -1, 0]
class Monster {
	/**/
	constructor(client) {
		this.client = client
		this.randomizePosition()
		this.state = "gather"
		this.maxEnergy = bounds[1] + 64
		this.energy = 0
		this.delay = 0
	}

	checkBlock(offset = [0, 0, 0]) {
		if (this.position[1] === 0) return this.randomizePosition()
		const checkPosition = offset.map((offset, index) => this.position[index] + offset)
		return getBlock(this.client.level, checkPosition) !== 0
	}

	enforceBounds() {
		if (!this.position.every((position, index) => position >= 0 && position < bounds[index])) this.randomizePosition()
	}

	wander() {
		this.position = wanderOffsets[randomIntFromInterval(0, wanderOffsets.length - 1)].map((offset, index) => this.position[index] + offset)
	}

	fall() {
		this.position = gravity.map((offset, index) => this.position[index] + offset)
	}

	setBlock(type, position) {
		setBlock(this.client.level, position, type, (block, x, y, z) => {
			this.client.setBlock(block, x, y, z)
		})
	}

	update(previousLocation) {
		if (previousLocation) this.setBlock(0, previousLocation)
		this.setBlock(21, this.position)
	}

	randomizePosition() {
		this.position = [randomIntFromInterval(0, bounds[0] - 1), randomIntFromInterval(0, bounds[1] - 1), randomIntFromInterval(0, bounds[2] - 1)]
	}

	tick() {
		this.delay--
		if (this.delay > 0) return
		const previousLocation = this.position
		switch (this.state) {
			case "gather":
				if (this.checkBlock(gravity)) {
					this.wander()
					if (this.checkBlock()) {
						this.delay = 3
						this.energy++
						if (this.energy >= this.maxEnergy) this.state = "hunt"
					}
				} else {
					this.fall()
				}
				break
			case "hunt": // unimplemented
				this.state = "gather"
				break
		}

		this.enforceBounds()
		this.update(previousLocation)
	}
}

server.on("clientConnected", async (client, authInfo) => {
	client.serverIdentification("Moleperson", " Moleperson game", 0x00)
	client.level = createTerrain()
	client.loadLevel(client.level, bounds[0], bounds[1], bounds[2], false, () => {
		client.configureSpawn(0, authInfo.username, 128, 256, 128, 0, 0)
		const monsters = []
		for (let i = 0; i < 32; i++) {
			new Monster(client)
		}
		const interval = setInterval(() => {
			if (client.socket.destroyed) return clearInterval(interval)
			monsters.forEach((monster) => monster.tick())
		}, 50)
	})
})
