import { isKnown, isMistake, KNOWN_BOX } from './srs'
import { EASY_LEVELS, LEVELS, type Card, type Level, type Progress, type QuestionType, type Settings } from './types'

/** Yanlış bilinen kart kaç kart sonra tekrar sorulsun */
export const RELEARN_GAP = 4
export const CHOICES = 5
/** Kaç kartta bir geçilen seviyelerden kontrol sorusu gelsin */
export const CHECKUP_EVERY = 5
/** Pratik modlarında (fiil, ters, yazma) sorulacak kart sayısı */
export const PRACTICE_SIZE = 20
/** Mevcut seviyenin bu oranı bilinince sonraki seviyenin kilidi açılır */
export const LEVEL_UP_RATIO = 0.8
/** Seviye tespit sınavında her seviyeden sorulan kelime ve geçmek için gereken doğru sayısı */
export const PLACEMENT_PER_LEVEL = 6
export const PLACEMENT_PASS = 4

export type Mode = 'study' | 'mistakes' | 'verbs' | 'reverse' | 'typing'
/** Kartın neden geldiği: tekrar, yeni, yeniden öğrenme ya da geçilen seviyeden kontrol */
export type PickKind = 'relearn' | 'review' | 'new' | 'checkup' | 'practice'
export interface Pick {
  card: Card
  kind: PickKind
}

const VERB_POS = new Set(['verb', 'modal verb', 'auxiliary verb'])
/** Fiil kalıplarını (get up, look for sth…) tanımak için: kalıbın ilk kelimesi bilinen bir fiil mi? */
const PHRASE_VERB_STARTS = new Set(['get', 'go', 'come', 'take', 'make', 'look', 'find', 'give', 'put', 'turn', 'set', 'bring', 'keep', 'run', 'pick', 'carry', 'break', 'work', 'think', 'grow', 'wake', 'stand', 'sit', 'pay', 'wait', 'listen', 'talk', 'speak', 'ask', 'agree', 'arrive', 'live', 'play', 'spend', 'stay', 'have', 'learn', 'know', 'hold', 'fill', 'end', 'begin', 'deal', 'depend', 'fall', 'figure', 'point', 'rely', 'show', 'sort', 'throw', 'try', 'write', 'call', 'check', 'cut', 'hang', 'move', 'pass', 'pull', 'send', 'sign', 'slow', 'calm', 'cheer', 'clean', 'close', 'drop', 'eat', 'focus', 'leave', 'let', 'lie', 'log', 'shut', 'tidy', 'warm', 'wash', 'wear', 'back', 'belong', 'catch', 'die', 'do', 'dress', 'feel', 'help', 'kick', 'lead', 'lock', 'miss', 'open', 'plug', 'rule', 'settle', 'stick', 'stop', 'switch', 'tear', 'use', 'watch', 'wipe', 'add', 'apply', 'believe', 'compare', 'complain', 'concentrate', 'consist', 'cope', 'dream', 'happen', 'hear', 'hope', 'insist', 'laugh', 'mean', 'object', 'prepare', 'protect', 'provide', 'recover', 'refer', 'reply', 'respond', 'search', 'succeed', 'suffer', 'worry', 'save', 'raise', 'reach', 'build', 'hand', 'join', 'mix', 'count', 'face', 'line', 'note', 'step', 'top', 'name', 'share', 'base', 'aim', 'act', 'care', 'see', 'tell', 'say', 'enjoy', 'win', 'lose', 'meet', 'need', 'want', 'like', 'love', 'hate', 'buy', 'sell', 'drive', 'fly', 'travel', 'visit', 'study', 'teach', 'read', 'start', 'change', 'decide', 'explain', 'remember', 'forget'])

export function isVerb(card: Card): boolean {
  if (VERB_POS.has(card.pos)) return true
  return card.pos === 'phrase' && card.word.includes(' ') && PHRASE_VERB_STARTS.has(card.word.split(' ')[0].toLowerCase())
}

/** Yazma sorusuna uygun mu: tek kelime, kısa, kalıp değil */
export function isTypeable(card: Card): boolean {
  return card.pos !== 'phrase' && /^[a-zA-Z'-]+$/.test(card.word) && card.word.length <= 14
}

const levelIndex = (l: Level) => LEVELS.indexOf(l)

export function passedLevels(s: Settings): Level[] {
  return LEVELS.slice(0, levelIndex(s.currentLevel))
}

/** Bu kart bir kez bilinince tamamlanır mı (A1/A2 ya da geçilmiş seviye) */
export function graduates(card: Card, s: Settings): boolean {
  return EASY_LEVELS.includes(card.level) || levelIndex(card.level) < levelIndex(s.currentLevel)
}

/** Yeni kelimeler yalnızca mevcut seviyeden gelir */
export function inScope(card: Card, s: Settings): boolean {
  return card.level === s.currentLevel && (card.pos !== 'phrase' || s.phrases)
}

/** Kart sırası: seviye, sonra id'ye göre sabit karışık sıra (alfabetik gelmesin diye) */
export function newCardOrder(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.level.localeCompare(b.level) || hash(a.id) - hash(b.id))
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function shuffle<T>(xs: T[], rand: () => number): T[] {
  return xs
    .map((x) => [rand(), x] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, x]) => x)
}

