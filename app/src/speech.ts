let voice: SpeechSynthesisVoice | undefined

function pickVoice() {
  const voices = speechSynthesis.getVoices()
  voice = voices.find((v) => v.lang === 'en-US' && v.localService) ?? voices.find((v) => v.lang.startsWith('en'))
}

if ('speechSynthesis' in window) {
  pickVoice()
  speechSynthesis.addEventListener('voiceschanged', pickVoice)
}

export const canSpeak = 'speechSynthesis' in window

export function speak(text: string) {
  if (!canSpeak) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text.replace(/\b(sb|sth)\b/g, (m) => (m === 'sb' ? 'somebody' : 'something')))
  u.lang = 'en-US'
  if (voice) u.voice = voice
  u.rate = 0.9
  speechSynthesis.speak(u)
}
