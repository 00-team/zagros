/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

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

var index_script = document.getElementById('index_script')

hot_reload_ws.onmessage = function (e) {
    let data = JSON.parse(e.data)
    if (data.scripts[0] != index_script.attributes.src.value) {
        clean_up()
        index_script.remove()
        index_script = document.createElement('script')
        index_script.id = 'index_script'
        index_script.defer = true
        index_script.src = data.scripts[0]
        document.head.appendChild(index_script)
    }

    data.styles.forEach(([uid, href]) => {
        /** @type {HTMLLinkElement} */
        let link = document.getElementById('stylesheet_' + uid)
        if (link.attributes.href.value != href) {
            link.setAttribute('href', href)
        }
    })
}