export interface Session {
  mode: Mode
  /** Bu oturumda yanlış bilinip tekrar sorulacak kartlar; `after` 0'a inince sıra gelir */
  relearn: { id: string; after: number }[]
  /** Pratik modlarında sırayla sorulacak kartlar */
  queue: string[]
  newToday: number
  /** Oturumda sorulan kart sayısı (kontrol sorusu sıklığı için) */
  served: number
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
  let queue: string[] = []
  const unlocked = (c: Card) => levelIndex(c.level) <= levelIndex(settings.currentLevel) && (c.pos !== 'phrase' || settings.phrases)
  // Önce vadesi gelmiş, sonra daha önce görülmüş, en son yeni kartlar
  const rank = (c: Card) => {
    const p = progress.get(c.id)
    return !p ? 2 : p.due <= now ? 0 : 1
  }
  const prioritized = (pool: Card[]) =>
    [0, 1, 2]
      .flatMap((r) => shuffle(pool.filter((c) => rank(c) === r), rand))
      .slice(0, PRACTICE_SIZE)
      .map((c) => c.id)

  if (mode === 'mistakes') {
    queue = shuffle(
      cards.filter((c) => {
        const p = progress.get(c.id)
        return p && isMistake(p)
      }),
      rand,
    ).map((c) => c.id)
  } else if (mode === 'verbs') {
    queue = prioritized(cards.filter((c) => isVerb(c) && unlocked(c)))
  } else if (mode === 'reverse') {
    queue = prioritized(cards.filter(unlocked))
  } else if (mode === 'typing') {
    queue = prioritized(cards.filter((c) => isTypeable(c) && unlocked(c)))
  }
  return { mode, relearn: [], queue, newToday, served: 0 }
}

/**
 * Sıradaki kartı seçer. Öncelik: zamanı gelen "yeniden öğren" kartı → vadesi gelmiş tekrar →
 * (her CHECKUP_EVERY kartta bir) geçilen seviyeden kontrol sorusu → mevcut seviyeden yeni kart →
 * bekleyen "yeniden öğren" kartı. Hiçbiri yoksa null.
 */
export function pickNext(
  session: Session,
  ordered: Card[],
  progress: Map<string, Progress>,
  settings: Settings,
  now: number,
): Pick | null {
  const byId = (id: string) => ordered.find((c) => c.id === id)
  const ready = session.relearn.find((r) => r.after <= 0)
  if (ready) return { card: byId(ready.id)!, kind: 'relearn' }

  if (session.mode !== 'study') {
    const id = session.queue[0] ?? session.relearn[0]?.id
    if (!id) return null
    return { card: byId(id)!, kind: session.queue[0] ? 'practice' : 'relearn' }
  }

  const waiting = new Set(session.relearn.map((r) => r.id))
  let due: Card | undefined
  let dueAt = Infinity
  for (const c of ordered) {
    const p = progress.get(c.id)
    if (p && !p.done && p.due <= now && p.due < dueAt && !waiting.has(c.id)) {
      due = c
      dueAt = p.due
    }
  }
  if (due) return { card: due, kind: 'review' }

  const passed = new Set(passedLevels(settings))
  if (passed.size && session.served % CHECKUP_EVERY === CHECKUP_EVERY - 1) {
    const pool = ordered.filter((c) => passed.has(c.level) && !progress.has(c.id) && (c.pos !== 'phrase' || settings.phrases))
    if (pool.length) return { card: pool[(session.served * 7919) % pool.length], kind: 'checkup' }
  }

  if (session.newToday < settings.dailyNew) {
    const fresh = ordered.find((c) => !progress.has(c.id) && inScope(c, settings))
    if (fresh) return { card: fresh, kind: 'new' }
  }
  return session.relearn[0] ? { card: byId(session.relearn[0].id)!, kind: 'relearn' } : null
}

/** Cevaptan sonra oturum durumunu günceller (yerinde değil, yeni nesne döner) */
export function afterAnswer(session: Session, cardId: string, wrong: boolean, countsAsNew: boolean): Session {
  const relearn = session.relearn.filter((r) => r.id !== cardId).map((r) => ({ ...r, after: r.after - 1 }))
  if (wrong) relearn.push({ id: cardId, after: RELEARN_GAP })
  return {
    ...session,
    relearn,
    queue: session.queue.filter((id) => id !== cardId),
    newToday: session.newToday + (countsAsNew ? 1 : 0),
    served: session.served + 1,
  }
}

