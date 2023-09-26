import { createSignal, onCleanup, onMount, JSX } from 'solid-js'
import './style/loading.scss'

// const loading_open_sfx = new Audio('open-sfx-0.mp3')

const loading_last_light_sfx = new Audio('sfx-4.mp3')
const loading_audio_ctx = new AudioContext()
const loading_audio_filter = loading_audio_ctx.createBiquadFilter()
loading_audio_ctx
    .createMediaElementSource(loading_last_light_sfx)
    .connect(loading_audio_filter)
loading_audio_filter.connect(loading_audio_ctx.destination)

loading_audio_filter.type = 'lowshelf'
loading_audio_filter.frequency.value = 1000
loading_audio_filter.gain.value = 10

const TEXT_ANIME: JSX.AnimateSVGAttributes<SVGAnimateElement> = {
    id: 'loading_text_anime',
    begin: 'indefinite',
    calcMode: 'linear',
    attributeName: 'fill-opacity',
    dur: '800ms',
    values: '0;1',
    fill: 'freeze',
}

type BGAT = JSX.AnimateTransformSVGAttributes<SVGAnimateTransformElement>
const BG_ANIME: BGAT = {
    classList: { loading_open_anime: true },
    attributeName: 'transform',
    attributeType: 'XML',
    type: 'translate',
    dur: '7s',
    fill: 'freeze',
    begin: 'indefinite',
    calcMode: 'spline',
    keyTimes: '0;1',
    keySplines: '0.3 0 0 1',
}

type Line = {
    x1: number
    y1: number
    x2: number
    y2: number
    p: number
    g: number
}
/* p is percentage and its precalculated: 100% / LINES.length * index */
const LINES: Line[] = [
    { g: 0, x1: 8.7, y1: 2.4, x2: 10.2, y2: 5.4, p: 0 },
    { g: 0, x1: 7.5, y1: 10.2, x2: 4.5, y2: 10.2, p: 0 },
    { g: 1, x1: 1.8, y1: 5.4, x2: 3.2, y2: 2.4, p: 0 },
    { g: 1, x1: 4.5, y1: 1.8, x2: 7.5, y2: 1.8, p: 0 },
    { g: 0, x1: 10.2, y1: 6.6, x2: 8.7, y2: 9.6, p: 0 },
    { g: 1, x1: 3.2, y1: 9.6, x2: 1.8, y2: 6.6, p: 0 },
]
LINES.forEach((l, i) => {
    l.p = Math.round((100 / LINES.length) * (i + 1))
})

const GROPS = [
    { d: 'M 18 -18 L 30 6 L 18 30 L -6 30 Z', t: [30, 0] },
    { d: 'M 18 -18 L -6 -18 L -18 6 -6 30 Z', t: [-30, 0] },
]

var loading_interval: NodeJS.Timer

var animates: SVGAnimateElement[] = []
const Loading = () => {
    const [percentage, setPercentage] = createSignal(0)
    const [open, setOpen] = createSignal(false)

    onMount(() => {
        clearInterval(loading_interval)

        let open_animates: SVGAnimateTransformElement[] = Array.from(
            document.querySelectorAll('svg.loading .loading_open_anime')
        )

        let step = 100 / LINES.length
        let milestone = step
        loading_interval = setInterval(() => {
            setPercentage(p => {
                let np = p + 1

                if (np >= 100) {
                    clearInterval(loading_interval)
                    animates.forEach(e => e.beginElement())
                    loading_last_light_sfx.play()

                    // setTimeout(() => loading_open_sfx.play(), 900)

                    setTimeout(() => {
                        open_animates.forEach(e => e.beginElement())
                        setOpen(true)
                    }, 1300)

                    return 100
                }

                if (np >= milestone) {
                    let e = animates.shift()
                    if (e) e.beginElement()
                    new Audio('./sfx-4.mp3').play()
                    milestone += step
                }

                return np
            })
        }, 40)
    })

    onCleanup(() => {
        clearInterval(loading_interval)
    })

    return (
        <div class='loading-container'>
            <svg
                class='loading'
                viewBox='0 0 12 12'
                classList={{ open: open() }}
            >
                {GROPS.map(({ d, t }, i) => (
                    <g>
                        <clipPath id={'loading_g_clip_' + i}>
                            <path d={d} />
                        </clipPath>

                        <path d={d} />

                        <g display={open() ? '' : 'none'}>
                            <text
                                clip-path={`url(#loading_g_clip_${i})`}
                                class='percentage'
                                text-anchor='middle'
                                dominant-baseline='middle'
                                x='50%'
                                y='70%'
                            >
                                100%
                            </text>

                            <text
                                clip-path={`url(#loading_g_clip_${i})`}
                                class='team'
                                text-anchor='middle'
                                dominant-baseline='middle'
                                x='50%'
                                y='45%'
                                dy='-0.9px'
                            >
                                {['0', '0'].map(c => (
                                    <tspan>{c}</tspan>
                                ))}
                            </text>

                            <text
                                clip-path={`url(#loading_g_clip_${i})`}
                                class='team'
                                text-anchor='middle'
                                dominant-baseline='middle'
                                x='50%'
                                y='45%'
                                dy='0.9px'
                            >
                                {['T', 'E', 'A', 'M'].map(c => (
                                    <tspan>{c}</tspan>
                                ))}
                            </text>
                        </g>

                        <animateTransform
                            {...BG_ANIME}
                            values={`0 0; ${t[0]} ${t[1]}`}
                        />
                    </g>
                ))}

                {LINES.map(({ p, g, ...attrs }) => (
                    <line {...attrs} opacity={percentage() >= p ? 1 : 0}>
                        <animateTransform
                            {...BG_ANIME}
                            values={`0 0; ${GROPS[g]!.t[0]} ${GROPS[g]!.t[1]}`}
                        />
                    </line>
                ))}

                <g display={open() ? 'none' : ''}>
                    <text
                        class='percentage'
                        text-anchor='middle'
                        dominant-baseline='middle'
                        x='50%'
                        y='70%'
                    >
                        {Math.round(percentage())}%
                    </text>

                    <text
                        class='team'
                        text-anchor='middle'
                        dominant-baseline='middle'
                        x='50%'
                        y='45%'
                        dy='-0.9px'
                    >
                        {['0', '0'].map(c => (
                            <tspan fill-opacity='0'>
                                {c}
                                <animate
                                    ref={e => animates.push(e)}
                                    {...TEXT_ANIME}
                                />
                            </tspan>
                        ))}
                    </text>

                    <text
                        class='team'
                        text-anchor='middle'
                        dominant-baseline='middle'
                        x='50%'
                        y='45%'
                        dy='0.9px'
                    >
                        {['T', 'E', 'A', 'M'].map(c => (
                            <tspan fill-opacity='0'>
                                {c}
                                <animate
                                    ref={e => animates.push(e)}
                                    {...TEXT_ANIME}
                                />
                            </tspan>
                        ))}
                    </text>
                </g>
            </svg>
        </div>
    )
}

export { Loading }
