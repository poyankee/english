import type { Answer, Progress } from './types'

const MIN = 60_000
const DAY = 24 * 60 * MIN

/** Kutu -> bir sonraki gösterime kadar geçecek süre. Kutu 0 aynı oturumda tekrar edilir. */
export const INTERVALS = [0, 10 * MIN, DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY, 90 * DAY]
export const MAX_BOX = INTERVALS.length - 1
/** İlk denemede bilinen kelime bu kutudan başlar */
export const KNOWN_BOX = 3
/** Bu kutuya ulaşan kelime "Bilemediklerim" listesinden çıkar */
export const RESCUED_BOX = 4

export function answer(prev: Progress | undefined, id: string, result: Answer, now: number): Progress {
  let box: number
  if (!prev) {
    box = result === 'correct' ? KNOWN_BOX : result === 'unsure' ? 1 : 0
  } else if (result === 'correct') {
    box = Math.min(prev.box + 1, MAX_BOX)
  } else if (result === 'wrong') {
    box = 0
  } else {
    box = Math.max(prev.box, 1)
  }
  return {
    id,
    box,
    due: now + INTERVALS[box],
    seen: (prev?.seen ?? 0) + 1,
    wrong: (prev?.wrong ?? 0) + (result === 'wrong' ? 1 : 0),
    lastSeen: now,
  }
}

export function isMistake(p: Progress): boolean {
  return p.wrong > 0 && p.box < RESCUED_BOX
}
