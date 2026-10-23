"""Oxford Phrase List PDF'ini JSON'a çevirir (pdfplumber gerekir).

PDF'te ana kalıplar normal fontla, varyant/örnekleri ise 5pt içeride ince fontla yazılmış;
seviye başlıkları (A1, A2…) kalın. Sütunlar soldan sağa, yukarıdan aşağıya okunur.

Kullanım:
    python3 scripts/parse_phrases.py Oxford_Phrase_List.pdf data/oxford-phrases.json
"""
import json
import re
import sys

import pdfplumber

COLUMNS = [40, 163, 286, 409]  # sütunların sol kenarı (pt)


def column_of(x):
    return max(i for i, c in enumerate(COLUMNS) if x >= c - 2)


def main(src, dst):
    rows = {}  # (sayfa, sütun, satır yüksekliği) -> o satırdaki kelimeler
    with pdfplumber.open(src) as pdf:
        for page_no, page in enumerate(pdf.pages):
            for w in page.extract_words(keep_blank_chars=True, x_tolerance=1.5, extra_attrs=["fontname", "size"]):
                if w["top"] > 740 or (page_no == 0 and w["top"] < 120):
                    continue  # sayfa altlığı, başlık ve giriş paragrafı
                col = column_of(w["x0"])
                rows.setdefault((page_no, col, round(w["top"])), []).append(w)

    lines = []
    for key in sorted(rows):
        ws = sorted(rows[key], key=lambda w: w["x0"])  # aynı satırda font değişince kelimeler bölünüyor
        first = ws[0]
        lines.append({
            "indent": first["x0"] - COLUMNS[key[1]],
            "bold": "Bold" in first["fontname"],
            "main": "Regular" in first["fontname"],
            "text": re.sub(r"\s+", " ", "".join(w["text"] for w in ws)).strip(),
        })

    phrases, level, last = [], None, None  # last: en son yazılan metnin (kap, anahtar) çifti
    for l in lines:
        if l["bold"]:
            level = l["text"]
            continue
        if l["indent"] > 8:  # bir önceki satırın devamı ("…to do" / "sth")
            container, key = last
            container[key] += " " + l["text"]
            continue
        if l["main"]:
            phrases.append({"phrase": l["text"], "level": level, "variants": []})
            last = (phrases[-1], "phrase")
        else:
            variants = phrases[-1]["variants"]
            variants.append(l["text"])
            last = (variants, len(variants) - 1)

    for p in phrases:
        p["id"] = re.sub(r"[^a-z0-9]+", "-", p["phrase"].lower()).strip("-")
        if not p["variants"]:
            del p["variants"]
    json.dump(phrases, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(phrases)} kalıp -> {dst}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
