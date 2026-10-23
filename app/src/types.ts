export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1']

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
}

export type Answer = 'correct' | 'wrong' | 'unsure'

export interface Settings {
  levels: Level[]
  phrases: boolean
  dailyNew: number
}

export const DEFAULT_SETTINGS: Settings = {
  levels: ['A1', 'A2'],
  phrases: true,
  dailyNew: 15,
}

export interface DayStats {
  date: string
  newCards: number
  reviews: number
  correct: number
}
