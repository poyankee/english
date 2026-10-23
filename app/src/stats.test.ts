import { describe, expect, it } from 'vitest'
import { answer, difficultyFactor, INTERVALS, KNOWN_BOX } from './srs'
import { applyFreezes, badges, change, computeStreak, dateKey, daysBefore, EMPTY_FREEZES, heatLevel, weekly, xpForAnswer, xpLevel } from './stats'
import type { DayStats, Progress } from './types'

const DAY = 24 * 3600 * 1000
const NOW = new Date(2026, 9, 21, 12).getTime() // Çarşamba
const k = (daysAgo: number) => dateKey(NOW - daysAgo * DAY)

describe('XP', () => {
  it('cevaba ve seriye göre XP', () => {
    expect(xpForAnswer('correct', 0)).toBe(10)
    expect(xpForAnswer('correct', 3)).toBe(12)
    expect(xpForAnswer('unsure', 5)).toBe(5)
    expect(xpForAnswer('wrong', 5)).toBe(2)
  })

  it('XP seviyeleri 0, 100, 300, 600… eşiklerinde artar', () => {
    expect(xpLevel(0)).toEqual({ level: 1, into: 0, need: 100 })
    expect(xpLevel(99).level).toBe(1)
    expect(xpLevel(100)).toEqual({ level: 2, into: 0, need: 200 })
    expect(xpLevel(650)).toEqual({ level: 4, into: 50, need: 400 })
  })
})

describe('seri ve seri koruyucu', () => {
  it('bugün çalışılmadıysa seri dünden sayılır', () => {
    expect(computeStreak(new Set([k(1), k(2), k(3)]), new Set(), NOW)).toBe(3)
    expect(computeStreak(new Set([k(0), k(1), k(3)]), new Set(), NOW)).toBe(2)
  })

  it('koruyucuyla kurtarılan gün seriyi bozmaz ama sayılmaz', () => {
    expect(computeStreak(new Set([k(1), k(3), k(4)]), new Set([k(2)]), NOW)).toBe(3)
  })

  it('kaçırılan gün yetecek kadar koruyucu varsa kapatılır', () => {
    const s = applyFreezes(new Set([k(2), k(3)]), { available: 1, used: [], grantedWeek: dateKey(NOW - 2 * DAY) }, NOW)
    expect(s.used).toEqual([k(1)])
    expect(s.available).toBe(0)
  })

  it('koruyucu yetmiyorsa hiçbiri harcanmaz', () => {
    const s = applyFreezes(new Set([k(4)]), { available: 1, used: [], grantedWeek: dateKey(NOW - 2 * DAY) }, NOW)
    expect(s.used).toEqual([])
    expect(s.available).toBe(1)
  })

  it('her yeni hafta 1 koruyucu verilir, en fazla 2 birikir', () => {
    expect(applyFreezes(new Set([k(0)]), { available: 1, used: [], grantedWeek: '2026-10-12' }, NOW).available).toBe(2)
    expect(applyFreezes(new Set([k(0)]), { available: 2, used: [], grantedWeek: '2026-10-12' }, NOW).available).toBe(2)
    expect(applyFreezes(new Set(), EMPTY_FREEZES, NOW).available).toBe(1)
  })
})

describe('haftalık özet', () => {
  it('son 7 günü önceki 7 günle karşılaştırır', () => {
    const days: DayStats[] = [
      { date: k(0), newCards: 0, reviews: 20, correct: 15, xp: 150, seconds: 300 },
      { date: k(6), newCards: 0, reviews: 10, correct: 5, xp: 50 },
      { date: k(8), newCards: 0, reviews: 15, correct: 10, xp: 100 },
    ]
    const w = weekly(days, NOW)
    expect(w.current).toMatchObject({ reviews: 30, correct: 20, xp: 200, activeDays: 2, seconds: 300 })
    expect(w.previous.reviews).toBe(15)
    expect(change(30, 15)).toBe(100)
    expect(change(5, 0)).toBeNull()
  })

  it('ısı haritası basamakları', () => {
    expect([0, 5, 15, 30, 80].map(heatLevel)).toEqual([0, 1, 2, 3, 4])
  })
})

describe('zor kelime tespiti', () => {
  const p = (patch: Partial<Progress>): Progress => ({ id: 'a', box: 3, due: 0, seen: 10, wrong: 0, lastSeen: 0, ...patch })

  it('sık yanlış yapılan kartın aralığı kısalır, hiç yanlış yapılmayanınki uzar', () => {
    expect(difficultyFactor(p({ wrong: 5 }))).toBe(0.5)
    expect(difficultyFactor(p({ wrong: 9 }))).toBe(0.4)
    expect(difficultyFactor(p({ wrong: 1 }))).toBe(1)
    expect(difficultyFactor(p({ wrong: 0, box: KNOWN_BOX }))).toBe(1.2)
  })

  it('aralık cevaba uygulanır', () => {
    const hard = answer(p({ wrong: 5, box: 2 }), 'a', 'correct', 0)
    expect(hard.due).toBe(Math.round(INTERVALS[3] * 0.5))
  })
})

describe('rozetler', () => {
  it('koşullara göre kazanılır', () => {
    const b = badges({ known: 60, streak: 7, level: 'B1', totalReviews: 100, bestCombo: 12, perfectSessions: 0, gamesPlayed: 0, customWords: 0, xpLevel: 2 })
    const earned = b.filter((x) => x.earned).map((x) => x.id)
    expect(earned).toEqual(['first', 'known50', 'streak3', 'streak7', 'levelA2', 'levelB1', 'combo10'])
  })
})

describe('günler', () => {
  it('yaz saati geçişinde gün atlamadan geriye gider', () => {
    // Avrupa'da 2026-03-29 gece saat ileri alınır; saat diliminden bağımsız olarak ardışık günler üretilmeli
    const now = new Date(2026, 2, 30, 0, 30).getTime()
    const keys = [0, 1, 2].map((i) => dateKey(daysBefore(now, i)))
    expect(keys).toEqual(['2026-03-30', '2026-03-29', '2026-03-28'])
  })
})
