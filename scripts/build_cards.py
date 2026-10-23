"""Kelime/kalıp listelerini zenginleştirme dosyalarıyla birleştirip uygulamanın okuyacağı
app/public/cards.json dosyasını üretir.

Zenginleştirme dosyaları: data/enrich/*.txt, her satır "|" ile ayrılmış 5 alan:
    id | emoji | türkçe | ingilizce açıklama | örnek cümle
Emoji ve örnek cümle boş bırakılabilir. Kalıpların id'leri "phrase:" ile başlar (ör. phrase:take-over).

Varsa data/lexicon.json'daki telaffuz, kelime ailesi, eş/zıt anlamlı ve konu bilgileri de eklenir.

Kullanım:
    python3 scripts/build_cards.py
"""
import collections
import glob
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load(name):
    with open(os.path.join(ROOT, "data", name), encoding="utf-8") as f:
        return json.load(f)


def main():
    base = {}
    for w in load("oxford3000.json") + load("oxford5000-b2c1.json"):
        base.setdefault(w["id"], w)  # 5000 listesinde tekrar edenlerde 3000'deki (düşük) seviye kalır
    for p in load("oxford-phrases.json"):
        base[f"phrase:{p['id']}"] = {"id": f"phrase:{p['id']}", "word": p["phrase"], "pos": "phrase", "level": p["level"]}

    enrich, problems = {}, []
    for path in sorted(glob.glob(os.path.join(ROOT, "data", "enrich", "*.txt"))):
        with open(path, encoding="utf-8") as f:
            for n, line in enumerate(f, 1):
                if not line.strip() or line.startswith("#"):
                    continue
                cols = [c.strip() for c in line.split("|")]
                where = f"{os.path.basename(path)}:{n}"
                if len(cols) != 5 or not cols[2] or not cols[3]:
                    problems.append(f"{where}: 5 sütun bekleniyordu: {line!r}")
                elif cols[0] not in base:
                    problems.append(f"{where}: bilinmeyen id {cols[0]!r}")
                else:
                    enrich[cols[0]] = cols

    # Telaffuz, kelime ailesi, eş/zıt anlamlılar ve konu (scripts/build_lexicon.py üretir)
    lex_path = os.path.join(ROOT, "data", "lexicon.json")
    lexicon = json.load(open(lex_path, encoding="utf-8")) if os.path.exists(lex_path) else {}

    cards = []
    for id_, b in base.items():
        if id_ not in enrich:
            continue
        _, emoji, tr, definition, ex = enrich[id_]
        card = {**b, "tr": tr, "def": definition}
        if emoji:
            card["emoji"] = emoji
        if ex:
            card["ex"] = ex
        card.update(lexicon.get(id_, {}))
        cards.append(card)

    out = os.path.join(ROOT, "app", "public", "cards.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(cards, f, ensure_ascii=False, separators=(",", ":"))

    done = collections.Counter(c["level"] + (" kalıp" if c["pos"] == "phrase" else "") for c in cards)
    total = collections.Counter(b["level"] + (" kalıp" if b["pos"] == "phrase" else "") for b in base.values())
    for key in sorted(total):
        print(f"  {key:9} {done[key]:5} / {total[key]}")
    print(f"{len(cards)} / {len(base)} kart hazır -> {os.path.relpath(out, ROOT)}")
    for p in problems:
        print("UYARI", p)
    if problems:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
