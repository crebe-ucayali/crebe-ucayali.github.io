import json
import csv
from pathlib import Path

RUTA_JSON = Path("datos/diccionario_lsp.json")
RUTA_SALIDA = Path("descripciones_pendientes.csv")

with RUTA_JSON.open("r", encoding="utf-8") as archivo:
    datos = json.load(archivo)

pendientes = []

for item in datos:
    descripcion = str(item.get("descripcion", "")).strip()

    if not descripcion:
        pendientes.append({
            "id": item.get("id", ""),
            "categoria": item.get("categoria", ""),
            "palabra": item.get("palabra", ""),
            "archivo_imagen": item.get("archivo_imagen", ""),
            "descripcion_actual": descripcion,
            "descripcion_corregida": ""
        })

with RUTA_SALIDA.open("w", encoding="utf-8-sig", newline="") as archivo:
    columnas = [
        "id",
        "categoria",
        "palabra",
        "archivo_imagen",
        "descripcion_actual",
        "descripcion_corregida"
    ]

    escritor = csv.DictWriter(
        archivo,
        fieldnames=columnas,
        delimiter=";"
    )

    escritor.writeheader()
    escritor.writerows(pendientes)

print("Reporte generado correctamente.")
print(f"Archivo creado: {RUTA_SALIDA}")
print(f"Entradas sin descripción: {len(pendientes)}")
print("Separador usado: punto y coma (;)")