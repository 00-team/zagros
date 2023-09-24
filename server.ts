import { resolve as path_resolve } from 'path'

const DIR_DIST = path_resolve(import.meta.dir, 'dist/')
const LT_ASSETS = path_resolve(DIR_DIST, 'latest_assets.json')

console.log('server is running')

Bun.serve({
    port: 8300,
    development: true,
    hostname: '127.0.0.1',
    fetch(request) {
        console.log('new request')
        if (this.upgrade(request)) return

        return new Response('error upgrading the request', { status: 500 })
    },
    websocket: {
        async message(ws) {
            ws.sendText(await Bun.file(LT_ASSETS).text())
        },
    },
})
