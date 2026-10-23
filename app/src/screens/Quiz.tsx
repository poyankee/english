import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppData } from '../App'
import { Choices, QuestionCard } from '../components/QuestionCard'
import { easeConfusion, recordAnswer, recordConfusion, undoAnswer } from '../db'
import { feedback } from '../feedback'
import { useT } from '../i18n'
import {
  afterAnswer,
  buildChoices,
  checkTyped,
  graduates,
  inScope,
  pickNext,
  questionType,
  startSession,
  type Mode,
  type Pick,
  type Session,
} from '../session'
import { speak } from '../speech'
import { answer } from '../srs'
import type { Answer, Card, Progress, QuestionType } from '../types'

const CONFETTI_COLORS = ['#6c5ce7', '#a66cff', '#ff6b9d', '#f97316', '#22c55e', '#3b82f6', '#facc15']
const UNDO_MS = 5000

interface Counts {
  done: number
  correct: number
  wrong: number
}

/** Geri alma için son cevaptan önceki durum */
interface UndoState {
  pick: Pick
  type: QuestionType
  prev: Progress | undefined
  saved: Progress
  countsAsNew: boolean
  correct: boolean
  session: Session
  counts: Counts
  combo: number
}

export function Quiz({ data, mode, onExit }: { data: AppData; mode: Mode; onExit: () => void }) {
  const t = useT()
  const { cards, settings } = data
  // Oturum boyunca ilerlemeyi yerelde tutuyoruz; her cevap ayrıca veritabanına yazılıyor
  const [progress] = useState(() => new Map(data.progress))
  const [session, setSession] = useState<Session>(() => startSession(mode, cards, progress, data.day.newCards, settings, Date.now(), Math.random, data.confusions, data.favorites))
  const [pick, setPick] = useState<Pick | null>(() => pickNext(session, cards, progress, settings, Date.now()))
  const [type, setType] = useState<QuestionType>(() =>
    pick ? questionType(pick.card, progress.get(pick.card.id), pick.kind, mode) : 'en-tr',
  )
  const [picked, setPicked] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [typedResult, setTypedResult] = useState<'correct' | 'almost' | 'wrong' | null>(null)
  const [counts, setCounts] = useState<Counts>({ done: 0, correct: 0, wrong: 0 })
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [praise, setPraise] = useState('')
  const [undo, setUndo] = useState<UndoState | null>(null)
  const [wrongList, setWrongList] = useState<Card[]>([])
  // "Devam"a iki kez hızlıca basılınca aynı cevap iki kez kaydedilmesin
  const saving = useRef(false)
  // İlerleme çubuğu için oturumun başında planlanan kart sayısı (yanlışlar sonradan eklenir)
  const [planned] = useState(() => {
    if (session.queue.length) return session.queue.length
    const now = Date.now()
    const due = [...progress.values()].filter((p) => !p.done && p.due <= now).length
    const fresh = cards.filter((c) => !progress.has(c.id) && inScope(c, settings)).length
    return due + Math.min(Math.max(settings.dailyNew - data.day.newCards, 0), fresh)
  })

  const card = pick?.card
  const field = type === 'tr-en' ? 'word' : 'tr'
  const choices = useMemo(() => {
    if (!card || type === 'type') return []
    // Karışanlar modunda daha önce karıştırılan kelimeler mutlaka şıklarda olsun
    const prefer = mode === 'confused' ? Object.keys(data.confusions[card.id] ?? {}).flatMap((id) => cards.filter((c) => c.id === id)) : []
    return buildChoices(card, cards, Math.random, field, prefer)
  }, [card, cards, type, field, mode, data.confusions])
  const answered = picked !== null
  const correct = !card ? false : type === 'type' ? typedResult !== 'wrong' : picked === card[field]

  useEffect(() => {
    window.scrollTo({ top: 0 })
    if (card && type === 'en-tr' && settings.autoSpeak) speak(card.word)
  }, [card, type, settings.autoSpeak])

  useEffect(() => {
    if (!undo) return
    const id = setTimeout(() => setUndo(null), UNDO_MS)
    return () => clearTimeout(id)
  }, [undo])

  const finished = !pick
  useEffect(() => {
    if (finished && counts.done > 0) feedback('finish')
  }, [finished, counts.done])

  if (!pick || !card) {
    const pct = counts.done ? Math.round((100 * counts.correct) / counts.done) : 0
    return (
      <main className="center done">
        {counts.done > 0 && <Confetti />}
        <div className="trophy">{counts.done === 0 ? '🤷' : pct >= 80 ? '🏆' : pct >= 50 ? '🎉' : '💪'}</div>
        <h2>{t(`done.${mode}`)}</h2>
        {counts.done === 0 ? (
          <p className="muted">{t('done.empty')}</p>
        ) : (
          <div className="score-row">
            <div className="score">
              <b>{counts.done}</b>
              <span>{t('done.cards')}</span>
            </div>
            <div className="score">
              <b>%{pct}</b>
              <span>{t('done.correct')}</span>
            </div>
            <div className="score">
              <b>🔥 {bestCombo}</b>
              <span>{t('done.best')}</span>
            </div>
          </div>
        )}
        {wrongList.length > 0 && (
          <section className="wrong-list">
            <h3>{t('done.wrongList')}</h3>
            <ul>
              {wrongList.map((c) => (
                <li key={c.id}>
                  <span>{c.emoji}</span> <b>{c.word}</b> <span className="muted">{c.tr}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <button className="primary" onClick={onExit}>
          {t('done.home')}
        </button>
      </main>
    )
  }

  function react(ok: boolean) {
    feedback(ok ? 'correct' : 'wrong')
    if (type !== 'en-tr' && settings.autoSpeak) speak(card!.word)
    if (ok) {
      const n = combo + 1
      setCombo(n)
      setBestCombo((b) => Math.max(b, n))
      const options = t('praise').split('|')
      setPraise(n >= 3 ? t('quiz.streak', { n }) : options[Math.floor(Math.random() * options.length)])
    } else {
      setCombo(0)
    }
  }

  function choose(ch: string) {
    setPicked(ch)
    const ok = ch === card![field]
    react(ok)
    if (!ok) {
      const other = cards.find((c) => c[field] === ch)
      if (other) recordConfusion(card!.id, other.id)
    } else if (mode === 'confused') {
      easeConfusion(card!.id)
    }
  }

  function submitTyped(giveUp = false) {
    const r = giveUp ? 'wrong' : checkTyped(typed, card!.word)
    setTypedResult(r)
    setPicked(giveUp ? '' : typed)
    react(r !== 'wrong')
  }

  async function next(result: Answer) {
    if (saving.current || !pick) return
    saving.current = true
    const c = pick.card
    if (mode === 'exam') {
      // Sınav modu tekrar takvimini etkilemez; yanlışlar sonda listelenir
      if (result === 'wrong') setWrongList((w) => [...w, c])
      const s = afterAnswer(session, c.id, false, false)
      setSession(s)
      setCounts((n) => ({ done: n.done + 1, correct: n.correct + (result === 'wrong' ? 0 : 1), wrong: n.wrong }))
      const nextPick = pickNext(s, cards, progress, settings, Date.now())
      setPick(nextPick)
      setType(nextPick ? questionType(nextPick.card, progress.get(nextPick.card.id), nextPick.kind, mode) : 'en-tr')
      setPicked(null)
      setTyped('')
      setTypedResult(null)
      saving.current = false
      return
    }
    const prev = progress.get(c.id)
    const now = Date.now()
    // Pratik modlarında vadesi gelmemiş kartın doğru cevabı takvimi ileri atmasın
    const offSchedule = mode !== 'study' && result !== 'wrong' && prev && prev.due > now
    const p = offSchedule ? { ...prev, seen: prev.seen + 1, lastSeen: now } : answer(prev, c.id, result, now, graduates(c, settings))
    // Geçilen seviyelerden gelen kontrol soruları günlük yeni kelime hakkından düşmez
    const countsAsNew = !prev && pick.kind !== 'checkup'
    setUndo({ pick, type, prev, saved: p, countsAsNew, correct: result === 'correct', session, counts, combo })
    progress.set(c.id, p)
    await recordAnswer(p, countsAsNew, result === 'correct')
    const s = afterAnswer(session, c.id, result === 'wrong', countsAsNew)
    setSession(s)
    setCounts((n) => ({
      done: n.done + 1,
      correct: n.correct + (result === 'correct' ? 1 : 0),
      wrong: n.wrong + (result === 'wrong' ? 1 : 0),
    }))
    const nextPick = pickNext(s, cards, progress, settings, now)
    setPick(nextPick)
    setType(nextPick ? questionType(nextPick.card, progress.get(nextPick.card.id), nextPick.kind, mode) : 'en-tr')
    setPicked(null)
    setTyped('')
    setTypedResult(null)
    saving.current = false
  }

  async function undoLast() {
    if (!undo) return
    await undoAnswer(undo.prev, undo.saved, undo.countsAsNew, undo.correct)
    if (undo.prev) progress.set(undo.pick.card.id, undo.prev)
    else progress.delete(undo.pick.card.id)
    setSession(undo.session)
    setCounts(undo.counts)
    setCombo(undo.combo)
    setPick(undo.pick)
    setType(undo.type)
    setPicked(null)
    setTyped('')
    setTypedResult(null)
    setUndo(null)
  }

  const total = Math.max(planned + counts.wrong, counts.done + 1)
  const badges = [
    ...(pick.kind === 'checkup' ? [{ text: t('quiz.checkup'), cls: 'check' }] : []),
    ...(!progress.has(card.id) && pick.kind !== 'checkup' ? [{ text: t('quiz.new'), cls: 'new' }] : []),
  ]

  return (
    <main className="quiz">
      <div className="quiz-top">
        <button className="icon" aria-label={t('quiz.exit')} onClick={onExit}>
          ✕
        </button>
        <div className="progress">
          <span style={{ width: `${(100 * counts.done) / total}%` }} />
        </div>
        {combo >= 2 && (
          <span className="combo" key={combo}>
            🔥{combo}
          </span>
        )}
      </div>
      <div className="quiz-sub">
        <span>{t('quiz.cards', { done: counts.done, correct: counts.correct })}</span>
        {session.relearn.length > 0 && <span>{t('quiz.waiting', { n: session.relearn.length })}</span>}
      </div>

      <div key={`${card.id}-${counts.done}`} className="stack">
        <QuestionCard card={card} type={type} revealed={answered} badges={badges} />

        {type === 'type' ? (
          <form
            className="type-box"
            onSubmit={(e) => {
              e.preventDefault()
              if (!answered && typed.trim()) submitTyped()
            }}
          >
            <input
              className={`big-input ${typedResult ?? ''}`}
              value={typed}
              disabled={answered}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={t('quiz.typePlaceholder')}
              onChange={(e) => setTyped(e.target.value)}
            />
            {!answered && (
              <div className="row">
                <button type="button" className="secondary" onClick={() => submitTyped(true)}>
                  {t('quiz.dontKnow')}
                </button>
                <button type="submit" className="primary grow" disabled={!typed.trim()}>
                  {t('quiz.check')}
                </button>
              </div>
            )}
          </form>
        ) : (
          <Choices choices={choices} correct={card[field]} picked={picked} onPick={choose} />
        )}
      </div>

      {answered && <div className="sheet-space" />}
      {answered && (
        <section className={`sheet ${correct ? 'ok' : 'no'}`}>
          <h3>{correct ? (typedResult === 'almost' ? t('quiz.almost') : praise) : t('quiz.wrong')}</h3>
          {(!correct || typedResult === 'almost') && (
            <span className="answer">{t('quiz.correctIs', { word: card.word, tr: card.tr })}</span>
          )}
          {type === 'type' && !correct && picked && <span className="muted">{t('quiz.youTyped', { text: picked })}</span>}
          {card.ex && <p className="example">“{card.ex}”</p>}
          <div className="row">
            {correct && mode !== 'exam' && (
              <button className="secondary" onClick={() => next('unsure')}>
                {t('quiz.guessed')}
              </button>
            )}
            <button className={`primary grow ${correct ? 'ok' : 'no'}`} onClick={() => next(correct ? 'correct' : 'wrong')} autoFocus>
              {t('continue')}
            </button>
          </div>
        </section>
      )}

      {undo && !answered && (
        <div className="toast" key={undo.saved.lastSeen}>
          <span>
            {undo.pick.card.word} {undo.correct ? '✓' : '✗'}
          </span>
          <button onClick={undoLast}>↩ {t('quiz.undo')}</button>
        </div>
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
