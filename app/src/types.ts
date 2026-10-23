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
  /** Amerikan telaffuzu (IPA) */
  ipa?: string
  /** Aynı kökten kelimeler (listede olanlar) */
  family?: string[]
  syn?: string[]
  ant?: string[]
  topic?: Topic
}

export const TOPICS = ['food', 'animals', 'body', 'people', 'places', 'objects', 'nature', 'colors', 'feelings', 'mind', 'communication', 'time', 'money', 'society', 'movement', 'numbers'] as const
export type Topic = (typeof TOPICS)[number]

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

/** Soru tipi: İngilizce → Türkçe şık, Türkçe → İngilizce şık, kelimeyi yazma ya da sadece dinleyip anlamını seçme */
export type QuestionType = 'en-tr' | 'tr-en' | 'type' | 'listen'

export type Lang = 'tr' | 'en'
export type Accent = 'us' | 'gb'
export type ThemeMode = 'system' | 'light' | 'dark'
export type ColorTheme = 'violet' | 'ocean' | 'forest' | 'sunset' | 'rose'
export type TextSize = 'small' | 'normal' | 'large'

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
  theme: ThemeMode
  color: ColorTheme
  textSize: TextSize
  /** Hedef: bu tarihe kadar bu seviyeyi bitirmek */
  goal: { level: Level; date: string } | null
  /** Günlük yeni kelime sayısı hedefe göre otomatik ayarlansın */
  autoDaily: boolean
  /** Günlük hatırlatma saati (takvim dosyası için), ör. "20:00" */
  reminderTime: string
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
  theme: 'system',
  color: 'violet',
  textSize: 'normal',
  goal: null,
  autoDaily: false,
  reminderTime: '20:00',
}

export interface DayStats {
  date: string
  newCards: number
  reviews: number
  correct: number
  /** O gün kazanılan XP */
  xp?: number
  /** O gün çalışılan süre (saniye) */
  seconds?: number
}
