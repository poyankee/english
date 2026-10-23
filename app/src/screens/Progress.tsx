import type { AppData } from '../App'
import { useT } from '../i18n'
import { levelStats } from '../session'
import { LEVELS } from '../types'

const STAGE_ICON = { A1: '🌱', A2: '🧭', B1: '🎒', B2: '🏔️', C1: '🦉' } as const

export function ProgressScreen({ data }: { data: AppData }) {
  const t = useT()
  const { cards, progress, settings } = data
  const current = LEVELS.indexOf(settings.currentLevel)

  return (
    <main className="stagger with-tabs">
      <h1>{t('progress.title')}</h1>
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
    </main>
  )
}
