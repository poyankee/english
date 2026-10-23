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

## Veri kaynakları

- Kelime ve kalıp listeleri: Oxford 3000, Oxford 5000 ve Oxford Phrase List (Oxford University Press)
- Türkçe karşılıklar, açıklamalar, örnek cümleler ve emojiler: `data/enrich/` (elle yazıldı)
- Telaffuz (IPA): [CMU Pronouncing Dictionary](http://www.speech.cs.cmu.edu/cgi-bin/cmudict) (BSD lisansı), Amerikan İngilizcesi
- Kelime ailesi, eş/zıt anlamlılar ve konular: [Princeton WordNet 3.0](https://wordnet.princeton.edu/) (WordNet lisansı)

Bu iki sözlükten üretilen bilgiler `data/lexicon.json` dosyasındadır ve `scripts/build_lexicon.py` ile yeniden üretilebilir.
