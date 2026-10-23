# Kelime Ezber Uygulaması — Yol Haritası

Amaç: Oxford 5000 kelimesini telefondan, her yerde, aralıklı tekrar (spaced repetition) ile kalıcı olarak öğrenmek.

## Temel oyun ekranı

```
┌───────────────────────────┐
│            🏰             │  ← kelimeyle ilgili sembol (emoji)
│                           │
│   castle  (n.)  · B2  🔊  │  ← kelime, tür, seviye, sesli okuma
│ "a large strong building  │
│  built in the past to     │  ← İngilizce açıklama
│  protect people"          │
│                           │
│  [ kale        ]          │
│  [ saray       ]          │
│  [ kule        ]          │  ← 5 Türkçe şık
│  [ köprü       ]          │
│  [ hendek      ]          │
└───────────────────────────┘
```

- Yanlış şıklar rastgele değil, **aynı türden (isim/fiil…) ve benzer anlamlı** kelimelerden seçilir; yoksa tahminle bulmak çok kolay olur.
- Cevaptan sonra doğru şık yeşil yanar, bir **örnek cümle** gösterilir, "Devam" ile sonraki karta geçilir.

## Teknik karar: PWA (Progressive Web App)

Telefona "Ana ekrana ekle" ile kurulan, uygulama gibi tam ekran açılan ve **internetsiz çalışan** bir web uygulaması.

| | PWA (önerilen) | Native (React Native / Flutter) |
|---|---|---|
| Kurulum | Linkten "Ana ekrana ekle" | App Store / Play Store veya APK |
| Maliyet | Ücretsiz (GitHub Pages) | Apple geliştirici hesabı $99/yıl (iOS için) |
| Geliştirme hızı | Hızlı, tek kod tabanı | Daha yavaş |
| Çevrimdışı | Var (Service Worker) | Var |
| Bildirim | Android'de tam, iOS'ta 16.4+ ana ekrana ekliyse | Tam |

**Karar:** Şimdilik kişisel kullanım için PWA. Store'a çıkmak istediğimizde aynı kod Capacitor ile Android/iOS uygulamasına sarılacak (Faz 4).

Seçilen yığın: **React + TypeScript + Vite**, veriler cihazda **IndexedDB**'de (Dexie), yayın **GitHub Pages**. İleride gerekirse aynı kod Capacitor ile mağaza uygulamasına çevrilebilir.

## Tekrar sistemi (uzun süreli hafıza)

Her kartın bir "kutu"su var (Leitner + basit SM-2). Yanlış bilinen kelime başa döner ve kısa aralıklarla tekrar gelir, doğru bildikçe aralık uzar:

| Kutu | Bir sonraki gösterim |
|---|---|
| 0 — Yeni / yanlış | Aynı oturumda ~5 kart sonra tekrar |
| 1 | 10 dakika sonra (veya ertesi oturum) |
| 2 | 1 gün |
| 3 | 3 gün |
| 4 | 7 gün |
| 5 | 16 gün |
| 6 | 35 gün |
| 7 — Öğrenildi ✅ | 90 gün sonra bir kontrol |

- **İlk seferde bilinemeyen** her kelime "Bilemediklerim" listesine girer ve en az 3 başarılı tekrardan (kutu 4) geçene kadar orada kalır.
- Doğru ama yavaş/emin olmadan verilen cevap için **"Tahmin ettim"** butonu: kart ilerlemez, ama yanlış da sayılmaz.
- İlk denemede bilinen kelime doğrudan kutu 3'ten başlar (bildiğin kelimelerle vakit kaybetmezsin).

## Fazlar

### Faz 0 — Veri temeli (başladı)
- [x] Oxford 3000 → `data/oxford3000.json` (2980 kelime, 3802 kart: A1–B2)
- [x] Oxford 5000 ek liste → `data/oxford5000-b2c1.json` (1997 kelime, 2158 kart: B2–C1)
- [x] Oxford Phrase List → `data/oxford-phrases.json` (750 kalıp: phrasal verb, deyim, collocation; A1–C1)
- [x] A1 zenginleştirme: 1077 kelime + 200 kalıp (`data/enrich/`)
- [ ] A2, B1, B2, C1 zenginleştirme
- [ ] Her kart için zenginleştirme: Türkçe karşılık(lar), İngilizce kısa açıklama, örnek cümle, emoji, benzer anlamlı 4+ çeldirici. Toplu üretilip elle örneklem kontrolü yapılacak.
- [ ] Soyut kelimeler (ör. *assumption*) için emoji yoksa türüne göre varsayılan sembol.

### Faz 1 — Çalışan ilk sürüm (MVP)
- [x] Vite + React + TS proje iskeleti, PWA ayarları (manifest, ikon, offline)
- [x] Quiz ekranı: sembol, kelime, açıklama, 5 şık, doğru/yanlış geri bildirimi
- [x] Tekrar algoritması + IndexedDB'de ilerleme kaydı
- [x] "Bilemediklerim" listesi ve sadece onlardan çalışma modu
- [x] Günlük oturum: ör. 10 yeni + vadesi gelen tekrarlar
- [ ] GitHub Pages'e otomatik yayın → telefona ekle

### Faz 2 — Konfor ve motivasyon
- [x] 🔊 Sesli telaffuz (tarayıcının ücretsiz ses motoru, Amerikan aksanı)
- [x] Seviye filtresi (A1 … C1) ve günlük hedef ayarı
- [x] Seri (streak) 🔥, günlük ilerleme çubuğu
- [ ] İstatistikler: öğrenilen / öğreniliyor / yeni, en çok zorlanılan kelimeler
- [x] Karanlık mod
- [x] Yedekleme: ilerlemeyi JSON olarak dışa/içe aktar (telefon değişirse kaybolmasın)

### Faz 3 — Daha derin öğrenme
- [ ] Ters mod: Türkçe → İngilizce
- [ ] Yazma modu: kelimeyi klavyeyle yaz (kutu 5+ kartlarda)
- [ ] Dinleme modu: sadece sesi duy, anlamı seç
- [ ] Örnek cümlede boşluk doldurma
- [ ] Kalıp (phrase) modu: "take over", "in other words" gibi kalıpların anlamını seçme, örnek cümlede boşluğa doğru kalıbı yerleştirme
- [ ] Günlük hatırlatma bildirimi
- [ ] (İsteğe bağlı) Bulut senkronizasyonu — birden fazla cihaz için

### Faz 4 — Store
- [ ] Capacitor ile Android (Play Store) ve iOS (App Store) paketleri
- [ ] Gizlilik politikası, mağaza görselleri, ikon seti
