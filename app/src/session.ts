import { isMistake } from './srs'
import type { Card, Progress, Settings } from './types'

/** Yanlış bilinen kart kaç kart sonra tekrar sorulsun */
export const RELEARN_GAP = 4
export const CHOICES = 5

export type Mode = 'study' | 'mistakes'

export interface Session {
  mode: Mode
  /** Bu oturumda yanlış bilinip tekrar sorulacak kartlar; `after` 0'a inince sıra gelir */
  relearn: { id: string; after: number }[]
  /** Bilemediklerim modunda sırayla sorulacak kartlar */
  queue: string[]
  newToday: number
}

export function inScope(card: Card, s: Settings): boolean {
  return card.pos === 'phrase' ? s.phrases && s.levels.includes(card.level) : s.levels.includes(card.level)
}

/** Kart sırası: seviye, sonra id'ye göre sabit karışık sıra (alfabetik gelmesin diye) */
export function newCardOrder(cards: Card[]): Card[] {
  const hash = (s: string) => {
    let h = 2166136261
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
    return h >>> 0
  }
  return [...cards].sort((a, b) => a.level.localeCompare(b.level) || hash(a.id) - hash(b.id))
}

export function startSession(
  mode: Mode,
  cards: Card[],
  progress: Map<string, Progress>,
  newToday: number,
): Session {
  const queue =
    mode === 'mistakes'
      ? cards
          .filter((c) => {
            const p = progress.get(c.id)
            return p && isMistake(p)
          })
          .sort(() => Math.random() - 0.5)
          .map((c) => c.id)
      : []
  return { mode, relearn: [], queue, newToday }
}

/**
 * Sıradaki kartı seçer. Öncelik: zamanı gelen "yeniden öğren" kartı → vadesi gelmiş tekrar →
 * yeni kart (günlük sınır dahilinde) → bekleyen "yeniden öğren" kartı. Hiçbiri yoksa null.
 */
export function pickNext(
  session: Session,
  ordered: Card[],
  progress: Map<string, Progress>,
  settings: Settings,
  now: number,
): Card | null {
  const byId = (id: string) => ordered.find((c) => c.id === id) ?? null
  const ready = session.relearn.find((r) => r.after <= 0)
  if (ready) return byId(ready.id)

  if (session.mode === 'mistakes') {
    const id = session.queue[0] ?? session.relearn[0]?.id
    return id ? byId(id) : null
  }

  const waiting = new Set(session.relearn.map((r) => r.id))
  let due: Card | null = null
  let dueAt = Infinity
  for (const c of ordered) {
    const p = progress.get(c.id)
    if (p && p.due <= now && p.due < dueAt && !waiting.has(c.id) && inScope(c, settings)) {
      due = c
      dueAt = p.due
    }
  }
  if (due) return due

  if (session.newToday < settings.dailyNew) {
    const fresh = ordered.find((c) => !progress.has(c.id) && inScope(c, settings))
    if (fresh) return fresh
  }
  return session.relearn[0] ? byId(session.relearn[0].id) : null
}

/** Cevaptan sonra oturum durumunu günceller (yerinde değil, yeni nesne döner) */
export function afterAnswer(session: Session, cardId: string, wrong: boolean, wasNew: boolean): Session {
  const relearn = session.relearn
    .filter((r) => r.id !== cardId)
    .map((r) => ({ ...r, after: r.after - 1 }))
  if (wrong) relearn.push({ id: cardId, after: RELEARN_GAP })
  return {
    ...session,
    relearn,
    queue: session.queue.filter((id) => id !== cardId),
    newToday: session.newToday + (wasNew ? 1 : 0),
  }
}

/**
 * Doğru cevap + 4 çeldirici. Çeldiriciler önce aynı tür ve seviyeden, yetmezse aynı türden,
 * en son herhangi bir karttan seçilir; Türkçe karşılığı aynı olanlar elenir.
 */
export function buildChoices(card: Card, pool: Card[], rand = Math.random): string[] {
  const used = new Set(splitTr(card.tr))
  const picks: string[] = []
  const tiers = [
    pool.filter((c) => c.pos === card.pos && c.level === card.level),
    pool.filter((c) => c.pos === card.pos),
    pool,
  ]
  for (const tier of tiers) {
    const shuffled = [...tier].sort(() => rand() - 0.5)
    for (const c of shuffled) {
      if (picks.length === CHOICES - 1) break
      if (c.id === card.id || c.word === card.word) continue
      const parts = splitTr(c.tr)
      if (parts.some((t) => used.has(t))) continue
      parts.forEach((t) => used.add(t))
      picks.push(c.tr)
    }
  }
  const choices = [card.tr, ...picks]
  return choices.sort(() => rand() - 0.5)
}

function splitTr(tr: string): string[] {
  return tr.split(/[,;/]/).map((t) => t.trim().toLocaleLowerCase('tr'))
}
