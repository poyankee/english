import type { AppData } from '../App'
import { inScope, type Mode } from '../session'
import { isMistake, RESCUED_BOX } from '../srs'
import { LEVELS } from '../types'

type Go = (s: { name: 'quiz'; mode: Mode } | { name: 'mistakes' } | { name: 'settings' }) => void

export function Home({ data, go }: { data: AppData; go: Go }) {
  const { cards, progress, settings, day } = data
  const now = Date.now()
  const scoped = cards.filter((c) => inScope(c, settings))
  const due = scoped.filter((c) => {
    const p = progress.get(c.id)
    return p && p.due <= now
  }).length
  const newLeft = Math.min(
    Math.max(settings.dailyNew - day.newCards, 0),
    scoped.filter((c) => !progress.has(c.id)).length,
  )
  const mistakes = [...progress.values()].filter(isMistake).length

  return (
    <main className="home">
      <header className="row between">
        <h1>Kelime</h1>
        <button className="icon" aria-label="Ayarlar" onClick={() => go({ name: 'settings' })}>
          ⚙️
        </button>
      </header>

      <section className="stats">
        <Stat value={`🔥 ${data.streak}`} label="gün seri" />
        <Stat value={day.reviews} label="bugün çalışılan" />
        <Stat value={day.reviews ? `%${Math.round((100 * day.correct) / day.reviews)}` : '–'} label="bugün doğru" />
      </section>

      <button className="primary big" onClick={() => go({ name: 'quiz', mode: 'study' })} disabled={!due && !newLeft}>
        {due || newLeft ? 'Çalışmaya başla' : 'Bugünlük bitti 🎉'}
        <small>
          {due} tekrar · {newLeft} yeni
        </small>
      </button>

      <button className="secondary big" onClick={() => go({ name: 'mistakes' })}>
        Bilemediklerim
        <small>{mistakes} kelime</small>
      </button>

      <section className="levels">
        {LEVELS.map((level) => {
          const inLevel = cards.filter((c) => c.level === level)
          if (!inLevel.length) return null
          const learned = inLevel.filter((c) => (progress.get(c.id)?.box ?? 0) >= RESCUED_BOX).length
          const started = inLevel.filter((c) => progress.has(c.id)).length
          return (
            <div key={level} className={settings.levels.includes(level) ? '' : 'muted'}>
              <div className="row between">
                <b>{level}</b>
                <span>
                  {learned} / {inLevel.length}
                </span>
              </div>
              <div className="bar">
                <span className="started" style={{ width: `${(100 * started) / inLevel.length}%` }} />
                <span className="learned" style={{ width: `${(100 * learned) / inLevel.length}%` }} />
              </div>
            </div>
          )
        })}
      </section>
    </main>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}
