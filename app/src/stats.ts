import { isKnown } from './srs'
import { LEVELS, type Answer, type Card, type DayStats, type Level, type Progress } from './types'

const DAY = 24 * 3600 * 1000

export function dateKey(t: number): string {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ---------- XP ---------- */

/** Cevap başına XP: doğru 10, tahmin 5, yanlış 2; 3 ve üstü seride +2 bonus */
export function xpForAnswer(result: Answer, combo: number): number {
  const base = result === 'correct' ? 10 : result === 'unsure' ? 5 : 2
  return base + (result === 'correct' && combo >= 3 ? 2 : 0)
}

/** Oyunlarda her doğru için verilen XP */
export const GAME_XP = 5

/** XP seviyesi: n. seviyeye çıkmak için toplam 50·n·(n-1) XP gerekir (0, 100, 300, 600…) */
export function xpLevel(xp: number) {
  let level = 1
  while (50 * (level + 1) * level <= xp) level++
  const floor = 50 * level * (level - 1)
  const next = 50 * (level + 1) * level
  return { level, into: xp - floor, need: next - floor }
}

export function totalXp(days: DayStats[]): number {
  return days.reduce((a, d) => a + (d.xp ?? 0), 0)
}

/* ---------- Seri ve seri koruyucu ---------- */

export interface FreezeState {
  available: number
  /** Koruyucuyla kurtarılan günler */
  used: string[]
  /** Son hak verilen haftanın pazartesisi */
  grantedWeek: string
}

export const MAX_FREEZES = 2
export const EMPTY_FREEZES: FreezeState = { available: 1, used: [], grantedWeek: '' }

function mondayOf(t: number): string {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dateKey(d.getTime())
}

/**
 * Her hafta 1 seri koruyucu verilir (en fazla 2 birikir). Son çalışılan gün ile bugün arasında
 * kaçırılan günler koruyucu yetiyorsa kapatılır, böylece seri bozulmaz.
 */
export function applyFreezes(active: Set<string>, state: FreezeState, now: number): FreezeState {
  const s: FreezeState = { ...state, used: [...state.used] }
  const week = mondayOf(now)
  if (s.grantedWeek !== week) {
    s.available = Math.min(s.available + (s.grantedWeek ? 1 : 0), MAX_FREEZES)
    s.grantedWeek = week
  }
  const covered = (k: string) => active.has(k) || s.used.includes(k)
  // Dünden geriye, ilk "kapsanmış" güne kadar kaçırılan günleri topla
  const gap: string[] = []
  for (let i = 1; i <= 30; i++) {
    const k = dateKey(now - i * DAY)
    if (covered(k)) break
    gap.push(k)
    if (i === 30) return s // hiç çalışılmamış: kurtarılacak seri yok
  }
  if (gap.length && gap.length <= s.available) {
    s.available -= gap.length
    s.used.push(...gap)
  }
  return s
}

/** Bugünden geriye, çalışılmış ya da koruyucuyla kurtarılmış ardışık gün sayısı (koruyucu günleri sayılmaz) */
export function computeStreak(active: Set<string>, frozen: Set<string>, now: number): number {
  let n = 0
  let i = active.has(dateKey(now)) ? 0 : 1 // bugün henüz çalışılmadıysa seri bozulmaz
  for (; i < 3650; i++) {
    const k = dateKey(now - i * DAY)
    if (active.has(k)) n++
    else if (!frozen.has(k)) break
  }
  return n
}

/* ---------- Haftalık özet ---------- */

export interface WeekSummary {
  reviews: number
  correct: number
  xp: number
  seconds: number
  activeDays: number
}

function sumRange(days: Map<string, DayStats>, from: number, count: number): WeekSummary {
  const s: WeekSummary = { reviews: 0, correct: 0, xp: 0, seconds: 0, activeDays: 0 }
  for (let i = 0; i < count; i++) {
    const d = days.get(dateKey(from - i * DAY))
    if (!d) continue
    s.reviews += d.reviews
    s.correct += d.correct
    s.xp += d.xp ?? 0
    s.seconds += d.seconds ?? 0
    if (d.reviews > 0) s.activeDays++
  }
  return s
}

/** Son 7 gün ve önceki 7 gün */
export function weekly(days: DayStats[], now: number): { current: WeekSummary; previous: WeekSummary } {
  const map = new Map(days.map((d) => [d.date, d]))
  return { current: sumRange(map, now, 7), previous: sumRange(map, now - 7 * DAY, 7) }
}

/** Yüzde değişim; önceki hafta boşsa null */
export function change(cur: number, prev: number): number | null {
  return prev ? Math.round(((cur - prev) / prev) * 100) : null
}

/* ---------- Isı haritası ve grafik ---------- */

/** Son `weeks` haftanın günleri, pazartesiden başlayan sütunlar halinde */
export function heatmap(days: DayStats[], now: number, weeks = 18): { date: string; reviews: number; future: boolean }[][] {
  const map = new Map(days.map((d) => [d.date, d.reviews]))
  const today = new Date(now)
  today.setHours(12, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - ((today.getDay() + 6) % 7) - (weeks - 1) * 7)
  const cols = []
  for (let w = 0; w < weeks; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const t = start.getTime() + (w * 7 + d) * DAY
      const k = dateKey(t)
      col.push({ date: k, reviews: map.get(k) ?? 0, future: t > today.getTime() })
    }
    cols.push(col)
  }
  return cols
}

