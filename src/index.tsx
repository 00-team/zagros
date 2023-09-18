/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { Header } from 'layout/header'
import { render } from 'solid-js/web'
import 'style/index.scss'

const App = () => {
    return (
        <>
            <Header />
        </>
    )
}

render(() => <App />, document.getElementById('root')!)
