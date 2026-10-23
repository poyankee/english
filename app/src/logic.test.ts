import { describe, expect, it } from 'vitest'
import {
  afterAnswer,
  buildChoices,
  checkTyped,
  CHECKUP_EVERY,
  EXAM_SIZE,
  filterWords,
  newCardOrder,
  phraseBlank,
  graduates,
  isVerb,
  nextLevel,
  pickNext,
  PRACTICE_SIZE,
  questionType,
  RELEARN_GAP,
  startSession,
} from './session'
import { answer, INTERVALS, isKnown, isMistake, KNOWN_BOX, MAX_BOX } from './srs'
import { DEFAULT_SETTINGS, type Card, type Level, type Progress, type Settings } from './types'

const card = (id: string, extra: Partial<Card> = {}): Card => ({
  id,
  word: id,
  pos: 'noun',
  level: 'A1',
  tr: `tr-${id}`,
  def: '',
  ...extra,
})
const settings = (patch: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...patch })
const prog = (id: string, patch: Partial<Progress> = {}): Progress => ({ id, box: 2, due: 0, seen: 1, wrong: 0, lastSeen: 0, ...patch })

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
    expect(answer(prog('a', { box: 3 }), 'a', 'unsure', 0).box).toBe(3)
  })

  it('A1/A2 kelimesi ilk seferde bilinince tamamlanır ve bir daha sorulmaz', () => {
    const p = answer(undefined, 'a', 'correct', 0, true)
    expect(p.done).toBe(true)
    expect(p.box).toBe(MAX_BOX)
    expect(p.due).toBeGreaterThan(50 * 365 * 24 * 3600 * 1000)
  })

  it('A1/A2 kelimesi bilinemezse öğrenilene kadar tekrar edilir, sonra tamamlanır', () => {
    let p = answer(undefined, 'a', 'wrong', 0, true)
    expect(p.done).toBeUndefined()
    p = answer(p, 'a', 'correct', 0, true)
    p = answer(p, 'a', 'correct', 0, true)
    expect(p.done).toBeUndefined()
    p = answer(p, 'a', 'correct', 0, true)
    expect(p.done).toBe(true)
  })

  it('tamamlanmış kelime pratikte yanlış bilinirse tekrar öğrenmeye döner', () => {
    const p = answer(prog('a', { box: MAX_BOX, done: true }), 'a', 'wrong', 0, true)
    expect(p.done).toBeUndefined()
    expect(isKnown(p)).toBe(false)
  })
})

describe('session', () => {
  const cards = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => card(id))

  it('yanlış bilinen kart RELEARN_GAP kart sonra tekrar gelir', () => {
    const progress = new Map<string, Progress>()
    let s = startSession('study', cards, progress, 0, settings(), 0)
    const seen: string[] = []
    for (let i = 0; i < RELEARN_GAP + 2; i++) {
      const c = pickNext(s, cards, progress, settings(), 0)!.card
      seen.push(c.id)
      const wrong = i === 0
      progress.set(c.id, answer(progress.get(c.id), c.id, wrong ? 'wrong' : 'correct', 0))
      s = afterAnswer(s, c.id, wrong, true)
    }
    expect(seen.indexOf('a', 1)).toBe(RELEARN_GAP + 1)
  })

  it('günlük yeni kart sınırına uyar', () => {
    const s = startSession('study', cards, new Map(), DEFAULT_SETTINGS.dailyNew, settings(), 0)
    expect(pickNext(s, cards, new Map(), settings(), 0)).toBeNull()
  })

  it('vadesi gelen tekrar yeni karttan önce gelir; tamamlanan kartlar hiç gelmez', () => {
    const progress = new Map([
      ['g', prog('g', { due: 5 })],
      ['f', prog('f', { due: 1, done: true })],
    ])
    const s = startSession('study', cards, progress, 0, settings(), 0)
    expect(pickNext(s, cards, progress, settings(), 10)).toEqual({ card: cards[6], kind: 'review' })
  })

  it('yeni kelimeler yalnızca mevcut seviyeden gelir', () => {
    const pool = [card('x', { level: 'C1' }), card('y', { level: 'B1' })]
    const s = startSession('study', pool, new Map(), 0, settings({ currentLevel: 'B1' }), 0)
    expect(pickNext(s, pool, new Map(), settings({ currentLevel: 'B1' }), 0)?.card.id).toBe('y')
  })

  it('geçilen seviyelerden belirli aralıklarla kontrol sorusu gelir', () => {
    const pool = [card('old', { level: 'A1' }), ...Array.from({ length: 10 }, (_, i) => card(`b${i}`, { level: 'B1' }))]
    const st = settings({ currentLevel: 'B1' })
    const s = { ...startSession('study', pool, new Map(), 0, st, 0), served: CHECKUP_EVERY - 1 }
    expect(pickNext(s, pool, new Map(), st, 0)).toEqual({ card: pool[0], kind: 'checkup' })
    expect(pickNext({ ...s, served: 0 }, pool, new Map(), st, 0)?.kind).toBe('new')
  })

  it('geçilen seviyedeki ve A1/A2 kartları tamamlanabilir, mevcut seviyedeki B1+ kartları tamamlanmaz', () => {
    const st = settings({ currentLevel: 'B2' })
    expect(graduates(card('a', { level: 'A2' }), st)).toBe(true)
    expect(graduates(card('b', { level: 'B1' }), st)).toBe(true)
    expect(graduates(card('c', { level: 'B2' }), st)).toBe(false)
  })

  it('mevcut seviyenin %80i bilinince sonraki seviye açılır', () => {
    const pool = Array.from({ length: 10 }, (_, i) => card(`k${i}`, { level: 'A1' }))
    const progress = new Map(pool.slice(0, 8).map((c) => [c.id, prog(c.id, { box: KNOWN_BOX })]))
    expect(nextLevel(pool, progress, settings())).toBe<Level>('A2')
    progress.delete('k0')
    expect(nextLevel(pool, progress, settings())).toBeNull()
  })
})

