import { useEffect, useState } from 'react'
import { hasImage, imageUrl, onImagesChange } from '../images'
import type { Card } from '../types'

const POS_EMOJI: Record<string, string> = { verb: '🏃', adjective: '🎨', adverb: '⚡', phrase: '💬' }

/** Kartın görseli: kullanıcının eklediği resim varsa o, yoksa emoji */
export function CardPicture({ card, fallback }: { card: Card; fallback?: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  useEffect(() => onImagesChange(() => setVersion((v) => v + 1)), [])
  useEffect(() => {
    let live = true
    if (hasImage(card.id)) imageUrl(card.id).then((u) => live && setUrl(u))
    else setUrl(null)
    return () => {
      live = false
    }
  }, [card.id, version])
  return (
    <div className={`emoji-bubble ${url ? 'has-img' : ''}`}>
      {url ? <img src={url} alt="" /> : card.emoji || fallback || POS_EMOJI[card.pos] || '🔤'}
    </div>
  )
}
