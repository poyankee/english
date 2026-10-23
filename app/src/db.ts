import Dexie, { type EntityTable } from 'dexie'
import { applyFreezes, computeStreak, EMPTY_FREEZES, type FreezeState } from './stats'
import { DEFAULT_SETTINGS, LEVELS, type Card, type DayStats, type Level, type Progress, type Settings } from './types'

const db = new Dexie('kelime') as Dexie & {
  progress: EntityTable<Progress, 'id'>
  days: EntityTable<DayStats, 'date'>
  meta: EntityTable<{ key: string; value: unknown }, 'key'>
  images: EntityTable<{ id: string; blob: Blob }, 'id'>
}
db.version(1).stores({
  progress: 'id, due, box',
  days: 'date',
  meta: 'key',
})
// Sürüm 2: kullanıcının kelimelere eklediği resimler
db.version(2).stores({
  images: 'id',
})

export { db }

export function today(now = Date.now()): string {
  const d = new Date(now)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function loadProgress(): Promise<Map<string, Progress>> {
  return new Map((await db.progress.toArray()).map((p) => [p.id, p]))
}

export async function loadSettings(): Promise<Settings> {
  const row = await db.meta.get('settings')
  const stored = (row?.value ?? {}) as Partial<Settings> & { levels?: Level[] }
  // Eski sürümde seviyeler çoklu seçiliyordu; en düşük seçili seviyeyi mevcut seviye yap
  if (!stored.currentLevel && stored.levels?.length) {
    stored.currentLevel = LEVELS.find((l) => stored.levels!.includes(l))
  }
  delete stored.levels
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function saveSettings(s: Settings) {
  await db.meta.put({ key: 'settings', value: s })
}

export async function loadDay(date = today()): Promise<DayStats> {
  return (await db.days.get(date)) ?? { date, newCards: 0, reviews: 0, correct: 0 }
}

export async function recordAnswer(p: Progress, wasNew: boolean, correct: boolean, xp = 0, seconds = 0) {
  await db.transaction('rw', db.progress, db.days, async () => {
    await db.progress.put(p)
    const day = await loadDay(today(p.lastSeen))
    day.reviews++
    if (wasNew) day.newCards++
    if (correct) day.correct++
    day.xp = (day.xp ?? 0) + xp
    day.seconds = (day.seconds ?? 0) + seconds
    await db.days.put(day)
  })
}

/** Sınav ve oyunlar: ilerlemeye dokunmadan bugünün XP ve süresine ekler */
export async function addActivity(xp: number, seconds: number) {
  await db.transaction('rw', db.days, async () => {
    const day = await loadDay()
    day.xp = (day.xp ?? 0) + xp
    day.seconds = (day.seconds ?? 0) + seconds
    await db.days.put(day)
  })
}

export async function loadDays(): Promise<DayStats[]> {
  return db.days.toArray()
}

/** Rozetler için tutulan sayaçlar */
export interface Counters {
  bestCombo: number
  perfectSessions: number
  gamesPlayed: number
}

export async function loadCounters(): Promise<Counters> {
  return { bestCombo: 0, perfectSessions: 0, gamesPlayed: 0, ...((await db.meta.get('counters'))?.value as Partial<Counters>) }
}

export async function bumpCounters(patch: { combo?: number; perfect?: boolean; game?: boolean }) {
  const c = await loadCounters()
  if (patch.combo) c.bestCombo = Math.max(c.bestCombo, patch.combo)
  if (patch.perfect) c.perfectSessions++
  if (patch.game) c.gamesPlayed++
  await db.meta.put({ key: 'counters', value: c })
}

export async function loadSeenBadges(): Promise<Set<string>> {
  return new Set(((await db.meta.get('seenBadges'))?.value as string[]) ?? [])
}

export async function saveSeenBadges(ids: Iterable<string>) {
  await db.meta.put({ key: 'seenBadges', value: [...ids] })
}

/** Son cevabı geri alır: kartın önceki durumunu ve günlük sayaçları eski haline getirir */
export async function undoAnswer(prev: Progress | undefined, current: Progress, wasNew: boolean, correct: boolean, xp = 0, seconds = 0) {
  await db.transaction('rw', db.progress, db.days, async () => {
    if (prev) await db.progress.put(prev)
    else await db.progress.delete(current.id)
    const day = await loadDay(today(current.lastSeen))
    day.reviews = Math.max(day.reviews - 1, 0)
    if (wasNew) day.newCards = Math.max(day.newCards - 1, 0)
    if (correct) day.correct = Math.max(day.correct - 1, 0)
    day.xp = Math.max((day.xp ?? 0) - xp, 0)
    day.seconds = Math.max((day.seconds ?? 0) - seconds, 0)
    await db.days.put(day)
  })
}

/** Seviye tespit sınavında bilinen kartları topluca kaydeder */
export async function savePlacement(known: Progress[]) {
  await db.progress.bulkPut(known)
}

/** Karıştırılan kelimeler: yanlış şıkkı seçtiğinde hangi kartla karıştırdığı kaydedilir */
export async function loadConfusions(): Promise<Record<string, Record<string, number>>> {
  return ((await db.meta.get('confusions'))?.value as Record<string, Record<string, number>>) ?? {}
}

export async function recordConfusion(cardId: string, otherId: string) {
  const all = await loadConfusions()
  all[cardId] = { ...all[cardId], [otherId]: (all[cardId]?.[otherId] ?? 0) + 1 }
  await db.meta.put({ key: 'confusions', value: all })
}

/** Doğru bilinince karışıklık sayacını azaltır; sıfırlanan çiftler listeden çıkar */
export async function easeConfusion(cardId: string) {
  const all = await loadConfusions()
  const entry = all[cardId]
  if (!entry) return
  for (const k of Object.keys(entry)) if (--entry[k] <= 0) delete entry[k]
  if (!Object.keys(entry).length) delete all[cardId]
  await db.meta.put({ key: 'confusions', value: all })
}

/** Oyunlardaki en iyi skor (eşleştirmede süre: düşük daha iyi) */
export async function loadBest(game: string): Promise<number | null> {
  return ((await db.meta.get(`best:${game}`))?.value as number | undefined) ?? null
}

export async function saveBest(game: string, value: number) {
  await db.meta.put({ key: `best:${game}`, value })
}

export async function loadFavorites(): Promise<Set<string>> {
  return new Set(((await db.meta.get('favorites'))?.value as string[]) ?? [])
}

export async function toggleFavorite(id: string): Promise<Set<string>> {
  const favs = await loadFavorites()
  if (favs.has(id)) favs.delete(id)
  else favs.add(id)
  await db.meta.put({ key: 'favorites', value: [...favs] })
  return favs
}

export async function loadCustomWords(): Promise<Card[]> {
  return ((await db.meta.get('customWords'))?.value as Card[]) ?? []
}

export async function saveCustomWords(words: Card[]) {
  await db.meta.put({ key: 'customWords', value: words })
}

/** Kartın ilerlemesini doğrudan yazar ya da siler ("zaten biliyorum", "baştan öğren") */
export async function setProgress(id: string, p: Progress | null) {
  if (p) await db.progress.put(p)
  else await db.progress.delete(id)
}

/**
 * Seri: bugünden geriye, en az bir kart çalışılmış ardışık gün sayısı. Haftalık seri koruyucular
 * kaçırılan günleri kapatır. Koruyucu durumu da döner.
 */
export async function streak(now = Date.now()): Promise<{ days: number; freezes: FreezeState }> {
  const active = new Set((await db.days.toArray()).filter((d) => d.reviews > 0).map((d) => d.date))
  const stored = ((await db.meta.get('freezes'))?.value as FreezeState) ?? EMPTY_FREEZES
  const freezes = applyFreezes(active, stored, now)
  if (JSON.stringify(freezes) !== JSON.stringify(stored)) await db.meta.put({ key: 'freezes', value: freezes })
  return { days: computeStreak(active, new Set(freezes.used), now), freezes }
}

/** Son yedek indirme zamanı (hatırlatma için) */
export async function loadLastBackup(): Promise<number | null> {
  return ((await db.meta.get('lastBackup'))?.value as number | undefined) ?? null
}

export async function markBackup() {
  await db.meta.put({ key: 'lastBackup', value: Date.now() })
}

export async function exportBackup(): Promise<string> {
  const images = await Promise.all((await db.images.toArray()).map(async (i) => ({ id: i.id, data: await blobToDataUrl(i.blob) })))
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: await db.progress.toArray(),
    days: await db.days.toArray(),
    meta: await db.meta.toArray(),
    images,
  })
}

