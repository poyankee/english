import { useCallback, useEffect, useState } from 'react'
import { loadDay, loadProgress, loadSettings, streak } from './db'
import { Home } from './screens/Home'
import { Mistakes } from './screens/Mistakes'
import { Quiz } from './screens/Quiz'
import { SettingsScreen } from './screens/Settings'
import { newCardOrder, type Mode } from './session'
import type { Card, DayStats, Progress, Settings } from './types'

type Screen = { name: 'home' } | { name: 'quiz'; mode: Mode } | { name: 'mistakes' } | { name: 'settings' }

export interface AppData {
  cards: Card[]
  progress: Map<string, Progress>
  settings: Settings
  day: DayStats
  streak: number
}

export default function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  const refresh = useCallback(async () => {
    const [progress, settings, day, s] = await Promise.all([loadProgress(), loadSettings(), loadDay(), streak()])
    setData((d) => (d ? { ...d, progress, settings, day, streak: s } : d))
  }, [])

  useEffect(() => {
    ;(async () => {
      const res = await fetch(`${import.meta.env.BASE_URL}cards.json`)
      const cards = newCardOrder((await res.json()) as Card[])
      const [progress, settings, day, s] = await Promise.all([loadProgress(), loadSettings(), loadDay(), streak()])
      setData({ cards, progress, settings, day, streak: s })
    })().catch((e) => setError(String(e)))
  }, [])

  const go = (s: Screen) => {
    refresh().then(() => setScreen(s))
  }

  if (error) return <main className="center">Yüklenemedi: {error}</main>
  if (!data) return <main className="center">Yükleniyor…</main>

  switch (screen.name) {
    case 'quiz':
      return <Quiz data={data} mode={screen.mode} onExit={() => go({ name: 'home' })} />
    case 'mistakes':
      return <Mistakes data={data} onBack={() => go({ name: 'home' })} onStudy={() => go({ name: 'quiz', mode: 'mistakes' })} />
    case 'settings':
      return <SettingsScreen data={data} onBack={() => go({ name: 'home' })} />
    default:
      return <Home data={data} go={go} />
  }
}
