/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { Header } from 'layout/header'
import { Component } from 'solid-js'
import { render } from 'solid-js/web'
import 'style/index.scss'

const App: Component = () => {
    return (
        <>
            <Header />
        </>
    )
}

render(() => <App />, document.getElementById('root')!)
