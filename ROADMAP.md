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
- [x] Tüm kartların zenginleştirmesi: 5958 kelime + 750 kalıp = 6708 kart (`data/enrich/`)

### Faz 1 — Çalışan ilk sürüm (MVP)
- [x] Vite + React + TS proje iskeleti, PWA ayarları (manifest, ikon, offline)
- [x] Quiz ekranı: sembol, kelime, açıklama, 5 şık, doğru/yanlış geri bildirimi
- [x] Tekrar algoritması + IndexedDB'de ilerleme kaydı
- [x] "Bilemediklerim" listesi ve sadece onlardan çalışma modu
- [x] Günlük oturum: ör. 10 yeni + vadesi gelen tekrarlar
- [x] GitHub Pages'e otomatik yayın → telefona ekle

### Faz 2 — Konfor ve motivasyon
- [x] 🔊 Sesli telaffuz (tarayıcının ücretsiz ses motoru, Amerikan aksanı)
- [x] Seviye filtresi (A1 … C1) ve günlük hedef ayarı
- [x] Seri (streak) 🔥, günlük ilerleme çubuğu
- [ ] İstatistikler: öğrenilen / öğreniliyor / yeni, en çok zorlanılan kelimeler
- [x] Karanlık mod
- [x] Fiil sınavı: seçili seviyelerden 20 fiil + fiil kalıbı, önce vadesi gelenler
- [x] Yedekleme: ilerlemeyi JSON olarak dışa/içe aktar (telefon değişirse kaybolmasın)

### Faz 3 — Kariyer modu ve yeni düzen
Uygulama büyüdüğü için alt sekme çubuğuyla 5 bölüme ayrılıyor:

| Sekme | İçerik |
|---|---|
| 🏠 Bugün | Selamlama, günlük hedef, "Çalış" düğmesi, Bilemediklerim, seri |
| 🎮 Pratik | Ters mod, yazma, kalıp tamamlama, eşleştirme, doğru/yanlış, fiil sınavı, sınav modu, karışan kelimeler |
| 📚 Kelimeler | Arama ve filtre, kelime detayı, favoriler, kendi kelimelerim, konu desteleri |
| 📈 İlerleme | Kariyer yolu (A1 → C1), XP ve unvan, istatistik, takvim ısı haritası, rozetler, haftalık özet |
| 👤 Profil | İsim, dil (TR/EN), aksan, otomatik seslendirme, ses/titreşim, günlük hedef, yedek ve dışa aktarma |

Kurallar:
- **Başlangıç:** İsim sorulur, ardından her seviyeden birkaç kelimeyle **seviye tespit sınavı** yapılır. Kullanıcı bildiği seviyeleri atlar ve takıldığı seviyeden başlar.
- **Geçilen seviyeler:** Arada bir, geçilen seviyelerden daha önce sorulmamış kelimeler kontrol amaçlı sorulur. Bilinirse bir daha sorulmaz, bilinemezse normal tekrara girer.
- **A1 ve A2 kelimeleri:** Bir kez bilinen kelime "tamamlandı" sayılır ve tekrar sorulmaz. Bilinemeyen kelime öğrenilene kadar tekrarlanır, sonra o da tamamlanır.
- **Seviye atlama:** Mevcut seviyenin büyük kısmı bilinince sonraki seviyenin kilidi açılır.
- **Karışık soru tipi:** Yeni kartlar İngilizce → Türkçe sorulur. Kart iyi bilindikçe Türkçe → İngilizce soruya, sonra yazma sorusuna dönüşür.

Seçilen özellikler (numaralar özellik listesindeki sırayla):
- [x] Alt sekme düzeni, TR/EN arayüz dili (38), ilk açılış ve isim (37)
- [x] Seviye tespit sınavı, kariyer yolu, A1/A2 ve geçilen seviye kuralları (26)
- [x] Ters mod (1), yazma modu (2), karışık soru tipleri
- [x] Aksan seçimi ve otomatik seslendirme (30), ses efektleri ve titreşim (23)
- [x] Geri al (32)

### Faz 4 — Pratik modları
- [x] Kalıp tamamlama (5), eşleştirme oyunu (7), doğru/yanlış kaydırma (8)
- [x] Sınav modu (27), karışan kelimeler (25)

### Faz 5 — Kelimeler
- [x] Kelime listesi, arama, filtre (10); kelime detay sayfası (9)
- [x] Favori / "zaten biliyorum" işaretleme (15); kendi kelimeni ekle (14)

### Faz 6 — İlerleme ve motivasyon
- [x] İstatistik sayfası (17), takvim ısı haritası (18)
- [x] Rozetler (19), XP ve unvanlar (20), seri koruyucu (21), haftalık özet (22)
- [x] Zor kelime tespiti: sık yanlış yapılan kelimeler daha sık gelir (24)

### Faz 7 — Veri zenginleştirme
- [x] Telaffuz yazısı / IPA (11), kelime ailesi (12), eş ve zıt anlamlılar (13), konu desteleri (16)

### Faz 8 — Yedek, bildirim, store
- [ ] Otomatik yedek hatırlatması (34), Excel/Anki'ye dışa aktarma (35)
- [ ] Günlük hatırlatma bildirimi (28): web uygulamasında zamanlanmış bildirim için sunucu gerekir, mağaza uygulamasında cihazın kendi bildirimiyle yapılır
- [ ] Capacitor ile Android ve iOS paketleri, gizlilik politikası, mağaza görselleri

### Sonraya bırakılanlar
- Tema ve yazı boyutu seçimi (31)
- Bulut senkronizasyonu (33)
