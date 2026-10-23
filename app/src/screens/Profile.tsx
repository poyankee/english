import { useState } from 'react'
import type { AppData, Nav } from '../App'
import { importBackup } from '../db'
import { initImages } from '../images'
import { download, downloadBackup, reminderIcs, toAnki, toCsv } from '../exporter'
import { useT } from '../i18n'
import { goalPlan, plannedDaily } from '../plan'
import { levelIndex } from '../session'
import { isMistake } from '../srs'
import { dateKey, daysBefore } from '../stats'
import { COLOR_THEMES, PALETTES } from '../theme'
import { LEVELS, type Card, type Settings, type TextSize, type ThemeMode } from '../types'

export function ProfileScreen({
  data,
  updateSettings,
  nav,
  refresh,
}: {
  data: AppData
  updateSettings: (s: Settings) => void
  nav: Nav
  refresh: () => Promise<void>
}) {
  const t = useT()
  const s = data.settings
  const [msg, setMsg] = useState('')
  const set = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch }
    next.dailyNew = plannedDaily(goalPlan(data.cards, data.progress, next, Date.now()), next)
    updateSettings(next)
  }
  const plan = goalPlan(data.cards, data.progress, s, Date.now())
  const inDays = (n: number) => dateKey(daysBefore(Date.now(), -n))

  const lists: { key: 'export.mistakes' | 'export.favorites' | 'export.studied'; file: string; cards: Card[] }[] = [
    { key: 'export.mistakes', file: 'bilemediklerim', cards: data.cards.filter((c) => { const p = data.progress.get(c.id); return p && isMistake(p) }) },
    { key: 'export.favorites', file: 'favorilerim', cards: data.cards.filter((c) => data.favorites.has(c.id)) },
    { key: 'export.studied', file: 'calistiklarim', cards: data.cards.filter((c) => data.progress.has(c.id)) },
  ]

  async function upload(file: File) {
    try {
      await importBackup(await file.text())
      await initImages(true)
      await refresh()
      setMsg(t('profile.uploaded'))
    } catch (e) {
      setMsg(t('profile.error', { msg: String(e) }))
    }
  }

  return (
    <main className="list stagger with-tabs">
      <header className="profile-head">
        <div className="avatar">{(s.name || '?').slice(0, 1).toLocaleUpperCase('tr')}</div>
        <div>
          <h1>{s.name || t('profile.title')}</h1>
          <span className={`tag level lvl-${s.currentLevel}`}>
            {s.currentLevel} · {t(`title.${s.currentLevel}`)}
          </span>
        </div>
      </header>

      <section className="panel">
        <label className="field">
          <span>{t('profile.name')}</span>
          <input value={s.name} maxLength={30} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <div className="field">
          <span>{t('profile.language')}</span>
          <div className="seg">
            <button className={s.lang === 'tr' ? 'on' : ''} onClick={() => set({ lang: 'tr' })}>
              🇹🇷 Türkçe
            </button>
            <button className={s.lang === 'en' ? 'on' : ''} onClick={() => set({ lang: 'en' })}>
              🇬🇧 English
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>{t('profile.level')}</h3>
        <div className="row wrap">
          {LEVELS.map((l) => (
            <button key={l} className={`chip lvl-${l} ${s.currentLevel === l ? 'on' : ''}`} onClick={() => set({ currentLevel: l })}>
              {l}
            </button>
          ))}
        </div>
        <p className="muted small">{t('profile.levelHint')}</p>
        <label className="row">
          <input type="checkbox" checked={s.phrases} onChange={(e) => set({ phrases: e.target.checked })} />
          {t('profile.phrases')}
        </label>
        <h3>{t('profile.daily', { n: s.dailyNew })}</h3>
        <input
          type="range"
          min={5}
          max={50}
          step={5}
          value={s.dailyNew}
          disabled={!!plan && s.autoDaily}
          onChange={(e) => set({ dailyNew: Number(e.target.value) })}
        />
        {plan && s.autoDaily && <p className="muted small">{t('goal.autoNote')}</p>}
        <button className="secondary" onClick={nav.onboarding}>
          🎯 {t('profile.retest')}
        </button>
      </section>

      <section className="panel">
        <h3>🎯 {t('goal.title')}</h3>
        <div className="row wrap">
          <button className={`chip ${!s.goal ? 'on' : ''}`} onClick={() => set({ goal: null })}>
            {t('goal.none')}
          </button>
          {LEVELS.filter((l) => levelIndex(l) >= levelIndex(s.currentLevel)).map((l) => (
            <button
              key={l}
              className={`chip lvl-${l} ${s.goal?.level === l ? 'on' : ''}`}
              onClick={() => set({ goal: { level: l, date: s.goal?.date ?? inDays(90) } })}
            >
              {l}
            </button>
          ))}
        </div>
        {s.goal && (
          <>
            <label className="field">
              <span>{t('goal.date')}</span>
              <input type="date" value={s.goal.date} min={inDays(1)} onChange={(e) => e.target.value && set({ goal: { ...s.goal!, date: e.target.value } })} />
            </label>
            <Toggle label={t('goal.auto')} on={s.autoDaily} onChange={(v) => set({ autoDaily: v })} />
          </>
        )}
        {plan && (
          <p className={`goal-summary ${plan.tooFast ? 'warn' : ''}`}>
            {t('goal.summary', { n: plan.remaining, days: plan.daysLeft, per: plan.perDay })}
            {plan.tooFast && <> {t('goal.tooFast')}</>}
          </p>
        )}
      </section>

      <section className="panel">
        <h3>⏰ {t('reminder.title')}</h3>
        <p className="muted small">{t('reminder.info')}</p>
        <div className="row">
          <input className="time-input" type="time" value={s.reminderTime} onChange={(e) => e.target.value && set({ reminderTime: e.target.value })} />
          <button
            className="secondary grow"
            onClick={() =>
              download(
                'kelime-hatirlatma.ics',
                reminderIcs(s.reminderTime, t('reminder.event'), t('reminder.eventText'), location.origin + import.meta.env.BASE_URL),
                'text/calendar;charset=utf-8',
              )
            }
          >
            📅 {t('reminder.add')}
          </button>
        </div>
      </section>

      <section className="panel">
        <h3>{t('profile.look')}</h3>
        <div className="field">
          <span>{t('profile.theme')}</span>
          <div className="seg">
            {(['system', 'light', 'dark'] as ThemeMode[]).map((m) => (
              <button key={m} className={s.theme === m ? 'on' : ''} onClick={() => set({ theme: m })}>
                {t(`theme.${m}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>{t('profile.color')}</span>
          <div className="swatches">
            {COLOR_THEMES.map((c) => {
              const [a, b, d] = PALETTES[c].light
              return (
                <button
                  key={c}
                  className={`swatch ${s.color === c ? 'on' : ''}`}
                  aria-label={t(`color.${c}`)}
                  aria-pressed={s.color === c}
                  onClick={() => set({ color: c })}
                >
                  <span style={{ background: `linear-gradient(135deg, ${a}, ${b} 55%, ${d})` }} />
                  <small>{t(`color.${c}`)}</small>
                </button>
              )
            })}
          </div>
        </div>
        <div className="field">
          <span>{t('profile.textSize')}</span>
          <div className="seg">
            {(['small', 'normal', 'large'] as TextSize[]).map((z) => (
              <button key={z} className={s.textSize === z ? 'on' : ''} onClick={() => set({ textSize: z })}>
                {t(`size.${z}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>{t('profile.sound')}</h3>
        <div className="field">
          <span>{t('profile.accent')}</span>
          <div className="seg">
            <button className={s.accent === 'us' ? 'on' : ''} onClick={() => set({ accent: 'us' })}>
              {t('profile.accentUs')}
            </button>
            <button className={s.accent === 'gb' ? 'on' : ''} onClick={() => set({ accent: 'gb' })}>
              {t('profile.accentGb')}
            </button>
          </div>
        </div>
        <Toggle label={t('profile.autoSpeak')} on={s.autoSpeak} onChange={(v) => set({ autoSpeak: v })} />
        <Toggle label={t('profile.sounds')} on={s.sounds} onChange={(v) => set({ sounds: v })} />
        <Toggle label={t('profile.vibration')} on={s.vibration} onChange={(v) => set({ vibration: v })} />
      </section>

      <section className="panel">
        <h3>{t('profile.backup')}</h3>
        <p className="muted small">{t('profile.backupInfo')}</p>
        <div className="row wrap">
          <button className="secondary" onClick={() => downloadBackup().then(refresh)}>
            {t('profile.download')}
          </button>
          <label className="secondary button">
            {t('profile.upload')}
            <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        </div>
        <p className="muted small">
          {data.lastBackup ? t('backup.last', { date: new Date(data.lastBackup).toLocaleDateString(s.lang === 'en' ? 'en-GB' : 'tr-TR') }) : t('backup.never')}
        </p>
        {msg && <p>{msg}</p>}
      </section>

      <section className="panel">
        <h3>{t('export.title')}</h3>
        <p className="muted small">{t('export.info')}</p>
        {lists.map((l) => (
          <div key={l.key} className="export-row">
            <span className="grow">
              {t(l.key)} <span className="muted">({l.cards.length})</span>
            </span>
            <button
              className="secondary small-btn"
              disabled={!l.cards.length}
              onClick={() => download(`${l.file}.csv`, toCsv(l.cards, data.progress), 'text/csv;charset=utf-8')}
            >
              {t('export.csv')}
            </button>
            <button className="secondary small-btn" disabled={!l.cards.length} onClick={() => download(`${l.file}-anki.txt`, toAnki(l.cards), 'text/plain;charset=utf-8')}>
              {t('export.anki')}
            </button>
          </div>
        ))}
      </section>

      <p className="muted small center">{t('profile.cards', { n: data.cards.length })}</p>
    </main>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <span>{label}</span>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <i />
    </label>
  )
}