function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(b)
  })
}

/* ---------- Kelime resimleri ---------- */

export async function loadImageIds(): Promise<string[]> {
  return (await db.images.toCollection().primaryKeys()) as string[]
}

export async function loadImage(id: string): Promise<Blob | undefined> {
  return (await db.images.get(id))?.blob
}

export async function saveImage(id: string, blob: Blob | null) {
  if (blob) await db.images.put({ id, blob })
  else await db.images.delete(id)
}

export async function importBackup(json: string) {
  const data = JSON.parse(json)
  if (data.version !== 1 || !Array.isArray(data.progress)) throw new Error('Geçersiz yedek dosyası')
  const images: { id: string; blob: Blob }[] = await Promise.all(
    ((data.images ?? []) as { id: string; data: string }[]).map(async (i) => ({ id: i.id, blob: await (await fetch(i.data)).blob() })),
  )
  await db.transaction('rw', [db.progress, db.days, db.meta, db.images], async () => {
    await Promise.all([db.progress.clear(), db.days.clear(), db.meta.clear(), db.images.clear()])
    await db.progress.bulkPut(data.progress)
    await db.days.bulkPut(data.days ?? [])
    await db.meta.bulkPut(data.meta ?? [])
    await db.images.bulkPut(images)
  })
}

/** Günlük meydan okuma sonuçları: tarih -> ilk denemenin skoru */
export interface DailyResult {
  score: number
  correct: number
  seconds: number
}

export async function loadDaily(): Promise<Record<string, DailyResult>> {
  return ((await db.meta.get('daily'))?.value as Record<string, DailyResult>) ?? {}
}

export async function saveDaily(date: string, r: DailyResult) {
  const all = await loadDaily()
  all[date] = r
  await db.meta.put({ key: 'daily', value: all })
}

/** Okunan hikâyeler: id -> anlama sorularındaki doğru sayısı */
export async function loadStoriesRead(): Promise<Record<string, number>> {
  return ((await db.meta.get('storiesRead'))?.value as Record<string, number>) ?? {}
}

export async function markStoryRead(id: string, correct: number) {
  const all = await loadStoriesRead()
  all[id] = Math.max(all[id] ?? 0, correct)
  await db.meta.put({ key: 'storiesRead', value: all })
}
