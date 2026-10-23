import { useT } from '../i18n'
import { canSpeak, speak } from '../speech'
import type { Card, QuestionType } from '../types'

const POS_EMOJI: Record<string, string> = { verb: '🏃', adjective: '🎨', adverb: '⚡', phrase: '💬' }
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
  return (
    <section className={`card lvl-${card.level}`}>
      <div className="emoji-bubble">{card.emoji || POS_EMOJI[card.pos] || '🔤'}</div>
      <p className="prompt">{type === 'en-tr' ? t('quiz.whichTr') : type === 'tr-en' ? t('quiz.whichEn') : t('quiz.typeIt')}</p>
      <div className="row center-x">
        <h2 className="word">{showWord ? card.word : card.tr}</h2>
        {canSpeak && showWord && (
          <button className="speak" aria-label={t('quiz.listen')} onClick={() => speak(card.word)}>
            🔊
          </button>
        )}
      </div>
      <div className="meta">
        <span className="tag level">{card.level}</span>
        <span className="tag">{t(`pos.${card.pos}` as Parameters<typeof t>[0])}</span>
        {badges?.map((b) => (
          <span key={b.text} className={`tag ${b.cls}`}>
            {b.text}
          </span>
        ))}
      </div>
      {type === 'en-tr' && <p className="def">{card.def}</p>}
      {type !== 'en-tr' && revealed && <p className="def">{`${card.tr} · ${card.def}`}</p>}
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
