import { useEffect, useMemo, useState } from 'react'
import type { AppData } from '../App'
import { WordSheet } from '../components/WordSheet'
import { STORIES, type Story } from '../data/stories'
import { addActivity, loadStoriesRead, markStoryRead } from '../db'
import { feedback } from '../feedback'
import { baseWord, wordVariants } from '../forms'
import { useT } from '../i18n'
import { levelIndex } from '../session'
import { canSpeak, speak, stopSpeaking } from '../speech'
import { isKnown } from '../srs'
import { LEVELS, type Card } from '../types'

const READ_XP = 20
const QUESTION_XP = 5

/** Hikâyeler: seviyeye göre kısa metinler, dokunulan kelimenin anlamı, sesli okuma ve anlama soruları */
export function Stories({ data, onExit }: { data: AppData; onExit: () => void }) {
  const t = useT()
  const [read, setRead] = useState<Record<string, number> | null>(null)
  const [open, setOpen] = useState<Story | null>(null)

  useEffect(() => {
    loadStoriesRead().then(setRead)
  }, [open])

  if (open) return <Reader story={open} data={data} onBack={() => setOpen(null)} />

  return (
    <main className="stagger">
      <header className="row between">
        <button className="icon" aria-label={t('back')} onClick={onExit}>
          ←
        </button>
        <h1 className="grow">{t('stories.title')}</h1>
      </header>
      <p className="muted">{t('stories.sub')}</p>
      {LEVELS.map((l) => (
        <section key={l} className="story-group">
          <h3>
            <span className={`tag level lvl-${l}`}>{l}</span> {t(`title.${l}`)}
            {levelIndex(l) > levelIndex(data.settings.currentLevel) && <span className="muted small"> · {t('stories.harder')}</span>}
          </h3>
          {STORIES.filter((s) => s.level === l).map((s) => (
            <button key={s.id} className={`story-item lvl-${l}`} onClick={() => setOpen(s)}>
              <span className="story-emoji">{s.emoji}</span>
              <span className="grow">
                <b>{s.title}</b>
                <small className="muted">{s.titleTr}</small>
              </span>
              {read && s.id in read && <span className="story-done">✓ {read[s.id]}/{s.questions.length}</span>}
            </button>
          ))}
        </section>
      ))}
    </main>
  )
}

function Reader({ story, data, onBack }: { story: Story; data: AppData; onBack: () => void }) {
  const t = useT()
  const [word, setWord] = useState<Card | null>(null)
  const [missing, setMissing] = useState('')
  const [answers, setAnswers] = useState<(number | null)[]>(() => story.questions.map(() => null))
  const [finished, setFinished] = useState(false)
  const [reading, setReading] = useState(false)

  // Metindeki her kelime halinden karta: "went" -> go, "children" -> child
  const lookup = useMemo(() => {
    const m = new Map<string, Card>()
    const sorted = [...data.cards].sort((a, b) => levelIndex(a.level) - levelIndex(b.level))
    for (const c of sorted) {
      if (c.pos === 'phrase') continue
      const base = baseWord(c.word)
      for (const v of wordVariants(c.word)) {
        // "visited", "went" gibi fiil halleri isim yerine fiil kartına gitsin
        const verbForm = c.pos === 'verb' && v !== base && !v.endsWith('s')
        if (!m.has(v) || (verbForm && m.get(v)!.pos !== 'verb')) m.set(v, c)
      }
      // "a, an" gibi virgüllü başlıklar
      for (const part of baseWord(c.word).split(/,\s*/)) if (!m.has(part)) m.set(part, c)
    }
    return m
  }, [data.cards])

  useEffect(() => () => stopSpeaking(), [])

  function tap(raw: string) {
    const w = raw.toLowerCase().replace(/[’']s$/, '').replace(/[^a-z'-]/g, '')
    if (!w) return
    const c = lookup.get(w) ?? lookup.get(w.replace(/[’']/g, ''))
    if (c) setWord(c)
    else {
      setMissing(raw)
      setTimeout(() => setMissing(''), 1600)
    }
  }

  function toggleRead() {
    if (reading) {
      stopSpeaking()
      setReading(false)
      return
    }
    setReading(true)
    speak(story.text.replace(/\n+/g, ' '), 0.9).then(() => setReading(false))
  }

  async function finish() {
    const correct = answers.filter((a, i) => a === story.questions[i].answer).length
    const first = !(story.id in (await loadStoriesRead()))
    await markStoryRead(story.id, correct)
    if (first) await addActivity(READ_XP + correct * QUESTION_XP, 0)
    feedback('finish')
    setFinished(true)
  }

  const allAnswered = answers.every((a) => a !== null)
  return (
    <main className="story">
      <header className="row between">
        <button className="icon" aria-label={t('back')} onClick={onBack}>
          ←
        </button>
        <span className={`tag level lvl-${story.level}`}>{story.level}</span>
      </header>
      <div className="story-head">
        <span className="story-emoji big">{story.emoji}</span>
        <h1>{story.title}</h1>
        <p className="muted">{story.titleTr}</p>
        {canSpeak && (
          <button className="secondary small-btn" onClick={toggleRead}>
            {reading ? `⏹ ${t('stories.stop')}` : `🔊 ${t('stories.listen')}`}
          </button>
        )}
        <p className="muted small">{t('stories.tapHint')}</p>
      </div>

      <article className="story-text">
        {story.text.split(/\n\s*\n/).map((para, pi) => (
          <p key={pi}>
            {para.split(/(\s+)/).map((tok, ti) => {
              if (/^\s+$/.test(tok)) return tok
              const key = tok.toLowerCase().replace(/[’']s$/, '').replace(/[^a-z'-]/g, '')
              const c = lookup.get(key)
              const unknown = c && !isKnown(data.progress.get(c.id)) && levelIndex(c.level) >= levelIndex(data.settings.currentLevel)
              return (
                <span key={ti} className={`tok ${unknown ? 'unknown' : ''}`} onClick={() => tap(tok)}>
                  {tok}
                </span>
              )
            })}
          </p>
        ))}
      </article>

      <section className="panel">
        <h3>{t('stories.questions')}</h3>
        {story.questions.map((q, qi) => (
          <div key={qi} className="story-q">
            <b>
              {qi + 1}. {q.q}
            </b>
            <div className="choices">
              {q.choices.map((ch, ci) => {
                const a = answers[qi]
                const state = a === null ? '' : ci === q.answer ? 'right' : ci === a ? 'wrong' : 'dim'
                return (
                  <button
                    key={ci}
                    className={`choice small ${state}`}
                    disabled={a !== null}
                    onClick={() => {
                      feedback(ci === q.answer ? 'correct' : 'wrong')
                      setAnswers(answers.map((x, k) => (k === qi ? ci : x)))
                    }}
                  >
                    {ch}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {finished ? (
          <p className="goal-summary">
            {t('stories.result', { n: answers.filter((a, i) => a === story.questions[i].answer).length, total: story.questions.length })}
          </p>
        ) : (
          <button className="primary wide" disabled={!allAnswered} onClick={finish}>
            {t('stories.finish')}
          </button>
        )}
        {finished && (
          <button className="secondary wide" onClick={onBack}>
            {t('stories.back')}
          </button>
        )}
      </section>

      {missing && <div className="toast">{t('stories.notFound', { word: missing })}</div>}
      {word && <WordSheet key={word.id} card={word} data={data} onClose={() => setWord(null)} onChange={() => {}} />}
    </main>
  )
}
