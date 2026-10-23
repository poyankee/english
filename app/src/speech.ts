import type { Accent } from './types'

export const canSpeak = 'speechSynthesis' in window

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

if (canSpeak) {
  pickVoice()
  speechSynthesis.addEventListener('voiceschanged', pickVoice)
}

export function setAccent(a: Accent) {
  if (a === accent) return
  accent = a
  if (canSpeak) pickVoice()
}

export function speak(text: string) {
  if (!canSpeak) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text.replace(/\b(sb|sth)\b/g, (m) => (m === 'sb' ? 'somebody' : 'something')))
  u.lang = LANG[accent]
  if (voice) u.voice = voice
  u.rate = 0.9
  speechSynthesis.speak(u)
}
