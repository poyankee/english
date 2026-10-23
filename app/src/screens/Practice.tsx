import type { AppData, Nav } from '../App'
import { useT } from '../i18n'
import { PRACTICE_SIZE, type Mode } from '../session'

interface Item {
  mode: Mode
  icon: string
  color: string
  title: Parameters<ReturnType<typeof useT>>[0]
  sub: Parameters<ReturnType<typeof useT>>[0]
}

const ITEMS: Item[] = [
  { mode: 'reverse', icon: '🔄', color: 'purple', title: 'practice.reverse', sub: 'practice.reverseSub' },
  { mode: 'typing', icon: '⌨️', color: 'blue', title: 'practice.typing', sub: 'practice.typingSub' },
  { mode: 'verbs', icon: '🏃', color: 'teal', title: 'practice.verbs', sub: 'practice.verbsSub' },
]

export function Practice({ nav }: { data: AppData; nav: Nav }) {
  const t = useT()
  return (
    <main className="stagger with-tabs">
      <header>
        <h1>{t('practice.title')}</h1>
        <p className="muted">{t('practice.sub')}</p>
      </header>
      <section className="grid2">
        {ITEMS.map((it) => (
          <button key={it.mode} className={`tile ${it.color}`} onClick={() => nav.quiz(it.mode)}>
            <span className="tile-icon">{it.icon}</span>
            <b>{t(it.title)}</b>
            <small>{t(it.sub, { n: PRACTICE_SIZE })}</small>
          </button>
        ))}
      </section>
    </main>
  )
}
