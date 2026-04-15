import http from 'http'

export function startServer(): void {
  const port = process.env.PORT ?? 3000

  http
    .createServer((_, res) => {
      res.writeHead(200)
      res.end('OK')
    })
    .listen(port, () => {
      console.log(`🌐 HTTP server started on port ${port}`)
    })
}
