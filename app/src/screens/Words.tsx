import type { AppData } from '../App'
import { useT } from '../i18n'

export function Words({ data }: { data: AppData }) {
  const t = useT()
  return (
    <main className="stagger with-tabs">
      <h1>{t('tab.words')}</h1>
      <p className="muted">{t("soon")} · {data.cards.length}</p>
    </main>
  )
}
