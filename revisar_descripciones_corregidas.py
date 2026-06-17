import csv
from pathlib import Path

RUTA_CSV = Path("descripciones_ocr.csv")

if not RUTA_CSV.exists():
    print("No se encontró descripciones_ocr.csv")
    raise SystemExit

with RUTA_CSV.open("r", encoding="utf-8-sig", newline="") as archivo:
    lector = csv.DictReader(archivo, delimiter=";")

    print("Columnas detectadas:")
    print(lector.fieldnames)

    total = 0
    con_ocr = 0
    con_corregida = 0

    for fila in lector:
        total += 1

        if fila.get("descripcion_ocr", "").strip():
            con_ocr += 1

        if fila.get("descripcion_corregida", "").strip():
            con_corregida += 1

print("Filas totales:", total)
print("Filas con descripcion_ocr:", con_ocr)
print("Filas con descripcion_corregida:", con_corregida)