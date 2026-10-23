import { useRef, useState } from 'react'
import type { AppData } from '../App'
import { recordAnswer } from '../db'
import { feedback } from '../feedback'
import { GameOver, GameTop } from '../games/GameShell'
import { useT } from '../i18n'
import { afterAnswer, nextProgress, pickNext, startSession, type Pick, type Session } from '../session'
import { canSpeak, speak } from '../speech'
import { xpForAnswer } from '../stats'
import { CardPicture } from '../components/CardPicture'

const SWIPE = 80

/**
 * Hızlı tekrar: kart çevrilir, sağa kaydırınca "biliyorum", sola kaydırınca "bilmiyorum".
 * Cevaplar tekrar takvimine yazılır (pratik modu kurallarıyla); bilinmeyenler turda tekrar gelir.
 */
export function Swipe({ data, onExit }: { data: AppData; onExit: () => void }) {
  const t = useT()
  const { cards, settings } = data
  const [progress] = useState(() => new Map(data.progress))
  const begin = () => {
    const s = startSession('swipe', cards, progress, data.day.newCards, settings, Date.now())
    return { session: s, pick: pickNext(s, cards, progress, settings, Date.now()), total: s.queue.length }
  }
  const [state, setState] = useState<{ session: Session; pick: Pick | null; total: number }>(begin)
  const [flipped, setFlipped] = useState(false)
  const [dx, setDx] = useState(0)
  const [counts, setCounts] = useState({ known: 0, unknown: 0 })
  const startX = useRef<number | null>(null)
  const moved = useRef(false)
  const shownAt = useRef(Date.now())
  const busy = useRef(false)

  const { session, pick, total } = state
  const card = pick?.card

  async function decide(known: boolean) {
    if (!card || busy.current) return
    busy.current = true
    feedback(known ? 'correct' : 'wrong')
    const now = Date.now()
    const prev = progress.get(card.id)
    const result = known ? 'correct' : 'wrong'
    const p = nextProgress(prev, card, result, 'swipe', settings, now)
    progress.set(card.id, p)
    const seconds = Math.min(60, Math.round((now - shownAt.current) / 1000))
    await recordAnswer(p, !prev, known, xpForAnswer(result, 0), seconds)
    const s = afterAnswer(session, card.id, !known, !prev)
    setState({ session: s, pick: pickNext(s, cards, progress, settings, now), total })
    setCounts((c) => (known ? { ...c, known: c.known + 1 } : { ...c, unknown: c.unknown + 1 }))
    setFlipped(false)
    setDx(0)
    shownAt.current = Date.now()
    busy.current = false
  }

  if (!card) {
    return (
      <GameOver
        emoji={counts.known + counts.unknown === 0 ? '🤷' : '⚡'}
        title={t('swipe.done')}
        lines={counts.known + counts.unknown === 0 ? [t('done.empty')] : [t('swipe.result', { known: counts.known, unknown: counts.unknown })]}
        record={false}
        onAgain={() => {
          setState(begin())
          setCounts({ known: 0, unknown: 0 })
        }}
        onExit={onExit}
      />
    )
  }

  const done = counts.known + counts.unknown
  return (
    <main className="quiz">
      <GameTop onExit={onExit} ratio={done / Math.max(total + counts.unknown, 1)} right={<span className="combo">✓{counts.known}</span>} />
      <div className="quiz-sub">
        <span>{t('swipe.hint')}</span>
        {session.relearn.length > 0 && <span>{t('quiz.waiting', { n: session.relearn.length })}</span>}
      </div>
      <section
        key={`${card.id}-${done}`}
        className={`card swipe-card lvl-${card.level} ${dx > SWIPE ? 'lean-ok' : dx < -SWIPE ? 'lean-no' : ''}`}
        style={{ transform: `translateX(${dx}px) rotate(${dx / 20}deg)` }}
        onPointerDown={(e) => {
          startX.current = e.clientX
          moved.current = false
        }}
        onPointerMove={(e) => {
          if (startX.current === null) return
          const d = e.clientX - startX.current
          if (Math.abs(d) > 8) moved.current = true
          setDx(d)
        }}
        onPointerUp={() => {
          startX.current = null
          if (dx > SWIPE) decide(true)
          else if (dx < -SWIPE) decide(false)
          else {
            setDx(0)
            if (!moved.current) setFlipped((f) => !f)
          }
        }}
      >
        <CardPicture card={card} />
        <div className="row center-x">
          <h2 className="word">{card.word}</h2>
          {canSpeak && (
            <button
              className="speak"
              aria-label={t('quiz.listen')}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                speak(card.word)
              }}
            >
              🔊
            </button>
          )}
        </div>
        {card.ipa && <div className="ipa">{card.ipa}</div>}
        {flipped ? (
          <div className="swipe-back">
            <p className="detail-tr">{card.tr}</p>
            <p className="def">{card.def}</p>
            {card.ex && <p className="example">“{card.ex}”</p>}
          </div>
        ) : (
          <p className="muted swipe-tap">👆 {t('swipe.tap')}</p>
        )}
      </section>
      <div className="row tf-buttons">
        <button className="tf-btn no" onClick={() => decide(false)}>
          ✗ {t('swipe.no')}
        </button>
        <button className="tf-btn ok" onClick={() => decide(true)}>
          ✓ {t('swipe.yes')}
        </button>
      </div>
    </main>
  )
}
