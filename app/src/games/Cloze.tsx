import type { AppData } from '../App'
import { useT } from '../i18n'
import { clozeRound, type ClozeQ } from '../rounds'
import { baseWord } from '../forms'
import { speak } from '../speech'
import { RoundGame } from './RoundGame'
import { CardPicture } from '../components/CardPicture'

/** Boşluk doldurma: örnek cümlede kelime boş bırakılır, doğru kelime seçilir */
export function Cloze({ data, onExit }: { data: AppData; onExit: () => void }) {
  const t = useT()
  return (
    <RoundGame<ClozeQ>
      id="cloze"
      emoji="✏️"
      hint={t('cloze.hint')}
      build={() => clozeRound(data.cards, data.progress, data.settings)}
      answerOf={(q) => baseWord(q.card.word)}
      choicesOf={(q) => q.choices}
      onPicked={(q) => data.settings.autoSpeak && speak(q.card.ex!)}
      onExit={onExit}
      body={(q, picked) => (
        <section className={`card lvl-${q.card.level}`}>
          {/* Resim cevabı ele vermesin diye cevaptan sonra gösterilir */}
          {picked ? <CardPicture card={q.card} fallback="✏️" /> : <div className="emoji-bubble">✏️</div>}
          <h2 className="cloze-line">
            {q.before}
            <span className={`blank ${picked ? (picked === baseWord(q.card.word) ? 'ok' : 'no') : ''}`}>{picked ? q.form : '_____'}</span>
            {q.after}
          </h2>
          {picked && <p className="def">{t('phrase.meaning', { tr: `${q.card.word} = ${q.card.tr}` })}</p>}
        </section>
      )}
    />
  )
}
