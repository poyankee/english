import type { AppData } from '../App'
import { pluralOf, verbForms } from '../forms'
import { useT } from '../i18n'
import { formsRound, type FormQ } from '../rounds'
import { speak } from '../speech'
import { RoundGame } from './RoundGame'
import { CardPicture } from '../components/CardPicture'

/** Kelime çekimleri: düzensiz fiillerin geçmiş/üçüncü hali ve düzensiz çoğullar */
export function Forms({ data, onExit }: { data: AppData; onExit: () => void }) {
  const t = useT()
  return (
    <RoundGame<FormQ>
      id="forms"
      emoji="🔤"
      hint={t('forms.hint')}
      build={() => formsRound(data.cards, data.settings)}
      answerOf={(q) => q.answer}
      choicesOf={(q) => q.choices}
      onPicked={(q) => data.settings.autoSpeak && speak(q.answer.replace('/', ', '))}
      onExit={onExit}
      body={(q, picked) => {
        const v = verbForms(q.card.word)
        return (
          <section className={`card lvl-${q.card.level}`}>
            <CardPicture card={q.card} />
            <p className="prompt">{t(`forms.${q.kind}`)}</p>
            <h2 className="word">{q.card.word}</h2>
            <p className="def">{q.card.tr}</p>
            {picked && (
              <p className="forms-line">
                {v ? `${q.card.word} → ${v.past} → ${v.participle}` : `${q.card.word} → ${pluralOf(q.card.word)}`}
              </p>
            )}
          </section>
        )
      }}
    />
  )
}
