#!/usr/bin/env python3
"""
Subsets Mukta to the ranges this portal actually renders and writes WOFF2.

Mukta is licensed under the SIL Open Font License, which permits subsetting.
The originals stay in `prototype/assets/fonts/`; only the web build is derived.

Run after replacing the source fonts:
    python3 scripts/build-fonts.py
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "prototype" / "assets" / "fonts"
TARGET = ROOT / "public" / "fonts"

# Devanagari plus the Latin, punctuation and symbols the portal uses.
UNICODES = ",".join([
    "U+0000-00FF",   # Basic Latin and Latin-1 Supplement
    "U+0900-097F",   # Devanagari
    "U+A8E0-A8FF",   # Devanagari Extended
    "U+200C-200D",   # ZWNJ / ZWJ, required for correct Devanagari shaping
    "U+2010-2027",   # dashes, quotes, the middle dot used as a separator
    "U+20B9",        # Indian rupee sign
    "U+2190-21BB",   # arrows used in the tables
    "U+2248",        # the "approximately equal" sign beside USD conversions
    "U+2264-2265",
    "U+2713-2717",   # tick marks
    "U+25A0-25FF",   # geometric shapes used by the chart legends
])

WEIGHTS = ["Regular", "SemiBold", "Bold", "ExtraBold"]


def main() -> int:
    TARGET.mkdir(parents=True, exist_ok=True)
    total_before = total_after = 0

    for weight in WEIGHTS:
        src = SOURCE / f"Mukta-{weight}.ttf"
        out = TARGET / f"Mukta-{weight}.woff2"
        if not src.exists():
            print(f"missing source: {src}", file=sys.stderr)
            return 1

        subprocess.run(
            [
                sys.executable, "-m", "fontTools.subset", str(src),
                f"--unicodes={UNICODES}",
                "--layout-features=*",          # keep Devanagari shaping intact
                "--flavor=woff2",
                "--desubroutinize",
                f"--output-file={out}",
            ],
            check=True,
        )
        before, after = src.stat().st_size, out.stat().st_size
        total_before += before
        total_after += after
        print(f"Mukta-{weight}: {before // 1024} KB ttf -> {after // 1024} KB woff2")

    print(f"total: {total_before // 1024} KB -> {total_after // 1024} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