describe('soru tipleri', () => {
  it('yeni kart İngilizce → Türkçe, iyi bilinen kart bazen ters ya da yazma olarak gelir', () => {
    const c = card('house')
    expect(questionType(c, undefined, 'new', 'study')).toBe('en-tr')
    expect(questionType(c, prog('house', { box: 3 }), 'review', 'study', () => 0.1)).toBe('tr-en')
    expect(questionType(c, prog('house', { box: 5 }), 'review', 'study', () => 0.1)).toBe('type')
    expect(questionType(card('look up', { pos: 'phrase' }), prog('x', { box: 6 }), 'review', 'study', () => 0.1)).toBe('tr-en')
  })

  it('pratik modları tipi kendisi belirler', () => {
    expect(questionType(card('a'), undefined, 'practice', 'reverse')).toBe('tr-en')
    expect(questionType(card('a'), undefined, 'practice', 'typing')).toBe('type')
  })

  it('yazma kontrolü: tam doğru, tek harf hatası, yanlış', () => {
    expect(checkTyped(' House ', 'house')).toBe('correct')
    expect(checkTyped('hous', 'house')).toBe('almost')
    expect(checkTyped('mouse', 'house')).toBe('almost')
    expect(checkTyped('home', 'house')).toBe('wrong')
    expect(checkTyped('an', 'a, an')).toBe('correct')
  })
})

