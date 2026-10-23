/** Doğru/yanlış cevapta kısa ses efekti ve titreşim. Ses dosyası yok; tonlar Web Audio ile üretiliyor. */

let ctx: AudioContext | undefined
const enabled = { sounds: true, vibration: true }

export function setFeedback(sounds: boolean, vibration: boolean) {
  enabled.sounds = sounds
  enabled.vibration = vibration
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', gain = 0.12) {
  ctx ??= new AudioContext()
  const t = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + duration)
}

export function feedback(kind: 'correct' | 'wrong' | 'finish') {
  try {
    if (enabled.sounds) {
      if (kind === 'correct') {
        tone(660, 0, 0.12)
        tone(990, 0.09, 0.18)
      } else if (kind === 'wrong') {
        tone(220, 0, 0.25, 'triangle', 0.15)
      } else {
        ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25))
      }
    }
    if (enabled.vibration && 'vibrate' in navigator) {
      navigator.vibrate(kind === 'wrong' ? [60, 40, 60] : kind === 'finish' ? [30, 30, 30, 30, 80] : 25)
    }
  } catch {
    // Ses ya da titreşim desteklenmiyorsa sessizce geç
  }
}
