import { describe, expect, it } from 'vitest'
import { toAnki, toCsv } from './exporter'
import type { Card, Progress } from './types'

const card: Card = { id: 'a', word: 'run', pos: 'verb', level: 'A1', tr: 'koşmak, "çalıştırmak"', def: 'to move fast, on foot', ex: 'I run.', ipa: 'ˈrʌn' }

describe('exporter', () => {
  it('CSV: BOM, başlık ve kaçışlı hücreler', () => {
    const p: Progress = { id: 'a', box: 0, due: 0, seen: 2, wrong: 2, lastSeen: 0 }
    const csv = toCsv([card], new Map([['a', p]]))
    expect(csv.startsWith('﻿word,turkish,')).toBe(true)
    const row = csv.split('\n')[1]
    expect(row).toContain('"koşmak, ""çalıştırmak"""')
    expect(row).toContain('"to move fast, on foot"')
    expect(row.endsWith(',2')).toBe(true)
  })

  it('Anki: başlık satırları ve sekmeyle ayrılmış alanlar', () => {
    const lines = toAnki([{ ...card, ex: 'a\tb' }]).split('\n')
    expect(lines.slice(0, 3)).toEqual(['#separator:tab', '#html:true', '#tags column:3'])
    const fields = lines[3].split('\t')
    expect(fields).toHaveLength(3)
    expect(fields[0]).toBe('run<br><small>ˈrʌn</small>')
    expect(fields[1]).toContain('<b>koşmak')
    expect(fields[2]).toBe('A1')
  })
})