describe('pratik', () => {
  it('fiil sınavı sadece fiil ve fiil kalıplarını sorar, önce vadesi gelenleri', () => {
    const cards = [
      ...Array.from({ length: 30 }, (_, i) => card(`v${i}`, { pos: 'verb' })),
      card('n', { pos: 'noun' }),
      card('p1', { pos: 'phrase', word: 'get up' }),
      card('p2', { pos: 'phrase', word: 'in fact' }),
    ]
    const progress = new Map([['v29', prog('v29', { due: 5 })]])
    const s = startSession('verbs', cards, progress, 0, settings(), 10)
    expect(s.queue).toHaveLength(PRACTICE_SIZE)
    expect(s.queue[0]).toBe('v29')
    expect(s.queue).not.toContain('n')
    expect(isVerb(cards[31])).toBe(true)
    expect(isVerb(cards[32])).toBe(false)
  })

  it('yazma modu kalıpları ve çok kelimeli kartları sormaz', () => {
    const cards = [card('house'), card('look up', { pos: 'phrase' }), card('ice cream')]
    expect(startSession('typing', cards, new Map(), 0, settings(), 0).queue).toEqual(['house'])
  })

  it('kilitli seviyeler pratikte sorulmaz', () => {
    const cards = [card('a1'), card('c1', { level: 'C1' })]
    expect(startSession('reverse', cards, new Map(), 0, settings(), 0).queue).toEqual(['a1'])
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

  it('ters modda İngilizce kelimeleri şık yapar', () => {
    const pool = Array.from({ length: 20 }, (_, i) => card(`w${i}`))
    const choices = buildChoices(pool[0], pool, Math.random, 'word')
    expect(choices).toContain('w0')
    expect(choices.every((c) => c.startsWith('w'))).toBe(true)
  })

  it('aynı anlamı taşıyan şıkları eler', () => {
    const pool = [card('big', { tr: 'büyük, iri' }), card('large', { tr: 'büyük' }), ...Array.from({ length: 6 }, (_, i) => card(`w${i}`))]
    expect(buildChoices(pool[0], pool)).not.toContain('büyük')
    expect(buildChoices(pool[0], pool, Math.random, 'word')).not.toContain('large')
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
    expect(new Set(buildChoices(pool[0], pool)).size).toBe(5)
  })
})

describe('sınav, karışanlar, kalıp tamamlama', () => {
  it('sınav açılmış seviyelerden EXAM_SIZE soru seçer', () => {
    const cards = Array.from({ length: 50 }, (_, i) => card(`w${i}`))
    expect(startSession('exam', cards, new Map(), 0, settings(), 0).queue).toHaveLength(EXAM_SIZE)
  })

  it('karışanlar modu en çok karıştırılan kelimeden başlar', () => {
    const cards = [card('a'), card('b'), card('c')]
    const s = startSession('confused', cards, new Map(), 0, settings(), 0, Math.random, { a: { b: 1 }, c: { a: 3 } })
    expect(s.queue).toEqual(['c', 'a'])
  })

  it('karışanlar modunda karıştırılan kelime şıklarda bulunur', () => {
    const pool = Array.from({ length: 30 }, (_, i) => card(`w${i}`))
    for (let k = 0; k < 10; k++) expect(buildChoices(pool[0], pool, Math.random, 'tr', [pool[29]])).toContain(pool[29].tr)
  })

  it('kalıpta parçacığı boşluk yapar, parçacıksız kalıbı atlar', () => {
    const b = phraseBlank(card('look after sb/sth', { pos: 'phrase' }))!
    expect(b.parts).toEqual(['look', null, 'sb/sth'])
    expect(b.answer).toBe('after')
    expect(b.choices).toHaveLength(4)
    expect(b.choices).toContain('after')
    expect(phraseBlank(card('in fact', { pos: 'phrase' }))).toBeNull()
  })
})

describe('kelimeler sekmesi', () => {
  const cards = [card('house', { tr: 'ev' }), card('mouse', { tr: 'fare' }), card('evening', { tr: 'akşam', level: 'A2' }), card('look up', { pos: 'phrase', tr: 'bakmak' })]
  const base = { query: '', level: 'all', status: 'all', pos: 'all' } as const

  it('İngilizce kelimede ve Türkçe karşılıkta arar, baştan eşleşenleri öne alır', () => {
    expect(filterWords(cards, new Map(), new Set(), { ...base, query: 'ev' }).map((c) => c.id)).toEqual(['evening', 'house'])
    expect(filterWords(cards, new Map(), new Set(), { ...base, query: 'ouse' }).map((c) => c.id)).toEqual(['house', 'mouse'])
  })

  it('seviye, tür, durum ve favoriye göre filtreler', () => {
    const progress = new Map([['house', prog('house', { box: KNOWN_BOX })], ['mouse', prog('mouse', { box: 1 })]])
    expect(filterWords(cards, progress, new Set(), { ...base, level: 'A2' }).map((c) => c.id)).toEqual(['evening'])
    expect(filterWords(cards, progress, new Set(), { ...base, pos: 'phrase' }).map((c) => c.id)).toEqual(['look up'])
    expect(filterWords(cards, progress, new Set(), { ...base, status: 'known' }).map((c) => c.id)).toEqual(['house'])
    expect(filterWords(cards, progress, new Set(), { ...base, status: 'learning' }).map((c) => c.id)).toEqual(['mouse'])
    expect(filterWords(cards, progress, new Set(['look up']), { ...base, status: 'favorites' }).map((c) => c.id)).toEqual(['look up'])
  })

  it('kullanıcının eklediği kelimeler yeni kart sırasında en önde', () => {
    const order = newCardOrder([...cards, card('custom:1', { custom: true, level: 'B1' })])
    expect(order[0].id).toBe('custom:1')
  })

  it('konuya göre filtreler ve liste modu yalnızca verilen kartları sorar', () => {
    const pool = [card('apple', { topic: 'food' }), card('dog', { topic: 'animals' }), card('cat', { topic: 'animals' })]
    expect(filterWords(pool, new Map(), new Set(), { ...base, topic: 'animals' }).map((c) => c.id)).toEqual(['cat', 'dog'])
    expect(startSession('list', pool, new Map(), 0, settings(), 0, Math.random, {}, new Set(), ['apple']).queue).toEqual(['apple'])
  })

  it('favoriler modu yalnızca favori kartları sorar', () => {
    expect(startSession('favorites', cards, new Map(), 0, settings(), 0, Math.random, {}, new Set(['mouse'])).queue).toEqual(['mouse'])
  })
})
