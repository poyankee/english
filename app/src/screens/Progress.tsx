import { useState } from 'react'
import type { AppData } from '../App'
import { badgeList } from '../badgeList'
import { WordSheet } from '../components/WordSheet'
import { useT, type T } from '../i18n'
import { levelStats } from '../session'
import { change, hardestWords, heatLevel, heatmap, knownCount, lastDays, totalXp, weekly, xpLevel } from '../stats'
import { LEVELS, type Card } from '../types'

const STAGE_ICON = { A1: '🌱', A2: '🧭', B1: '🎒', B2: '🏔️', C1: '🦉' } as const

export function ProgressScreen({ data, refresh }: { data: AppData; refresh: () => Promise<void> }) {
  const t = useT()
  const { cards, progress, settings, days } = data
  const now = Date.now()
  const xp = totalXp(days)
  const lvl = xpLevel(xp)
  const week = weekly(days, now)
  const totalSeconds = days.reduce((a, d) => a + (d.seconds ?? 0), 0)
  const hardest = hardestWords(cards, progress)
  const allBadges = badgeList(data)
  const [open, setOpen] = useState<Card | null>(null)
  const [badgeTip, setBadgeTip] = useState<string | null>(null)
  const current = LEVELS.indexOf(settings.currentLevel)

  return (
    <main className="stagger with-tabs">
      <h1>{t('progress.title')}</h1>

      <section className="xp-card">
        <div className="xp-badge">{lvl.level}</div>
        <div className="grow">
          <div className="row between">
            <b>{t('stats.xpLevel', { n: lvl.level })}</b>
            <span>{t('stats.xpTotal', { n: xp })}</span>
          </div>
          <div className="bar light">
            <span className="learned" style={{ width: `${(100 * lvl.into) / lvl.need}%` }} />
          </div>
          <small>{t('stats.xpNext', { n: lvl.need - lvl.into })}</small>
        </div>
      </section>

      <section className="panel">
        <div className="row between">
          <h3>{t('stats.week')}</h3>
          <span className="muted small">{t('stats.weekVs')}</span>
        </div>
        <div className="week-grid">
          <WeekStat value={week.current.reviews} label={t('stats.cards')} delta={change(week.current.reviews, week.previous.reviews)} />
          <WeekStat
            value={week.current.reviews ? `%${Math.round((100 * week.current.correct) / week.current.reviews)}` : '–'}
            label={t('stats.accuracy')}
            delta={null}
          />
          <WeekStat value={week.current.xp} label="XP" delta={change(week.current.xp, week.previous.xp)} />
          <WeekStat
            value={t('stats.minutes', { n: Math.round(week.current.seconds / 60) })}
            label={t('stats.time')}
            delta={change(week.current.seconds, week.previous.seconds)}
          />
        </div>
      </section>

      <section className="panel">
        <h3>{t('stats.calendar')}</h3>
        <Heatmap days={days} now={now} t={t} />
      </section>

      <section className="panel">
        <h3>{t('stats.last14')}</h3>
        <Bars days={lastDays(days, now, 14)} t={t} />
      </section>

      <section className="totals">
        <Total icon="📚" value={knownCount(progress)} label={t('stats.knownWords')} />
        <Total icon="⏱" value={t('stats.minutes', { n: Math.round(totalSeconds / 60) })} label={t('stats.totalTime')} />
        <Total icon="🔥" value={data.streak} label={t('stats.streak')} />
        <Total icon="🧊" value={data.freezes.available} label={t('stats.freezes')} hint={t('stats.freezeInfo')} />
      </section>

      <h3 className="section-title">{t('progress.path')}</h3>
      <section className="path">
        {LEVELS.map((level, i) => {
          const st = levelStats(cards, progress, level)
          const state = i < current ? 'passed' : i === current ? 'current' : 'locked'
          return (
            <div key={level} className={`stage lvl-${level} ${state}`}>
              <div className="stage-dot">{state === 'locked' ? '🔒' : STAGE_ICON[level]}</div>
              <div className="stage-body">
                <div className="row between">
                  <b>
                    {level} · {t(`title.${level}`)}
                  </b>
                  <span className={`stage-tag ${state}`}>
                    {state === 'passed' ? t('progress.passed') : state === 'current' ? t('progress.current') : t('progress.locked')}
                  </span>
                </div>
                <div className="bar">
                  <span className="started" style={{ width: `${(100 * st.started) / st.total}%` }} />
                  <span className="learned" style={{ width: `${(100 * st.known) / st.total}%` }} />
                </div>
                <small className="muted">{t('progress.known', { known: st.known, total: st.total })}</small>
              </div>
            </div>
          )
        })}
      </section>

      <div className="row between">
        <h3 className="section-title">{t('stats.badges')}</h3>
        <span className="muted small">
          {t('stats.badgesCount', { n: allBadges.filter((b) => b.earned).length, total: allBadges.length })}
        </span>
      </div>
      <section className="badge-grid">
        {allBadges.map((b) => (
          <button key={b.id} className={`badge ${b.earned ? 'earned' : ''}`} onClick={() => setBadgeTip(badgeTip === b.id ? null : b.id)}>
            <span className="badge-icon">{b.earned ? b.icon : '🔒'}</span>
            <span className="badge-name">{t(`badge.${b.id}` as Parameters<T>[0])}</span>
            {badgeTip === b.id && <span className="badge-desc">{t(`badge.${b.id}.desc` as Parameters<T>[0])}</span>}
          </button>
        ))}
      </section>

      <h3 className="section-title">{t('stats.hardest')}</h3>
      {hardest.length === 0 ? (
        <p className="muted">{t('stats.hardestEmpty')}</p>
      ) : (
        <ul className="word-list">
          {hardest.map(({ card, p }) => (
            <li key={card.id} onClick={() => setOpen(card)}>
              <span className="emoji-sm">{card.emoji}</span>
              <div className="grow word-text">
                <b>{card.word}</b>
                <span className="muted">{card.tr}</span>
              </div>
              <span className="tag no-bg">{t('stats.wrongTimes', { n: p.wrong })}</span>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <WordSheet key={open.id} card={open} data={data} onClose={() => setOpen(null)} onChange={refresh} />
      )}
    </main>
  )
}

function WeekStat({ value, label, delta }: { value: string | number; label: string; delta: number | null }) {
  return (
    <div className="week-stat">
      <b>{value}</b>
      <span>{label}</span>
      {delta !== null && <em className={delta >= 0 ? 'up' : 'down'}>{delta >= 0 ? `▲ %${delta}` : `▼ %${-delta}`}</em>}
    </div>
  )
}

function Total({ icon, value, label, hint }: { icon: string; value: string | number; label: string; hint?: string }) {
  return (
    <div className="total" title={hint}>
      <span>{icon}</span>
      <b>{value}</b>
      <small>{label}</small>
    </div>
  )
}

function formatDate(key: string) {
  const [, m, d] = key.split('-')
  return `${Number(d)}.${Number(m)}`
}

/** Son 18 haftanın çalışma yoğunluğu; tek renk, açıktan koyuya 5 basamak */
function Heatmap({ days, now, t }: { days: AppData['days']; now: number; t: T }) {
  const [tip, setTip] = useState<string | null>(null)
  const cols = heatmap(days, now)
  return (
    <div className="heatmap-wrap">
      <div className="heatmap">
        {cols.map((col, i) => (
          <div key={i} className="heat-col">
            {col.map((cell) => (
              <button
                key={cell.date}
                className={`heat-cell h${heatLevel(cell.reviews)} ${cell.future ? 'future' : ''}`}
                aria-label={t('stats.dayTip', { date: formatDate(cell.date), n: cell.reviews })}
                onClick={() => setTip(t('stats.dayTip', { date: formatDate(cell.date), n: cell.reviews }))}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="row between small muted">
        <span>{tip ?? ''}</span>
        <span className="heat-legend">
          {t('stats.less')} {[0, 1, 2, 3, 4].map((l) => <i key={l} className={`heat-cell h${l}`} />)} {t('stats.more')}
        </span>
      </div>
    </div>
  )
}

/** Son 14 günün çalışılan kart sayısı; tek seri, dokununca değer gösterilir */
function Bars({ days, t }: { days: AppData['days']; t: T }) {
  const [sel, setSel] = useState<number | null>(null)
  const max = Math.max(10, ...days.map((d) => d.reviews))
  return (
    <div>
      <div className="bars">
        {days.map((d, i) => (
          <button key={d.date} className={`bar-col ${sel === i ? 'sel' : ''}`} onClick={() => setSel(sel === i ? null : i)} aria-label={t('stats.dayTip', { date: formatDate(d.date), n: d.reviews })}>
            <span className="bar-fill" style={{ height: `${(100 * d.reviews) / max}%` }} />
            <span className="bar-label">{formatDate(d.date).split('.')[0]}</span>
          </button>
        ))}
      </div>
      <p className="small muted bars-tip">{sel !== null ? t('stats.dayTip', { date: formatDate(days[sel].date), n: days[sel].reviews }) : ' '}</p>
    </div>
  )
}
