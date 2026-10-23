import { useEffect, useRef, useState } from 'react'
import type { AppData } from '../App'
import { addActivity, bumpCounters, loadBest, saveBest } from '../db'
import { feedback } from '../feedback'
import { useT } from '../i18n'
import { GAME_XP } from '../stats'
import { gamePool } from '../session'
import type { Card } from '../types'
import { GameOver, GameTop } from './GameShell'

const SECONDS = 60
const SWIPE = 80

interface Statement {
  card: Card
  shown: string
  isTrue: boolean
}

function makeStatement(pool: Card[], i: number): Statement {
  const card = pool[i % pool.length]
  const isTrue = Math.random() < 0.5
  let other = card
  while (other.tr === card.tr) other = pool[Math.floor(Math.random() * pool.length)]
  return { card, shown: isTrue ? card.tr : other.tr, isTrue }
}

export function TrueFalse({ data, onExit }: { data: AppData; onExit: () => void }) {
  const t = useT()
  const [pool, setPool] = useState(() => gamePool(data.cards, data.progress, data.settings, 200))
  const [i, setI] = useState(0)
  const [st, setSt] = useState(() => makeStatement(pool, 0))
  const [score, setScore] = useState(0)
  const [left, setLeft] = useState(SECONDS)
  const [flash, setFlash] = useState<'ok' | 'no' | null>(null)
  const [dx, setDx] = useState(0)
  const [result, setResult] = useState<{ record: boolean; best: number } | null>(null)
  const startX = useRef<number | null>(null)
  const scoreRef = useRef(0)

  useEffect(() => {
    if (result) return
    if (left <= 0) {
      ;(async () => {
        const best = await loadBest('truefalse')
        const record = best === null || scoreRef.current > best
        if (record) await saveBest('truefalse', scoreRef.current)
        await addActivity(scoreRef.current * GAME_XP, SECONDS)
        await bumpCounters({ game: true })
        feedback('finish')
        setResult({ record, best: record ? scoreRef.current : best! })
      })()
      return
    }
    const id = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(id)
  }, [left, result])

  function answer(saysTrue: boolean) {
    if (left <= 0 || flash) return
    const ok = saysTrue === st.isTrue
    feedback(ok ? 'correct' : 'wrong')
    if (ok) {
      scoreRef.current++
      setScore(scoreRef.current)
    }
    setFlash(ok ? 'ok' : 'no')
    setTimeout(() => {
      setFlash(null)
      setDx(0)
      setI(i + 1)
      setSt(makeStatement(pool, i + 1))
    }, 280)
  }

  if (result) {
    return (
      <GameOver
        emoji="👆"
        title={t('game.finished')}
        lines={[`${t('game.score')}: ${score}`, t('game.best', { n: result.best })]}
        record={result.record}
        onAgain={() => {
          const p = gamePool(data.cards, data.progress, data.settings, 200)
          setPool(p)
          setI(0)
          setSt(makeStatement(p, 0))
          scoreRef.current = 0
          setScore(0)
          setLeft(SECONDS)
          setResult(null)
        }}
        onExit={onExit}
      />
    )
  }

  return (
    <main className="quiz">
      <GameTop onExit={onExit} ratio={left / SECONDS} right={<span className="combo">⭐{score}</span>} />
      <div className="quiz-sub">
        <span>
          ⏱ {left} sn
        </span>
        <span>{t('tf.hint')}</span>
      </div>
      <section
        key={i}
        className={`card tf-card lvl-${st.card.level} ${flash ?? ''}`}
        style={{ transform: `translateX(${dx}px) rotate(${dx / 20}deg)` }}
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerMove={(e) => startX.current !== null && setDx(e.clientX - startX.current)}
        onPointerUp={() => {
          if (dx > SWIPE) answer(true)
          else if (dx < -SWIPE) answer(false)
          else setDx(0)
          startX.current = null
        }}
      >
        <div className="emoji-bubble">{st.card.emoji}</div>
        <h2 className="word">{st.card.word}</h2>
        <p className="tf-eq">=</p>
        <h2 className="tf-tr">{st.shown}</h2>
      </section>
      <div className="row tf-buttons">
        <button className="tf-btn no" onClick={() => answer(false)}>
          ✗ {t('tf.false')}
        </button>
        <button className="tf-btn ok" onClick={() => answer(true)}>
          ✓ {t('tf.true')}
        </button>
      </div>
    </main>
  )
}
