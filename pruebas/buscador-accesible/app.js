(() => {
  "use strict";

  const DATA_URL = "datos/recursos.json?v=1";
  const MAX_SUGERENCIAS = 7;

  const elementos = {
    entrada: document.querySelector("#buscador"),
    listaSugerencias: document.querySelector("#lista-sugerencias"),
    estadoBuscador: document.querySelector("#estado-buscador"),
    estadoCatalogo: document.querySelector("#estado-catalogo"),
    limpiar: document.querySelector("#limpiar"),
    filtroModulo: document.querySelector("#filtro-modulo"),
    filtroCategoria: document.querySelector("#filtro-categoria"),
    filtroTipo: document.querySelector("#filtro-tipo"),
    restablecer: document.querySelector("#restablecer-filtros"),
    contador: document.querySelector("#contador-resultados"),
    resumen: document.querySelector("#resumen-filtros"),
    listaResultados: document.querySelector("#lista-resultados"),
    botonesRapidos: document.querySelectorAll("[data-consulta]")
  };

  let recursos = [];
  let resultadosActuales = [];
  let sugerencias = [];
  let indiceActivo = -1;

  const normalizar = (texto = "") => String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const etiquetasTexto = (recurso) => Array.isArray(recurso.etiquetas)
    ? recurso.etiquetas.join(" ")
    : String(recurso.etiquetas || "");

  const esRecursoValido = (recurso) => Boolean(
    recurso &&
    typeof recurso.id === "string" &&
    typeof recurso.titulo === "string" &&
    typeof recurso.modulo === "string" &&
    typeof recurso.categoria === "string" &&
    typeof recurso.tipo === "string" &&
    typeof recurso.descripcion === "string" &&
    typeof recurso.url === "string"
  );

  const puntuar = (recurso, consulta) => {
    if (!consulta) return 1;

    const titulo = normalizar(recurso.titulo);
    const modulo = normalizar(recurso.modulo);
    const categoria = normalizar(recurso.categoria);
    const tipo = normalizar(recurso.tipo);
    const descripcion = normalizar(recurso.descripcion);
    const etiquetas = normalizar(etiquetasTexto(recurso));
    const palabras = consulta.split(/\s+/).filter(Boolean);

    let puntaje = 0;
    if (titulo === consulta) puntaje += 14;
    else if (titulo.startsWith(consulta)) puntaje += 10;
    else if (titulo.includes(consulta)) puntaje += 7;

    if (modulo === consulta) puntaje += 6;
    if (categoria.includes(consulta)) puntaje += 4;
    if (tipo.includes(consulta)) puntaje += 3;
    if (descripcion.includes(consulta)) puntaje += 2;
    if (etiquetas.includes(consulta)) puntaje += 4;

    palabras.forEach((palabra) => {
      if (titulo.includes(palabra)) puntaje += 3;
      if (modulo.includes(palabra)) puntaje += 2;
      if (categoria.includes(palabra)) puntaje += 2;
      if (tipo.includes(palabra)) puntaje += 1;
      if (descripcion.includes(palabra)) puntaje += 1;
      if (etiquetas.includes(palabra)) puntaje += 2;
    });

    return puntaje;
  };

  const cerrarSugerencias = () => {
    elementos.listaSugerencias.hidden = true;
    elementos.entrada.setAttribute("aria-expanded", "false");
    elementos.entrada.setAttribute("aria-activedescendant", "");
    indiceActivo = -1;
  };

  const actualizarSugerenciaActiva = () => {
    const opciones = [...elementos.listaSugerencias.querySelectorAll('[role="option"]')];
    opciones.forEach((opcion, indice) => {
      const activa = indice === indiceActivo;
      opcion.classList.toggle("activo", activa);
      opcion.setAttribute("aria-selected", activa ? "true" : "false");
      if (activa) {
        elementos.entrada.setAttribute("aria-activedescendant", opcion.id);
        opcion.scrollIntoView({ block: "nearest" });
      }
    });
  };

  const crearOpcionFiltro = (valor) => {
    const opcion = document.createElement("option");
    opcion.value = valor;
    opcion.textContent = valor;
    return opcion;
  };

  const poblarFiltro = (select, valores) => {
    const opcionInicial = select.options[0];
    select.replaceChildren(opcionInicial);
    valores.forEach((valor) => select.appendChild(crearOpcionFiltro(valor)));
  };

  const prepararFiltros = () => {
    const modulos = [...new Set(recursos.map((recurso) => recurso.modulo))].sort((a, b) => a.localeCompare(b, "es"));
    const categorias = [...new Set(recursos.map((recurso) => recurso.categoria))].sort((a, b) => a.localeCompare(b, "es"));
    const tipos = [...new Set(recursos.map((recurso) => recurso.tipo))].sort((a, b) => a.localeCompare(b, "es"));

    poblarFiltro(elementos.filtroModulo, modulos);
    poblarFiltro(elementos.filtroCategoria, categorias);
    poblarFiltro(elementos.filtroTipo, tipos);
  };

  const seleccionarSugerencia = (recurso) => {
    elementos.entrada.value = recurso.titulo;
    elementos.limpiar.hidden = false;
    cerrarSugerencias();
    aplicarBusqueda();
    elementos.estadoBuscador.textContent = `Recurso seleccionado: ${recurso.titulo}.`;
    const primerEnlace = elementos.listaResultados.querySelector("a");
    if (primerEnlace) primerEnlace.focus();
  };

  const renderizarSugerencias = () => {
    elementos.listaSugerencias.replaceChildren();

    if (!sugerencias.length) {
      cerrarSugerencias();
      return;
    }

    sugerencias.forEach((recurso, indice) => {
      const item = document.createElement("li");
      const boton = document.createElement("button");
      boton.type = "button";
      boton.id = `sugerencia-${indice}`;
      boton.setAttribute("role", "option");
      boton.setAttribute("aria-selected", "false");

      const modulo = document.createElement("span");
      modulo.className = "tipo";
      modulo.textContent = recurso.modulo;

      const texto = document.createElement("span");
      texto.className = "texto-sugerencia";

      const titulo = document.createElement("strong");
      titulo.textContent = recurso.titulo;

      const detalle = document.createElement("span");
      detalle.textContent = `${recurso.categoria} · ${recurso.tipo}`;

      texto.append(titulo, detalle);
      boton.append(modulo, texto);
      boton.addEventListener("mousedown", (evento) => evento.preventDefault());
      boton.addEventListener("click", () => seleccionarSugerencia(recurso));
      item.appendChild(boton);
      elementos.listaSugerencias.appendChild(item);
    });

    elementos.listaSugerencias.hidden = false;
    elementos.entrada.setAttribute("aria-expanded", "true");
    actualizarSugerenciaActiva();
  };

  const actualizarSugerencias = () => {
    const consulta = normalizar(elementos.entrada.value);

    if (!consulta) {
      sugerencias = [];
      cerrarSugerencias();
      elementos.estadoBuscador.textContent = "Puede escribir una palabra o utilizar los filtros.";
      return;
    }

    sugerencias = recursos
      .map((recurso) => ({ recurso, puntaje: puntuar(recurso, consulta) }))
      .filter((resultado) => resultado.puntaje > 0)
      .sort((a, b) => b.puntaje - a.puntaje || a.recurso.titulo.localeCompare(b.recurso.titulo, "es"))
      .slice(0, MAX_SUGERENCIAS)
      .map((resultado) => resultado.recurso);

    indiceActivo = -1;
    renderizarSugerencias();
    elementos.estadoBuscador.textContent = sugerencias.length === 0
      ? "No se encontraron sugerencias. Revise los resultados o pruebe otra palabra."
      : `${sugerencias.length} ${sugerencias.length === 1 ? "sugerencia disponible" : "sugerencias disponibles"}.`;
  };

  const crearResultado = (recurso) => {
    const articulo = document.createElement("article");
    articulo.className = "resultado-tarjeta";
    articulo.dataset.id = recurso.id;

    const meta = document.createElement("div");
    meta.className = "resultado-meta";

    const modulo = document.createElement("span");
    modulo.textContent = recurso.modulo;

    const tipo = document.createElement("span");
    tipo.textContent = recurso.tipo;

    meta.append(modulo, tipo);

    const titulo = document.createElement("h3");
    titulo.textContent = recurso.titulo;

    const categoria = document.createElement("p");
    categoria.className = "resultado-categoria";
    categoria.textContent = recurso.categoria;

    const descripcion = document.createElement("p");
    descripcion.textContent = recurso.descripcion;

    const etiquetas = document.createElement("p");
    etiquetas.className = "resultado-etiquetas";
    const listaEtiquetas = Array.isArray(recurso.etiquetas) ? recurso.etiquetas.slice(0, 5) : [];
    etiquetas.textContent = listaEtiquetas.length ? `Temas: ${listaEtiquetas.join(", ")}` : "";

    const enlace = document.createElement("a");
    enlace.className = "resultado-enlace";
    enlace.href = recurso.url;
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.textContent = "Abrir recurso";
    enlace.setAttribute("aria-label", `Abrir ${recurso.titulo}`);

    articulo.append(meta, titulo, categoria, descripcion);
    if (etiquetas.textContent) articulo.appendChild(etiquetas);
    articulo.appendChild(enlace);

    return articulo;
  };

  const descripcionFiltros = () => {
    const partes = [];
    const consulta = elementos.entrada.value.trim();
    if (consulta) partes.push(`búsqueda “${consulta}”`);
    if (elementos.filtroModulo.value) partes.push(`módulo ${elementos.filtroModulo.value}`);
    if (elementos.filtroCategoria.value) partes.push(`categoría ${elementos.filtroCategoria.value}`);
    if (elementos.filtroTipo.value) partes.push(`tipo ${elementos.filtroTipo.value}`);
    return partes.length ? `Filtros activos: ${partes.join("; ")}.` : "Se muestran todos los recursos del catálogo.";
  };

  const renderizarResultados = () => {
    elementos.listaResultados.replaceChildren();

    elementos.contador.textContent = `${resultadosActuales.length} ${resultadosActuales.length === 1 ? "resultado" : "resultados"}`;
    elementos.resumen.textContent = descripcionFiltros();

    if (!resultadosActuales.length) {
      const vacio = document.createElement("p");
      vacio.className = "resultado-vacio";
      vacio.textContent = "No se encontraron recursos con la búsqueda y los filtros seleccionados.";
      elementos.listaResultados.appendChild(vacio);
      return;
    }

    resultadosActuales.forEach((recurso) => {
      elementos.listaResultados.appendChild(crearResultado(recurso));
    });
  };

  const aplicarBusqueda = () => {
    const consulta = normalizar(elementos.entrada.value);
    const modulo = elementos.filtroModulo.value;
    const categoria = elementos.filtroCategoria.value;
    const tipo = elementos.filtroTipo.value;

    elementos.limpiar.hidden = !consulta;

    resultadosActuales = recursos
      .filter((recurso) => !modulo || recurso.modulo === modulo)
      .filter((recurso) => !categoria || recurso.categoria === categoria)
      .filter((recurso) => !tipo || recurso.tipo === tipo)
      .map((recurso) => ({ recurso, puntaje: puntuar(recurso, consulta) }))
      .filter((resultado) => !consulta || resultado.puntaje > 0)
      .sort((a, b) => {
        if (consulta && b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
        return a.recurso.titulo.localeCompare(b.recurso.titulo, "es");
      })
      .map((resultado) => resultado.recurso);

    renderizarResultados();
  };

  const habilitarInterfaz = () => {
    [
      elementos.entrada,
      elementos.filtroModulo,
      elementos.filtroCategoria,
      elementos.filtroTipo,
      elementos.restablecer
    ].forEach((elemento) => {
      elemento.disabled = false;
    });
  };

  const mostrarErrorCarga = () => {
    elementos.estadoCatalogo.textContent = "No se pudo cargar el catálogo.";
    elementos.estadoCatalogo.classList.add("error");
    elementos.estadoBuscador.textContent = "Revise su conexión o recargue la página.";
    elementos.contador.textContent = "Error de carga";
    elementos.listaResultados.replaceChildren();
    const error = document.createElement("p");
    error.className = "resultado-vacio";
    error.textContent = "El archivo de recursos no está disponible en este momento.";
    elementos.listaResultados.appendChild(error);
  };

  const cargarCatalogo = async () => {
    try {
      const respuesta = await fetch(DATA_URL, { cache: "no-store" });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

      const datos = await respuesta.json();
      if (!Array.isArray(datos)) throw new Error("Formato de catálogo inválido");

      recursos = datos.filter(esRecursoValido);
      if (!recursos.length) throw new Error("Catálogo vacío");

      prepararFiltros();
      habilitarInterfaz();
      aplicarBusqueda();

      elementos.estadoCatalogo.classList.remove("error");
      elementos.estadoCatalogo.textContent = `${recursos.length} recursos cargados`;
      elementos.estadoBuscador.textContent = "Puede escribir una palabra o utilizar los filtros.";
    } catch (error) {
      console.error("No se pudo cargar el catálogo de EVA:", error);
      mostrarErrorCarga();
    }
  };

  elementos.entrada.addEventListener("input", () => {
    actualizarSugerencias();
    aplicarBusqueda();
  });

  elementos.entrada.addEventListener("keydown", (evento) => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      if (elementos.listaSugerencias.hidden) actualizarSugerencias();
      if (!sugerencias.length) return;
      indiceActivo = (indiceActivo + 1) % sugerencias.length;
      actualizarSugerenciaActiva();
    }

    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      if (!sugerencias.length) return;
      indiceActivo = indiceActivo <= 0 ? sugerencias.length - 1 : indiceActivo - 1;
      actualizarSugerenciaActiva();
    }

    if (evento.key === "Enter") {
      if (indiceActivo >= 0 && sugerencias[indiceActivo]) {
        evento.preventDefault();
        seleccionarSugerencia(sugerencias[indiceActivo]);
      } else {
        cerrarSugerencias();
        aplicarBusqueda();
      }
    }

    if (evento.key === "Escape") {
      cerrarSugerencias();
      elementos.estadoBuscador.textContent = "Lista de sugerencias cerrada.";
    }
  });

  elementos.limpiar.addEventListener("click", () => {
    elementos.entrada.value = "";
    elementos.limpiar.hidden = true;
    cerrarSugerencias();
    aplicarBusqueda();
    elementos.estadoBuscador.textContent = "Búsqueda restablecida.";
    elementos.entrada.focus();
  });

  [
    elementos.filtroModulo,
    elementos.filtroCategoria,
    elementos.filtroTipo
  ].forEach((select) => {
    select.addEventListener("change", () => {
      cerrarSugerencias();
      aplicarBusqueda();
    });
  });

  elementos.restablecer.addEventListener("click", () => {
    elementos.entrada.value = "";
    elementos.filtroModulo.value = "";
    elementos.filtroCategoria.value = "";
    elementos.filtroTipo.value = "";
    elementos.limpiar.hidden = true;
    cerrarSugerencias();
    aplicarBusqueda();
    elementos.estadoBuscador.textContent = "Búsqueda y filtros restablecidos.";
    elementos.entrada.focus();
  });

  elementos.botonesRapidos.forEach((boton) => {
    boton.addEventListener("click", () => {
      elementos.entrada.value = boton.dataset.consulta || "";
      actualizarSugerencias();
      aplicarBusqueda();
      elementos.entrada.focus();
    });
  });

  document.addEventListener("click", (evento) => {
    if (!evento.target.closest(".campo-autocompletado")) cerrarSugerencias();
  });

  cargarCatalogo();
})();
