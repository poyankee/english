import type { Answer, Progress } from './types'

const MIN = 60_000
const DAY = 24 * 60 * MIN
/** Tamamlanan kartların vadesi: pratikte hiç */
const NEVER = 100 * 365 * DAY

/** Kutu -> bir sonraki gösterime kadar geçecek süre. Kutu 0 aynı oturumda tekrar edilir. */
export const INTERVALS = [0, 10 * MIN, DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY, 90 * DAY]
export const MAX_BOX = INTERVALS.length - 1
/** İlk denemede bilinen kelime bu kutudan başlar; bu kutu ve üstü "biliyorum" sayılır */
export const KNOWN_BOX = 3
/** Bu kutuya ulaşan kelime "Bilemediklerim" listesinden çıkar */
export const RESCUED_BOX = 4

/**
 * Cevaba göre kartın yeni durumu.
 * `graduate`: A1/A2 kelimeleri ve geçilen seviyelerden gelen kontrol soruları için true.
 * Böyle kartlar ilk seferde bilinince ya da tekrarla "biliyorum" seviyesine çıkınca tamamlanır.
 */
export function answer(prev: Progress | undefined, id: string, result: Answer, now: number, graduate = false): Progress {
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
  const done = graduate && result === 'correct' && box >= KNOWN_BOX
  return {
    id,
    box: done ? MAX_BOX : box,
    due: now + (done ? NEVER : INTERVALS[box]),
    seen: (prev?.seen ?? 0) + 1,
    wrong: (prev?.wrong ?? 0) + (result === 'wrong' ? 1 : 0),
    lastSeen: now,
    ...(done ? { done: true } : {}),
  }
}

/** Seviye tespit sınavında bilinen kelime: kolay/geçilen seviyede tamamlanır, diğerlerinde "biliyorum"dan başlar */
export function placementKnown(id: string, now: number, graduate: boolean): Progress {
  return answer(undefined, id, 'correct', now, graduate)
}

export function isMistake(p: Progress): boolean {
  return p.wrong > 0 && p.box < RESCUED_BOX && !p.done
}

export function isKnown(p: Progress | undefined): boolean {
  return !!p && (p.done || p.box >= KNOWN_BOX)
}
