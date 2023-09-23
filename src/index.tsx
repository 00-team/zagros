/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { Header } from 'layout/header'
import { Chart } from 'layout/chart'
import { Component } from 'solid-js'
import { render } from 'solid-js/web'
import 'style/index.scss'

import { default_episodes, episode_types, setEpisodes } from 'stores'
import type { Episode } from 'stores'

let selref: HTMLSelectElement
const App: Component = () => {
    return (
        <main>
            <Header />
            <div class='content'>
                <div class='timeline'>
                    <Chart />
                </div>
                <div class='config-input'>
                    <div class='config'></div>
                    <div class='input'>
                        <select ref={selref}>
                            {episode_types.map(t => (
                                <option value={t}>
                                    {t.replaceAll('_', ' ')}
                                </option>
                            ))}
                        </select>
                        <button
                            onclick={() => {
                                setEpisodes(s => [
                                    ...s,
                                    default_episodes[
                                        selref.value as Episode['type']
                                    ](),
                                ])
                            }}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}

render(() => <App />, document.getElementById('root')!)