/** Isı haritası yoğunluk basamağı (0-4) */
export function heatLevel(reviews: number): number {
  return reviews === 0 ? 0 : reviews < 10 ? 1 : reviews < 25 ? 2 : reviews < 50 ? 3 : 4
}

export function lastDays(days: DayStats[], now: number, count: number): DayStats[] {
  const map = new Map(days.map((d) => [d.date, d]))
  return Array.from({ length: count }, (_, i) => {
    const k = dateKey(now - (count - 1 - i) * DAY)
    return map.get(k) ?? { date: k, newCards: 0, reviews: 0, correct: 0 }
  })
}

/** En çok zorlanılan kelimeler: yanlış sayısı ve oranına göre, tamamlananlar hariç */
export function hardestWords(cards: Card[], progress: Map<string, Progress>, n = 10): { card: Card; p: Progress }[] {
  const byId = new Map(cards.map((c) => [c.id, c]))
  return [...progress.values()]
    .filter((p) => p.wrong > 0 && !p.done && byId.has(p.id))
    .sort((a, b) => b.wrong - a.wrong || b.wrong / b.seen - a.wrong / a.seen)
    .slice(0, n)
    .map((p) => ({ card: byId.get(p.id)!, p }))
}

/* ---------- Rozetler ---------- */

export interface BadgeInput {
  known: number
  streak: number
  level: Level
  totalReviews: number
  bestCombo: number
  perfectSessions: number
  gamesPlayed: number
  customWords: number
  xpLevel: number
}

export interface Badge {
  id: string
  icon: string
  /** i18n anahtarının sonu: badge.<id> ve badge.<id>.desc */
  earned: boolean
}

const BADGES: { id: string; icon: string; check: (i: BadgeInput) => boolean }[] = [
  { id: 'first', icon: '🌱', check: (i) => i.totalReviews >= 1 },
  { id: 'known50', icon: '📗', check: (i) => i.known >= 50 },
  { id: 'known250', icon: '📘', check: (i) => i.known >= 250 },
  { id: 'known1000', icon: '📚', check: (i) => i.known >= 1000 },
  { id: 'known3000', icon: '🏛️', check: (i) => i.known >= 3000 },
  { id: 'known5000', icon: '👑', check: (i) => i.known >= 5000 },
  { id: 'streak3', icon: '🔥', check: (i) => i.streak >= 3 },
  { id: 'streak7', icon: '⚡', check: (i) => i.streak >= 7 },
  { id: 'streak30', icon: '🌟', check: (i) => i.streak >= 30 },
  { id: 'streak100', icon: '💎', check: (i) => i.streak >= 100 },
  { id: 'levelA2', icon: '🧭', check: (i) => LEVELS.indexOf(i.level) >= 1 },
  { id: 'levelB1', icon: '🎒', check: (i) => LEVELS.indexOf(i.level) >= 2 },
  { id: 'levelB2', icon: '🏔️', check: (i) => LEVELS.indexOf(i.level) >= 3 },
  { id: 'levelC1', icon: '🦉', check: (i) => LEVELS.indexOf(i.level) >= 4 },
  { id: 'combo10', icon: '🎯', check: (i) => i.bestCombo >= 10 },
  { id: 'combo25', icon: '🏹', check: (i) => i.bestCombo >= 25 },
  { id: 'perfect', icon: '💯', check: (i) => i.perfectSessions >= 1 },
  { id: 'gamer', icon: '🎮', check: (i) => i.gamesPlayed >= 10 },
  { id: 'collector', icon: '✍️', check: (i) => i.customWords >= 5 },
  { id: 'xp10', icon: '🚀', check: (i) => i.xpLevel >= 10 },
]

export function badges(input: BadgeInput): Badge[] {
  return BADGES.map((b) => ({ id: b.id, icon: b.icon, earned: b.check(input) }))
}

export function knownCount(progress: Map<string, Progress>): number {
  let n = 0
  for (const p of progress.values()) if (isKnown(p)) n++
  return n
}
