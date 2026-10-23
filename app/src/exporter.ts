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

export function download(name: string, text: string, type: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** Tam yedeği (ilerleme, günler, ayarlar, favoriler, kendi kelimeler) indirir ve zamanını kaydeder */
export async function downloadBackup() {
  download(`kelime-yedek-${new Date().toISOString().slice(0, 10)}.json`, await exportBackup(), 'application/json')
  await markBackup()
}
