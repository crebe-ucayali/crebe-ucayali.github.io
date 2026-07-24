(() => {
  "use strict";

  const recursos = [
    { titulo:"Banco Digital del Sistema Braille", tipo:"BDA", categoria:"Braille", descripcion:"Recursos para conocer la celda Braille, letras, números, signos y actividades prácticas.", url:"https://crebe-ucayali.github.io/banco-digital-accesible/" },
    { titulo:"Banco Digital de Lengua de Señas Peruana", tipo:"BDA", categoria:"Lengua de señas", descripcion:"Vocabulario visual y recursos educativos relacionados con la Lengua de Señas Peruana.", url:"https://crebe-ucayali.github.io/banco-digital-accesible/" },
    { titulo:"Tarjetas educativas accesibles", tipo:"Prueba", categoria:"Actividad", descripcion:"Demostración de tarjetas con preguntas, respuestas, categorías y navegación mediante teclado.", url:"../tarjetas-educativas/" },
    { titulo:"Rutinas visuales", tipo:"MEA", categoria:"Pictogramas", descripcion:"Materiales para anticipar actividades, organizar secuencias y apoyar la comprensión cotidiana.", url:"https://crebe-ucayali.github.io/materiales-educativos-accesibles/" },
    { titulo:"Tarjetas de emociones", tipo:"MEA", categoria:"Emociones", descripcion:"Recursos visuales para reconocer, expresar y conversar sobre diferentes estados emocionales.", url:"https://crebe-ucayali.github.io/materiales-educativos-accesibles/" },
    { titulo:"Capacitaciones CREBE", tipo:"CAP", categoria:"Capacitación", descripcion:"Talleres, sesiones, materiales formativos y recursos de acompañamiento pedagógico.", url:"https://crebe-ucayali.github.io/capacitaciones/" },
    { titulo:"Repositorio Accesible", tipo:"RA", categoria:"Documentos", descripcion:"Colección organizada de textos, orientaciones y materiales adaptados para la comunidad educativa.", url:"https://crebe-ucayali.github.io/repositorio-accesible/" },
    { titulo:"Noti Inclusivos", tipo:"NI", categoria:"Noticias", descripcion:"Noticias, comunicados y novedades vinculadas a la inclusión educativa y la atención a la diversidad.", url:"https://crebe-ucayali.github.io/noti-inclusivos/" },
    { titulo:"Directorio institucional", tipo:"AC", categoria:"Directorio", descripcion:"Información de contacto y ubicación de servicios e instituciones relacionadas con la atención educativa.", url:"https://crebe-ucayali.github.io/accesos-complementarios/directorios/directorio-institucional.html" },
    { titulo:"Calendario institucional", tipo:"AC", categoria:"Actividades", descripcion:"Consulta de actividades, capacitaciones y fechas organizadas por el CREBE Ucayali.", url:"https://crebe-ucayali.github.io/accesos-complementarios/recursos/calendario.html" }
  ];

  const entrada = document.querySelector("#buscador");
  const lista = document.querySelector("#lista-sugerencias");
  const estado = document.querySelector("#estado-buscador");
  const limpiar = document.querySelector("#limpiar");
  const detalle = document.querySelector("#detalle-recurso");
  const botonesRapidos = document.querySelectorAll("[data-consulta]");

  let resultados = [];
  let indiceActivo = -1;

  const normalizar = (texto) => String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const textoBuscable = (recurso) => normalizar([
    recurso.titulo,
    recurso.tipo,
    recurso.categoria,
    recurso.descripcion
  ].join(" "));

  const cerrarLista = () => {
    lista.hidden = true;
    entrada.setAttribute("aria-expanded", "false");
    entrada.setAttribute("aria-activedescendant", "");
    indiceActivo = -1;
  };

  const actualizarActivo = () => {
    const opciones = Array.from(lista.querySelectorAll("[role=option]"));
    opciones.forEach((opcion, indice) => {
      const activo = indice === indiceActivo;
      opcion.classList.toggle("activo", activo);
      opcion.setAttribute("aria-selected", activo ? "true" : "false");
      if (activo) {
        entrada.setAttribute("aria-activedescendant", opcion.id);
        opcion.scrollIntoView({ block:"nearest" });
      }
    });
  };

  const seleccionar = (recurso) => {
    entrada.value = recurso.titulo;
    limpiar.hidden = false;
    cerrarLista();
    estado.textContent = `Recurso seleccionado: ${recurso.titulo}.`;
    detalle.innerHTML = `
      <div class="detalle-meta">
        <span>${recurso.tipo}</span>
        <span>${recurso.categoria}</span>
      </div>
      <h3>${recurso.titulo}</h3>
      <p>${recurso.descripcion}</p>
      <a class="detalle-enlace" href="${recurso.url}" target="_blank" rel="noopener noreferrer">Abrir recurso</a>
    `;
    detalle.focus();
  };

  const renderizar = () => {
    lista.innerHTML = "";

    resultados.forEach((recurso, indice) => {
      const item = document.createElement("li");
      const boton = document.createElement("button");
      boton.type = "button";
      boton.id = `sugerencia-${indice}`;
      boton.setAttribute("role", "option");
      boton.setAttribute("aria-selected", "false");
      boton.innerHTML = `
        <span class="tipo">${recurso.tipo}</span>
        <span class="texto-sugerencia">
          <strong>${recurso.titulo}</strong>
          <span>${recurso.categoria}</span>
        </span>
      `;
      boton.addEventListener("mousedown", (evento) => evento.preventDefault());
      boton.addEventListener("click", () => seleccionar(recurso));
      item.appendChild(boton);
      lista.appendChild(item);
    });

    if (!resultados.length) {
      cerrarLista();
      estado.textContent = "No se encontraron recursos relacionados. Pruebe con otra palabra.";
      return;
    }

    lista.hidden = false;
    entrada.setAttribute("aria-expanded", "true");
    estado.textContent = resultados.length === 1
      ? "Se encontró 1 sugerencia."
      : `Se encontraron ${resultados.length} sugerencias.`;
    actualizarActivo();
  };

  const buscar = () => {
    const consulta = normalizar(entrada.value);
    limpiar.hidden = !consulta;

    if (!consulta) {
      resultados = [];
      cerrarLista();
      estado.textContent = "Ingrese una palabra para comenzar.";
      return;
    }

    const palabras = consulta.split(/\s+/).filter(Boolean);
    resultados = recursos
      .map((recurso) => {
        const texto = textoBuscable(recurso);
        const coincidencias = palabras.filter((palabra) => texto.includes(palabra)).length;
        const prioridadTitulo = normalizar(recurso.titulo).includes(consulta) ? 3 : 0;
        return { recurso, puntaje: coincidencias + prioridadTitulo };
      })
      .filter((resultado) => resultado.puntaje > 0)
      .sort((a, b) => b.puntaje - a.puntaje || a.recurso.titulo.localeCompare(b.recurso.titulo))
      .slice(0, 7)
      .map((resultado) => resultado.recurso);

    indiceActivo = -1;
    renderizar();
  };

  entrada.addEventListener("input", buscar);

  entrada.addEventListener("keydown", (evento) => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      if (lista.hidden) buscar();
      if (!resultados.length) return;
      indiceActivo = (indiceActivo + 1) % resultados.length;
      actualizarActivo();
    }

    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      if (!resultados.length) return;
      indiceActivo = indiceActivo <= 0 ? resultados.length - 1 : indiceActivo - 1;
      actualizarActivo();
    }

    if (evento.key === "Enter" && indiceActivo >= 0 && resultados[indiceActivo]) {
      evento.preventDefault();
      seleccionar(resultados[indiceActivo]);
    }

    if (evento.key === "Escape") {
      cerrarLista();
      estado.textContent = "Lista de sugerencias cerrada.";
    }
  });

  limpiar.addEventListener("click", () => {
    entrada.value = "";
    limpiar.hidden = true;
    cerrarLista();
    estado.textContent = "Búsqueda restablecida.";
    detalle.innerHTML = '<p class="detalle-vacio">Todavía no seleccionó ningún recurso.</p>';
    entrada.focus();
  });

  botonesRapidos.forEach((boton) => {
    boton.addEventListener("click", () => {
      entrada.value = boton.dataset.consulta || "";
      buscar();
      entrada.focus();
    });
  });

  document.addEventListener("click", (evento) => {
    if (!evento.target.closest(".campo-autocompletado")) cerrarLista();
  });
})();
