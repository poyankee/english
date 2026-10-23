import { useState } from 'react'
import type { AppData } from '../App'
import { speak } from '../speech'
import { isMistake, RESCUED_BOX } from '../srs'

export function Mistakes({ data, onBack, onStudy }: { data: AppData; onBack: () => void; onStudy: () => void }) {
  const [showRescued, setShowRescued] = useState(false)
  const rows = data.cards
    .map((c) => ({ card: c, p: data.progress.get(c.id) }))
    .filter(({ p }) => p && p.wrong > 0 && (showRescued || isMistake(p)))
    .sort((a, b) => a.p!.box - b.p!.box || b.p!.wrong - a.p!.wrong)
  const active = rows.filter(({ p }) => isMistake(p!)).length

  return (
    <main className="list">
      <header className="row between">
        <button className="icon" aria-label="Geri" onClick={onBack}>
          ←
        </button>
        <h1>Bilemediklerim</h1>
        <span />
      </header>
      <p className="muted">
        İlk seferde bilemediğin kelimeler burada. {RESCUED_BOX} kez üst üste doğru bilince listeden çıkarlar.
      </p>
      <button className="primary big" onClick={onStudy} disabled={!active}>
        Bunları çalış<small>{active} kelime</small>
      </button>
      <label className="row">
        <input type="checkbox" checked={showRescued} onChange={(e) => setShowRescued(e.target.checked)} />
        Öğrendiklerimi de göster
      </label>
      <ul>
        {rows.map(({ card, p }) => (
          <li key={card.id} onClick={() => speak(card.word)}>
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
