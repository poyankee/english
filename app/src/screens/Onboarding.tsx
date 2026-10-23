import { useMemo, useState } from 'react'
import type { AppData } from '../App'
import { Choices, QuestionCard } from '../components/QuestionCard'
import { savePlacement } from '../db'
import { feedback } from '../feedback'
import { useT } from '../i18n'
import { buildChoices, graduates, placementCards, PLACEMENT_PASS } from '../session'
import { placementKnown } from '../srs'
import { LEVELS, type Card, type Level, type Settings } from '../types'

type Step = 'welcome' | 'name' | 'intro' | 'test' | 'result'

export function Onboarding({ data, updateSettings, onDone }: { data: AppData; updateSettings: (s: Settings) => Promise<void>; onDone: () => void }) {
  const t = useT()
  const [step, setStep] = useState<Step>(data.settings.name ? 'intro' : 'welcome')
  const [name, setName] = useState(data.settings.name)
  const [levelIdx, setLevelIdx] = useState(0)
  const [qIdx, setQIdx] = useState(0)
  const [levelCorrect, setLevelCorrect] = useState(0)
  const [known, setKnown] = useState<Card[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const [result, setResult] = useState<{ level: Level; all: boolean } | null>(null)

  const level = LEVELS[levelIdx]
  const questions = useMemo(() => placementCards(data.cards, level), [data.cards, level])
  const card = questions[qIdx]
  const choices = useMemo(() => (card ? buildChoices(card, data.cards) : []), [card, data.cards])

  async function finish(resultLevel: Level, knownCards: Card[], all: boolean) {
    const settings = { ...data.settings, name: name.trim(), currentLevel: resultLevel }
    const now = Date.now()
    // Daha önce çalışılmış kartların ilerlemesini ezmiyoruz
    await savePlacement(
      knownCards.filter((c) => !data.progress.has(c.id)).map((c) => placementKnown(c.id, now, graduates(c, settings))),
    )
    await updateSettings(settings)
    setResult({ level: resultLevel, all })
    setStep('result')
  }

  function pick(ch: string) {
    if (picked) return
    setPicked(ch)
    const ok = ch === card.tr
    feedback(ok ? 'correct' : 'wrong')
    const nextKnown = ok ? [...known, card] : known
    const nextCorrect = levelCorrect + (ok ? 1 : 0)
    setTimeout(() => {
      setPicked(null)
      setKnown(nextKnown)
      if (qIdx + 1 < questions.length) {
        setLevelCorrect(nextCorrect)
        setQIdx(qIdx + 1)
        return
      }
      // Seviye bitti: geçemediyse bu seviyeden başlar, geçtiyse sonrakine
      if (nextCorrect < PLACEMENT_PASS) finish(level, nextKnown, false)
      else if (levelIdx + 1 === LEVELS.length) finish('C1', nextKnown, true)
      else {
        setLevelIdx(levelIdx + 1)
        setQIdx(0)
        setLevelCorrect(0)
      }
    }, 700)
  }

  if (step === 'welcome') {
    return (
      <main className="center onboarding stagger">
        <div className="big-emoji">📚</div>
        <h1>{t('onb.welcome')}</h1>
        <p className="muted">{t('onb.welcomeText')}</p>
        <button className="primary wide" onClick={() => setStep('name')}>
          {t('start')}
        </button>
      </main>
    )
  }

  if (step === 'name') {
    return (
      <main className="center onboarding stagger">
        <div className="big-emoji">🙋</div>
        <h1>{t('onb.nameQ')}</h1>
        <input
          className="big-input"
          value={name}
          maxLength={30}
          autoFocus
          placeholder={t('onb.namePlaceholder')}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep('intro')}
        />
        <button className="primary wide" disabled={!name.trim()} onClick={() => setStep('intro')}>
          {t('continue')}
        </button>
      </main>
    )
  }

  if (step === 'intro') {
    return (
      <main className="center onboarding stagger">
        <div className="big-emoji">🎯</div>
        <h1>{t('onb.hello', { name: name.trim() })}</h1>
        <ul className="how">
          <li>{t('onb.how1')}</li>
          <li>{t('onb.how2')}</li>
          <li>{t('onb.how3')}</li>
        </ul>
        <p className="muted">{t('onb.testIntro')}</p>
        <button className="primary wide" onClick={() => setStep('test')}>
          {t('onb.testStart')}
        </button>
        <button className="secondary wide" onClick={() => (data.settings.name ? onDone() : finish('A1', [], false))}>
          {data.settings.name ? t('back') : t('onb.skip')}
        </button>
      </main>
    )
  }

  if (step === 'result' && result) {
    return (
      <main className="center onboarding stagger">
        <div className="big-emoji">🏅</div>
        <h1>{t('onb.resultTitle', { level: result.level })}</h1>
        <span className={`tag level lvl-${result.level}`}>{t(`title.${result.level}`)}</span>
        <p className="muted">{result.all ? t('onb.resultAll') : t('onb.resultText', { n: known.length })}</p>
        <button className="primary wide" onClick={onDone}>
          {t('onb.go')}
        </button>
      </main>
    )
  }

  const total = LEVELS.length * questions.length
  const doneCount = levelIdx * questions.length + qIdx
  return (
    <main className="quiz">
      <div className="quiz-top">
        <span className={`tag level lvl-${level}`}>{t('onb.testLevel', { level })}</span>
        <div className="progress">
          <span style={{ width: `${(100 * doneCount) / total}%` }} />
        </div>
      </div>
      {card && (
        <div key={card.id} className="stack">
          <QuestionCard card={card} type="en-tr" revealed={false} />
          <Choices choices={choices} correct={card.tr} picked={picked} onPick={pick} />
        </div>
      )}
    </main>
  )
}
