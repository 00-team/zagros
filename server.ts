import { resolve as path_resolve } from 'path'

const DIR_DIST = path_resolve(import.meta.dir, 'dist/')
const UPDATE_TS = path_resolve(DIR_DIST, 'latest_update.txt')

var latest_update = parseInt(await Bun.file(UPDATE_TS).text())

Bun.serve({
    port: 8300,
    development: true,
    hostname: '127.0.0.1',
    fetch(request) {
        if (this.upgrade(request)) return

        return new Response('error upgrading the request', { status: 500 })
    },
    websocket: {
        async message(ws) {
            let new_latest_update = parseInt(await Bun.file(UPDATE_TS).text())
            if (new_latest_update != latest_update) {
                latest_update = new_latest_update
                ws.sendText('script')
            } else {
                ws.sendText('none')
            }
        },
    },
})
