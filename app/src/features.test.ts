import { describe, expect, it } from 'vitest'
import { reminderIcs } from './exporter'
import { pluralOf, verbForms, wordVariants } from './forms'
import { goalPlan, plannedDaily } from './plan'
import { judge } from './recognition'
import { clozeOf, dailyRound, dailyScore, formQuestion, seeded } from './rounds'
import { nextProgress, questionType } from './session'
import { DEFAULT_SETTINGS, type Card, type Progress, type Settings } from './types'

const card = (id: string, extra: Partial<Card> = {}): Card => ({ id, word: id, pos: 'noun', level: 'A1', tr: `tr-${id}`, def: '', ...extra })
const settings = (patch: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...patch })
const prog = (id: string, patch: Partial<Progress> = {}): Progress => ({ id, box: 3, due: 0, seen: 1, wrong: 0, lastSeen: 0, ...patch })

describe('çekimler', () => {
  it('düzensiz fiil ve çoğulları bilir', () => {
    expect(verbForms('go')).toEqual({ past: 'went', participle: 'gone' })
    expect(verbForms('lie (1)')?.past).toBe('lay')
    expect(pluralOf('child')).toBe('children')
    expect(verbForms('walk')).toBeUndefined()
  })
  it('metindeki halleri üretir', () => {
    expect(wordVariants('go')).toEqual(expect.arrayContaining(['went', 'gone', 'goes', 'going']))
    expect(wordVariants('stop')).toEqual(expect.arrayContaining(['stopped', 'stopping']))
    expect(wordVariants('study')).toEqual(expect.arrayContaining(['studies', 'studied']))
  })
  it('çekim sorusunda cevap bir kez ve 4 şık vardır', () => {
    const q = formQuestion(card('go', { pos: 'verb' }), 'past', seeded(1))!
    expect(q.answer).toBe('went')
    expect(q.choices).toHaveLength(4)
    expect(q.choices.filter((c) => c === 'went')).toHaveLength(1)
    const p = formQuestion(card('child'), 'plural', seeded(2))!
    expect(p.choices).toContain('children')
    expect(new Set(p.choices).size).toBe(p.choices.length)
  })
})

describe('boşluk doldurma', () => {
  it('çekimli hali bulup boşluk yapar, şıklar yalın halde', () => {
    const go = card('go', { pos: 'verb', ex: 'We went home early.' })
    const pool = [go, ...['eat', 'run', 'sing', 'play'].map((w) => card(w, { pos: 'verb' }))]
    const q = clozeOf(go, pool, seeded(3))!
    expect(q.before).toBe('We ')
    expect(q.form).toBe('went')
    expect(q.after).toBe(' home early.')
    expect(q.choices).toContain('go')
    expect(q.choices).toHaveLength(4)
  })
  it('kelime cümlede yoksa null', () => {
    expect(clozeOf(card('cat', { ex: 'I like dogs.' }), [])).toBeNull()
  })
})

describe('günlük meydan okuma', () => {
  const cards = Array.from({ length: 40 }, (_, i) => card(`w${i}`))
  it('aynı gün aynı sorular, farklı gün farklı', () => {
    const a = dailyRound(cards, settings(), '2026-10-23').map((q) => q.card.id)
    const b = dailyRound([...cards].reverse(), settings(), '2026-10-23').map((q) => q.card.id)
    const c = dailyRound(cards, settings(), '2026-10-24').map((q) => q.card.id)
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
    expect(a).toHaveLength(10)
  })
  it('skor: doğru başına 10, hız bonusu', () => {
    expect(dailyScore(10, 30)).toBe(160)
    expect(dailyScore(5, 200)).toBe(50)
    expect(dailyScore(0, 5)).toBe(0)
  })
})

describe('hedef planı', () => {
  it('kalan kelimeyi güne böler', () => {
    const cards = Array.from({ length: 100 }, (_, i) => card(`w${i}`, { level: i < 50 ? 'A1' : 'A2' }))
    const progress = new Map(cards.slice(0, 20).map((c) => [c.id, prog(c.id)]))
    const now = new Date(2026, 0, 1, 10).getTime()
    const s = settings({ goal: { level: 'A2', date: '2026-01-10' }, autoDaily: true })
    const plan = goalPlan(cards, progress, s, now)!
    expect(plan.remaining).toBe(80)
    expect(plan.daysLeft).toBe(10)
    expect(plan.perDay).toBe(8)
    expect(plannedDaily(plan, s)).toBe(8)
    expect(plannedDaily(plan, { ...s, autoDaily: false })).toBe(s.dailyNew)
  })
  it('hedef mevcut seviyenin altındaysa plan yok', () => {
    expect(goalPlan([], new Map(), settings({ currentLevel: 'B1', goal: { level: 'A2', date: '2030-01-01' } }), 0)).toBeNull()
  })
})

describe('telaffuz', () => {
  it('duyulan metinlerden birinde kelime geçiyorsa doğru', () => {
    expect(judge(['the apple', 'an apple'], 'apple')).toBe('correct')
    expect(judge(['Apple.'], 'apple')).toBe('correct')
    expect(judge(['aple'], 'apple')).toBe('almost')
    expect(judge(['banana'], 'apple')).toBe('wrong')
  })
})

describe('modlar', () => {
  it('dinleme modunda soru tipi dinleme', () => {
    expect(questionType(card('a'), undefined, 'practice', 'listening')).toBe('listen')
  })
  it('pratikte vadesi gelmemiş kartın doğrusu takvimi değiştirmez, yanlışı sıfırlar', () => {
    const c = card('a')
    const prev = prog('a', { box: 4, due: 1000 })
    expect(nextProgress(prev, c, 'correct', 'swipe', settings(), 10)).toMatchObject({ box: 4, due: 1000, seen: 2 })
    expect(nextProgress(prev, c, 'wrong', 'swipe', settings(), 10).box).toBe(0)
  })
})

describe('takvim hatırlatması', () => {
  it('her gün tekrar eden alarmlı etkinlik', () => {
    const ics = reminderIcs('20:30', 'Kelime', 'Çalış', 'https://x.y/', new Date(2026, 9, 23, 12))
    expect(ics).toContain('DTSTART:20261024T203000')
    expect(ics).toContain('RRULE:FREQ=DAILY')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
  })
})
