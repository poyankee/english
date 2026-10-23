import { useState } from 'react'
import { loadCustomWords, saveCustomWords, setProgress, toggleFavorite } from '../db'
import { useT } from '../i18n'
import { canSpeak, speak } from '../speech'
import { daysUntilDue, markDone } from '../srs'
import type { Card, Progress } from '../types'

/** Kelime detayı: alttan açılan pencere. Favori, "zaten biliyorum", baştan öğren ve (kendi kelimesiyse) silme. */
export function WordSheet({
  card,
  progress,
  favorite,
  onClose,
  onChange,
}: {
  card: Card
  progress: Progress | undefined
  favorite: boolean
  onClose: () => void
  onChange: () => void
}) {
  const t = useT()
  const [fav, setFav] = useState(favorite)
  const [p, setP] = useState(progress)
  const now = Date.now()
  const days = p ? daysUntilDue(p, now) : null

  async function fav_() {
    setFav((await toggleFavorite(card.id)).has(card.id))
    onChange()
  }

  async function known() {
    const next = markDone(card.id, p, now)
    await setProgress(card.id, next)
    setP(next)
    onChange()
  }

  async function reset() {
    await setProgress(card.id, null)
    setP(undefined)
    onChange()
  }

  async function remove() {
    await saveCustomWords((await loadCustomWords()).filter((w) => w.id !== card.id))
    await setProgress(card.id, null)
    onChange()
    onClose()
  }

  return (
    <div className="modal" onClick={onClose}>
      <section className={`modal-sheet lvl-${card.level}`} onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="detail-head">
          <div className="emoji-bubble">{card.emoji || '🔤'}</div>
          <div>
            <div className="row">
              <h2 className="word">{card.word}</h2>
              {canSpeak && (
                <button className="speak" aria-label={t('quiz.listen')} onClick={() => speak(card.word)}>
                  🔊
                </button>
              )}
            </div>
            <div className="meta left">
              <span className="tag level">{card.level}</span>
              <span className="tag">{t(`pos.${card.pos}` as Parameters<typeof t>[0])}</span>
              {card.custom && <span className="tag new">{t('words.custom')}</span>}
            </div>
          </div>
        </div>
        <p className="detail-tr">{card.tr}</p>
        {card.def && <p className="def">{card.def}</p>}
        {card.ex && (
          <button className="example-btn" onClick={() => speak(card.ex!)}>
            “{card.ex}” 🔊
          </button>
        )}

        <div className="detail-status">
          <b>{!p ? t('detail.statusNew') : p.done ? t('detail.statusDone') : days ? t('detail.nextIn', { n: days }) : t('detail.nextNow')}</b>
          {p && !p.done && <span>{t('detail.box', { n: p.box })}</span>}
          {p && <span className="muted">{t('detail.stats', { seen: p.seen, wrong: p.wrong })}</span>}
        </div>

        <div className="detail-actions">
          <button className="secondary" onClick={fav_}>
            {fav ? `⭐ ${t('detail.unfavorite')}` : `☆ ${t('detail.favorite')}`}
          </button>
          {!p?.done && (
            <button className="secondary" onClick={known}>
              ✅ {t('detail.markKnown')}
            </button>
          )}
          {p && (
            <button className="secondary" onClick={reset}>
              🔁 {t('detail.reset')}
            </button>
          )}
          {card.custom && (
            <button className="secondary danger" onClick={remove}>
              🗑 {t('detail.delete')}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
