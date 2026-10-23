import { useEffect, useState } from 'react'
import type { AppData } from '../App'
import { inScope, isVerb, VERB_TEST_SIZE, type Mode } from '../session'
import { isMistake, KNOWN_BOX } from '../srs'
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
  const verbs = scoped.filter(isVerb).length
  const accuracy = day.reviews ? Math.round((100 * day.correct) / day.reviews) : null

  return (
    <main className="home stagger">
      <header className="row between">
        <h1>Kelime</h1>
        <button className="icon" aria-label="Ayarlar" onClick={() => go({ name: 'settings' })}>
          ⚙️
        </button>
      </header>

      <section className="hero">
        <div className="hero-text">
          <h2>{greeting()} 👋</h2>
          <p>{day.newCards >= settings.dailyNew ? 'Günlük hedefini tamamladın!' : 'Bugünkü hedefine az kaldı.'}</p>
          <div className="hero-stats">
            <span className="pill">
              <span className="flame">🔥</span> {data.streak} gün
            </span>
            <span className="pill">📚 {day.reviews} kart</span>
            {accuracy !== null && <span className="pill">🎯 %{accuracy}</span>}
          </div>
        </div>
        <Ring value={day.newCards} goal={settings.dailyNew} />
      </section>

      <button className="action main" onClick={() => go({ name: 'quiz', mode: 'study' })} disabled={!due && !newLeft}>
        <span className="action-icon">{due || newLeft ? '🚀' : '🎉'}</span>
        <span className="action-text">
          <b>{due || newLeft ? 'Çalışmaya başla' : 'Bugünlük bitti'}</b>
          <small>
            {due} tekrar · {newLeft} yeni kelime
          </small>
        </span>
        <span className="chev">›</span>
      </button>

      <button className="action orange" onClick={() => go({ name: 'mistakes' })}>
        <span className="action-icon">🧠</span>
        <span className="action-text">
          <b>Bilemediklerim</b>
          <small>Zorlandığın kelimeleri tekrar et</small>
        </span>
        {mistakes > 0 && <span className="count">{mistakes}</span>}
        <span className="chev">›</span>
      </button>

      <button className="action teal" onClick={() => go({ name: 'quiz', mode: 'verbs' })} disabled={!verbs}>
        <span className="action-icon">🏃</span>
        <span className="action-text">
          <b>Fiil sınavı</b>
          <small>{VERB_TEST_SIZE} fiil ve fiil kalıbı</small>
        </span>
        <span className="chev">›</span>
      </button>

      <h3 className="section-title">Seviyeler</h3>
      <section className="levels">
        {LEVELS.map((level) => {
          const inLevel = cards.filter((c) => c.level === level)
          if (!inLevel.length) return null
          const known = inLevel.filter((c) => (progress.get(c.id)?.box ?? 0) >= KNOWN_BOX).length
          const started = inLevel.filter((c) => progress.has(c.id)).length
          return (
            <div key={level} className={`level lvl-${level} ${settings.levels.includes(level) ? '' : 'off'}`}>
              <span className="level-badge">{level}</span>
              <div className="level-info">
                <div className="nums">
                  <span>
                    <b>{known}</b> biliyorum · <b>{started - known}</b> çalışıyorum
                  </span>
                  <span>{inLevel.length}</span>
                </div>
                <div className="bar">
                  <span className="started" style={{ width: `${(100 * started) / inLevel.length}%` }} />
                  <span className="learned" style={{ width: `${(100 * known) / inLevel.length}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </section>
    </main>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'Merhaba' : 'İyi akşamlar'
}

/** Günlük yeni kelime hedefini gösteren halka */
function Ring({ value, goal }: { value: number; goal: number }) {
  const r = 38
  const circ = 2 * Math.PI * r
  const ratio = Math.min(value / Math.max(goal, 1), 1)
  // İlk çizimde boş başlayıp dolsun diye bir kare sonra gerçek değere geçiyoruz
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(ratio))
    return () => cancelAnimationFrame(id)
  }, [ratio])
  return (
    <div className="ring" aria-label={`Günlük hedef: ${value} / ${goal}`}>
      <svg viewBox="0 0 86 86" width="86" height="86">
        <circle className="track" cx="43" cy="43" r={r} />
        <circle className="value" cx="43" cy="43" r={r} strokeDasharray={circ} strokeDashoffset={circ * (1 - shown)} />
      </svg>
      <div className="ring-label">
        <b>{ratio >= 1 ? '✓' : value}</b>
        <span>/ {goal} yeni</span>
      </div>
    </div>
  )
}
