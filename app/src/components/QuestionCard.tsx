import { useT } from '../i18n'
import { canSpeak, speak } from '../speech'
import type { Card, QuestionType } from '../types'
import { CardPicture } from './CardPicture'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

/**
 * Sorunun üst kısmı. İngilizce → Türkçe sorularda kelime ve açıklama, Türkçe → İngilizce ve yazma
 * sorularında Türkçe karşılık gösterilir; İngilizce kelime cevaptan sonra açılır.
 */
export function QuestionCard({
  card,
  type,
  revealed,
  badges,
}: {
  card: Card
  type: QuestionType
  revealed: boolean
  badges?: { text: string; cls: string }[]
}) {
  const t = useT()
  const showWord = type === 'en-tr' || revealed
  if (type === 'listen' && !revealed) {
    // Dinleme sorusu: kelime, resim ve açıklama gizli; sadece ses
    return (
      <section className={`card lvl-${card.level}`}>
        <p className="prompt">{t('quiz.whatHeard')}</p>
        <button className="listen-big" aria-label={t('quiz.listen')} onClick={() => speak(card.word)}>
          🔊
        </button>
        <button className="link-btn" onClick={() => speak(card.word, 0.6)}>
          🐢 {t('quiz.slow')}
        </button>
        <div className="meta">
          {badges?.map((b) => (
            <span key={b.text} className={`tag ${b.cls}`}>
              {b.text}
            </span>
          ))}
        </div>
      </section>
    )
  }
  return (
    <section className={`card lvl-${card.level}`}>
      <CardPicture card={card} />
      <p className="prompt">{type === 'en-tr' || type === 'listen' ? t('quiz.whichTr') : type === 'tr-en' ? t('quiz.whichEn') : t('quiz.typeIt')}</p>
      <div className="row center-x">
        <h2 className="word">{showWord ? card.word : card.tr}</h2>
        {canSpeak && showWord && (
          <button className="speak" aria-label={t('quiz.listen')} onClick={() => speak(card.word)}>
            🔊
          </button>
        )}
      </div>
      {showWord && card.ipa && <div className="ipa">{card.ipa}</div>}
      <div className="meta">
        <span className="tag level">{card.level}</span>
        <span className="tag">{t(`pos.${card.pos}` as Parameters<typeof t>[0])}</span>
        {badges?.map((b) => (
          <span key={b.text} className={`tag ${b.cls}`}>
            {b.text}
          </span>
        ))}
      </div>
      {(type === 'en-tr' || type === 'listen') && <p className="def">{card.def}</p>}
      {type !== 'en-tr' && type !== 'listen' && revealed && <p className="def">{`${card.tr} · ${card.def}`}</p>}
      {/* Yazma sorusunda açıklama ipucu olarak gösterilir; kelimenin kendisini içeriyorsa gizlenir */}
      {type === 'type' && !revealed && !card.def.toLowerCase().includes(card.word.toLowerCase()) && <p className="def muted">{card.def}</p>}
    </section>
  )
}

export function Choices({
  choices,
  correct,
  picked,
  onPick,
}: {
  choices: string[]
  correct: string
  picked: string | null
  onPick: (c: string) => void
}) {
  return (
    <section className="choices">
      {choices.map((ch, i) => {
        const state = !picked ? '' : ch === correct ? 'right' : ch === picked ? 'wrong' : 'dim'
        return (
          <button key={ch} className={`choice ${state}`} disabled={!!picked} onClick={() => onPick(ch)}>
            <span className="letter">{state === 'right' ? '✓' : state === 'wrong' ? '✗' : LETTERS[i]}</span>
            {ch}
          </button>
        )
      })}
    </section>
  )
}
