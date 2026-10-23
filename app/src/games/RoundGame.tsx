import { useState, type ReactNode } from 'react'
import { addActivity, bumpCounters, loadBest, saveBest } from '../db'
import { feedback } from '../feedback'
import { useT } from '../i18n'
import { GAME_XP } from '../stats'
import { GameOver, GameTop } from './GameShell'

/**
 * Şıklı soru turlarının ortak iskeleti (boşluk doldurma, çekimler…): ilerleme, skor, rekor, XP.
 * Her oyun sadece soruları üretir ve sorunun gövdesini çizer.
 */
export function RoundGame<Q>({
  id,
  emoji,
  hint,
  build,
  answerOf,
  choicesOf,
  body,
  onPicked,
  onExit,
  wide,
}: {
  id: string
  emoji: string
  hint: string
  build: () => Q[]
  answerOf: (q: Q) => string
  choicesOf: (q: Q) => string[]
  body: (q: Q, picked: string | null) => ReactNode
  onPicked?: (q: Q) => void
  onExit: () => void
  /** Uzun şıklar alt alta dizilsin */
  wide?: boolean
}) {
  const t = useT()
  const [round, setRound] = useState(build)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [started, setStarted] = useState(() => Date.now())
  const [result, setResult] = useState<{ record: boolean; best: number } | null>(null)
  const q = round[i]

  async function next() {
    setPicked(null)
    if (i + 1 < round.length) {
      setI(i + 1)
      return
    }
    const best = await loadBest(id)
    const record = best === null || score > best
    if (record) await saveBest(id, score)
    await addActivity(score * GAME_XP, Math.round((Date.now() - started) / 1000))
    await bumpCounters({ game: true })
    feedback('finish')
    setResult({ record, best: record ? score : best! })
  }

  function pick(ch: string) {
    if (picked) return
    setPicked(ch)
    const ok = ch === answerOf(q)
    feedback(ok ? 'correct' : 'wrong')
    if (ok) setScore(score + 1)
    onPicked?.(q)
  }

  if (result || !q) {
    return (
      <GameOver
        emoji={round.length ? emoji : '🤷'}
        title={round.length ? t('game.done') : t('done.empty')}
        lines={round.length ? [`${t('game.score')}: ${score} / ${round.length}`, t('game.best', { n: result?.best ?? score })] : []}
        record={!!result?.record}
        onAgain={() => {
          setRound(build())
          setStarted(Date.now())
          setI(0)
          setScore(0)
          setResult(null)
        }}
        onExit={onExit}
      />
    )
  }

  const answer = answerOf(q)
  return (
    <main className="quiz">
      <GameTop onExit={onExit} ratio={i / round.length} right={<span className="combo">⭐{score}</span>} />
      <p className="muted center">{hint}</p>
      <div key={i} className="stack">
        {body(q, picked)}
        <section className={wide ? 'choices' : 'grid2'}>
          {choicesOf(q).map((ch) => (
            <button
              key={ch}
              className={`choice ${wide ? '' : 'center-text'} ${picked ? (ch === answer ? 'right' : ch === picked ? 'wrong' : 'dim') : ''}`}
              disabled={!!picked}
              onClick={() => pick(ch)}
            >
              {ch}
            </button>
          ))}
        </section>
      </div>
      {picked && (
        <button className={`primary wide ${picked === answer ? 'ok' : 'no'}`} onClick={next} autoFocus>
          {t('continue')}
        </button>
      )}
    </main>
  )
}
