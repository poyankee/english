import { baseWord } from './forms'
import { checkTyped } from './session'

/** Tarayıcının konuşma tanıma özelliği (Chrome/Android, Safari/iOS 14.5+). Türleri TS'de olmadığı için kısaca tanımlı. */

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}
interface Recognition {
  lang: string
  maxAlternatives: number
  interimResults: boolean
  onresult: ((e: RecognitionResultEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  abort: () => void
}
type RecognitionCtor = new () => Recognition

const w = (typeof window === 'undefined' ? {} : window) as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition

export const canRecognize = !!Ctor

/** Bir kez dinler; duyulan olası metinleri döner (boşsa hiçbir şey anlaşılmadı) */
export function listenOnce(lang: string): { result: Promise<string[]>; stop: () => void } {
  if (!Ctor) return { result: Promise.reject(new Error('unsupported')), stop: () => {} }
  const r = new Ctor()
  r.lang = lang
  r.maxAlternatives = 5
  r.interimResults = false
  const result = new Promise<string[]>((resolve, reject) => {
    let heard: string[] = []
    r.onresult = (e) => {
      heard = Array.from(e.results[0] ?? []).map((a) => a.transcript)
    }
    r.onerror = (e) => (e.error === 'no-speech' || e.error === 'aborted' ? resolve([]) : reject(new Error(e.error)))
    r.onend = () => resolve(heard)
  })
  r.start()
  return { result, stop: () => r.abort() }
}

/** Duyulan metinlerden biri kelimeyle eşleşiyor mu: tam, neredeyse (tek harf) ya da hayır */
export function judge(heard: string[], word: string): 'correct' | 'almost' | 'wrong' {
  const target = baseWord(word)
  let best: 'correct' | 'almost' | 'wrong' = 'wrong'
  for (const h of heard) {
    const clean = h.toLowerCase().replace(/[.,!?]/g, '').trim()
    // Tanıma bazen "the apple" gibi fazladan kelime ekler; kelimelerden biri tutuyorsa da sayılır
    const options = [clean, ...clean.split(' ')]
    for (const o of options) {
      const r = checkTyped(o, target)
      if (r === 'correct') return 'correct'
      if (r === 'almost') best = 'almost'
    }
  }
  return best
}
