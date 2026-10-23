import { useState } from 'react'
import type { AppData, Nav } from '../App'
import { exportBackup, importBackup } from '../db'
import { useT } from '../i18n'
import { LEVELS, type Settings } from '../types'

export function ProfileScreen({ data, updateSettings, nav }: { data: AppData; updateSettings: (s: Settings) => void; nav: Nav }) {
  const t = useT()
  const s = data.settings
  const [msg, setMsg] = useState('')
  const set = (patch: Partial<Settings>) => updateSettings({ ...s, ...patch })

  async function download() {
    const blob = new Blob([await exportBackup()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `kelime-yedek-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  async function upload(file: File) {
    try {
      await importBackup(await file.text())
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
        <input type="range" min={5} max={50} step={5} value={s.dailyNew} onChange={(e) => set({ dailyNew: Number(e.target.value) })} />
        <button className="secondary" onClick={nav.onboarding}>
          🎯 {t('profile.retest')}
        </button>
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
          <button className="secondary" onClick={download}>
            {t('profile.download')}
          </button>
          <label className="secondary button">
            {t('profile.upload')}
            <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        </div>
        {msg && <p>{msg}</p>}
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
