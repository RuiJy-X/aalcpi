import argparse
import json
import re
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from pathlib import Path

import pdfplumber
from pypdf import PdfReader, PdfWriter, PageObject
from pypdf.generic import RectangleObject


PLANTER_LINE_PATTERN = re.compile(
    r"^\s*(\d{4,})\s*([A-Za-z0-9.,'()\-/\s]+?)\s+(\d{4,})\s+(.+?)\s*$"
)
PRIMARY_HEADER_ANCHOR = "UNIVERSAL ROBINA CORPORATION"
PRIMARY_FOOTER_ANCHOR = "EMMA E ABUEVA"
PRIMARY_FOOTER_ROLE_ANCHOR = "QA MANAGER"

HEADER_ANCHOR_NORM = re.sub(r"[^A-Z0-9]", "", PRIMARY_HEADER_ANCHOR.upper())
FOOTER_ANCHOR_NORM = re.sub(r"[^A-Z0-9]", "", PRIMARY_FOOTER_ANCHOR.upper())
FOOTER_ROLE_NORM   = re.sub(r"[^A-Z0-9]", "", PRIMARY_FOOTER_ROLE_ANCHOR.upper())


@dataclass
class PlanterInfo:
    planter_code: str
    planter_name: str
    hacienda_code: str
    hacienda_address: str


@dataclass
class OutputRecord:
    source_page: int
    segment: str
    planter_code: str
    planter_name: str
    hacienda_code: str
    hacienda_address: str
    output_file: str


# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

def _normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _safe_filename(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9 _\-.]", "", value)
    cleaned = _normalize_spaces(cleaned).replace(" ", "_")
    return cleaned or "UNKNOWN_PLANTER"


