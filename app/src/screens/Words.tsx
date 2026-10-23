import { useMemo, useState } from 'react'
import type { AppData, Nav } from '../App'
import { AddWordSheet } from '../components/AddWordSheet'
import { WordSheet } from '../components/WordSheet'
import { useT } from '../i18n'
import { filterWords, wordStatus, type WordFilter } from '../session'
import { LEVELS, TOPICS, type Card } from '../types'

const PAGE = 60

export function Words({ data, nav, refresh }: { data: AppData; nav: Nav; refresh: () => Promise<void> }) {
  const t = useT()
  const [f, setF] = useState<WordFilter>({ query: '', level: 'all', status: 'all', pos: 'all', topic: 'all' })
  const [limit, setLimit] = useState(PAGE)
  const [open, setOpen] = useState<Card | null>(null)
  const [adding, setAdding] = useState(false)
  const results = useMemo(() => filterWords(data.cards, data.progress, data.favorites, f), [data, f])
  const set = (patch: Partial<WordFilter>) => {
    setF({ ...f, ...patch })
    setLimit(PAGE)
  }

  const statuses: [WordFilter['status'], string][] = [
    ['all', t('words.all')],
    ['new', t('words.new')],
    ['learning', t('words.learning')],
    ['known', t('words.known')],
    ['favorites', t('words.favorites')],
    ['custom', t('words.custom')],
  ]
  const poses: WordFilter['pos'][] = ['all', 'noun', 'verb', 'adjective', 'adverb', 'phrase']

  return (
    <main className="with-tabs words">
      <header className="row between">
        <h1>{t('words.title')}</h1>
        <button className="primary small-btn" onClick={() => setAdding(true)}>
          ＋ {t('words.add')}
        </button>
      </header>

      <input className="search" type="search" value={f.query} placeholder={t('words.search')} onChange={(e) => set({ query: e.target.value })} />

      <div className="chips-row">
        <button className={`chip ${f.level === 'all' ? 'on' : ''}`} onClick={() => set({ level: 'all' })}>
          {t('words.all')}
        </button>
        {LEVELS.map((l) => (
          <button key={l} className={`chip lvl-${l} ${f.level === l ? 'on' : ''}`} onClick={() => set({ level: l })}>
            {l}
          </button>
        ))}
      </div>
      <div className="chips-row">
        {statuses.map(([s, label]) => (
          <button key={s} className={`chip ${f.status === s ? 'on' : ''}`} onClick={() => set({ status: s })}>
            {label}
          </button>
        ))}
      </div>
      <div className="chips-row">
        {poses.map((p) => (
          <button key={p} className={`chip ${f.pos === p ? 'on' : ''}`} onClick={() => set({ pos: p })}>
            {p === 'all' ? t('words.all') : t(`pos.${p}`)}
          </button>
        ))}
      </div>

      <div className="chips-row">
        {(['all', ...TOPICS] as const).map((tp) => (
          <button key={tp} className={`chip ${f.topic === tp ? 'on' : ''}`} onClick={() => set({ topic: tp })}>
            {t(`topic.${tp}`)}
          </button>
        ))}
      </div>

      <div className="row between">
        <span className="muted small">{t('words.results', { n: results.length })}</span>
        {results.length > 0 && (f.status === 'favorites' ? (
          <button className="secondary small-btn" onClick={() => nav.quiz('favorites')}>
            ⭐ {t('words.studyFavs')}
          </button>
        ) : (
          <button className="secondary small-btn" onClick={() => nav.quiz('list', results.map((c) => c.id))}>
            🎯 {t('words.studyList')}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="muted center">{t('words.empty')}</p>
      ) : (
        <ul className="word-list">
          {results.slice(0, limit).map((c) => {
            const st = wordStatus(data.progress.get(c.id))
            return (
              <li key={c.id} className={`lvl-${c.level}`} onClick={() => setOpen(c)}>
                <span className="emoji-sm">{c.emoji}</span>
                <div className="grow word-text">
                  <b>{c.word}</b>
                  <span className="muted">{c.tr}</span>
                </div>
                {data.favorites.has(c.id) && <span>⭐</span>}
                <span className={`status-dot ${st}`} title={t(`words.${st}`)} />
                <span className="tag level">{c.level}</span>
              </li>
            )
          })}
        </ul>
      )}
      {results.length > limit && (
        <button className="secondary" onClick={() => setLimit(limit + PAGE)}>
          {t('words.more')}
        </button>
      )}

      {open && (
        <WordSheet key={open.id} card={open} data={data} onClose={() => setOpen(null)} onChange={refresh} />
      )}
      {adding && <AddWordSheet level={data.settings.currentLevel} onClose={() => setAdding(false)} onSaved={refresh} />}
    </main>
  )
}
