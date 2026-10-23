import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  loadConfusions,
  loadCounters,
  loadCustomWords,
  loadDay,
  loadDays,
  loadFavorites,
  loadProgress,
  loadSeenBadges,
  loadSettings,
  saveSettings,
  streak,
  type Counters,
} from './db'
import { setFeedback } from './feedback'
import { I18n, makeT } from './i18n'
import { Match } from './games/Match'
import { PhraseFill } from './games/PhraseFill'
import { TrueFalse } from './games/TrueFalse'
import { Mistakes } from './screens/Mistakes'
import { Onboarding } from './screens/Onboarding'
import { Practice } from './screens/Practice'
import { ProfileScreen } from './screens/Profile'
import { ProgressScreen } from './screens/Progress'
import { Quiz } from './screens/Quiz'
import { Today } from './screens/Today'
import { Words } from './screens/Words'
import { newCardOrder, type Confusions, type Mode } from './session'
import { setAccent } from './speech'
import type { FreezeState } from './stats'
import type { Card, DayStats, Progress, Settings } from './types'

export type Tab = 'today' | 'practice' | 'words' | 'progress' | 'profile'
/** Sekme çubuğunun gizlendiği tam ekran akışlar */
export type Game = 'match' | 'truefalse' | 'phrase'
type Overlay = { name: 'quiz'; mode: Mode } | { name: 'game'; game: Game } | { name: 'mistakes' } | { name: 'onboarding' } | null

export interface AppData {
  cards: Card[]
  progress: Map<string, Progress>
  settings: Settings
  day: DayStats
  streak: number
  freezes: FreezeState
  confusions: Confusions
  favorites: Set<string>
  /** Tüm günlerin istatistikleri (grafikler, haftalık özet, XP) */
  days: DayStats[]
  counters: Counters
  seenBadges: Set<string>
}

export interface Nav {
  quiz: (mode: Mode) => void
  game: (g: Game) => void
  mistakes: () => void
  onboarding: () => void
  tab: (t: Tab) => void
}

const TABS: { id: Tab; icon: string }[] = [
  { id: 'today', icon: '🏠' },
  { id: 'practice', icon: '🎮' },
  { id: 'words', icon: '📚' },
  { id: 'progress', icon: '📈' },
  { id: 'profile', icon: '👤' },
]

export default function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('today')
  const [overlay, setOverlay] = useState<Overlay>(null)

  const t = useMemo(() => makeT(data?.settings.lang ?? 'tr'), [data?.settings.lang])

  // cards.json'dan gelen kartlar; kullanıcının eklediği kelimeler her yüklemede bunlara eklenir
  const baseCards = useRef<Card[]>([])

  const load = useCallback(async () => {
    // Seri koruyucu günleri işaretleyebildiği için seri, günler okunmadan önce hesaplanır
    const st = await streak()
    const [progress, settings, day, confusions, favorites, custom, days, counters, seenBadges] = await Promise.all([
      loadProgress(),
      loadSettings(),
      loadDay(),
      loadConfusions(),
      loadFavorites(),
      loadCustomWords(),
      loadDays(),
      loadCounters(),
      loadSeenBadges(),
    ])
    const cards = newCardOrder([...baseCards.current, ...custom])
    return { cards, progress, settings, day, streak: st.days, freezes: st.freezes, confusions, favorites, days, counters, seenBadges }
  }, [])

  const refresh = useCallback(async () => {
    const d = await load()
    setData(d)
  }, [load])

  useEffect(() => {
    ;(async () => {
      const res = await fetch(`${import.meta.env.BASE_URL}cards.json`)
      baseCards.current = (await res.json()) as Card[]
      const d = await load()
      setData(d)
      if (!d.settings.name) setOverlay({ name: 'onboarding' })
    })().catch((e) => setError(String(e)))
  }, [load])

  useEffect(() => {
    if (!data) return
    setAccent(data.settings.accent)
    setFeedback(data.settings.sounds, data.settings.vibration)
  }, [data])

  const updateSettings = useCallback(async (s: Settings) => {
    await saveSettings(s)
    setData((d) => (d ? { ...d, settings: s } : d))
  }, [])

  const close = () => {
    refresh().then(() => setOverlay(null))
  }

  const nav: Nav = {
    quiz: (mode) => refresh().then(() => setOverlay({ name: 'quiz', mode })),
    game: (game) => refresh().then(() => setOverlay({ name: 'game', game })),
    mistakes: () => refresh().then(() => setOverlay({ name: 'mistakes' })),
    onboarding: () => setOverlay({ name: 'onboarding' }),
    tab: (id) => {
      refresh()
      setTab(id)
      window.scrollTo({ top: 0 })
    },
  }

  if (error) return <main className="center">{t('loadError', { msg: error })}</main>
  if (!data) return <main className="center">{t('loading')}</main>

  let content
  if (overlay?.name === 'quiz') content = <Quiz data={data} mode={overlay.mode} onExit={close} />
  else if (overlay?.name === 'game')
    content =
      overlay.game === 'match' ? (
        <Match data={data} onExit={close} />
      ) : overlay.game === 'truefalse' ? (
        <TrueFalse data={data} onExit={close} />
      ) : (
        <PhraseFill data={data} onExit={close} />
      )
  else if (overlay?.name === 'mistakes') content = <Mistakes data={data} onBack={close} onStudy={() => nav.quiz('mistakes')} />
  else if (overlay?.name === 'onboarding') content = <Onboarding data={data} updateSettings={updateSettings} onDone={close} />
  else if (tab === 'practice') content = <Practice data={data} nav={nav} />
  else if (tab === 'words') content = <Words data={data} nav={nav} refresh={refresh} />
  else if (tab === 'progress') content = <ProgressScreen data={data} refresh={refresh} />
  else if (tab === 'profile') content = <ProfileScreen data={data} updateSettings={updateSettings} nav={nav} />
  else content = <Today data={data} nav={nav} updateSettings={updateSettings} />

  return (
    <I18n.Provider value={t}>
      {content}
      {!overlay && (
        <nav className="tabbar">
          {TABS.map((item) => (
            <button key={item.id} className={tab === item.id ? 'on' : ''} onClick={() => nav.tab(item.id)}>
              <span className="tab-icon">{item.icon}</span>
              <span>{t(`tab.${item.id}`)}</span>
            </button>
          ))}
        </nav>
      )}
    </I18n.Provider>
  )
}
