"""Oxford 5000 PDF'inden (pdftotext -layout çıktısı) kelime listesini JSON'a çevirir.

Kullanım:
    pdftotext -layout American_Oxford_5000.pdf out.txt
    python3 scripts/parse_oxford.py out.txt data/oxford5000-b2c1.json
"""
import json
import re
import sys

POS = {
    "n": "noun", "v": "verb", "adj": "adjective", "adv": "adverb",
    "prep": "preposition", "pron": "pronoun", "conj": "conjunction",
    "det": "determiner", "exclam": "exclamation", "number": "number",
}
_P = r"(?:(?:n|v|adj|adv|prep|pron|conj|det|exclam|number)\.?[,/]?\s*)+"
TAGS = rf"{_P}[ABC][12](?:,\s*{_P}[ABC][12])*"
ENTRY = re.compile(rf"(.+?)\s+({TAGS})")
LEVEL_GROUP = re.compile(rf"({_P})([ABC][12])")


def parse_tags(tags):
    """'n. B2, adj. C1' -> [('noun', 'B2'), ('adjective', 'C1')]"""
    out = []
    for pos_part, level in LEVEL_GROUP.findall(tags):
        for p in re.split(r"[,/]", pos_part):
            p = p.strip().rstrip(".")
            if p:
                out.append((POS[p], level))
    return out


def main(src, dst):
    columns = []
    for line in open(src, encoding="utf-8"):
        if "Oxford" in line or "learners at B2" in line or not line.strip():
            continue
        columns += re.split(r"\s{2,}", line.strip())

    words, pending = [], None
    for col in columns:
        if re.fullmatch(TAGS, col):
            # "strip (remove clothes/a layer)" bir satırda, "v. C1" alt satırda kalmış
            col, pending = f"{pending} {col}", None
        m = ENTRY.fullmatch(col)
        if not m:
            pending = col
            continue
        head, tags = m.groups()
        sense = re.search(r"\((.+)\)$", head)
        head = re.sub(r"\s*\(.+\)$", "", head)
        head = re.sub(r"(?<=[a-zé])\d$", "", head)  # bow1, bass1 -> homonim numaralarını at
        if head[0].isupper() and head[1:].islower():
            head = head.lower()  # sayfa başındaki "Abolish"
        for pos, level in parse_tags(tags):
            words.append({
                "id": f"{head}-{pos}" + (f"-{sense.group(1)}" if sense else ""),
                "word": head,
                "pos": pos,
                "level": level,
                **({"sense": sense.group(1)} if sense else {}),
            })
    if pending:
        raise SystemExit(f"Ayrıştırılamadı: {pending!r}")

    json.dump(words, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len({w['word'] for w in words})} kelime, {len(words)} kart -> {dst}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
