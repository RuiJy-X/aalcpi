import argparse
import json
import multiprocessing
import os
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
# PDF writing
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

    new_left   = max(left,   min(left   + bbox_x0,     right))
    new_right  = max(left,   min(left   + bbox_x1,     right))
    new_top    = max(bottom, min(top    - bbox_top,     top))
    new_bottom = max(bottom, min(top    - bbox_bottom,  top))

    if new_right <= new_left or new_top <= new_bottom:
        raise ValueError("Computed crop box is invalid for the selected segment.")

    crop = RectangleObject((new_left, new_bottom, new_right, new_top))

    writer = PdfWriter()
    writer.add_page(pypdf_page)
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
# Page-range batch worker — one PDF open per worker batch
# ---------------------------------------------------------------------------

def _process_page_range(
    page_indices: list[int],
    input_pdf_path: str,
    master_pdf_path: str,
) -> list[dict]:
    """
    Process a batch of pages in a single worker invocation.
    Extracts planter metadata from pages without writing hundreds of physical split PDF files.
    """
    records: list[dict] = []

    with pdfplumber.open(input_pdf_path) as plumber_pdf:
        for page_index in page_indices:
            try:
                page = plumber_pdf.pages[page_index]
                text = page.extract_text() or ""
                planter_infos = _parse_planter_infos(text)

                if not planter_infos:
                    continue

                for info in planter_infos:
                    records.append(asdict(OutputRecord(
                        source_page=page_index + 1,
                        segment="full",
                        planter_code=info.planter_code,
                        planter_name=info.planter_name,
                        hacienda_code=info.hacienda_code,
                        hacienda_address=info.hacienda_address,
                        output_file=master_pdf_path,
                    )))

            except Exception as exc:
                sys.stderr.write(f"Warning: page {page_index + 1} failed: {exc}\n")

    return records


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _chunk(lst: list, size: int) -> list[list]:
    return [lst[i:i + size] for i in range(0, len(lst), size)]


def extract_single_page(input_pdf_path: Path, page_number: int, output_pdf_path: Path) -> None:
    """
    Extract a single page from a master PDF and write it to an output file.
    page_number is 1-indexed.
    """
    reader = PdfReader(str(input_pdf_path))
    writer = PdfWriter()
    target_idx = max(0, min(page_number - 1, len(reader.pages) - 1))
    writer.add_page(reader.pages[target_idx])

    output_pdf_path.parent.mkdir(parents=True, exist_ok=True)
    with output_pdf_path.open("wb") as fh:
        writer.write(fh)


# ---------------------------------------------------------------------------
# Main processing entry point
# ---------------------------------------------------------------------------

def process_pdf(
    input_pdf_path: Path,
    week_number: str,
    crop_year: str,
    output_dir: Path,
    max_pages: int | None = None,
    workers: int = 2,
    chunk_size: int = 50,
) -> list[OutputRecord]:
    if not input_pdf_path.exists():
        raise FileNotFoundError(f"Input PDF not found: {input_pdf_path}")

    output_dir.mkdir(parents=True, exist_ok=True)

    # Save exactly 1 master PDF file for this week/crop-year
    master_pdf_path = output_dir / "master.pdf"
    import shutil
    shutil.copy2(str(input_pdf_path), str(master_pdf_path))

    resolved_workers = workers if workers > 0 else max(1, (os.cpu_count() or 1))

    total_pages = len(PdfReader(str(input_pdf_path)).pages)
    page_indices = list(range(min(total_pages, max_pages) if max_pages else total_pages))
    batches = _chunk(page_indices, chunk_size)

    all_record_dicts: list[dict] = []

    # Fast path: single batch or single worker -> run directly in-process
    if len(batches) <= 1 or resolved_workers <= 1:
        for batch in batches:
            all_record_dicts.extend(
                _process_page_range(batch, str(input_pdf_path), str(master_pdf_path))
            )
    else:
        # Multi-batch parallel processing with in-process fallback
        failed_batches: list[list[int]] = []
        try:
            with ProcessPoolExecutor(max_workers=min(resolved_workers, len(batches))) as executor:
                futures = {
                    executor.submit(
                        _process_page_range,
                        batch,
                        str(input_pdf_path),
                        str(master_pdf_path),
                    ): batch
                    for batch in batches
                }

                for future in as_completed(futures):
                    batch = futures[future]
                    try:
                        all_record_dicts.extend(future.result())
                    except Exception as exc:
                        sys.stderr.write(
                            f"Warning: batch pages {batch[0]+1}–{batch[-1]+1} failed in worker pool: {exc}. Retrying in-process...\n"
                        )
                        failed_batches.append(batch)
        except Exception as pool_exc:
            sys.stderr.write(f"Warning: Process pool encountered error: {pool_exc}. Retrying remaining batches in-process...\n")
            # If the entire pool failed, process all batches that haven't completed
            processed_pages = {d.get("source_page", 0) - 1 for d in all_record_dicts}
            for batch in batches:
                if any(p not in processed_pages for p in batch):
                    failed_batches.append(batch)

        for batch in failed_batches:
            try:
                all_record_dicts.extend(
                    _process_page_range(batch, str(input_pdf_path), str(master_pdf_path))
                )
            except Exception as batch_exc:
                sys.stderr.write(
                    f"Error: in-process retry for pages {batch[0]+1}–{batch[-1]+1} failed: {batch_exc}\n"
                )

    records = [OutputRecord(**d) for d in all_record_dicts]
    records.sort(key=lambda r: (r.source_page, r.segment))
    return records


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    # Check for extract subcommand
    if len(sys.argv) >= 4 and sys.argv[1] == "extract":
        input_pdf = Path(sys.argv[2])
        try:
            page_num = int(sys.argv[3])
        except ValueError:
            sys.stderr.write("Invalid page number\n")
            return 1
        output_pdf = Path(sys.argv[4]) if len(sys.argv) >= 5 else input_pdf.parent / f"page_{page_num}.pdf"
        try:
            extract_single_page(input_pdf, page_num, output_pdf)
            return 0
        except Exception as exc:
            sys.stderr.write(f"Extract failed: {exc}\n")
            return 1

    parser = argparse.ArgumentParser(
        description=(
            "Index a weekly planters PDF and save a master copy with page mapping."
        )
    )
    parser.add_argument("pdf_path",      help="Path to the source PDF file")
    parser.add_argument("week_number",   help="Week number used in metadata")
    parser.add_argument("crop_year",     help="Crop year used in metadata (e.g. 2025-2026)")
    parser.add_argument("output_folder", help="Folder where master PDF will be saved")
    parser.add_argument("--max-pages",  type=int, default=None)
    parser.add_argument(
        "--workers",
        type=int,
        default=0,
        help="Worker processes (default: 0 = auto-detect from CPU count)",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=50,
        help="Pages per worker batch (default: 50)",
    )

    args = parser.parse_args()

    try:
        results = process_pdf(
            input_pdf_path=Path(args.pdf_path),
            week_number=str(args.week_number),
            crop_year=str(args.crop_year),
            output_dir=Path(args.output_folder),
            max_pages=args.max_pages,
            workers=args.workers,
            chunk_size=args.chunk_size,
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
    multiprocessing.freeze_support()
    raise SystemExit(main())