def _extract_planter_lines(text: str) -> list[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return []

    candidates: list[str] = []
    for index, line in enumerate(lines):
        if "WEEKLY PLANTERS REPORT" in line.upper() and index + 1 < len(lines):
            candidates.append(lines[index + 1])

    if not candidates:
        for line in lines:
            if PLANTER_LINE_PATTERN.match(line):
                candidates.append(line)

    seen: set[str] = set()
    unique: list[str] = []
    for line in candidates:
        if line not in seen:
            seen.add(line)
            unique.append(line)
    return unique


def _parse_planter_infos(text: str) -> list[PlanterInfo]:
    entries: list[PlanterInfo] = []
    seen_keys: set[tuple[str, str, str, str]] = set()

    for planter_line in _extract_planter_lines(text):
        match = PLANTER_LINE_PATTERN.match(planter_line)
        if not match:
            continue
        planter_code, planter_name, hacienda_code, hacienda_address = match.groups()
        item = PlanterInfo(
            planter_code=planter_code,
            planter_name=_normalize_spaces(planter_name),
            hacienda_code=hacienda_code,
            hacienda_address=_normalize_spaces(hacienda_address),
        )
        key = (item.planter_code, item.planter_name, item.hacienda_code, item.hacienda_address)
        if key not in seen_keys:
            seen_keys.add(key)
            entries.append(item)

    return entries


# ---------------------------------------------------------------------------
# Split detection
# ---------------------------------------------------------------------------

def _find_dynamic_split_y(page, page_height: float) -> float | None:
    words = page.extract_words(keep_blank_chars=False, use_text_flow=True)
    if not words:
        return None

    line_words: dict[float, list[tuple[float, str]]] = {}
    for word in words:
        text = str(word.get("text", "")).strip().upper()
        if not text:
            continue
        top = round(float(word.get("top", 0.0)), 1)
        line_words.setdefault(top, []).append((float(word.get("x0", 0.0)), text))

    header_tops: list[float] = []
    footer_tops: list[float] = []

    for top, items in line_words.items():
        items.sort(key=lambda item: item[0])
        line_text = " ".join(token for _, token in items)
        normalized = re.sub(r"[^A-Z0-9]", "", line_text)
        tokens = {re.sub(r"[^A-Z0-9]", "", token) for _, token in items}
        tokens.discard("")

        if HEADER_ANCHOR_NORM in normalized or {"WEEKLY", "PLANTERS", "REPORT"}.issubset(tokens):
            header_tops.append(top)
        if FOOTER_ANCHOR_NORM in normalized or FOOTER_ROLE_NORM in normalized:
            footer_tops.append(top)

    header_tops.sort()
    footer_tops.sort()

    split_y: float | None = None
    if len(header_tops) >= 2:
        footer_between = next(
            (t for t in footer_tops if header_tops[0] < t < header_tops[1]), None
        )
        split_y = (footer_between + header_tops[1]) / 2 if footer_between else (header_tops[0] + header_tops[1]) / 2
    elif len(footer_tops) >= 2:
        split_y = (footer_tops[0] + footer_tops[1]) / 2

    if split_y is None:
        return None
    if split_y < page_height * 0.15 or split_y > page_height * 0.85:
        return None
    return split_y


def _get_segments(page, *, split_mode: str, fixed_split_ratio: float) -> dict[str, tuple[float, float, float, float]]:
    w, h = page.width, page.height
    if split_mode == "none":
        return {"full": (0.0, 0.0, w, h)}
    if split_mode == "dynamic":
        split_y = _find_dynamic_split_y(page, h)
        if split_y is not None:
            return {"top": (0.0, 0.0, w, split_y), "bottom": (0.0, split_y, w, h)}
    split_y = h * fixed_split_ratio
    return {"top": (0.0, 0.0, w, split_y), "bottom": (0.0, split_y, w, h)}


# ---------------------------------------------------------------------------
# PDF writing — NO deepcopy, use add_page + cropbox directly
# ---------------------------------------------------------------------------

def _write_segment_pdf(
    pypdf_page: PageObject,
    bbox: tuple[float, float, float, float],
    output_path: Path,
) -> None:
    left   = float(pypdf_page.mediabox.left)
    right  = float(pypdf_page.mediabox.right)
    bottom = float(pypdf_page.mediabox.bottom)
    top    = float(pypdf_page.mediabox.top)

    bbox_x0, bbox_top, bbox_x1, bbox_bottom = bbox

    # pdfplumber top-left → pypdf bottom-left coordinate conversion
    new_left   = max(left,   min(left   + bbox_x0,     right))
    new_right  = max(left,   min(left   + bbox_x1,     right))
    new_top    = max(bottom, min(top    - bbox_top,     top))
    new_bottom = max(bottom, min(top    - bbox_bottom,  top))

    if new_right <= new_left or new_top <= new_bottom:
        raise ValueError("Computed crop box is invalid for the selected segment.")

    crop = RectangleObject((new_left, new_bottom, new_right, new_top))

    writer = PdfWriter()
    writer.add_page(pypdf_page)          # add_page does NOT deepcopy
    writer.pages[0].cropbox  = crop
    writer.pages[0].mediabox = crop

    with output_path.open("wb") as fh:
        writer.write(fh)


# ---------------------------------------------------------------------------
# Output path helpers
# ---------------------------------------------------------------------------

def _build_output_path(
    output_dir: Path,
    planter_name: str,
    week_number: str,
    crop_year: str,
    source_page: int,
    segment: str,
) -> Path:
    base = f"{_safe_filename(planter_name)}_W{week_number}_CY{crop_year}"
    candidate = output_dir / f"{base}.pdf"
    if not candidate.exists():
        return candidate
    return output_dir / f"{base}_p{source_page}_{segment}.pdf"


def _build_combined_planter_name(planter_infos: list[PlanterInfo]) -> str:
    names = [p.planter_name for p in planter_infos if p.planter_name]
    if not names:
        return "MULTIPLE_PLANTERS"
    if len(names) <= 2:
        return "_AND_".join(names)
    return f"{names[0]}_AND_{len(names) - 1}_OTHERS"


# ---------------------------------------------------------------------------
# Per-page worker  (runs in a subprocess when multiprocessing is used)
# ---------------------------------------------------------------------------

def _process_page(
    page_index: int,
    input_pdf_path: str,
    week_number: str,
    crop_year: str,
    output_dir: str,
    split_mode: str,
    fixed_split_ratio: float,
) -> list[dict]:
    """
    Process a single page and return a list of record dicts.
    Keeps each worker's memory footprint small — opens the PDF once per worker
    process (ProcessPoolExecutor reuses processes across tasks).
    """
    out = Path(output_dir)
    records: list[dict] = []

    with pdfplumber.open(input_pdf_path) as plumber_pdf:
        pypdf_reader = PdfReader(input_pdf_path)
        page = plumber_pdf.pages[page_index]
        pypdf_page = pypdf_reader.pages[page_index]

        segments = _get_segments(page, split_mode=split_mode, fixed_split_ratio=fixed_split_ratio)

        for segment_name, bbox in segments.items():
            segment_page = page.crop(bbox)
            text = segment_page.extract_text() or ""
            planter_infos = _parse_planter_infos(text)

            if not planter_infos:
                continue

            if split_mode == "none" and len(planter_infos) > 1:
                combined_name = _build_combined_planter_name(planter_infos)
                output_path = _build_output_path(out, combined_name, week_number, crop_year, page_index + 1, segment_name)
                _write_segment_pdf(pypdf_page, bbox, output_path)
                for info in planter_infos:
                    records.append(asdict(OutputRecord(
                        source_page=page_index + 1,
                        segment=segment_name,
                        planter_code=info.planter_code,
                        planter_name=info.planter_name,
                        hacienda_code=info.hacienda_code,
                        hacienda_address=info.hacienda_address,
                        output_file=str(output_path),
                    )))
                continue

            info = planter_infos[0]
            output_path = _build_output_path(out, info.planter_name, week_number, crop_year, page_index + 1, segment_name)
            _write_segment_pdf(pypdf_page, bbox, output_path)
            records.append(asdict(OutputRecord(
                source_page=page_index + 1,
                segment=segment_name,
                planter_code=info.planter_code,
                planter_name=info.planter_name,
                hacienda_code=info.hacienda_code,
                hacienda_address=info.hacienda_address,
                output_file=str(output_path),
            )))

    return records


# ---------------------------------------------------------------------------
# Main processing entry point
# ---------------------------------------------------------------------------

def process_pdf(
    input_pdf_path: Path,
    week_number: str,
    crop_year: str,
    output_dir: Path,
    split_mode: str = "none",
    fixed_split_ratio: float = 0.5,
    max_pages: int | None = None,
) -> list[OutputRecord]:
    if not input_pdf_path.exists():
        raise FileNotFoundError(f"Input PDF not found: {input_pdf_path}")
    if not 0.05 <= fixed_split_ratio <= 0.95:
        raise ValueError("fixed_split_ratio must be between 0.05 and 0.95")
    if split_mode not in {"dynamic", "fixed", "none"}:
        raise ValueError("split_mode must be one of: dynamic, fixed, none")

    output_dir.mkdir(parents=True, exist_ok=True)

    total_pages = len(PdfReader(str(input_pdf_path)).pages)
    page_indices = list(range(min(total_pages, max_pages) if max_pages else total_pages))

    all_record_dicts: list[dict] = []

    with ProcessPoolExecutor() as executor:
        futures = {
            executor.submit(
                _process_page,
                idx,
                str(input_pdf_path),
                week_number,
                crop_year,
                str(output_dir),
                split_mode,
                fixed_split_ratio,
            ): idx
            for idx in page_indices
        }

        for future in as_completed(futures):
            try:
                all_record_dicts.extend(future.result())
            except Exception as exc:
                page_idx = futures[future]
                sys.stderr.write(f"Warning: page {page_idx + 1} failed: {exc}\n")

    # Reconstruct dataclass objects and sort by source_page for stable output
    records = [OutputRecord(**d) for d in all_record_dicts]
    records.sort(key=lambda r: (r.source_page, r.segment))
    return records


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _build_cli_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Split a weekly planters PDF into one planter per output PDF and "
            "rename files using planter name, week number, and crop year."
        )
    )
    parser.add_argument("pdf_path",      help="Path to the source PDF file")
    parser.add_argument("week_number",   help="Week number used in output file naming")
    parser.add_argument("crop_year",     help="Crop year used in output file naming (example: 2025-2026)")
    parser.add_argument("output_folder", help="Folder where split PDFs will be saved")
    parser.add_argument("--max-pages",        type=int,   default=None)
    parser.add_argument("--workers",          type=int,   default=4,      help="Parallel worker processes (default: 4)")
    parser.add_argument("--split-mode",       choices=["dynamic", "fixed", "none"], default="none")
    parser.add_argument("--fixed-split-ratio",type=float, default=0.5)
    return parser


def main() -> int:
    args = _build_cli_parser().parse_args()

    try:
        results = process_pdf(
            input_pdf_path=Path(args.pdf_path),
            week_number=str(args.week_number),
            crop_year=str(args.crop_year),
            output_dir=Path(args.output_folder),
            split_mode=str(args.split_mode),
            fixed_split_ratio=float(args.fixed_split_ratio),
            max_pages=args.max_pages
        )
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}), file=sys.stderr)
        return 1

    print(json.dumps(
        {
            "ok": True,
            "processed_count": len(results),
            "files": [asdict(r) for r in results],
        },
        ensure_ascii=True,
        indent=2,
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
