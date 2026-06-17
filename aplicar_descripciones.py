import json
import csv
from pathlib import Path

RUTA_JSON = Path("datos/diccionario_lsp.json")
RUTA_CSV = Path("descripciones_ocr.csv")
RUTA_BACKUP = Path("datos/diccionario_lsp_backup.json")

if not RUTA_JSON.exists():
    print("ERROR: No se encontró el archivo datos/diccionario_lsp.json")
    print("Verifica que estés dentro de la carpeta banco-digital-lsp.")
    raise SystemExit

if not RUTA_CSV.exists():
    print("ERROR: No se encontró el archivo descripciones_pendientes.csv")
    print("Verifica que el CSV esté en la misma carpeta que este script.")
    raise SystemExit

with RUTA_JSON.open("r", encoding="utf-8") as archivo:
    datos = json.load(archivo)

RUTA_BACKUP.write_text(
    json.dumps(datos, ensure_ascii=False, indent=2),
    encoding="utf-8"
)

correcciones = {}

with RUTA_CSV.open("r", encoding="utf-8-sig", newline="") as archivo:
    lector = csv.DictReader(archivo, delimiter=";")

    for fila in lector:
        codigo = fila.get("id", "").strip()
        descripcion = fila.get("descripcion_corregida", "").strip()

        if codigo and descripcion:
            correcciones[codigo] = descripcion

actualizadas = 0

for item in datos:
    codigo = item.get("id", "")

    if codigo in correcciones:
        item["descripcion"] = correcciones[codigo]
        actualizadas += 1

with RUTA_JSON.open("w", encoding="utf-8") as archivo:
    json.dump(datos, archivo, ensure_ascii=False, indent=2)

print("Diccionario actualizado correctamente.")
print(f"Descripciones actualizadas: {actualizadas}")
print(f"Copia de seguridad creada en: {RUTA_BACKUP}")