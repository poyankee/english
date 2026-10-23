import type { AppData, Game, Nav } from '../App'
import { useT, type T } from '../i18n'
import { canRecognize } from '../recognition'
import { EXAM_SIZE, PRACTICE_SIZE, type Mode } from '../session'
import { canSpeak } from '../speech'

type Key = Parameters<T>[0]
interface Item {
  target: { mode: Mode } | { game: Game }
  icon: string
  color: string
  title: Key
  sub: Key
  n?: number
  /** Bu cihazda çalışmıyorsa kapalı */
  needs?: 'speech' | 'mic'
}

/** Pratik ekranı bölümleri: testler, oyunlar, okuma ve konuşma */
const SECTIONS: { title: Key; items: Item[] }[] = [
  {
    title: 'practice.secTests',
    items: [
      { target: { game: 'swipe' }, icon: '⚡', color: 'orange', title: 'practice.swipe', sub: 'practice.swipeSub' },
      { target: { mode: 'listening' }, icon: '🎧', color: 'teal', title: 'practice.listening', sub: 'practice.listeningSub', needs: 'speech' },
      { target: { mode: 'reverse' }, icon: '🔄', color: 'purple', title: 'practice.reverse', sub: 'practice.reverseSub' },
      { target: { mode: 'typing' }, icon: '⌨️', color: 'blue', title: 'practice.typing', sub: 'practice.typingSub' },
      { target: { mode: 'verbs' }, icon: '🏃', color: 'teal', title: 'practice.verbs', sub: 'practice.verbsSub', n: PRACTICE_SIZE },
      { target: { mode: 'confused' }, icon: '🔀', color: 'purple', title: 'practice.confused', sub: 'practice.confusedSub' },
      { target: { mode: 'exam' }, icon: '📝', color: 'blue', title: 'practice.exam', sub: 'practice.examSub', n: EXAM_SIZE },
    ],
  },
  {
    title: 'practice.secGames',
    items: [
      { target: { game: 'match' }, icon: '🃏', color: 'pink', title: 'practice.match', sub: 'practice.matchSub' },
      { target: { game: 'truefalse' }, icon: '👆', color: 'green', title: 'practice.tf', sub: 'practice.tfSub' },
      { target: { game: 'cloze' }, icon: '✏️', color: 'blue', title: 'practice.cloze', sub: 'practice.clozeSub' },
      { target: { game: 'forms' }, icon: '🔤', color: 'purple', title: 'practice.forms', sub: 'practice.formsSub' },
      { target: { game: 'phrase' }, icon: '🧩', color: 'orange', title: 'practice.phrase', sub: 'practice.phraseSub' },
    ],
  },
  {
    title: 'practice.secRead',
    items: [
      { target: { game: 'stories' }, icon: '📖', color: 'green', title: 'practice.stories', sub: 'practice.storiesSub' },
      { target: { game: 'speak' }, icon: '🎤', color: 'pink', title: 'practice.speak', sub: 'practice.speakSub', needs: 'mic' },
    ],
  },
]

export function Practice({ data, nav }: { data: AppData; nav: Nav }) {
  const t = useT()
  const confused = Object.keys(data.confusions).length
  const go = (it: Item) => ('mode' in it.target ? nav.quiz(it.target.mode) : nav.game(it.target.game))
  return (
    <main className="stagger with-tabs">
      <header>
        <h1>{t('practice.title')}</h1>
        <p className="muted">{t('practice.sub')}</p>
      </header>

      <button className="action main daily-tile" onClick={() => nav.game('daily')}>
        <span className="action-icon">⏱️</span>
        <span className="action-text">
          <b>{t('practice.daily')}</b>
          <small>{data.dailyToday !== null ? t('practice.dailyDone', { n: data.dailyToday }) : t('practice.dailySub')}</small>
        </span>
        <span className="chev">›</span>
      </button>

      {SECTIONS.map((sec) => (
        <section key={sec.title} className="practice-section">
          <h3>{t(sec.title)}</h3>
          <div className="grid2">
            {sec.items.map((it) => {
              const isConfused = 'mode' in it.target && it.target.mode === 'confused'
              const unsupported = (it.needs === 'speech' && !canSpeak) || (it.needs === 'mic' && !canRecognize)
              return (
                <button key={it.title} className={`tile ${it.color}`} disabled={(isConfused && !confused) || unsupported} onClick={() => go(it)}>
                  <span className="tile-icon">{it.icon}</span>
                  <b>{t(it.title)}</b>
                  <small>{unsupported ? t('practice.unsupported') : t(it.sub, { n: it.n ?? 0 })}</small>
                  {isConfused && confused > 0 && <span className="count tile-count">{confused}</span>}
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </main>
  )
}
