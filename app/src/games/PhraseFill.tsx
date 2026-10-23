import { useState } from 'react'
import type { AppData } from '../App'
import { addActivity, bumpCounters, loadBest, saveBest } from '../db'
import { feedback } from '../feedback'
import { useT } from '../i18n'
import { GAME_XP } from '../stats'
import { phraseRound } from '../session'
import { speak } from '../speech'
import { GameOver, GameTop } from './GameShell'

export function PhraseFill({ data, onExit }: { data: AppData; onExit: () => void }) {
  const t = useT()
  const [round, setRound] = useState(() => phraseRound(data.cards, data.settings))
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ record: boolean; best: number } | null>(null)
  const q = round[i]
  const [started, setStarted] = useState(() => Date.now())

  async function next() {
    setPicked(null)
    if (i + 1 < round.length) {
      setI(i + 1)
      return
    }
    const best = await loadBest('phrase')
    const record = best === null || score > best
    if (record) await saveBest('phrase', score)
    await addActivity(score * GAME_XP, Math.round((Date.now() - started) / 1000))
    await bumpCounters({ game: true })
    feedback('finish')
    setResult({ record, best: record ? score : best! })
  }

  function pick(ch: string) {
    if (picked) return
    setPicked(ch)
    const ok = ch === q.answer
    feedback(ok ? 'correct' : 'wrong')
    if (ok) setScore(score + 1)
    if (data.settings.autoSpeak) speak(q.card.word)
  }

  if (result || !q) {
    return (
      <GameOver
        emoji="🧩"
        title={t('game.done')}
        lines={[`${t('game.score')}: ${score} / ${round.length}`, t('game.best', { n: result?.best ?? score })]}
        record={!!result?.record}
        onAgain={() => {
          setRound(phraseRound(data.cards, data.settings))
          setStarted(Date.now())
          setI(0)
          setScore(0)
          setResult(null)
        }}
        onExit={onExit}
      />
    )
  }

  return (
    <main className="quiz">
      <GameTop onExit={onExit} ratio={i / round.length} right={<span className="combo">⭐{score}</span>} />
      <p className="muted center">{t('phrase.hint')}</p>
      <section key={i} className={`card lvl-${q.card.level}`}>
        <div className="emoji-bubble">{q.card.emoji}</div>
        <h2 className="phrase-line">
          {q.parts.map((p, k) =>
            p === null ? (
              <span key={k} className={`blank ${picked ? (picked === q.answer ? 'ok' : 'no') : ''}`}>
                {picked ? q.answer : '___'}
              </span>
            ) : (
              <span key={k}>{p} </span>
            ),
          )}
        </h2>
        <p className="def">{t('phrase.meaning', { tr: q.card.tr })}</p>
        {picked && q.card.ex && <p className="example">“{q.card.ex}”</p>}
      </section>
      <section className="grid2" key={`c${i}`}>
        {q.choices.map((ch) => (
          <button
            key={ch}
            className={`choice center-text ${picked ? (ch === q.answer ? 'right' : ch === picked ? 'wrong' : 'dim') : ''}`}
            disabled={!!picked}
            onClick={() => pick(ch)}
          >
            {ch}
          </button>
        ))}
      </section>
      {picked && (
        <button className={`primary wide ${picked === q.answer ? 'ok' : 'no'}`} onClick={next} autoFocus>
          {t('continue')}
        </button>
      )}
    </main>
  )
}
