import { useEffect, useRef, useState } from 'react'
import type { AppData } from '../App'
import { addActivity, bumpCounters, loadBest, saveBest } from '../db'
import { feedback } from '../feedback'
import { baseWord } from '../forms'
import { useT } from '../i18n'
import { canRecognize, judge, listenOnce } from '../recognition'
import { gamePool } from '../session'
import { canSpeak, speak } from '../speech'
import { GAME_XP } from '../stats'
import type { Card } from '../types'
import { GameOver, GameTop } from './GameShell'
import { CardPicture } from '../components/CardPicture'

const SIZE = 10
const TRIES = 3

function round(data: AppData): Card[] {
  return gamePool(data.cards, data.progress, data.settings, 80)
    .filter((c) => /^[a-z][a-z' -]*$/.test(baseWord(c.word)))
    .slice(0, SIZE)
}

/** Telaffuz pratiği: kelimeyi söylersin, telefon anlayıp anlamadığını gösterir */
export function Speak({ data, onExit }: { data: AppData; onExit: () => void }) {
  const t = useT()
  const [cards, setCards] = useState(() => round(data))
  const [i, setI] = useState(0)
  const [tries, setTries] = useState(0)
  const [listening, setListening] = useState(false)
  const [verdict, setVerdict] = useState<{ kind: 'correct' | 'almost' | 'wrong'; heard: string } | null>(null)
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ record: boolean; best: number } | null>(null)
  const [started, setStarted] = useState(() => Date.now())
  const stopRef = useRef<() => void>(() => {})
  const card = cards[i]
  const lang = data.settings.accent === 'gb' ? 'en-GB' : 'en-US'

  useEffect(() => () => stopRef.current(), [])

  if (!canRecognize) {
    return (
      <main className="center done">
        <div className="trophy">🎤</div>
        <h2>{t('speak.unsupported')}</h2>
        <p className="muted">{t('speak.unsupportedText')}</p>
        <button className="primary wide" onClick={onExit}>
          {t('done.home')}
        </button>
      </main>
    )
  }

  async function listen() {
    setError('')
    setListening(true)
    const l = listenOnce(lang)
    stopRef.current = l.stop
    try {
      const heard = await l.result
      const kind = heard.length ? judge(heard, card.word) : 'wrong'
      setVerdict({ kind, heard: heard[0] ?? '' })
      setTries((n) => n + 1)
      if (kind === 'correct') {
        feedback('correct')
        setScore((s) => s + 1)
      } else feedback('wrong')
    } catch (e) {
      setError(String((e as Error).message) === 'not-allowed' ? t('speak.noMic') : t('speak.error'))
    } finally {
      setListening(false)
    }
  }

  async function next() {
    setVerdict(null)
    setTries(0)
    if (i + 1 < cards.length) {
      setI(i + 1)
      return
    }
    const best = await loadBest('speak')
    const record = best === null || score > best
    if (record) await saveBest('speak', score)
    await addActivity(score * GAME_XP, Math.round((Date.now() - started) / 1000))
    await bumpCounters({ game: true })
    feedback('finish')
    setResult({ record, best: record ? score : best! })
  }

  if (result || !card) {
    return (
      <GameOver
        emoji="🎤"
        title={t('game.done')}
        lines={[`${t('game.score')}: ${score} / ${cards.length}`, t('game.best', { n: result?.best ?? score })]}
        record={!!result?.record}
        onAgain={() => {
          setCards(round(data))
          setI(0)
          setScore(0)
          setStarted(Date.now())
          setResult(null)
        }}
        onExit={onExit}
      />
    )
  }

  const finished = verdict?.kind === 'correct' || tries >= TRIES
  return (
    <main className="quiz">
      <GameTop onExit={onExit} ratio={i / cards.length} right={<span className="combo">⭐{score}</span>} />
      <p className="muted center">{t('speak.hint')}</p>
      <section key={i} className={`card lvl-${card.level}`}>
        <CardPicture card={card} fallback="🎤" />
        <div className="row center-x">
          <h2 className="word">{card.word}</h2>
          {canSpeak && (
            <button className="speak" aria-label={t('quiz.listen')} onClick={() => speak(card.word)}>
              🔊
            </button>
          )}
        </div>
        {card.ipa && <div className="ipa">{card.ipa}</div>}
        <p className="def">{card.tr}</p>
      </section>

      {verdict && (
        <section className={`speak-verdict ${verdict.kind}`}>
          <b>{t(`speak.${verdict.kind}`)}</b>
          {verdict.kind !== 'correct' && <span>{verdict.heard ? t('speak.heard', { text: verdict.heard }) : t('speak.nothing')}</span>}
        </section>
      )}
      {error && <p className="speak-verdict wrong">{error}</p>}

      {!finished ? (
        <button className={`mic ${listening ? 'on' : ''}`} onClick={listening ? () => stopRef.current() : listen} aria-label={t('speak.tap')}>
          🎤
          <small>{listening ? t('speak.listening') : tries ? t('speak.again', { n: TRIES - tries }) : t('speak.tap')}</small>
        </button>
      ) : null}
      <button className={finished ? 'primary wide' : 'secondary wide'} onClick={next}>
        {finished ? t('continue') : t('speak.skip')}
      </button>
    </main>
  )
}
