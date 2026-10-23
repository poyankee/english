# Kelime — uygulama

Oxford 5000 kelime ve Oxford Phrase List kalıplarını aralıklı tekrarla çalışmak için PWA.

```bash
npm install
npm run dev      # data/ klasöründen public/cards.json üretir ve geliştirme sunucusunu açar
npm test         # tekrar algoritması ve şık üretimi testleri
npm run build    # dist/ klasörüne yayın paketi
```

- `src/srs.ts` — Leitner kutuları ve tekrar aralıkları
- `src/session.ts` — sıradaki kartın seçimi, yanlış kartın oturum içinde tekrar sorulması, çeldirici şıklar
- `src/db.ts` — ilerleme, günlük istatistik ve yedekleme (IndexedDB / Dexie)
