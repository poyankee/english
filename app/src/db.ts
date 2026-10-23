import Dexie, { type EntityTable } from 'dexie'
import { DEFAULT_SETTINGS, type DayStats, type Progress, type Settings } from './types'

const db = new Dexie('kelime') as Dexie & {
  progress: EntityTable<Progress, 'id'>
  days: EntityTable<DayStats, 'date'>
  meta: EntityTable<{ key: string; value: unknown }, 'key'>
}
db.version(1).stores({
  progress: 'id, due, box',
  days: 'date',
  meta: 'key',
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
  return { ...DEFAULT_SETTINGS, ...(row?.value as Partial<Settings> | undefined) }
}

export async function saveSettings(s: Settings) {
  await db.meta.put({ key: 'settings', value: s })
}

export async function loadDay(date = today()): Promise<DayStats> {
  return (await db.days.get(date)) ?? { date, newCards: 0, reviews: 0, correct: 0 }
}

export async function recordAnswer(p: Progress, wasNew: boolean, correct: boolean) {
  await db.transaction('rw', db.progress, db.days, async () => {
    await db.progress.put(p)
    const day = await loadDay(today(p.lastSeen))
    day.reviews++
    if (wasNew) day.newCards++
    if (correct) day.correct++
    await db.days.put(day)
  })
}

/** Bugünden geriye doğru, en az bir kart çalışılmış ardışık gün sayısı */
export async function streak(now = Date.now()): Promise<number> {
  const days = new Set((await db.days.toArray()).filter((d) => d.reviews > 0).map((d) => d.date))
  let n = 0
  const d = new Date(now)
  if (!days.has(today(d.getTime()))) d.setDate(d.getDate() - 1) // bugün henüz çalışılmadıysa seri bozulmaz
  while (days.has(today(d.getTime()))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export async function exportBackup(): Promise<string> {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: await db.progress.toArray(),
    days: await db.days.toArray(),
    meta: await db.meta.toArray(),
  })
}

export async function importBackup(json: string) {
  const data = JSON.parse(json)
  if (data.version !== 1 || !Array.isArray(data.progress)) throw new Error('Geçersiz yedek dosyası')
  await db.transaction('rw', db.progress, db.days, db.meta, async () => {
    await Promise.all([db.progress.clear(), db.days.clear(), db.meta.clear()])
    await db.progress.bulkPut(data.progress)
    await db.days.bulkPut(data.days ?? [])
    await db.meta.bulkPut(data.meta ?? [])
  })
}