/**
 * Soru tipi: yeni ve zayıf kartlar İngilizce → Türkçe; iyi bilinenler zaman zaman Türkçe → İngilizce,
 * çok iyi bilinenler yazma sorusu olarak gelir. Pratik modları tipi kendisi belirler.
 */
export function questionType(card: Card, p: Progress | undefined, kind: PickKind, mode: Mode, rand = Math.random): QuestionType {
  if (mode === 'reverse') return 'tr-en'
  if (mode === 'typing') return 'type'
  if (mode !== 'study' || kind === 'relearn' || kind === 'checkup' || !p || p.box < KNOWN_BOX) return 'en-tr'
  if (p.box >= 5 && isTypeable(card) && rand() < 0.5) return 'type'
  return rand() < 0.5 ? 'tr-en' : 'en-tr'
}

/**
 * Doğru cevap + 4 çeldirici. Çeldiriciler önce aynı tür ve seviyeden, yetmezse aynı türden,
 * en son herhangi bir karttan seçilir; aynı anlamı taşıyanlar elenir.
 * `field`: şıklar Türkçe karşılık mı (en-tr) yoksa İngilizce kelime mi (tr-en).
 */
export function buildChoices(card: Card, pool: Card[], rand = Math.random, field: 'tr' | 'word' = 'tr'): string[] {
  const key = (c: Card) => (field === 'tr' ? splitTr(c.tr) : [c.word.toLowerCase(), ...splitTr(c.tr)])
  const used = new Set(key(card))
  const picks: string[] = []
  const tiers = [pool.filter((c) => c.pos === card.pos && c.level === card.level), pool.filter((c) => c.pos === card.pos), pool]
  for (const tier of tiers) {
    for (const c of shuffle(tier, rand)) {
      if (picks.length === CHOICES - 1) break
      if (c.id === card.id || c.word === card.word) continue
      const parts = key(c)
      if (parts.some((t) => used.has(t))) continue
      parts.forEach((t) => used.add(t))
      picks.push(c[field])
    }
  }
  return shuffle([card[field], ...picks], rand)
}

/** "kazanmak (para), elde etmek" -> ["kazanmak", "elde etmek"]; parantez içi açıklamalar karşılaştırmaya girmez */
function splitTr(tr: string): string[] {
  const parts = tr
    .replace(/\([^)]*\)/g, '')
    .split(/[,;/]/)
    .map((t) => t.trim().toLocaleLowerCase('tr'))
    .filter(Boolean)
  // "(belirli tanımlık)" gibi tamamen parantez içindeki karşılıklarda metnin kendisiyle karşılaştır
  return parts.length ? parts : [tr.trim().toLocaleLowerCase('tr')]
}

/** Yazılan cevabı kontrol eder: tam doğru, tek harf hatalı ("neredeyse") ya da yanlış */
export function checkTyped(input: string, word: string): 'correct' | 'almost' | 'wrong' {
  const a = input.trim().toLowerCase().replace(/\s+/g, ' ')
  const targets = word.toLowerCase().split(/,\s*/)
  if (targets.includes(a)) return 'correct'
  if (a.length >= 4 && targets.some((t) => distance(a, t) <= 1)) return 'almost'
  return 'wrong'
}

/** Levenshtein mesafesi */
function distance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

export interface LevelStats {
  total: number
  known: number
  started: number
}

export function levelStats(cards: Card[], progress: Map<string, Progress>, level: Level): LevelStats {
  let total = 0
  let known = 0
  let started = 0
  for (const c of cards) {
    if (c.level !== level) continue
    total++
    const p = progress.get(c.id)
    if (p) started++
    if (isKnown(p)) known++
  }
  return { total, known, started }
}

/** Mevcut seviye yeterince bilindiyse sonraki seviye, yoksa null */
export function nextLevel(cards: Card[], progress: Map<string, Progress>, s: Settings): Level | null {
  const i = levelIndex(s.currentLevel)
  if (i === LEVELS.length - 1) return null
  const st = levelStats(cards, progress, s.currentLevel)
  return st.total && st.known / st.total >= LEVEL_UP_RATIO ? LEVELS[i + 1] : null
}

/** Seviye tespit sınavı için bir seviyeden rastgele tek kelimelik kartlar */
export function placementCards(cards: Card[], level: Level, rand = Math.random): Card[] {
  const pool = cards.filter((c) => c.level === level && c.pos !== 'phrase' && ['noun', 'verb', 'adjective', 'adverb'].includes(c.pos))
  return shuffle(pool, rand).slice(0, PLACEMENT_PER_LEVEL)
}
