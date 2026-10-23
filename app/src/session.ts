import { isMistake } from './srs'
import type { Card, Progress, Settings } from './types'

/** Yanlış bilinen kart kaç kart sonra tekrar sorulsun */
export const RELEARN_GAP = 4
export const CHOICES = 5

export type Mode = 'study' | 'mistakes' | 'verbs'
/** Fiil sınavında sorulacak kart sayısı */
export const VERB_TEST_SIZE = 20

const VERB_POS = new Set(['verb', 'modal verb', 'auxiliary verb'])
/** Fiil kalıplarını (get up, look for sth…) tanımak için: kalıbın ilk kelimesi bilinen bir fiil mi? */
const PHRASE_VERB_STARTS = new Set(['get', 'go', 'come', 'take', 'make', 'look', 'find', 'give', 'put', 'turn', 'set', 'bring', 'keep', 'run', 'pick', 'carry', 'break', 'work', 'think', 'grow', 'wake', 'stand', 'sit', 'pay', 'wait', 'listen', 'talk', 'speak', 'ask', 'agree', 'arrive', 'live', 'play', 'spend', 'stay', 'have', 'learn', 'know', 'hold', 'fill', 'end', 'begin', 'deal', 'depend', 'fall', 'figure', 'point', 'rely', 'show', 'sort', 'throw', 'try', 'write', 'call', 'check', 'cut', 'hang', 'move', 'pass', 'pull', 'send', 'sign', 'slow', 'calm', 'cheer', 'clean', 'close', 'drop', 'eat', 'focus', 'leave', 'let', 'lie', 'log', 'shut', 'take', 'tidy', 'warm', 'wash', 'wear', 'back', 'belong', 'catch', 'die', 'do', 'dress', 'feel', 'help', 'kick', 'lead', 'lock', 'miss', 'open', 'plug', 'rule', 'settle', 'stick', 'stop', 'switch', 'tear', 'use', 'watch', 'wipe', 'add', 'apply', 'believe', 'compare', 'complain', 'concentrate', 'consist', 'cope', 'dream', 'happen', 'hear', 'hope', 'insist', 'laugh', 'mean', 'object', 'prepare', 'protect', 'provide', 'recover', 'refer', 'reply', 'respond', 'search', 'succeed', 'suffer', 'worry', 'save', 'raise', 'reach', 'build', 'hand', 'join', 'mix', 'count', 'face', 'line', 'note', 'step', 'top', 'name', 'share', 'base', 'aim', 'act', 'care', 'see', 'tell', 'say', 'enjoy', 'win', 'lose', 'meet', 'need', 'want', 'like', 'love', 'hate', 'buy', 'sell', 'drive', 'fly', 'travel', 'visit', 'study', 'teach', 'read', 'start', 'change', 'decide', 'explain', 'remember', 'forget'])

export function isVerb(card: Card): boolean {
  if (VERB_POS.has(card.pos)) return true
  return card.pos === 'phrase' && card.word.includes(' ') && PHRASE_VERB_STARTS.has(card.word.split(' ')[0].toLowerCase())
}

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
  settings: Settings,
  now: number,
  rand = Math.random,
): Session {
  const shuffle = <T,>(xs: T[]) => xs.map((x) => [rand(), x] as const).sort((a, b) => a[0] - b[0]).map(([, x]) => x)
  let queue: string[] = []
  if (mode === 'mistakes') {
    queue = shuffle(cards.filter((c) => {
      const p = progress.get(c.id)
      return p && isMistake(p)
    })).map((c) => c.id)
  } else if (mode === 'verbs') {
    // Önce vadesi gelmiş fiiller, sonra daha önce görülenler, en son yeni fiiller
    const verbs = cards.filter((c) => isVerb(c) && inScope(c, settings))
    const rank = (c: Card) => {
      const p = progress.get(c.id)
      return !p ? 2 : p.due <= now ? 0 : 1
    }
    queue = [0, 1, 2]
      .flatMap((r) => shuffle(verbs.filter((c) => rank(c) === r)))
      .slice(0, VERB_TEST_SIZE)
      .map((c) => c.id)
  }
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

  if (session.mode !== 'study') {
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
