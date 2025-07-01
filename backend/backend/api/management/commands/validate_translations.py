from __future__ import annotations

import argparse
import csv
import random
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import List, Tuple, Dict, Set

# ---------------------------------------------------------------------------
# Simple heuristics
# ---------------------------------------------------------------------------
ALPHA_EN = re.compile(r"^[A-Za-z .'\'-]+$")
ALPHA_ES = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ .¿¡'\'-]+$")


Pair = Tuple[str, str]


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def load(path: Path) -> List[Pair]:
    """Load a two-column CSV (utf-8-sig tolerant) and return trimmed tuples."""
    pairs: List[Pair] = []
    with path.open(newline="", encoding="utf-8-sig") as fh:
        rdr = csv.reader(fh)
        for idx, row in enumerate(rdr, start=1):
            if len(row) != 2:
                raise ValueError(f"Row {idx} expected 2 columns, got {len(row)}: {row!r}")
            eng, es = (c.strip() for c in row)
            pairs.append((eng, es))
    return pairs


def duplicate_checks(pairs: List[Pair]):
    """Return exact duplicates and one-to-many mappings."""
    exact_dups: List[Pair] = []
    seen: Set[Pair] = set()

    eng_to_es: Dict[str, Set[str]] = defaultdict(set)
    es_to_eng: Dict[str, Set[str]] = defaultdict(set)

    for eng, es in pairs:
        if (eng, es) in seen:
            exact_dups.append((eng, es))
        seen.add((eng, es))
        eng_to_es[eng].add(es)
        es_to_eng[es].add(eng)

    multi_eng = {k: sorted(v) for k, v in eng_to_es.items() if len(v) > 1}
    multi_es = {k: sorted(v) for k, v in es_to_eng.items() if len(v) > 1}
    return exact_dups, multi_eng, multi_es


def heuristic_suspicions(pairs: List[Pair]):
    """Flag likely problems without external APIs."""
    susp: List[Tuple[str, str, str]] = []
    for eng, es in pairs:
        if not eng or not es:
            susp.append((eng, es, "blank"))
        elif eng.lower() == es.lower():
            susp.append((eng, es, "identical"))
        elif ALPHA_EN.fullmatch(es):
            # Spanish side looks like pure ASCII English characters
            susp.append((eng, es, "looks English"))
        elif not ALPHA_ES.fullmatch(es):
            susp.append((eng, es, "non-Spanish chars"))
    return susp


def mt_sanity_check(pairs: List[Pair], limit: int = 300):
    """Optional expensive check using Google MT via deep_translator.

    Only the first *limit* rows are checked to avoid quota exhaustion.
    """
    try:
        from deep_translator import GoogleTranslator  # type: ignore
        from Levenshtein import ratio  # type: ignore
    except ImportError:
        sys.exit(
            "Install deep-translator and python-Levenshtein to use --mt-check."
        )

    mismatches: List[Tuple[str, str, str]] = []
    tr = GoogleTranslator(source="en", target="es")

    for eng, es in pairs[:limit]:
        guess = tr.translate(eng)
        if ratio(guess.lower(), es.lower()) < 0.6:
            mismatches.append((eng, es, guess))
    return mismatches


# ---------------------------------------------------------------------------
# Command entry point
# ---------------------------------------------------------------------------

def main(argv: List[str] | None = None):
    parser = argparse.ArgumentParser(
        description="Validate a bilingual CSV (English, Spanish) for structural and translation anomalies.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("csv", type=Path, help="Path to the CSV file to validate.")
    parser.add_argument(
        "--mt-check",
        action="store_true",
        help="Call Google MT (via deep_translator) on the first N rows and flag large mismatches.",
    )
    parser.add_argument(
        "--mt-limit",
        type=int,
        default=300,
        help="Number of rows to check when --mt-check is enabled.",
    )
    parser.add_argument(
        "--show-sample",
        type=int,
        default=0,
        help="Print N random suspect rows at the end of the report.",
    )

    args = parser.parse_args(argv)

    if not args.csv.exists():
        sys.exit(f"File not found: {args.csv}")

    pairs = load(args.csv)
    exact_dups, multi_eng, multi_es = duplicate_checks(pairs)
    susp = heuristic_suspicions(pairs)
    mt_mism: List[Tuple[str, str, str]] = []
    if args.mt_check:
        mt_mism = mt_sanity_check(pairs, args.mt_limit)

    # ------------------------------------------------------------------
    # Report summary
    # ------------------------------------------------------------------
    print("\n=== Translation CSV QA Report ===\n")
    print(f"Rows processed: {len(pairs):,}")
    print(f"Exact duplicate pairs: {len(exact_dups):,}")
    print(f"English terms mapping to >1 Spanish terms: {len(multi_eng):,}")
    print(f"Spanish terms mapping to >1 English terms: {len(multi_es):,}")
    print(f"Heuristic suspicions: {len(susp):,}")
    if args.mt_check:
        print(
            f"MT mismatches (first {args.mt_limit} rows checked): {len(mt_mism):,}"
        )

    # ------------------------------------------------------------------
    # Optional example rows
    # ------------------------------------------------------------------
    combined_suspects: List[Tuple[str, str, str]] = []
    combined_suspects.extend([(e, s, "exact-dup") for e, s in exact_dups])
    combined_suspects.extend(susp)
    combined_suspects.extend(mt_mism)

    if args.show_sample and combined_suspects:
        print("\n--- Sample suspect rows ---")
        for row in random.sample(combined_suspects, min(args.show_sample, len(combined_suspects))):
            print(" • ", row)

    # Exit code for CI pipelines
    # 0 = clean, 1 = issues detected
    if exact_dups or multi_eng or multi_es or susp or mt_mism:
        sys.exit(1)


# Django management command hook ------------------------------------------------
from django.core.management.base import BaseCommand  # type: ignore  # noqa: E402


class Command(BaseCommand):
    """Django wrapper so you can run: python manage.py validate_translations FILE.csv"""

    help = "Validate a bilingual CSV for structural anomalies and translation inconsistencies."

    def add_arguments(self, parser: argparse.ArgumentParser) -> None:  # type: ignore[override]
        # Reuse main()'s argparse setup sans the program name.
        main_parser = argparse.ArgumentParser(add_help=False)
        main_parser.add_argument("csv", type=Path)
        main_parser.add_argument("--mt-check", action="store_true")
        main_parser.add_argument("--mt-limit", type=int, default=300)
        main_parser.add_argument("--show-sample", type=int, default=0)
        for a in main_parser._actions:  # type: ignore[attr-defined]
            if not any(a.option_strings):
                parser.add_argument(a.dest, **{k: getattr(a, k) for k in ("type", "help")})
            else:
                parser.add_argument(*a.option_strings, **{k: getattr(a, k) for k in ("help", "action", "type", "default") if hasattr(a, k)})

    def handle(self, *args, **options):  # type: ignore[override]
        # Pass through to the standalone main() for actual logic
        argv: List[str] = []
        for key, value in options.items():
            if key == "csv":
                argv.append(str(value))
            elif isinstance(value, bool) and value:
                argv.append(f"--{key.replace('_', '-')}")
            elif value not in (None, False):
                argv.extend([f"--{key.replace('_', '-')}", str(value)])
        try:
            main(argv)
        except SystemExit as exc:
            # Django expects handle() not to exit; capture the code instead.
            if exc.code not in (0, None):
                self.stderr.write(self.style.ERROR(f"Validation failed with exit code {exc.code}"))
            raise 