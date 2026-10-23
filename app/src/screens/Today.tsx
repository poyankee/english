import { useEffect, useState } from 'react'
import type { AppData, Nav } from '../App'
import { useT } from '../i18n'
import { inScope, nextLevel } from '../session'
import { isMistake } from '../srs'
import type { Settings } from '../types'

export function Today({ data, nav, updateSettings }: { data: AppData; nav: Nav; updateSettings: (s: Settings) => void }) {
  const t = useT()
  const { cards, progress, settings, day } = data
  const now = Date.now()
  const due = [...progress.values()].filter((p) => !p.done && p.due <= now).length
  const newLeft = Math.min(
    Math.max(settings.dailyNew - day.newCards, 0),
    cards.filter((c) => !progress.has(c.id) && inScope(c, settings)).length,
  )
  const mistakes = [...progress.values()].filter(isMistake).length
  const accuracy = day.reviews ? Math.round((100 * day.correct) / day.reviews) : null
  const up = nextLevel(cards, progress, settings)

  return (
    <main className="home stagger with-tabs">
      <header className="row between">
        <h1>{settings.name ? `${t(greetingKey())}, ${settings.name}` : t(greetingKey())} 👋</h1>
      </header>

      <section className="hero">
        <div className="hero-text">
          <h2>{t('today.career')}</h2>
          <p>{t('today.careerSub', { level: settings.currentLevel, title: t(`title.${settings.currentLevel}`) })}</p>
          <p>{day.newCards >= settings.dailyNew ? t('today.goalDone') : t('today.goalLeft')}</p>
          <div className="hero-stats">
            <span className="pill">
              <span className="flame">🔥</span> {t('today.days', { n: data.streak })}
            </span>
            <span className="pill">📚 {t('today.cards', { n: day.reviews })}</span>
            {accuracy !== null && <span className="pill">🎯 %{accuracy}</span>}
          </div>
        </div>
        <Ring value={day.newCards} goal={settings.dailyNew} label={t('today.ringNew', { n: settings.dailyNew })} />
      </section>

      {up && (
        <section className="levelup">
          <div>
            <b>{t('today.levelUpTitle', { level: up })}</b>
            <p>{t('today.levelUpText', { level: settings.currentLevel })}</p>
          </div>
          <button className="primary" onClick={() => updateSettings({ ...settings, currentLevel: up })}>
            {t('today.levelUpBtn')}
          </button>
        </section>
      )}

      <button className="action main" onClick={() => nav.quiz('study')} disabled={!due && !newLeft}>
        <span className="action-icon">{due || newLeft ? '🚀' : '🎉'}</span>
        <span className="action-text">
          <b>{due || newLeft ? t('today.study') : t('today.studyDone')}</b>
          <small>{t('today.studySub', { due, fresh: newLeft })}</small>
        </span>
        <span className="chev">›</span>
      </button>

      <button className="action orange" onClick={nav.mistakes}>
        <span className="action-icon">🧠</span>
        <span className="action-text">
          <b>{t('today.mistakes')}</b>
          <small>{t('today.mistakesSub')}</small>
        </span>
        {mistakes > 0 && <span className="count">{mistakes}</span>}
        <span className="chev">›</span>
      </button>
    </main>
  )
}

function greetingKey() {
  const h = new Date().getHours()
  return h < 6 ? 'greet.night' : h < 12 ? 'greet.morning' : h < 18 ? 'greet.day' : 'greet.evening'
}

/** Günlük yeni kelime hedefini gösteren halka */
function Ring({ value, goal, label }: { value: number; goal: number; label: string }) {
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
    <div className="ring" aria-label={`${value} ${label}`}>
      <svg viewBox="0 0 86 86" width="86" height="86">
        <circle className="track" cx="43" cy="43" r={r} />
        <circle className="value" cx="43" cy="43" r={r} strokeDasharray={circ} strokeDashoffset={circ * (1 - shown)} />
      </svg>
      <div className="ring-label">
        <b>{ratio >= 1 ? '✓' : value}</b>
        <span>{label}</span>
      </div>
    </div>
  )
}
