import { useEffect, useMemo, useState } from 'react'
import type { AppData } from '../App'
import { recordAnswer } from '../db'
import { afterAnswer, buildChoices, pickNext, startSession, type Mode, type Session } from '../session'
import { canSpeak, speak } from '../speech'
import { answer } from '../srs'
import type { Answer, Card } from '../types'

const POS_LABEL: Record<string, string> = {
  noun: 'isim',
  verb: 'fiil',
  adjective: 'sıfat',
  adverb: 'zarf',
  preposition: 'edat',
  pronoun: 'zamir',
  conjunction: 'bağlaç',
  determiner: 'belirleyici',
  exclamation: 'ünlem',
  number: 'sayı',
  'modal verb': 'yardımcı fiil',
  'auxiliary verb': 'yardımcı fiil',
  article: 'tanımlık',
  phrase: 'kalıp',
}
const POS_EMOJI: Record<string, string> = { verb: '🏃', adjective: '🎨', adverb: '⚡', phrase: '💬' }

export function Quiz({ data, mode, onExit }: { data: AppData; mode: Mode; onExit: () => void }) {
  const { cards, settings } = data
  // Oturum boyunca ilerlemeyi yerelde tutuyoruz; her cevap ayrıca veritabanına yazılıyor
  const [progress] = useState(() => new Map(data.progress))
  const [session, setSession] = useState<Session>(() => startSession(mode, cards, progress, data.day.newCards))
  const [card, setCard] = useState<Card | null>(() => pickNext(session, cards, progress, settings, Date.now()))
  const [picked, setPicked] = useState<string | null>(null)
  const [count, setCount] = useState({ done: 0, correct: 0 })

  const choices = useMemo(() => (card ? buildChoices(card, cards) : []), [card, cards])

  useEffect(() => {
    if (picked && card) speak(card.word)
  }, [picked, card])

  if (!card) {
    return (
      <main className="center done">
        <div className="emoji">🎉</div>
        <h2>{mode === 'mistakes' ? 'Bilemediklerin bitti!' : 'Bugünlük bu kadar!'}</h2>
        <p>
          {count.done} kart · {count.correct} doğru
        </p>
        <button className="primary" onClick={onExit}>
          Ana sayfa
        </button>
      </main>
    )
  }

  const correct = picked === card.tr

  async function next(result: Answer) {
    const c = card!
    const prev = progress.get(c.id)
    const now = Date.now()
    // Bilemediklerim modunda vadesi gelmemiş kartın doğru cevabı takvimi ileri atmasın
    const offSchedule = mode === 'mistakes' && result !== 'wrong' && prev && prev.due > now
    const p = offSchedule ? { ...prev, seen: prev.seen + 1, lastSeen: now } : answer(prev, c.id, result, now)
    progress.set(c.id, p)
    await recordAnswer(p, !prev, result === 'correct')
    const s = afterAnswer(session, c.id, result === 'wrong', !prev)
    setSession(s)
    setCount((n) => ({ done: n.done + 1, correct: n.correct + (result === 'correct' ? 1 : 0) }))
    setPicked(null)
    setCard(pickNext(s, cards, progress, settings, now))
  }

  return (
    <main className="quiz">
      <header className="row between">
        <button className="icon" aria-label="Çık" onClick={onExit}>
          ✕
        </button>
        <span className="muted">
          {count.done} kart · {count.correct} doğru
          {session.relearn.length > 0 && ` · ${session.relearn.length} tekrar bekliyor`}
        </span>
      </header>

      <section className="card">
        <div className="emoji">{card.emoji || POS_EMOJI[card.pos] || '🔤'}</div>
        <div className="row center-x">
          <h2 className="word">{card.word}</h2>
          {canSpeak && (
            <button className="icon" aria-label="Dinle" onClick={() => speak(card.word)}>
              🔊
            </button>
          )}
        </div>
        <div className="meta">
          {POS_LABEL[card.pos] ?? card.pos} · {card.level}
          {!progress.has(card.id) && <span className="badge">yeni</span>}
        </div>
        <p className="def">{card.def}</p>
      </section>

      <section className="choices">
        {choices.map((ch) => {
          const state = !picked ? '' : ch === card.tr ? 'right' : ch === picked ? 'wrong' : 'dim'
          return (
            <button key={ch} className={`choice ${state}`} disabled={!!picked} onClick={() => setPicked(ch)}>
              {ch}
            </button>
          )
        })}
      </section>

      {picked && (
        <section className="feedback">
          {card.ex && <p className="example">“{card.ex}”</p>}
          <div className="row">
            {correct && (
              <button className="secondary" onClick={() => next('unsure')}>
                🤔 Tahmin ettim
              </button>
            )}
            <button className="primary grow" onClick={() => next(correct ? 'correct' : 'wrong')} autoFocus>
              {correct ? 'Doğru! Devam' : 'Devam'}
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
