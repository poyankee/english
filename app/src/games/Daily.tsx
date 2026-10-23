import { useEffect, useState } from 'react'
import type { AppData } from '../App'
import { Choices, QuestionCard } from '../components/QuestionCard'
import { addActivity, bumpCounters, loadDaily, saveDaily, today, type DailyResult } from '../db'
import { feedback } from '../feedback'
import { useT } from '../i18n'
import { dailyRound, dailyScore, DAILY_SIZE } from '../rounds'
import { dateKey, daysBefore, GAME_XP } from '../stats'
import { GameTop } from './GameShell'

/** Günlük meydan okuma: her gün aynı 10 soru; ilk deneme skoru kaydedilir, son 7 günle karşılaştırılır */
export function Daily({ data, onExit }: { data: AppData; onExit: () => void }) {
  const t = useT()
  const date = today()
  const [round] = useState(() => dailyRound(data.cards, data.settings, date))
  const [history, setHistory] = useState<Record<string, DailyResult> | null>(null)
  const [playing, setPlaying] = useState(false)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    loadDaily().then(setHistory)
  }, [])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 500)
    return () => clearInterval(id)
  }, [playing, startedAt])

  if (!history) return <main className="center">{t('loading')}</main>

  const todayResult = history[date]
  if (todayResult || !round.length) {
    const week = Array.from({ length: 7 }, (_, k) => {
      const d = dateKey(daysBefore(Date.now(), 6 - k))
      return { d, r: history[d] }
    })
    const max = Math.max(1, ...week.map((w) => w.r?.score ?? 0))
    const weekBest = Math.max(0, ...week.slice(0, 6).map((w) => w.r?.score ?? 0))
    return (
      <main className="center done stagger">
        <div className="trophy">{todayResult && todayResult.score > weekBest ? '🏆' : '📅'}</div>
        <h2>{t('daily.doneTitle')}</h2>
        {todayResult && (
          <div className="score-row">
            <div className="score">
              <b>{todayResult.score}</b>
              <span>{t('game.score')}</span>
            </div>
            <div className="score">
              <b>
                {todayResult.correct}/{DAILY_SIZE}
              </b>
              <span>{t('done.correct')}</span>
            </div>
            <div className="score">
              <b>{todayResult.seconds} sn</b>
              <span>{t('game.time')}</span>
            </div>
          </div>
        )}
        {todayResult && todayResult.score > weekBest && weekBest > 0 && <span className="tag new">{t('daily.weekRecord')}</span>}
        <section className="panel wide-panel">
          <h3>{t('daily.week')}</h3>
          <div className="bars daily-bars">
            {week.map(({ d, r }) => (
              <div key={d} className={`bar-col ${d === date ? 'sel' : ''}`} title={`${d}: ${r?.score ?? 0}`}>
                <span className="bar-num">{r?.score ?? ''}</span>
                <span className="bar-fill" style={{ height: `${((r?.score ?? 0) / max) * 100}%` }} />
                <span className="bar-label">{new Date(`${d}T12:00`).toLocaleDateString(data.settings.lang === 'en' ? 'en-GB' : 'tr-TR', { weekday: 'short' })}</span>
              </div>
            ))}
          </div>
        </section>
        <p className="muted">{t('daily.tomorrow')}</p>
        <button className="primary wide" onClick={onExit}>
          {t('done.home')}
        </button>
      </main>
    )
  }

  if (!playing) {
    return (
      <main className="center done stagger">
        <div className="trophy">⏱️</div>
        <h2>{t('daily.title')}</h2>
        <p className="muted">{t('daily.intro', { n: DAILY_SIZE })}</p>
        <button
          className="primary wide"
          onClick={() => {
            setStartedAt(Date.now())
            setPlaying(true)
          }}
        >
          {t('start')}
        </button>
        <button className="secondary wide" onClick={onExit}>
          {t('back')}
        </button>
      </main>
    )
  }

  const q = round[i]
  async function pick(ch: string) {
    if (picked) return
    setPicked(ch)
    const ok = ch === q.card.tr
    feedback(ok ? 'correct' : 'wrong')
    const nextCorrect = correct + (ok ? 1 : 0)
    setCorrect(nextCorrect)
    setTimeout(async () => {
      setPicked(null)
      if (i + 1 < round.length) {
        setI(i + 1)
        return
      }
      const seconds = Math.round((Date.now() - startedAt) / 1000)
      const r = { score: dailyScore(nextCorrect, seconds), correct: nextCorrect, seconds }
      await saveDaily(date, r)
      await addActivity(nextCorrect * GAME_XP, seconds)
      await bumpCounters({ game: true })
      feedback('finish')
      setPlaying(false)
      setHistory({ ...history, [date]: r })
    }, 650)
  }

  return (
    <main className="quiz">
      <GameTop onExit={onExit} ratio={i / round.length} right={<span className="combo">⏱{elapsed}</span>} />
      <div key={i} className="stack">
        <QuestionCard card={q.card} type="en-tr" revealed={!!picked} />
        <Choices choices={q.choices} correct={q.card.tr} picked={picked} onPick={pick} />
      </div>
    </main>
  )
}
