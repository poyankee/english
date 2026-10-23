import type { AppData } from './App'
import { badges, knownCount, totalXp, xpLevel, type Badge } from './stats'

/** Uygulama verisinden rozetlerin güncel durumu */
export function badgeList(data: AppData): Badge[] {
  return badges({
    known: knownCount(data.progress),
    streak: data.streak,
    level: data.settings.currentLevel,
    totalReviews: data.days.reduce((a, d) => a + d.reviews, 0),
    bestCombo: data.counters.bestCombo,
    perfectSessions: data.counters.perfectSessions,
    gamesPlayed: data.counters.gamesPlayed,
    customWords: data.cards.filter((c) => c.custom).length,
    xpLevel: xpLevel(totalXp(data.days)).level,
  })
}
