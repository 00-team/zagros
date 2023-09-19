var refresh_interval = null
var hot_reload_ws = new WebSocket('ws://localhost:8300')

hot_reload_ws.onopen = function () {
    console.log('WebSocket was opened')

    refresh_interval = setInterval(() => {
        if (this.readyState != WebSocket.OPEN) {
            console.log('websocket was closed')
            clearInterval(refresh_interval)
            return
        }
        this.send('reload')
    }, 500)
}

hot_reload_ws.onmessage = function (e) {
    if (e.data != 'none') location.reload()
}
