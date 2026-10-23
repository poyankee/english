import type { ColorTheme, Settings, TextSize, ThemeMode } from './types'

/** Renk paletleri: [vurgu, vurgu-2, vurgu-3] açık ve koyu temada ayrı tonlar */
export const PALETTES: Record<ColorTheme, { light: [string, string, string]; dark: [string, string, string] }> = {
  violet: { light: ['#6c5ce7', '#a66cff', '#ff6b9d'], dark: ['#8b7cf6', '#b48cff', '#ff7eaa'] },
  ocean: { light: ['#2563eb', '#0ea5e9', '#14b8a6'], dark: ['#3b82f6', '#38bdf8', '#2dd4bf'] },
  forest: { light: ['#059669', '#22c55e', '#84cc16'], dark: ['#10b981', '#4ade80', '#a3e635'] },
  sunset: { light: ['#e8590c', '#f59e0b', '#ec4899'], dark: ['#f97316', '#fbbf24', '#f472b6'] },
  rose: { light: ['#db2777', '#f472b6', '#a855f7'], dark: ['#ec4899', '#f9a8d4', '#c084fc'] },
}
export const COLOR_THEMES = Object.keys(PALETTES) as ColorTheme[]

const SIZE: Record<TextSize, string> = { small: '15px', normal: '16px', large: '18px' }
const BG = { light: '#f4f2ff', dark: '#13111f' }
/** Uygulama açılırken temanın yanıp sönmemesi için son tema tarayıcıda da tutulur */
const CACHE_KEY = 'kelime-theme'

type ThemeSettings = Pick<Settings, 'theme' | 'color' | 'textSize'>

const darkQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
let current: ThemeSettings | null = null

function resolve(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? (darkQuery?.matches ? 'dark' : 'light') : mode
}

/** Temayı <html> üzerine uygular: data-theme, vurgu renkleri, yazı boyutu ve tarayıcı çubuğu rengi */
export function applyTheme(s: ThemeSettings) {
  current = s
  const root = document.documentElement
  const mode = resolve(s.theme)
  const [a, b, c] = PALETTES[s.color]?.[mode] ?? PALETTES.violet[mode]
  root.dataset.theme = mode
  root.style.setProperty('--accent', a)
  root.style.setProperty('--accent-2', b)
  root.style.setProperty('--accent-3', c)
  root.style.fontSize = SIZE[s.textSize] ?? SIZE.normal
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BG[mode])
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(s))
  } catch {
    // Gizli sekme vb.: sadece açılıştaki önbellek kaybolur
  }
}

/** Ayarlar yüklenmeden önce son kullanılan temayı uygular */
export function applyCachedTheme() {
  let s: ThemeSettings = { theme: 'system', color: 'violet', textSize: 'normal' }
  try {
    s = { ...s, ...JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') }
  } catch {
    // önbellek yoksa varsayılan
  }
  applyTheme(s)
}

// "Sistem" seçiliyken telefonun açık/koyu modu değişince tema da değişsin
darkQuery?.addEventListener('change', () => {
  if (current?.theme === 'system') applyTheme(current)
})
