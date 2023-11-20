// The following scene is based on an animation that portrayed the Not Awesome 2 server.
// In the animation, the player spawns in front of another player, who seemingly trolls the player by destroying the block below them.
// The player is now located in a different level, where they then proceed to say "Hey! WTF!" in the chat. This gets followed by the player getting spammed by messages saying "gimp" and then getting kicked with a message saying "who's shie xD?", likely referring to an alt account as suggested by another animation.
const Server = require("classicborne-server-protocol")
const server = new Server(20304)
const playerSpamNames = ["gimpy", "great", "civil", "clayprism"]
const fs = require('fs')
const nbt = require('nbt')

let level = null
nbt.parse(fs.readFileSync('./reallygreat.cw'), function (error, data) {
	if (error) throw error
	level = Buffer.from(data.value.BlockArray.value)
})

server.on("clientConnected", (client, authInfo) => {
	console.log("Client connected! Hello " + authInfo.username + ".")
	setTimeout(() => {
		client.message("Welcome to Really Great!")
		client.message("You've been here 1 times!")
		client.loadLevel(level)
		client.configureSpawn(0, authInfo.username)
		setTimeout(() => { // begin troll
			setTimeout(() => {
				// teleport to other room
			}, 500)
		}, 1500)
	}, 3000)
	client.on("message", (message) => { // begin spam unless automated command (Hey! WTF!)
		if (message.includes("/")) return // might be command. ignore that.
		client.message(`${authInfo.username}: ` + message, 0)
		for (let i = 0; i < 32; i++) {
			setTimeout(() => {
				client.message(`${playerSpamNames[i % 4]}: gimp`)
			}, 400 * i)
		}
		setTimeout(() => {
			for (let i = 0; i < 64; i++) {
				setTimeout(() => {
					client.message(`${playerSpamNames[i % 4]}: gimp`)
				}, 30 * i)
			}
		}, 3000)
		setTimeout(() => {
			client.disconnect("Kicked: who's shie xD?")
		}, 5000)
	})
})