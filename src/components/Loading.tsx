import { createSignal, onCleanup, onMount } from 'solid-js'
import './style/loading.scss'

type Line = {
    x1: number
    y1: number
    x2: number
    y2: number
    p: number
    t: [number, number]
}
/* p is percentage and its precalculated: 100% / LINES.length * index */
const LINES: Line[] = [
    { x1: 4.5, y1: 3, x2: 7.5, y2: 3, p: 17, t: [0, -1.2] },
    { x1: 7.5, y1: 3, x2: 9, y2: 6, p: 33, t: [1.2, -0.6] },
    { x1: 9, y1: 6, x2: 7.5, y2: 9, p: 50, t: [1.2, 0.6] },
    { x1: 7.5, y1: 9, x2: 4.5, y2: 9, p: 67, t: [0, 1.2] },
    { x1: 4.5, y1: 9, x2: 3, y2: 6, p: 83, t: [-1.2, 0.6] },
    { x1: 3, y1: 6, x2: 4.5, y2: 3, p: 100, t: [-1.2, -0.6] },
]

// const PATH_DATA = {
//     17: 'M 4.5 3 L 7.5 3',
//     33: 'M 4.5 3 L 7.5 3 L 9 6',
//     50: 'M 4.5 3 L 7.5 3 L 9 6 L 7.5 9',
//     67: 'M 4.5 3 L 7.5 3 L 9 6 L 7.5 9 L 4.5 9',
//     83: 'M 4.5 3 L 7.5 3 L 9 6 L 7.5 9 L 4.5 9 L 3 6 ',
//     100: 'M 4.5 3 L 7.5 3 L 9 6 L 7.5 9 L 4.5 9 L 3 6 Z',
// }

var loading_interval: NodeJS.Timer
const Loading = () => {
    // const [path_data, setPathData] = createSignal('')
    const [percentage, setPercentage] = createSignal(0)

    onMount(() => {
        clearInterval(loading_interval)

        // let step = 100 / LINES.length
        // let milestone = step
        loading_interval = setInterval(() => {
            setPercentage(p => {
                let np = p + 1
                if (np >= 100) {
                    clearInterval(loading_interval)
                    //     setPathData(PATH_DATA[100])
                    return 100
                }

                return np
                // } else if (np >= 83) {
                //     setPathData(PATH_DATA[83])
                // } else if (np >= 67) {
                //     setPathData(PATH_DATA[67])
                // } else if (np >= 50) {
                //     setPathData(PATH_DATA[50])
                // } else if (np >= 33) {
                //     setPathData(PATH_DATA[33])
                // } else if (np >= 17) {
                //     setPathData(PATH_DATA[17])
                // } else {
                //     setPathData('')
                // }
            })
        }, 70)
    })

    onCleanup(() => {
        clearInterval(loading_interval)
    })

    return (
        <div class='loading-container'>
            <svg class='loading' viewBox='0 0 12 12'>
                <clipPath id='loading_hexagon_clip'>
                    <path d='M 1.5 0 L 4.5 0 L 6 3 L 4.5 6 L 1.5 6 L 0 3 Z' />
                </clipPath>

                {LINES.map(({ p, t, ...attrs }) => (
                    <line
                        transform={`translate(${t[0]} ${t[1]})`}
                        {...attrs}
                        opacity={percentage() >= p ? 1 : 0}
                        // opacity={1}
                    ></line>
                ))}

                <text
                    text-anchor='middle'
                    dominant-baseline='middle'
                    x='50%'
                    y='50%'
                >
                    {percentage()}%
                </text>

                {/*
                <path fill='#111' d='M 1.5 0 L 4.5 0 L 3 3 Z'></path>
                <path fill='darkcyan' d='M 4.5 0 L 3 3 L 6 3 Z'></path>
                <path fill='darkgreen' d='M 6 3 L 4.5 6 L 3 3 Z'></path>
                <path fill='darkred' d='M 4.5 6 L 1.5 6 L 3 3 Z'></path>
                <path fill='darkgray' d='M 1.5 6 L 0 3 L 3 3 Z'></path>
                <path fill='#111' d='M 0 3 L 1.5 0 L 3 3 Z'></path>
                */}
            </svg>
        </div>
    )
}

export { Loading }
