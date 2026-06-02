from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]

PDFS = [
    ("lektion-01", "Lektioner/Lektion_1_compressed .pdf"),
    ("lektion-02", "Lektioner/Lektion_2_compressed.pdf"),
    ("lektion-03", "Lektioner/Lektion_3_compressed.pdf"),
    ("lektion-04", "Lektioner/Lektion_4_compressed.pdf"),
    ("lektion-05", "Lektioner/Lektion_5_compressed.pdf"),
    ("lektion-06", "Lektioner/Lektion_6_compressed.pdf"),
    ("lektion-07", "Lektioner/Lektion_7_compressed.pdf"),
    ("lektion-08", "Lektioner/Lektion_8_compressed.pdf"),
    ("lektion-09", "Lektioner/Lektion_9_compressed.pdf"),
    ("lektion-10", "Lektioner/Lektion_10_compressed.pdf"),
    ("lektion-11", "Lektioner/Lektion_11_compressed.pdf"),
    ("lektion-12", "Lektioner/Lektion_12_compressed.pdf"),
    ("lektion-13", "Lektioner/Lektion_13_compressed.pdf"),
    ("exam-2023", "Tidligere Eksamensæt/GMT_eksamen_juni-2023_løsninger.pdf"),
    ("exam-2024", "Tidligere Eksamensæt/GMT-eksamen-juni-2024-løsninger.pdf"),
    ("exam-2025", "Tidligere Eksamensæt/GMT_eksamen_juni-2025_løsninger.pdf"),
]

KEYWORDS = [
    "acceleration",
    "arbejde",
    "atwood",
    "bevægelse",
    "centripetal",
    "cylinder",
    "energi",
    "friktion",
    "gas",
    "gravitation",
    "hastighed",
    "idealgas",
    "impuls",
    "isobar",
    "isoterm",
    "isochor",
    "kalorimetri",
    "kanon",
    "katapult",
    "kraft",
    "massemidtpunkt",
    "moment",
    "newton",
    "projektil",
    "rotation",
    "satellit",
    "skråplan",
    "stød",
    "temperatur",
    "termodynamik",
    "trisse",
    "tryk",
    "varme",
    "varmeledning",
    "carnot",
    "entropi",
    "nyttevirkning",
    "varmekraftmaskine",
    "varmepumpe",
    "reversibel",
    "irreversibel",
    "kelvin",
    "clausius",
    "otto",
    "diesel",
]

UI_NOISE_PATTERNS = [
    r"GMT\s*-\s*AAU\s*F\d{4}",
    r"Thomas Tauris",
    r"Question \d+",
    r"Spørgsmål \d+",
    r"Answer saved",
    r"Marked out of [\d.,]+",
    r"Vægter med [\d.,]+",
    r"Besvaret",
    r"Flag question",
    r"Select one:",
    r"Clear my choice",
    r"Ryd mit valg",
    r"Tid tilbage",
    r"Jump to\.\.\.",
    r"Spring til\.\.\.",
    r"Next page",
    r"Previous page",
    r"Contact ITS Support",
    r"AAU Moodle",
    r"AAU It services - Aalborg University",
    r"Tel:\s*\+\d[\d\s]*",
    r"Dashboard\s*/[^\n]+",
    r"\(side \d+ af \d+\)",
    r"\d+/\d+/\d{4}, \d+:\d+",
    r"\(page \d+ of \d+\)",
    r"Bemærk",
    r"FORTSÆTTELSE [A-Z]\.",
    r"You can preview this quiz",
    r"Quiz navigation",
    r"Finish attempt",
    r"Not yet answered",
    r"Marked out of",
]


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"<latexit[^>]*>.*?</latexit>", " ", text, flags=re.DOTALL)
    text = re.sub(r"<latexit[^<]*", " ", text, flags=re.DOTALL)
    text = re.sub(r"</latexit>", " ", text)
    text = re.sub(r"sha1_base64=\"[^\"]+\"", " ", text)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"[A-Za-z0-9+/=]{70,}", " ", text)
    for pattern in UI_NOISE_PATTERNS:
        text = re.sub(pattern, " ", text, flags=re.IGNORECASE)
    text = re.sub(r"Grundlæggendemekanikogtermodynamik", "Grundlæggende mekanik og termodynamik", text, flags=re.IGNORECASE)
    text = re.sub(r"([a-zæøå]{6,})(og)([a-zæøå]{6,})", r"\1 og \3", text, flags=re.IGNORECASE)
    text = re.sub(r"([a-zæøå])([A-ZÆØÅ])", r"\1 \2", text)
    text = re.sub(r"([.,;:!?])([A-Za-zÆØÅæøå])", r"\1 \2", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def compact_snippet(text: str, limit: int = 600) -> str:
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0] + " ..."


def page_keywords(text: str) -> list[str]:
    lower = text.lower()
    return [keyword for keyword in KEYWORDS if keyword in lower]


def main() -> None:
    corpus = []
    for source_id, relative_path in PDFS:
        source_path = ROOT / relative_path
        if not source_path.exists():
            print(f"[warn] Missing PDF source: {relative_path}")
            continue
        reader = PdfReader(str(source_path))
        pages = []
        for index, page in enumerate(reader.pages, start=1):
            raw = page.extract_text() or ""
            text = clean_text(raw)
            pages.append(
                {
                    "page": index,
                    "text": compact_snippet(text),
                    "keywords": page_keywords(text),
                }
            )
        corpus.append({"sourceId": source_id, "pageCount": len(reader.pages), "pages": pages})

    output = ROOT / "src/data/pdfCorpus.ts"
    serialized = json.dumps(corpus, ensure_ascii=False, indent=2)
    output.write_text(
        "import type { PdfCorpusSource } from './types';\n\n"
        "export const pdfCorpus: PdfCorpusSource[] = "
        + serialized
        + ";\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
