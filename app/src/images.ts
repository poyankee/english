/** Kelimelere eklenen resimler: hangi kartların resmi olduğu bellekte tutulur, resimler gerektiğinde okunur */
import { loadImage, loadImageIds, saveImage } from './db'

const ids = new Set<string>()
const urls = new Map<string, string>()
const listeners = new Set<() => void>()

let loaded = false

/** Resimli kartların listesini okur; yedek geri yüklenince `force` ile yeniden okunur */
export async function initImages(force = false) {
  if (loaded && !force) return
  loaded = true
  ids.clear()
  for (const id of await loadImageIds()) ids.add(id)
  urls.forEach((u) => URL.revokeObjectURL(u))
  urls.clear()
  listeners.forEach((l) => l())
}

export function hasImage(id: string) {
  return ids.has(id)
}

export async function imageUrl(id: string): Promise<string | null> {
  if (!ids.has(id)) return null
  const cached = urls.get(id)
  if (cached) return cached
  const blob = await loadImage(id)
  if (!blob) return null
  const u = URL.createObjectURL(blob)
  urls.set(id, u)
  return u
}

export function onImagesChange(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

const MAX = 360

/** Seçilen fotoğrafı küçültüp (en çok 360px, JPEG) kaydeder */
export async function setImage(id: string, file: File | null) {
  const old = urls.get(id)
  if (old) URL.revokeObjectURL(old)
  urls.delete(id)
  if (!file) {
    await saveImage(id, null)
    ids.delete(id)
  } else {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('image'))), 'image/jpeg', 0.82))
    await saveImage(id, blob)
    ids.add(id)
  }
  listeners.forEach((l) => l())
}
