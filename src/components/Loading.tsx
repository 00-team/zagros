import './style/loading.scss'

const Loading = () => {
    return (
        <div class='loading-container'>
            {/*<svg class='loading' viewBox='0 0 52 38'>
                <g class='frame'>
                    <path
                        class='bc'
                        fill='#f22'
                        d='M 47 33 L 9 33 L 9 36 L 47 36 Z'
                    ></path>

                    <path
                        class='bl'
                        fill='#222'
                        d='M 7 33 L 7 36 L 9 36 L 9 33 Z'
                    />

                    <path
                        class='tl'
                        fill='blue'
                        d='M 9 4 L 9 7 L 7 7 L 7 4 Z'
                    />

                    <path
                        class='tc'
                        fill='orange'
                        d='M 9 7 L 9 4 L 45 4 L 45 7 Z'
                    />

                    <path
                        fill='#222'
                        d='M 9 7 L 45 7 L 47 9 L 47 33 L 9 33 L 7 31 L 7 9 Z'
                    ></path>
                </g>
            </svg>*/}
            <div class='loading'>
                <div class='shape'>
                    <div class='face bottom'>Bottom</div>
                    <div class='face front'>Front</div>
                    <div class='face top'></div>
                    <div class='face back'></div>
                </div>
            </div>
        </div>
    )
}

export { Loading }
