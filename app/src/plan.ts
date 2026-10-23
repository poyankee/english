import { levelIndex } from './session'
import { isKnown } from './srs'
import type { Card, Progress, Settings } from './types'

const DAY = 24 * 3600 * 1000
export const MIN_DAILY = 5
export const MAX_DAILY = 50

export interface GoalPlan {
  /** Hedefe kadar öğrenilecek kelime (mevcut seviyeden hedef seviyeye, henüz "biliyorum" olmayanlar) */
  remaining: number
  total: number
  daysLeft: number
  /** Hedefe yetişmek için günde gereken yeni kelime */
  perDay: number
  /** Gereken hız uygulamanın sınırını aşıyor */
  tooFast: boolean
}

/** Hedef seviye ve tarihe göre plan; hedef yoksa ya da geçmişse null */
export function goalPlan(cards: Card[], progress: Map<string, Progress>, s: Settings, now: number): GoalPlan | null {
  if (!s.goal) return null
  const from = levelIndex(s.currentLevel)
  const to = levelIndex(s.goal.level)
  if (to < from) return null
  let total = 0
  let remaining = 0
  for (const c of cards) {
    const li = levelIndex(c.level)
    if (li < from || li > to || (c.pos === 'phrase' && !s.phrases)) continue
    total++
    if (!isKnown(progress.get(c.id))) remaining++
  }
  const end = new Date(`${s.goal.date}T23:59:59`).getTime()
  const daysLeft = Math.max(1, Math.ceil((end - now) / DAY))
  const perDay = Math.ceil(remaining / daysLeft)
  return { remaining, total, daysLeft, perDay, tooFast: perDay > MAX_DAILY }
}

/** Otomatik plan açıksa günlük yeni kelime sayısı (sınırlar içinde); değilse kullanıcının seçtiği */
export function plannedDaily(plan: GoalPlan | null, s: Settings): number {
  if (!plan || !s.autoDaily) return s.dailyNew
  return Math.min(MAX_DAILY, Math.max(MIN_DAILY, plan.perDay))
}
