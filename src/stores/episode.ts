import { createLocalStore } from './utils'

type EpBase = {
    timestamp: number
}

type EpProjectStart = EpBase & {
    type: 'project_start'
}

type EpProjectPayment = EpBase & {
    type: 'project_peyment'
    amount: number
}

type Episode = EpProjectStart | EpProjectPayment
type EpMap = {
    [T in Episode as T['type']]: T
}

type EpDefMap = {
    [T in Episode as T['type']]: () => T
}

const default_episodes: EpDefMap = {
    project_start: () => ({
        type: 'project_start',
        timestamp: +new Date(),
    }),
    project_peyment() {
        return {
            type: 'project_peyment',
            timestamp: +new Date(),
            amount: 0,
        }
    },
}

const episode_types = Object.keys(default_episodes) as Array<
    keyof typeof default_episodes
>

const [episodes, setEpisodes] = createLocalStore<Episode[]>('episodes', [])

export { episodes, setEpisodes, default_episodes, episode_types }
export type { EpMap, Episode, EpProjectStart, EpBase }
