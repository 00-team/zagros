import { resolve as path_resolve } from 'path'

const DIR_DIST = path_resolve(import.meta.dir, 'dist/')
const UPDATE_TS = path_resolve(DIR_DIST, 'latest_update.txt')

// var latest_update = parseInt(await Bun.file(UPDATE_TS).text())

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
            let data = await Bun.file(UPDATE_TS).text()
            ws.sendText(data)
        },
    },
})
