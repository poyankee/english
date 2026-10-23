import { Capacitor } from '@capacitor/core'
import { QueueStrategy, TextToSpeech } from '@capacitor-community/text-to-speech'
import type { Accent } from './types'

/** Android uygulamasında web görünümü sesli okumayı desteklemediği için telefonun kendi sesi kullanılır */
const native = Capacitor.isNativePlatform()
const web = typeof window !== 'undefined' && 'speechSynthesis' in window
export const canSpeak = native || web

const LANG: Record<Accent, string> = { us: 'en-US', gb: 'en-GB' }
let accent: Accent = 'us'
let voice: SpeechSynthesisVoice | undefined

function pickVoice() {
  const voices = speechSynthesis.getVoices()
  const lang = LANG[accent]
  voice =
    voices.find((v) => v.lang.replace('_', '-') === lang && v.localService) ??
    voices.find((v) => v.lang.replace('_', '-') === lang) ??
    voices.find((v) => v.lang.startsWith('en'))
}

if (web && !native) {
  pickVoice()
  speechSynthesis.addEventListener('voiceschanged', pickVoice)
}

export function setAccent(a: Accent) {
  if (a === accent) return
  accent = a
  if (web && !native) pickVoice()
}

/** Metni okur; okuma bitince (ya da durdurulunca) tamamlanır */
export function speak(text: string, rate = 0.9): Promise<void> {
  const clean = text.replace(/\b(sb|sth)\b/g, (m) => (m === 'sb' ? 'somebody' : 'something'))
  if (native) {
    return TextToSpeech.speak({ text: clean, lang: LANG[accent], rate, queueStrategy: QueueStrategy.Flush }).catch(() => {})
  }
  if (!web) return Promise.resolve()
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(clean)
  u.lang = LANG[accent]
  if (voice) u.voice = voice
  u.rate = rate
  return new Promise((resolve) => {
    u.onend = () => resolve()
    u.onerror = () => resolve()
    speechSynthesis.speak(u)
  })
}

export function stopSpeaking() {
  if (native) TextToSpeech.stop().catch(() => {})
  else if (web) speechSynthesis.cancel()
}
