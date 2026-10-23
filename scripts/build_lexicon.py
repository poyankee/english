"""Kartlar için telaffuz (IPA), kelime ailesi, eş/zıt anlamlılar ve konu üretir -> data/lexicon.json

Kaynaklar:
- CMU Pronouncing Dictionary (Amerikan İngilizcesi, ARPAbet) -> IPA'ya çevrilir
- Princeton WordNet 3.0 (NLTK üzerinden): türetilmiş biçimler, eş/zıt anlamlılar, anlam kategorileri

Sonuç depoya eklenir; yayın sırasında bu scriptin çalışması gerekmez.

Kullanım (bir kez):
    pip install cmudict nltk
    # wordnet.zip -> $NLTK_DATA/corpora/wordnet.zip
    NLTK_DATA=... python3 scripts/build_lexicon.py
"""
import json
import os
import re

import cmudict
from nltk.corpus import wordnet as wn

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ARPA = {
    "AA": "ɑ", "AE": "æ", "AO": "ɔ", "AW": "aʊ", "AY": "aɪ", "B": "b", "CH": "tʃ", "D": "d", "DH": "ð",
    "EH": "ɛ", "EY": "eɪ", "F": "f", "G": "ɡ", "HH": "h", "IH": "ɪ", "IY": "i", "JH": "dʒ", "K": "k",
    "L": "l", "M": "m", "N": "n", "NG": "ŋ", "OW": "oʊ", "OY": "ɔɪ", "P": "p", "R": "r", "S": "s",
    "SH": "ʃ", "T": "t", "TH": "θ", "UH": "ʊ", "UW": "u", "V": "v", "W": "w", "Y": "j", "Z": "z", "ZH": "ʒ",
}
VOWELS = {"AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY", "IH", "IY", "OW", "OY", "UH", "UW"}

WN_POS = {"noun": [wn.NOUN], "verb": [wn.VERB], "adjective": [wn.ADJ, wn.ADJ_SAT], "adverb": [wn.ADV]}

# WordNet anlam kategorisi -> uygulamadaki konu
TOPICS = {
    "noun.food": "food",
    "verb.consumption": "food",
    "noun.animal": "animals",
    "noun.plant": "nature",
    "noun.object": "nature",
    "noun.phenomenon": "nature",
    "verb.weather": "nature",
    "noun.body": "body",
    "noun.person": "people",
    "noun.location": "places",
    "noun.artifact": "objects",
    "noun.communication": "communication",
    "verb.communication": "communication",
    "noun.time": "time",
    "noun.feeling": "feelings",
    "verb.emotion": "feelings",
    "noun.cognition": "mind",
    "noun.possession": "money",
    "noun.group": "society",
    "verb.motion": "movement",
    "noun.quantity": "numbers",
}
COLORS = {"red", "blue", "green", "yellow", "black", "white", "brown", "gray", "pink", "purple", "orange", "gold", "silver"}


# Hece başında birlikte bulunabilen ünsüz grupları (vurgu işaretini grubun önüne koymak için)
ONSETS = {
    tuple(x.split())
    for x in """P R|P L|P Y|B R|B L|B Y|T R|T W|D R|D W|K R|K L|K W|K Y|G R|G L|G W|F R|F L|F Y|TH R|SH R|
    S P|S T|S K|S M|S N|S L|S W|M Y|N Y|V Y|HH Y|S P R|S T R|S K R|S P L|S K W|S K Y|S P Y""".replace("\n", "").split("|")
}


