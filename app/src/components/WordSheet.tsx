import { useState } from 'react'
import { loadCustomWords, saveCustomWords, setProgress, toggleFavorite } from '../db'
import { useT } from '../i18n'
import { canSpeak, speak } from '../speech'
import { daysUntilDue, markDone } from '../srs'
import type { AppData } from '../App'
import type { Card } from '../types'

/**
 * Kelime detayı: alttan açılan pencere. Telaffuz, kelime ailesi ve eş/zıt anlamlılar (dokununca o kelimeye
 * geçer), favori, "zaten biliyorum", baştan öğren ve (kendi kelimesiyse) silme.
 */
export function WordSheet({ card: first, data, onClose, onChange }: { card: Card; data: AppData; onClose: () => void; onChange: () => void }) {
  const [card, setCard] = useState(first)
  return <WordDetail key={card.id} card={card} data={data} onClose={onClose} onChange={onChange} onOpen={setCard} />
}

function WordDetail({
  card,
  data,
  onClose,
  onChange,
  onOpen,
}: {
  card: Card
  data: AppData
  onClose: () => void
  onChange: () => void
  onOpen: (c: Card) => void
}) {
  const t = useT()
  const [fav, setFav] = useState(data.favorites.has(card.id))
  const [p, setP] = useState(data.progress.get(card.id))
  const related = (words: string[] | undefined) =>
    (words ?? []).map((w) => ({ w, card: data.cards.find((c) => c.word.toLowerCase() === w) }))
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
            {card.ipa && <div className="ipa">{card.ipa}</div>}
            <div className="meta left">
              <span className="tag level">{card.level}</span>
              <span className="tag">{t(`pos.${card.pos}` as Parameters<typeof t>[0])}</span>
              {card.topic && <span className="tag">{t(`topic.${card.topic}`)}</span>}
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

        {(
          [
            ['detail.family', card.family],
            ['detail.syn', card.syn],
            ['detail.ant', card.ant],
          ] as const
        ).map(
          ([label, words]) =>
            words &&
            words.length > 0 && (
              <div key={label} className="relations">
                <span className="muted small">{t(label)}</span>
                <div className="row wrap">
                  {related(words).map(({ w, card: c }) =>
                    c ? (
                      <button key={w} className={`chip lvl-${c.level}`} onClick={() => onOpen(c)}>
                        {w}
                      </button>
                    ) : (
                      <span key={w} className="chip plain">
                        {w}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ),
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
