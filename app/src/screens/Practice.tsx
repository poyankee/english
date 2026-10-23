import type { AppData, Game, Nav } from '../App'
import { useT, type T } from '../i18n'
import { EXAM_SIZE, PRACTICE_SIZE, type Mode } from '../session'

type Key = Parameters<T>[0]
interface Item {
  target: { mode: Mode } | { game: Game }
  icon: string
  color: string
  title: Key
  sub: Key
  n?: number
}

const ITEMS: Item[] = [
  { target: { mode: 'reverse' }, icon: '🔄', color: 'purple', title: 'practice.reverse', sub: 'practice.reverseSub' },
  { target: { mode: 'typing' }, icon: '⌨️', color: 'blue', title: 'practice.typing', sub: 'practice.typingSub' },
  { target: { game: 'match' }, icon: '🃏', color: 'pink', title: 'practice.match', sub: 'practice.matchSub' },
  { target: { game: 'truefalse' }, icon: '👆', color: 'green', title: 'practice.tf', sub: 'practice.tfSub' },
  { target: { game: 'phrase' }, icon: '🧩', color: 'orange', title: 'practice.phrase', sub: 'practice.phraseSub' },
  { target: { mode: 'verbs' }, icon: '🏃', color: 'teal', title: 'practice.verbs', sub: 'practice.verbsSub', n: PRACTICE_SIZE },
  { target: { mode: 'confused' }, icon: '🔀', color: 'purple', title: 'practice.confused', sub: 'practice.confusedSub' },
  { target: { mode: 'exam' }, icon: '📝', color: 'blue', title: 'practice.exam', sub: 'practice.examSub', n: EXAM_SIZE },
]

export function Practice({ data, nav }: { data: AppData; nav: Nav }) {
  const t = useT()
  const confused = Object.keys(data.confusions).length
  return (
    <main className="stagger with-tabs">
      <header>
        <h1>{t('practice.title')}</h1>
        <p className="muted">{t('practice.sub')}</p>
      </header>
      <section className="grid2">
        {ITEMS.map((it) => {
          const isConfused = 'mode' in it.target && it.target.mode === 'confused'
          return (
            <button
              key={it.title}
              className={`tile ${it.color}`}
              disabled={isConfused && !confused}
              onClick={() => ('mode' in it.target ? nav.quiz(it.target.mode) : nav.game(it.target.game))}
            >
              <span className="tile-icon">{it.icon}</span>
              <b>{t(it.title)}</b>
              <small>{t(it.sub, { n: it.n ?? 0 })}</small>
              {isConfused && confused > 0 && <span className="count tile-count">{confused}</span>}
            </button>
          )
        })}
      </section>
    </main>
  )
}
