import { useEffect, useState } from 'react'
import type { AppData } from '../App'
import { addActivity, bumpCounters, loadBest, saveBest } from '../db'
import { feedback } from '../feedback'
import { useT } from '../i18n'
import { GAME_XP } from '../stats'
import { gamePool } from '../session'
import type { Card } from '../types'
import { GameOver, GameTop } from './GameShell'

const PAIRS = 5
const ROUNDS = 4

const shuffled = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5)

export function Match({ data, onExit }: { data: AppData; onExit: () => void }) {
  const t = useT()
  const [game, setGame] = useState(0)
  const [cards, setCards] = useState<Card[]>(() => gamePool(data.cards, data.progress, data.settings, PAIRS * ROUNDS))
  const [round, setRound] = useState(0)
  const [left, setLeft] = useState<Card[]>([])
  const [right, setRight] = useState<Card[]>([])
  const [sel, setSel] = useState<{ side: 'l' | 'r'; id: string } | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState<string[]>([])
  const [start] = useState(() => Date.now())
  const [result, setResult] = useState<{ secs: number; record: boolean; best: number } | null>(null)

  useEffect(() => {
    const roundCards = cards.slice(round * PAIRS, round * PAIRS + PAIRS)
    setLeft(shuffled(roundCards))
    setRight(shuffled(roundCards))
    setMatched(new Set())
  }, [round, cards])

  async function finish() {
    const secs = Math.round((Date.now() - start) / 1000)
    const best = await loadBest('match')
    const record = best === null || secs < best
    if (record) await saveBest('match', secs)
    await addActivity(PAIRS * ROUNDS * GAME_XP, secs)
    await bumpCounters({ game: true })
    feedback('finish')
    setResult({ secs, record, best: record ? secs : best! })
  }

  function tap(side: 'l' | 'r', id: string) {
    if (matched.has(id) || wrong.length) return
    if (!sel || sel.side === side) {
      setSel({ side, id })
      return
    }
    if (sel.id === id) {
      feedback('correct')
      const next = new Set(matched).add(id)
      setMatched(next)
      setSel(null)
      if (next.size === left.length) {
        setTimeout(() => (round + 1 < ROUNDS && cards.length > (round + 1) * PAIRS ? setRound(round + 1) : finish()), 450)
      }
    } else {
      feedback('wrong')
      setWrong([sel.id + sel.side, id + side])
      setTimeout(() => {
        setWrong([])
        setSel(null)
      }, 500)
    }
  }

  if (result) {
    return (
      <GameOver
        emoji="🃏"
        title={t('game.done')}
        lines={[t('match.time', { s: result.secs }), t('game.best', { n: `${result.best} sn` })]}
        record={result.record}
        onAgain={() => {
          setResult(null)
          setCards(gamePool(data.cards, data.progress, data.settings, PAIRS * ROUNDS))
          setRound(0)
          setGame(game + 1)
        }}
        onExit={onExit}
      />
    )
  }

  const cls = (side: 'l' | 'r', id: string) =>
    [
      'match-item',
      matched.has(id) ? 'gone' : '',
      sel?.side === side && sel.id === id ? 'sel' : '',
      wrong.includes(id + side) ? 'bad' : '',
    ].join(' ')

  return (
    <main className="quiz" key={game}>
      <GameTop onExit={onExit} ratio={(round * PAIRS + matched.size) / (PAIRS * ROUNDS)} />
      <div className="quiz-sub">
        <span>{t('match.round', { n: round + 1, total: ROUNDS })}</span>
      </div>
      <p className="muted center">{t('match.hint')}</p>
      <section className="match-grid" key={round}>
        <div className="match-col">
          {left.map((c) => (
            <button key={c.id} className={cls('l', c.id)} onClick={() => tap('l', c.id)}>
              {c.word}
            </button>
          ))}
        </div>
        <div className="match-col">
          {right.map((c) => (
            <button key={c.id} className={cls('r', c.id)} onClick={() => tap('r', c.id)}>
              {c.tr}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
