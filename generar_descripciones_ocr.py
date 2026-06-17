from __future__ import annotations

import argparse
import csv
import re
import shutil
import subprocess
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = BASE_DIR / "descripciones_pendientes.csv"
DEFAULT_OUTPUT = BASE_DIR / "descripciones_ocr.csv"
IMAGE_ROOT = BASE_DIR / "imagenes"

INPUT_COLUMNS = [
    "id",
    "categoria",
    "palabra",
    "archivo_imagen",
    "descripcion_actual",
    "descripcion_corregida",
]

OUTPUT_COLUMNS = [
    "id",
    "categoria",
    "palabra",
    "archivo_imagen",
    "descripcion_actual",
    "descripcion_ocr",
    "descripcion_corregida",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Genera descripciones_ocr.csv intentando extraer texto visible "
            "desde las imagenes indicadas en descripciones_pendientes.csv."
        )
    )
    parser.add_argument(
        "--entrada",
        default=str(DEFAULT_INPUT),
        help="CSV de entrada. Por defecto: descripciones_pendientes.csv",
    )
    parser.add_argument(
        "--salida",
        default=str(DEFAULT_OUTPUT),
        help="CSV de salida. Por defecto: descripciones_ocr.csv",
    )
    parser.add_argument(
        "--tesseract",
        default=None,
        help="Ruta al ejecutable de Tesseract, si no esta en PATH.",
    )
    parser.add_argument(
        "--idiomas",
        default="spa+eng",
        help="Idiomas OCR para Tesseract. Por defecto: spa+eng",
    )
    return parser.parse_args()


def find_tesseract(explicit_path: str | None) -> str | None:
    candidates: list[str] = []
    if explicit_path:
        candidates.append(explicit_path)

    path_match = shutil.which("tesseract")
    if path_match:
        candidates.append(path_match)

    candidates.extend(
        [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        ]
    )

    for candidate in candidates:
        path = Path(candidate)
        if path.is_file():
            return str(path)

    return None


def sniff_delimiter(csv_path: Path) -> str:
    sample = csv_path.read_text(encoding="utf-8-sig", errors="replace")[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=";,")
        return dialect.delimiter
    except csv.Error:
        return ";"


def read_rows(csv_path: Path) -> tuple[list[dict[str, str]], str]:
    delimiter = sniff_delimiter(csv_path)
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=delimiter)
        missing_columns = [column for column in INPUT_COLUMNS if column not in (reader.fieldnames or [])]
        if missing_columns:
            missing = ", ".join(missing_columns)
            raise SystemExit(f"Faltan columnas requeridas en {csv_path.name}: {missing}")
        return list(reader), delimiter


def normalize_ocr_text(text: str) -> str:
    text = text.replace("\x0c", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def is_inside(path: Path, directory: Path) -> bool:
    try:
        path.relative_to(directory)
        return True
    except ValueError:
        return False


def resolve_image_path(raw_path: str) -> Path | None:
    if not raw_path.strip():
        return None

    image_path = (BASE_DIR / raw_path).resolve()
    image_root = IMAGE_ROOT.resolve()
    if not is_inside(image_path, image_root):
        return None

    if not image_path.is_file():
        return None

    return image_path


def run_tesseract(
    executable: str,
    image_path: Path,
    languages: str,
    psm: str,
) -> str:
    command = [
        executable,
        str(image_path),
        "stdout",
        "-l",
        languages,
        "--psm",
        psm,
    ]

    try:
        completed = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
    except OSError:
        return ""

    if completed.returncode != 0:
        return ""

    return normalize_ocr_text(completed.stdout)


def extract_text(executable: str | None, image_path: Path | None, languages: str) -> str:
    if not executable or image_path is None:
        return ""

    language_attempts = [languages]
    if languages != "eng":
        language_attempts.append("eng")

    for language in language_attempts:
        for psm in ("6", "11"):
            text = run_tesseract(executable, image_path, language, psm)
            if text:
                return text

    return ""


def build_output_rows(
    rows: list[dict[str, str]],
    executable: str | None,
    languages: str,
) -> list[dict[str, str]]:
    output_rows: list[dict[str, str]] = []

    for row in rows:
        image_path = resolve_image_path(row.get("archivo_imagen", ""))
        ocr_text = extract_text(executable, image_path, languages)
        output_rows.append(
            {
                "id": row.get("id", ""),
                "categoria": row.get("categoria", ""),
                "palabra": row.get("palabra", ""),
                "archivo_imagen": row.get("archivo_imagen", ""),
                "descripcion_actual": row.get("descripcion_actual", ""),
                "descripcion_ocr": ocr_text,
                "descripcion_corregida": row.get("descripcion_corregida", ""),
            }
        )

    return output_rows


def write_rows(csv_path: Path, rows: list[dict[str, str]], delimiter: str) -> None:
    with csv_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_COLUMNS, delimiter=delimiter)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    args = parse_args()
    input_path = Path(args.entrada).resolve()
    output_path = Path(args.salida).resolve()

    if input_path != DEFAULT_INPUT.resolve():
        raise SystemExit("Por seguridad, este script solo lee descripciones_pendientes.csv.")

    if output_path != DEFAULT_OUTPUT.resolve():
        raise SystemExit("Por seguridad, este script solo escribe descripciones_ocr.csv.")

    rows, delimiter = read_rows(input_path)
    tesseract = find_tesseract(args.tesseract)
    if not tesseract:
        print(
            "Aviso: no se encontro Tesseract. Se generara el CSV con descripcion_ocr vacia.",
            file=sys.stderr,
        )

    output_rows = build_output_rows(rows, tesseract, args.idiomas)
    write_rows(output_path, output_rows, delimiter)
    print(f"Archivo generado: {output_path.name}")
    print(f"Filas procesadas: {len(output_rows)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
