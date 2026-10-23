import type { ReactNode } from 'react'
import { useT } from '../i18n'

/** Oyunların ortak üst çubuğu: çıkış, ilerleme/süre ve skor */
export function GameTop({ onExit, ratio, right }: { onExit: () => void; ratio: number; right?: ReactNode }) {
  const t = useT()
  return (
    <div className="quiz-top">
      <button className="icon" aria-label={t('quiz.exit')} onClick={onExit}>
        ✕
      </button>
      <div className="progress">
        <span style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
      </div>
      {right}
    </div>
  )
}

/** Oyun sonu ekranı */
export function GameOver({
  emoji,
  title,
  lines,
  record,
  onAgain,
  onExit,
}: {
  emoji: string
  title: string
  lines: string[]
  record: boolean
  onAgain: () => void
  onExit: () => void
}) {
  const t = useT()
  return (
    <main className="center done stagger">
      <div className="trophy">{emoji}</div>
      <h2>{title}</h2>
      {record && <span className="tag new">{t('game.newBest')}</span>}
      {lines.map((l) => (
        <p key={l} className="muted">
          {l}
        </p>
      ))}
      <button className="primary wide" onClick={onAgain}>
        {t('game.again')}
      </button>
      <button className="secondary wide" onClick={onExit}>
        {t('done.home')}
      </button>
    </main>
  )
}
