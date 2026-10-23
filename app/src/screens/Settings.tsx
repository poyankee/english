import { useState } from 'react'
import type { AppData } from '../App'
import { exportBackup, importBackup, saveSettings } from '../db'
import { LEVELS, type Settings } from '../types'

export function SettingsScreen({ data, onBack }: { data: AppData; onBack: () => void }) {
  const [s, setS] = useState<Settings>(data.settings)
  const [msg, setMsg] = useState('')

  const update = (next: Settings) => {
    setS(next)
    saveSettings(next)
  }

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
      setMsg('Yedek yüklendi ✅')
    } catch (e) {
      setMsg(`Hata: ${e}`)
    }
  }

  return (
    <main className="list stagger">
      <header className="page-head">
        <button className="icon" aria-label="Geri" onClick={onBack}>
          ←
        </button>
        <h1>Ayarlar</h1>
        <span />
      </header>

      <section className="panel">
        <h3>Seviyeler</h3>
        <div className="row wrap">
          {LEVELS.map((l) => {
            const on = s.levels.includes(l)
            return (
              <button
                key={l}
                className={`chip lvl-${l} ${on ? 'on' : ''}`}
                onClick={() => update({ ...s, levels: on ? s.levels.filter((x) => x !== l) : [...s.levels, l] })}
              >
                {l} <small>{data.cards.filter((c) => c.level === l).length}</small>
              </button>
            )
          })}
        </div>

        <label className="row">
          <input type="checkbox" checked={s.phrases} onChange={(e) => update({ ...s, phrases: e.target.checked })} />
          Kalıpları da sor (phrasal verb, deyim…)
        </label>
      </section>

      <section className="panel">
        <h3>Günlük yeni kelime: {s.dailyNew}</h3>
        <input
          type="range"
          min={5}
          max={50}
          step={5}
          value={s.dailyNew}
          onChange={(e) => update({ ...s, dailyNew: Number(e.target.value) })}
        />
      </section>

      <section className="panel">
        <h3>Yedekleme</h3>
        <p className="muted">İlerlemen sadece bu cihazda duruyor. Telefon değiştirirken yedeği indirip yeni cihazda yükle.</p>
        <div className="row wrap">
          <button className="secondary" onClick={download}>
            Yedeği indir
          </button>
          <label className="secondary button">
            Yedek yükle
            <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        </div>
        {msg && <p>{msg}</p>}
      </section>

      <p className="muted small center">{data.cards.length} kart yüklü</p>
    </main>
  )
}
