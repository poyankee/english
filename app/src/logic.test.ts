import { describe, expect, it } from 'vitest'
import { answer, INTERVALS, isMistake, KNOWN_BOX } from './srs'
import { afterAnswer, buildChoices, isVerb, pickNext, RELEARN_GAP, startSession, VERB_TEST_SIZE } from './session'
import { DEFAULT_SETTINGS, type Card, type Progress } from './types'

const card = (id: string, extra: Partial<Card> = {}): Card => ({
  id,
  word: id,
  pos: 'noun',
  level: 'A1',
  tr: `tr-${id}`,
  def: '',
  ...extra,
})

describe('srs', () => {
  it('ilk seferde bilinen kelime ileri kutudan başlar', () => {
    const p = answer(undefined, 'a', 'correct', 0)
    expect(p.box).toBe(KNOWN_BOX)
    expect(p.due).toBe(INTERVALS[KNOWN_BOX])
    expect(isMistake(p)).toBe(false)
  })

  it('bilinemeyen kelime kutu 0a düşer ve Bilemediklerim listesine girer', () => {
    const p = answer(undefined, 'a', 'wrong', 0)
    expect(p.box).toBe(0)
    expect(isMistake(p)).toBe(true)
  })

  it('yanlış kelime birkaç doğru cevaptan sonra listeden çıkar', () => {
    let p = answer(undefined, 'a', 'wrong', 0)
    const boxes = []
    for (let i = 0; i < 4; i++) {
      p = answer(p, 'a', 'correct', 0)
      boxes.push(p.box)
    }
    expect(boxes).toEqual([1, 2, 3, 4])
    expect(isMistake(p)).toBe(false)
  })

  it('"tahmin ettim" kartı ilerletmez', () => {
    const prev: Progress = { id: 'a', box: 3, due: 0, seen: 2, wrong: 0, lastSeen: 0 }
    expect(answer(prev, 'a', 'unsure', 0).box).toBe(3)
  })
})

describe('session', () => {
  const cards = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => card(id))

  it('yanlış bilinen kart RELEARN_GAP kart sonra tekrar gelir', () => {
    const progress = new Map<string, Progress>()
    let s = startSession('study', cards, progress, 0, DEFAULT_SETTINGS, 0)
    const seen: string[] = []
    for (let i = 0; i < RELEARN_GAP + 2; i++) {
      const c = pickNext(s, cards, progress, DEFAULT_SETTINGS, 0)!
      seen.push(c.id)
      const wrong = i === 0
      progress.set(c.id, answer(progress.get(c.id), c.id, wrong ? 'wrong' : 'correct', 0))
      s = afterAnswer(s, c.id, wrong, true)
    }
    expect(seen.indexOf('a', 1)).toBe(RELEARN_GAP + 1)
  })

  it('günlük yeni kart sınırına uyar', () => {
    const s = startSession('study', cards, new Map(), DEFAULT_SETTINGS.dailyNew, DEFAULT_SETTINGS, 0)
    expect(pickNext(s, cards, new Map(), DEFAULT_SETTINGS, 0)).toBeNull()
  })

  it('vadesi gelen tekrar yeni karttan önce gelir', () => {
    const progress = new Map<string, Progress>([['g', { id: 'g', box: 2, due: 5, seen: 1, wrong: 0, lastSeen: 0 }]])
    const s = startSession('study', cards, progress, 0, DEFAULT_SETTINGS, 0)
    expect(pickNext(s, cards, progress, DEFAULT_SETTINGS, 10)!.id).toBe('g')
  })

  it('seçilmeyen seviyeler gelmez', () => {
    const s = startSession('study', [card('x', { level: 'C1' })], new Map(), 0, DEFAULT_SETTINGS, 0)
    expect(pickNext(s, [card('x', { level: 'C1' })], new Map(), DEFAULT_SETTINGS, 0)).toBeNull()
  })
})

describe('fiil sınavı', () => {
  it('sadece fiil ve fiil kalıplarını sorar, önce vadesi gelenleri', () => {
    const cards = [
      ...Array.from({ length: 30 }, (_, i) => card(`v${i}`, { pos: 'verb' })),
      card('n', { pos: 'noun' }),
      card('p1', { pos: 'phrase', word: 'get up' }),
      card('p2', { pos: 'phrase', word: 'in fact' }),
    ]
    const progress = new Map<string, Progress>([['v29', { id: 'v29', box: 2, due: 5, seen: 1, wrong: 0, lastSeen: 0 }]])
    const s = startSession('verbs', cards, progress, 0, DEFAULT_SETTINGS, 10)
    expect(s.queue).toHaveLength(VERB_TEST_SIZE)
    expect(s.queue[0]).toBe('v29')
    expect(s.queue).not.toContain('n')
    expect(isVerb(cards[31])).toBe(true)
    expect(isVerb(cards[32])).toBe(false)
  })
})

describe('buildChoices', () => {
  it('5 farklı şık üretir, doğru cevap içinde', () => {
    const pool = Array.from({ length: 20 }, (_, i) => card(`w${i}`))
    const choices = buildChoices(pool[0], pool)
    expect(choices).toHaveLength(5)
    expect(new Set(choices).size).toBe(5)
    expect(choices).toContain(pool[0].tr)
  })

  it('aynı anlamı taşıyan şıkları eler', () => {
    const pool = [card('big', { tr: 'büyük, iri' }), card('large', { tr: 'büyük' }), ...Array.from({ length: 6 }, (_, i) => card(`w${i}`))]
    expect(buildChoices(pool[0], pool)).not.toContain('büyük')
  })

  it('parantez içindeki açıklamayı yok sayarak aynı anlamı eler', () => {
    const pool = [card('earn', { tr: 'kazanmak (para)' }), card('win', { tr: 'kazanmak' }), ...Array.from({ length: 6 }, (_, i) => card(`w${i}`))]
    expect(buildChoices(pool[0], pool)).not.toContain('kazanmak')
  })

  it('tamamen parantez içindeki karşılıklar tekrar etmez', () => {
    const pool = [
      card('a', { pos: 'article', tr: 'bir' }),
      card('the', { pos: 'article', tr: '(belirli tanımlık)' }),
      card('the2', { pos: 'article', tr: '(belirli tanımlık)' }),
      ...Array.from({ length: 6 }, (_, i) => card(`w${i}`)),
    ]
    const choices = buildChoices(pool[0], pool)
    expect(new Set(choices).size).toBe(5)
  })
})
