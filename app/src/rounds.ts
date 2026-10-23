/** Oyun turlarını hazırlayan saf fonksiyonlar: boşluk doldurma, çekimler, günlük meydan okuma */
import { baseWord, IRREGULAR_VERBS, pluralOf, regularPast, verbForms, wordVariants } from './forms'
import { buildChoices, gamePool, hash, levelIndex, sample, shuffle } from './session'
import type { Card, Progress, Settings } from './types'

export const ROUND_SIZE = 15
export const DAILY_SIZE = 10

const SINGLE = /^[a-z][a-z'-]*$/

function unlockedWords(cards: Card[], settings: Settings): Card[] {
  return cards.filter((c) => c.pos !== 'phrase' && levelIndex(c.level) <= levelIndex(settings.currentLevel))
}

/* ---------- Boşluk doldurma ---------- */

export interface ClozeQ {
  card: Card
  before: string
  after: string
  /** Cümlede geçen hali (ör. "went") */
  form: string
  /** Şıklar yalın halde (ör. "go") */
  choices: string[]
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Örnek cümlede kelimeyi (çekimli hali dahil) bulup boşluk yapar; bulunamazsa null */
export function clozeOf(card: Card, pool: Card[], rand = Math.random): ClozeQ | null {
  const w = baseWord(card.word)
  if (!card.ex || !SINGLE.test(w)) return null
  const re = new RegExp(`\\b(${wordVariants(w).map(escape).join('|')})\\b`, 'i')
  const m = re.exec(card.ex)
  if (!m) return null
  const picks: string[] = []
  const used = new Set([w])
  for (const tier of [pool.filter((c) => c.pos === card.pos && c.level === card.level), pool.filter((c) => c.pos === card.pos), pool]) {
    for (const c of sample(tier, rand)) {
      if (picks.length === 3) break
      const b = baseWord(c.word)
      if (used.has(b) || !SINGLE.test(b)) continue
      used.add(b)
      picks.push(b)
    }
  }
  return {
    card,
    before: card.ex.slice(0, m.index),
    after: card.ex.slice(m.index + m[0].length),
    form: m[0],
    choices: shuffle([w, ...picks], rand),
  }
}

export function clozeRound(cards: Card[], progress: Map<string, Progress>, settings: Settings, rand = Math.random): ClozeQ[] {
  const all = unlockedWords(cards, settings)
  return gamePool(cards, progress, settings, 200, rand)
    .map((c) => clozeOf(c, all, rand))
    .filter((q): q is ClozeQ => q !== null)
    .slice(0, ROUND_SIZE)
}

/* ---------- Fiil çekimleri ve çoğullar ---------- */

export type FormKind = 'past' | 'participle' | 'plural'

export interface FormQ {
  card: Card
  kind: FormKind
  answer: string
  choices: string[]
}

function fillChoices(answer: string, wrong: string[], extra: string[], rand: () => number): string[] {
  const set = new Set([answer])
  for (const w of [...wrong, ...shuffle(extra, rand)]) {
    if (set.size === 4) break
    // "burnt/burned" gibi cevapların parçaları çeldirici olmasın
    if (w && !answer.split('/').includes(w)) set.add(w)
  }
  return shuffle([...set], rand)
}

export function formQuestion(card: Card, kind: FormKind, rand = Math.random): FormQ | null {
  const w = baseWord(card.word)
  if (kind === 'plural') {
    const answer = pluralOf(w)
    if (!answer) return null
    const wrong = [`${w}s`, w, w.replace(/fe?$/, 'ves'), `${w}es`, `${w}en`]
    return { card, kind, answer, choices: fillChoices(answer, wrong, [], rand) }
  }
  const v = verbForms(w)
  if (!v) return null
  const answer = v[kind]
  const other = kind === 'past' ? v.participle : v.past
  const wrong = [other.split('/')[0], regularPast(w), w]
  const extra = Object.values(IRREGULAR_VERBS).map((x) => x[kind].split('/')[0])
  return { card, kind, answer, choices: fillChoices(answer, wrong, extra, rand) }
}

export function formsRound(cards: Card[], settings: Settings, rand = Math.random): FormQ[] {
  const qs: FormQ[] = []
  for (const c of shuffle(unlockedWords(cards, settings), rand)) {
    if (qs.length === ROUND_SIZE) break
    const kind: FormKind | null = c.pos === 'noun' && pluralOf(c.word) ? 'plural' : c.pos === 'verb' && verbForms(c.word) ? (rand() < 0.5 ? 'past' : 'participle') : null
    const q = kind && formQuestion(c, kind, rand)
    if (q) qs.push(q)
  }
  return qs
}

/* ---------- Günlük meydan okuma ---------- */

/** Tohumlu rastgele sayı üreteci: aynı gün herkese/her açılışta aynı sorular */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface DailyQ {
  card: Card
  choices: string[]
}

export function dailyRound(cards: Card[], settings: Settings, date: string): DailyQ[] {
  const rand = seeded(hash(`${date}:${settings.currentLevel}`))
  const pool = unlockedWords(cards, settings).filter((c) => !c.custom)
  // Sıralama kullanıcıya göre değişmesin diye id'ye göre sabitlenip tohumla karıştırılır
  const base = [...pool].sort((a, b) => a.id.localeCompare(b.id))
  return shuffle(base, rand)
    .slice(0, DAILY_SIZE)
    .map((card) => ({ card, choices: buildChoices(card, pool, rand) }))
}

/** Skor: her doğru 10 puan, ayrıca 90 saniyenin altında kalan her saniye 1 puan (sadece en az bir doğru varsa) */
export function dailyScore(correct: number, seconds: number): number {
  return correct * 10 + (correct ? Math.max(0, 90 - seconds) : 0)
}
