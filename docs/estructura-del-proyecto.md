# Estructura del proyecto

Este documento propone una organización básica para el Banco Digital de Lengua de Señas Peruana.

La estructura del repositorio busca separar los archivos principales, los datos, las imágenes y los documentos de respaldo, de manera que el proyecto pueda mantenerse ordenado, revisarse con facilidad y ampliarse progresivamente.

Estructura sugerida:

```text
banco-digital-lsp/
│
├── index.html
├── estilos.css
├── app.js
├── creditos.html
├── accesibilidad.html
├── contacto.html
├── faq.html
├── README.md
├── LICENSE
│
├── datos/
│   └── diccionario_lsp.json
│
├── imagenes/
│   └── categorias_de_senas/
│
└── docs/
    ├── alcance-pedagogico.md
    ├── fuentes-y-creditos.md
    ├── uso-permitido.md
    ├── respaldo-institucional.md
    ├── estructura-del-proyecto.md
    └── bitacora-de-cambios.md
```

Descripción de archivos y carpetas:

`index.html` contiene la estructura principal de la aplicación web.

`estilos.css` define la apariencia visual, el diseño responsivo, la organización de tarjetas, el contraste, los espaciados y la presentación general del banco digital.

`app.js` contiene la lógica de carga de datos, búsqueda, filtros por categoría, visualización de tarjetas y funcionamiento interactivo.

`creditos.html` presenta el reconocimiento de autoría, apoyo institucional y fuente del material visual de referencia.

`accesibilidad.html` informa los criterios de accesibilidad considerados en la plataforma y las mejoras que pueden incorporarse progresivamente.

`contacto.html` permite orientar observaciones, sugerencias o reportes de errores vinculados al banco digital.

`faq.html` reúne preguntas frecuentes sobre el uso del recurso, su finalidad y sus límites.

`datos/` almacena el archivo JSON con las señas, categorías, rutas de imágenes y descripciones asociadas.

`imagenes/` contiene los recursos visuales organizados por categorías. Cada imagen debe mantener relación directa con los datos registrados en el archivo JSON.

`docs/` reúne documentos de respaldo pedagógico, autoral, institucional y organizativo.

Para mantener el repositorio ordenado, se recomienda usar nombres de archivo en minúsculas, sin tildes, sin espacios y con guiones medios o guiones bajos según la estructura ya utilizada. También se recomienda verificar que los nombres de las imágenes coincidan exactamente con las rutas indicadas en `diccionario_lsp.json`.

Cada nueva categoría, seña o recurso complementario debe registrar su fuente, fecha de incorporación y revisión pedagógica cuando corresponda.