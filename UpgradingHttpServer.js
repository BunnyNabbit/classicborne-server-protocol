const { PassThrough } = require("stream").Duplex
const { WebSocketServer } = require("ws")

const http = require("http")
class UpgradingHttpServer {
	constructor() {
		this.webSocketServer = new WebSocketServer({ noServer: true })
		this.webSocketServer.on('connection', function connection(ws, req) {
			ws.on('error', console.error)
			ws._socket.emit("upgradeWebSocket", ws, req)
		})
		this.httpServer = http.createServer((req, res) => {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({
				data: 'Hello World!',
			}))
		})
		this.httpServer.on('upgrade', (req, socket, head) => {
			this.webSocketServer.handleUpgrade(req, socket, head, (ws) => {
				if (socket.client.server.isTrustedWebSocketProxy(socket.remoteAddress)) {
					socket.client.address = req.headers["x-forwarded-for"]
				}
				this.webSocketServer.emit('connection', ws, req)
			})
		})
	}
	upgradeSocketToHttp(socket, head) {
		const pass = new PassThrough()
		const originalWrite = socket._write
		const originalRead = socket._read
		const originalTransform = socket._transform
		socket._write = pass._write
		socket._read = pass._read
		socket._transform = pass._transform
		this.httpServer.emit("connection", socket)
		socket.once("data", (data) => { // ??????? no no it doesnt bozher me it doesnt bozher me. it bozhers me it bozhers me a lot
			socket._write = originalWrite
			socket._read = originalRead
			socket._transform = originalTransform
		})
		socket.write(head)
	}
}

module.exports = UpgradingHttpServer