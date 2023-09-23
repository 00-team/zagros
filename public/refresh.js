var refresh_interval = null
var hot_reload_ws = new WebSocket('ws://localhost:8300')
var latest_ts = 0

hot_reload_ws.onopen = function () {
    console.log('WebSocket was opened')

    refresh_interval = setInterval(() => {
        if (this.readyState != WebSocket.OPEN) {
            console.log('websocket was closed')
            clearInterval(refresh_interval)
            return
        }
        this.send('reload')
    }, 300)
}

hot_reload_ws.onmessage = async function (e) {
    let new_ts = parseInt(e.data)
    if (!latest_ts) {
        latest_ts = new_ts
    } else if (new_ts != latest_ts) {
        location.reload()
    }
}
