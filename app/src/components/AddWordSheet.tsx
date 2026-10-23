import { useState } from 'react'
import { loadCustomWords, saveCustomWords } from '../db'
import { useT } from '../i18n'
import type { Level } from '../types'

/** Kullanıcının kendi kelimesini eklediği form. Kelime mevcut seviyeye eklenir ve ilk sırada sorulur. */
export function AddWordSheet({ level, onClose, onSaved }: { level: Level; onClose: () => void; onSaved: () => void }) {
  const t = useT()
  const [form, setForm] = useState({ word: '', tr: '', def: '', ex: '', emoji: '' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })
  const valid = form.word.trim() && form.tr.trim()

  async function save() {
    const word = form.word.trim()
    const words = await loadCustomWords()
    words.push({
      id: `custom:${Date.now()}`,
      word,
      pos: word.includes(' ') ? 'phrase' : 'noun',
      level,
      tr: form.tr.trim(),
      def: form.def.trim(),
      ...(form.ex.trim() ? { ex: form.ex.trim() } : {}),
      emoji: form.emoji.trim() || '✍️',
      custom: true,
    })
    await saveCustomWords(words)
    onSaved()
    onClose()
  }

  return (
    <div className="modal" onClick={onClose}>
      <section className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <h2>{t('words.addTitle')}</h2>
        <label className="field">
          <span>{t('words.word')}</span>
          <input value={form.word} onChange={set('word')} autoFocus autoCapitalize="none" maxLength={60} />
        </label>
        <label className="field">
          <span>{t('words.tr')}</span>
          <input value={form.tr} onChange={set('tr')} maxLength={80} />
        </label>
        <label className="field">
          <span>{t('words.def')}</span>
          <input value={form.def} onChange={set('def')} maxLength={160} />
        </label>
        <label className="field">
          <span>{t('words.ex')}</span>
          <input value={form.ex} onChange={set('ex')} maxLength={160} />
        </label>
        <label className="field">
          <span>{t('words.emoji')}</span>
          <input value={form.emoji} onChange={set('emoji')} maxLength={4} />
        </label>
        <div className="row">
          <button className="secondary" onClick={onClose}>
            {t('words.cancel')}
          </button>
          <button className="primary grow" disabled={!valid} onClick={save}>
            {t('words.save')}
          </button>
        </div>
      </section>
    </div>
  )
}
