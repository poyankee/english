import { useEffect, useState } from 'react'
import type { AppData, Nav } from '../App'
import { badgeList } from '../badgeList'
import { saveSeenBadges } from '../db'
import { downloadBackup } from '../exporter'
import { useT, type T } from '../i18n'
import { goalPlan } from '../plan'
import { inScope, nextLevel } from '../session'
import { isMistake } from '../srs'
import { totalXp, xpLevel } from '../stats'
import type { Settings } from '../types'

/** Bu kadar kart çalışıldıktan sonra haftalık yedek hatırlatması gösterilir */
const BACKUP_AFTER_CARDS = 30
const WEEK = 7 * 24 * 3600 * 1000

export function Today({
  data,
  nav,
  updateSettings,
  refresh,
}: {
  data: AppData
  nav: Nav
  updateSettings: (s: Settings) => void
  refresh: () => Promise<void>
}) {
  const t = useT()
  const { cards, progress, settings, day } = data
  const now = Date.now()
  // Silinen kendi kelimelerin ilerlemesi sayılmasın
  const ids = new Set(cards.map((c) => c.id))
  const due = [...progress.values()].filter((p) => !p.done && p.due <= now && ids.has(p.id)).length
  const newLeft = Math.min(
    Math.max(settings.dailyNew - day.newCards, 0),
    cards.filter((c) => !progress.has(c.id) && inScope(c, settings)).length,
  )
  const mistakes = [...progress.values()].filter((p) => isMistake(p) && ids.has(p.id)).length
  const accuracy = day.reviews ? Math.round((100 * day.correct) / day.reviews) : null
  const up = nextLevel(cards, progress, settings)
  const xp = xpLevel(totalXp(data.days))
  const fresh = badgeList(data).filter((b) => b.earned && !data.seenBadges.has(b.id))
  const plan = goalPlan(cards, progress, settings, now)
  const [dismissed, setDismissed] = useState(false)
  const [backupLater, setBackupLater] = useState(false)
  const needsBackup = progress.size >= BACKUP_AFTER_CARDS && (!data.lastBackup || now - data.lastBackup > WEEK) && !backupLater

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
            <span className="pill">⭐ {t('stats.xpLevel', { n: xp.level })}</span>
            {data.freezes.available > 0 && <span className="pill">🧊 {data.freezes.available}</span>}
          </div>
        </div>
        <Ring value={day.newCards} goal={settings.dailyNew} label={t('today.ringNew', { n: settings.dailyNew })} />
      </section>

      {fresh.length > 0 && !dismissed && (
        <section className="levelup badge-banner">
          <span className="badge-big">{fresh[0].icon}</span>
          <div className="grow">
            <b>{t('today.newBadge')}</b>
            <p>
              {t(`badge.${fresh[0].id}` as Parameters<T>[0])} · {t(`badge.${fresh[0].id}.desc` as Parameters<T>[0])}
            </p>
          </div>
          <button
            className="primary"
            onClick={() => {
              setDismissed(true)
              saveSeenBadges([...data.seenBadges, ...fresh.map((b) => b.id)])
            }}
          >
            {t('today.ok')}
          </button>
        </section>
      )}

      {needsBackup && (
        <section className="levelup backup-banner">
          <span className="badge-big">💾</span>
          <div className="grow">
            <b>{t('backup.remind')}</b>
            <p>{t('backup.remindText')}</p>
            <div className="row">
              <button className="primary small-btn" onClick={() => downloadBackup().then(refresh)}>
                {t('backup.now')}
              </button>
              <button className="secondary small-btn" onClick={() => setBackupLater(true)}>
                {t('backup.later')}
              </button>
            </div>
          </div>
        </section>
      )}

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

      {plan && settings.goal && (
        <section className="goal-card" onClick={() => nav.tab('profile')}>
          <div className="row between">
            <b>
              🎯 {t('goal.card', { level: settings.goal.level })}
            </b>
            <span className="muted small">{t('goal.daysLeft', { n: plan.daysLeft })}</span>
          </div>
          <div className="bar">
            <span className="learned" style={{ width: `${plan.total ? (100 * (plan.total - plan.remaining)) / plan.total : 0}%` }} />
          </div>
          <small className="muted">
            {t('goal.cardSub', { n: plan.remaining, per: plan.perDay })}
            {plan.perDay > settings.dailyNew && !settings.autoDaily && <> · {t('goal.behind')}</>}
          </small>
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
