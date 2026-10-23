export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1']
/** Bir kez bilinince "tamamlandı" sayılan kolay seviyeler */
export const EASY_LEVELS: Level[] = ['A1', 'A2']

export interface Card {
  id: string
  /** İngilizce kelime ya da kalıp */
  word: string
  /** noun, verb… ya da kalıplar için "phrase" */
  pos: string
  level: Level
  /** Türkçe karşılık (doğru şık) */
  tr: string
  /** Kısa İngilizce açıklama */
  def: string
  ex?: string
  emoji?: string
  sense?: string
  /** Kullanıcının kendi eklediği kelime */
  custom?: boolean
}

export interface Progress {
  id: string
  /** Leitner kutusu: 0 = yeniden öğreniliyor … 7 = öğrenildi */
  box: number
  /** Bir sonraki gösterim zamanı (ms) */
  due: number
  seen: number
  wrong: number
  lastSeen: number
  /** Tamamlandı: bir daha sorulmaz (A1/A2'de bilinen ya da geçilen seviyede kontrolden geçen kelimeler) */
  done?: boolean
}

export type Answer = 'correct' | 'wrong' | 'unsure'

/** Soru tipi: İngilizce → Türkçe şık, Türkçe → İngilizce şık, ya da kelimeyi yazma */
export type QuestionType = 'en-tr' | 'tr-en' | 'type'

export type Lang = 'tr' | 'en'
export type Accent = 'us' | 'gb'

export interface Settings {
  name: string
  lang: Lang
  /** Yeni kelimelerin geldiği seviye; altındakiler "geçilmiş" sayılır */
  currentLevel: Level
  phrases: boolean
  dailyNew: number
  accent: Accent
  autoSpeak: boolean
  sounds: boolean
  vibration: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  lang: 'tr',
  currentLevel: 'A1',
  phrases: true,
  dailyNew: 15,
  accent: 'us',
  autoSpeak: true,
  sounds: true,
  vibration: true,
}

export interface DayStats {
  date: string
  newCards: number
  reviews: number
  correct: number
}
