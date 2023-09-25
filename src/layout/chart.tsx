import { episodes } from 'stores'

import './style/chart.scss'
import { createStore } from 'solid-js/store'

const Chart = () => {
    const [canvas, setCanvas] = createStore({
        width: 0,
        height: 0,
    })

    return (
        <svg class='chart' viewBox='0 0 1024 1024'>
            <line x1={10} y1={1000} x2={1000} y2={1000}></line>
        </svg>
    )
}

export { Chart }
