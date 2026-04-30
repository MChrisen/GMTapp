from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[\[\]{}()_,;:]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def load_export_json(file_name: str, export_name: str):
    path = ROOT / "src" / "data" / file_name
    raw = path.read_text(encoding="utf-8")
    marker = f"export const {export_name}"
    idx = raw.find(marker)
    if idx < 0:
        raise ValueError(f"Cannot find {marker} in {file_name}")
    rhs = raw[idx:]
    rhs = rhs.split("=", 1)[1].strip()
    if rhs.endswith(";"):
        rhs = rhs[:-1]
    return json.loads(rhs)


def main() -> None:
    try:
        formulas = load_export_json("formulas.ts", "formulasWithExamples")
        examples = load_export_json("examples.ts", "workedExamples")
        patterns = load_export_json("examples.ts", "problemPatterns")
    except Exception:
        # Fall back gracefully when data is not JSON-serializable in source form.
        print("[warn] Could not parse data exports directly; search index not regenerated.")
        return

    formula_index = [
        {
            "id": f["id"],
            "text": normalize(
                " ".join(
                    [
                        f.get("name", ""),
                        f.get("topic", ""),
                        f.get("equation", ""),
                        f.get("latex", ""),
                        " ".join(f.get("keywords", [])),
                    ]
                )
            ),
        }
        for f in formulas
    ]

    example_index = [
        {
            "id": e["id"],
            "text": normalize(
                " ".join(
                    [
                        e.get("title", ""),
                        e.get("pattern", ""),
                        e.get("question", ""),
                        " ".join(e.get("givens", [])),
                        " ".join(e.get("steps", [])),
                        " ".join(e.get("keywords", [])),
                    ]
                )
            ),
        }
        for e in examples
    ]

    pattern_index = [
        {
            "id": p["id"],
            "text": normalize(
                " ".join(
                    [
                        p.get("title", ""),
                        p.get("recognition", ""),
                        " ".join(p.get("cueWords", [])),
                        " ".join(p.get("method", [])),
                        " ".join(p.get("pitfalls", [])),
                    ]
                )
            ),
        }
        for p in patterns
    ]

    output = ROOT / "src" / "data" / "searchIndex.ts"
    payload = {
        "formulas": formula_index,
        "examples": example_index,
        "patterns": pattern_index,
    }
    output.write_text(
        "export const searchIndex = " + json.dumps(payload, ensure_ascii=False, indent=2) + " as const;\n",
        encoding="utf-8",
    )
    print(f"[ok] Wrote {output.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
