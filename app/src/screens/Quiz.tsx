import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppData } from '../App'
import { recordAnswer } from '../db'
import { afterAnswer, buildChoices, inScope, pickNext, startSession, type Mode, type Session } from '../session'
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
const DONE_TITLE: Record<Mode, string> = {
  study: 'Bugünlük bu kadar!',
  mistakes: 'Bilemediklerin bitti!',
  verbs: 'Fiil sınavı bitti!',
}
const PRAISE = ['Harika! 🎉', 'Süper! ⭐', 'Mükemmel! 💯', 'Aferin! 👏', 'Çok iyi! 🙌', 'Tam isabet! 🎯']
const LETTERS = ['A', 'B', 'C', 'D', 'E']
const CONFETTI_COLORS = ['#6c5ce7', '#a66cff', '#ff6b9d', '#f97316', '#22c55e', '#3b82f6', '#facc15']
const POS_EMOJI: Record<string, string> = { verb: '🏃', adjective: '🎨', adverb: '⚡', phrase: '💬' }

export function Quiz({ data, mode, onExit }: { data: AppData; mode: Mode; onExit: () => void }) {
  const { cards, settings } = data
  // Oturum boyunca ilerlemeyi yerelde tutuyoruz; her cevap ayrıca veritabanına yazılıyor
  const [progress] = useState(() => new Map(data.progress))
  const [session, setSession] = useState<Session>(() => startSession(mode, cards, progress, data.day.newCards, settings, Date.now()))
  const [card, setCard] = useState<Card | null>(() => pickNext(session, cards, progress, settings, Date.now()))
  const [picked, setPicked] = useState<string | null>(null)
  const [count, setCount] = useState({ done: 0, correct: 0, wrong: 0 })
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [praise, setPraise] = useState(PRAISE[0])
  // "Devam"a iki kez hızlıca basılınca aynı cevap iki kez kaydedilmesin
  const saving = useRef(false)
  // İlerleme çubuğu için oturumun başında planlanan kart sayısı (yanlışlar sonradan eklenir)
  const [planned] = useState(() => {
    if (session.queue.length) return session.queue.length
    const now = Date.now()
    const scoped = cards.filter((c) => inScope(c, settings))
    const due = scoped.filter((c) => (progress.get(c.id)?.due ?? Infinity) <= now).length
    const fresh = scoped.filter((c) => !progress.has(c.id)).length
    return due + Math.min(Math.max(settings.dailyNew - data.day.newCards, 0), fresh)
  })

  const choices = useMemo(() => (card ? buildChoices(card, cards) : []), [card, cards])

  useEffect(() => {
    if (picked && card) speak(card.word)
  }, [picked, card])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [card])

  if (!card) {
    const pct = count.done ? Math.round((100 * count.correct) / count.done) : 0
    return (
      <main className="center done">
        <Confetti />
        <div className="trophy">{pct >= 80 ? '🏆' : pct >= 50 ? '🎉' : '💪'}</div>
        <h2>{DONE_TITLE[mode]}</h2>
        <div className="score-row">
          <div className="score">
            <b>{count.done}</b>
            <span>kart</span>
          </div>
          <div className="score">
            <b>%{pct}</b>
            <span>doğru</span>
          </div>
          <div className="score">
            <b>🔥 {bestCombo}</b>
            <span>en uzun seri</span>
          </div>
        </div>
        <button className="primary" onClick={onExit}>
          Ana sayfaya dön
        </button>
      </main>
    )
  }

  const correct = picked === card.tr

  async function next(result: Answer) {
    if (saving.current) return
    saving.current = true
    const c = card!
    const prev = progress.get(c.id)
    const now = Date.now()
    // Bilemediklerim / fiil sınavında vadesi gelmemiş kartın doğru cevabı takvimi ileri atmasın
    const offSchedule = mode !== 'study' && result !== 'wrong' && prev && prev.due > now
    const p = offSchedule ? { ...prev, seen: prev.seen + 1, lastSeen: now } : answer(prev, c.id, result, now)
    progress.set(c.id, p)
    await recordAnswer(p, !prev, result === 'correct')
    const s = afterAnswer(session, c.id, result === 'wrong', !prev)
    setSession(s)
    setCount((n) => ({
      done: n.done + 1,
      correct: n.correct + (result === 'correct' ? 1 : 0),
      wrong: n.wrong + (result === 'wrong' ? 1 : 0),
    }))
    setPicked(null)
    setCard(pickNext(s, cards, progress, settings, now))
    saving.current = false
  }

  function choose(ch: string) {
    setPicked(ch)
    if (ch === card!.tr) {
      const n = combo + 1
      setCombo(n)
      setBestCombo((b) => Math.max(b, n))
      setPraise(n >= 3 ? `${n} üst üste! 🔥` : PRAISE[Math.floor(Math.random() * PRAISE.length)])
    } else {
      setCombo(0)
    }
  }

  const total = Math.max(planned + count.wrong, count.done + 1)

  return (
    <main className="quiz">
      <div className="quiz-top">
        <button className="icon" aria-label="Çık" onClick={onExit}>
          ✕
        </button>
        <div className="progress">
          <span style={{ width: `${(100 * count.done) / total}%` }} />
        </div>
        {combo >= 2 && (
          <span className="combo" key={combo}>
            🔥{combo}
          </span>
        )}
      </div>
      <div className="quiz-sub">
        <span>
          {count.done} kart · {count.correct} doğru
        </span>
        {session.relearn.length > 0 && <span>🔁 {session.relearn.length} tekrar bekliyor</span>}
      </div>

      <section className={`card lvl-${card.level}`} key={card.id}>
        <div className="emoji-bubble">{card.emoji || POS_EMOJI[card.pos] || '🔤'}</div>
        <div className="row center-x">
          <h2 className="word">{card.word}</h2>
          {canSpeak && (
            <button className="speak" aria-label="Dinle" onClick={() => speak(card.word)}>
              🔊
            </button>
          )}
        </div>
        <div className="meta">
          <span className="tag level">{card.level}</span>
          <span className="tag">{POS_LABEL[card.pos] ?? card.pos}</span>
          {!progress.has(card.id) && <span className="tag new">yeni</span>}
        </div>
        <p className="def">{card.def}</p>
      </section>

      <section className="choices" key={`c-${card.id}`}>
        {choices.map((ch, i) => {
          const state = !picked ? '' : ch === card.tr ? 'right' : ch === picked ? 'wrong' : 'dim'
          return (
            <button key={ch} className={`choice ${state}`} disabled={!!picked} onClick={() => choose(ch)}>
              <span className="letter">{state === 'right' ? '✓' : state === 'wrong' ? '✗' : LETTERS[i]}</span>
              {ch}
            </button>
          )
        })}
      </section>

      {picked && <div className="sheet-space" />}
      {picked && (
        <section className={`sheet ${correct ? 'ok' : 'no'}`}>
          <h3>{correct ? praise : 'Olmadı 😕'}</h3>
          {!correct && (
            <span className="answer">
              Doğrusu: {card.word} = {card.tr}
            </span>
          )}
          {card.ex && <p className="example">“{card.ex}”</p>}
          <div className="row">
            {correct && (
              <button className="secondary" onClick={() => next('unsure')}>
                🤔 Tahmin ettim
              </button>
            )}
            <button className={`primary grow ${correct ? 'ok' : 'no'}`} onClick={() => next(correct ? 'correct' : 'wrong')} autoFocus>
              Devam
            </button>
          </div>
        </section>
      )}
    </main>
  )
}

function Confetti() {
  // Rastgelelik her çizimde değişmesin diye parçaları bir kez üretiyoruz
  const [pieces] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2.2 + Math.random() * 1.8,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
    })),
  )
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}
