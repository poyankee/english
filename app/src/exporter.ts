import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { exportBackup, markBackup } from './db'
import { wordStatus } from './session'
import type { Card, Progress } from './types'

/** CSV hücresi: virgül, tırnak ya da satır sonu içeriyorsa tırnak içine alınır */
function cell(v: string | number): string {
  const s = String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Excel/Sheets için CSV. Başta BOM var ki Excel Türkçe karakterleri doğru açsın. */
export function toCsv(cards: Card[], progress: Map<string, Progress>): string {
  const head = ['word', 'turkish', 'type', 'level', 'definition', 'example', 'ipa', 'status', 'mistakes']
  const rows = cards.map((c) => {
    const p = progress.get(c.id)
    return [c.word, c.tr, c.pos, c.level, c.def, c.ex ?? '', c.ipa ?? '', wordStatus(p), p?.wrong ?? 0].map(cell).join(',')
  })
  return '﻿' + [head.join(','), ...rows].join('\n')
}

/**
 * Anki içe aktarma dosyası (sekmeyle ayrılmış): ön yüz İngilizce kelime + telaffuz, arka yüz Türkçe
 * karşılık + açıklama + örnek. Anki'de "Dosya > İçe aktar" ile alan ayırıcı "Sekme" seçilir.
 */
export function toAnki(cards: Card[]): string {
  const clean = (s: string) => s.replace(/[\t\n]/g, ' ')
  const lines = cards.map((c) => {
    const front = clean(c.ipa ? `${c.word}<br><small>${c.ipa}</small>` : c.word)
    const back = clean([`<b>${c.tr}</b>`, c.def, c.ex ? `<i>${c.ex}</i>` : ''].filter(Boolean).join('<br>'))
    return `${front}\t${back}\t${c.level}`
  })
  return ['#separator:tab', '#html:true', '#tags column:3', ...lines].join('\n')
}

/** Dosyayı indirir. Android uygulamasında indirme bağlantısı çalışmadığı için dosya kaydedilip paylaşım menüsü açılır. */
export async function download(name: string, text: string, type: string) {
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 })
    await Share.share({ title: name, files: [uri] }).catch(() => {})
    return
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** Tam yedeği (ilerleme, günler, ayarlar, favoriler, kendi kelimeler) indirir ve zamanını kaydeder */
export async function downloadBackup() {
  await download(`kelime-yedek-${new Date().toISOString().slice(0, 10)}.json`, await exportBackup(), 'application/json')
  await markBackup()
}

/**
 * Her gün tekrar eden takvim etkinliği (.ics). Telefonun takvimi bildirimi kendisi gösterir; böylece
 * sunucu olmadan günlük hatırlatma kurulabilir. Saat yerel saattir (saat dilimi belirtilmez).
 */
export function reminderIcs(time: string, title: string, text: string, url: string, now = new Date()): string {
  const [h, m] = time.split(':').map(Number)
  const start = new Date(now)
  start.setDate(start.getDate() + 1)
  start.setHours(h, m, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  const local = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kelime//Daily reminder//TR',
    'BEGIN:VEVENT',
    'UID:kelime-daily-reminder',
    `DTSTAMP:${stamp}`,
    `DTSTART:${local(start)}`,
    'DURATION:PT15M',
    'RRULE:FREQ=DAILY',
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(`${text} ${url}`)}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
