import { useState } from 'react'
import type { AppData } from '../App'
import { useT } from '../i18n'
import { speak } from '../speech'
import { isMistake, RESCUED_BOX } from '../srs'

export function Mistakes({ data, onBack, onStudy }: { data: AppData; onBack: () => void; onStudy: () => void }) {
  const t = useT()
  const [showRescued, setShowRescued] = useState(false)
  const rows = data.cards
    .map((c) => ({ card: c, p: data.progress.get(c.id) }))
    .filter(({ p }) => p && p.wrong > 0 && (showRescued || isMistake(p)))
    .sort((a, b) => a.p!.box - b.p!.box || b.p!.wrong - a.p!.wrong)
  const active = rows.filter(({ p }) => isMistake(p!)).length

  return (
    <main className="list stagger">
      <header className="page-head">
        <button className="icon" aria-label={t('back')} onClick={onBack}>
          ←
        </button>
        <h1>{t('mistakes.title')}</h1>
        <span />
      </header>
      <p className="muted">{t('mistakes.info', { n: RESCUED_BOX })}</p>
      <button className="action main" onClick={onStudy} disabled={!active}>
        <span className="action-icon">🧠</span>
        <span className="action-text">
          <b>{t('mistakes.study')}</b>
          <small>{t('mistakes.count', { n: active })}</small>
        </span>
        <span className="chev">›</span>
      </button>
      <label className="row">
        <input type="checkbox" checked={showRescued} onChange={(e) => setShowRescued(e.target.checked)} />
        {t('mistakes.showAll')}
      </label>
      {rows.length === 0 && (
        <p className="muted center">{t('mistakes.empty')}</p>
      )}
      <ul hidden={rows.length === 0}>
        {rows.map(({ card, p }) => (
          <li key={card.id} className={`lvl-${card.level}`} onClick={() => speak(card.word)}>
            <span className="emoji-sm">{card.emoji}</span>
            <div className="grow">
              <b>{card.word}</b> <span className="muted">{card.tr}</span>
            </div>
            <span className="dots" title={`${p!.wrong} kez yanlış`}>
              {Array.from({ length: RESCUED_BOX }, (_, i) => (i < p!.box ? '●' : '○')).join('')}
            </span>
          </li>
        ))}
      </ul>
    </main>
  )
}