def arpa_to_ipa(phones):
    """ARPAbet -> IPA. Vurgu işareti, vurgulu ünlüden önceki hece başının (ünsüz grubu) önüne konur."""
    bases = [re.match(r"([A-Z]+)(\d?)", ph).groups() for ph in phones]
    marks = {}
    for i, (base, stress) in enumerate(bases):
        if base not in VOWELS or stress not in ("1", "2"):
            continue
        # Ünlüden geriye ünsüz dizisi
        j = i
        while j > 0 and bases[j - 1][0] not in VOWELS:
            j -= 1
        cluster = [b for b, _ in bases[j:i]]
        if j == 0:
            start = 0  # kelime başı: tüm ünsüzler bu heceye ait
        else:
            # En uzun geçerli hece başı (3, 2, 1 ünsüz)
            take = next((n for n in (3, 2) if len(cluster) >= n and tuple(cluster[-n:]) in ONSETS), min(1, len(cluster)))
            start = i - take
        marks[start] = "ˈ" if stress == "1" else "ˌ"
    out = []
    for i, (base, stress) in enumerate(bases):
        if i in marks:
            out.append(marks[i])
        if base == "AH":
            out.append("ʌ" if stress == "1" else "ə")
        elif base == "ER":
            out.append("ɝ" if stress == "1" else "ɚ")
        else:
            out.append(ARPA[base])
    ipa = "".join(out)
    # Tek heceli kelimelerde vurgu işareti gereksiz
    return ipa.replace("ˈ", "") if ipa.count("ˈ") + ipa.count("ˌ") == 1 and sum(b in VOWELS for b, _ in bases) == 1 else ipa


def main():
    cards = json.load(open(os.path.join(ROOT, "app", "public", "cards.json"), encoding="utf-8"))
    pron = cmudict.dict()
    vocab = {c["word"].lower() for c in cards}
    lex = {}
    stats = {"ipa": 0, "family": 0, "syn": 0, "ant": 0, "topic": 0}

    for c in cards:
        word = c["word"].split(",")[0].strip().lower()
        entry = {}

        # Telaffuz: tek kelime ya da sb/sth hariç tüm parçaları sözlükte olan kısa kalıplar
        tokens = [t for t in re.split(r"[\s-]+", word.replace("…", "")) if t and t not in ("sb", "sth", "sb/sth", "sth/sb")]
        if 0 < len(tokens) <= 4 and all(t in pron for t in tokens):
            entry["ipa"] = "/" + " ".join(arpa_to_ipa(pron[t][0]) for t in tokens) + "/"

        poses = WN_POS.get(c["pos"])
        if poses and " " not in word:
            synsets = [s for p in poses for s in wn.synsets(word, pos=p)]
            own = [l for s in synsets for l in s.lemmas() if l.name().lower() == word]

            family = []
            for l in own:
                for d in l.derivationally_related_forms():
                    n = d.name().lower().replace("_", " ")
                    if n != word and n in vocab and n not in family:
                        family.append(n)
            if family:
                entry["family"] = family[:6]

            syn = []
            # İsimlerde yalnızca en yaygın anlam; fiil/sıfatlarda ilk iki anlam
            for s in synsets[: 1 if c["pos"] == "noun" else 2]:
                for l in s.lemmas():
                    n = l.name().lower().replace("_", " ")
                    if n != word and n in vocab and n not in syn:
                        syn.append(n)
            if syn:
                entry["syn"] = syn[:5]

            ant = []
            for l in own:
                for a in l.antonyms():
                    n = a.name().lower().replace("_", " ")
                    if n != word and n not in ant:
                        ant.append(n)
            # Listedeki zıt anlamlılar önce
            ant.sort(key=lambda n: n not in vocab)
            if ant:
                entry["ant"] = ant[:4]

            # Konuyu yalnızca kelimenin ilk (en yaygın) anlamından al
            topic = "colors" if word in COLORS else (TOPICS.get(synsets[0].lexname()) if synsets else None)
            # Yemek, hayvan ve vücut anlamları ilk üç anlamdan biriyse öncelikli ("banana": bitki değil yemek)
            for pri in ("food", "body", "animals"):
                if any(TOPICS.get(x.lexname()) == pri for x in synsets[:3]):
                    topic = pri
                    break
            if topic:
                entry["topic"] = topic

        for k in stats:
            if k in entry:
                stats[k] += 1
        if entry:
            lex[c["id"]] = entry

    out = os.path.join(ROOT, "data", "lexicon.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(lex, f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    print(f"{len(cards)} kart:", ", ".join(f"{k} {v}" for k, v in stats.items()), "->", os.path.relpath(out, ROOT))


if __name__ == "__main__":
    main()
