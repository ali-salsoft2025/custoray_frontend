const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")

const port = Number(process.env.PORT || 3036)
const hostname = process.env.HOST || "127.0.0.1"
const app = next({ dev: false, dir: __dirname, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true))
  }).listen(port, hostname, () => {
    console.log(`Next.js ready on http://${hostname}:${port}`)
  })
})
