const formulario = document.querySelector("#formulario-noticias");
const entradaBusqueda = document.querySelector("#busqueda-noticias");
const listaNoticias = document.querySelector("#lista-noticias");
const estadoNoticias = document.querySelector("#estado-noticias");
const botonesTemas = document.querySelectorAll("[data-tema]");
const botonActualizar = document.querySelector("#actualizar-noticias");

const BUSQUEDA_INICIAL = "inclusión educativa Perú";
const LIMITE_NOTICIAS = 12;

function limpiarTexto(texto) {
  const elemento = document.createElement("textarea");
  elemento.innerHTML = texto || "";
  return elemento.value.replace(/<[^>]*>/g, "").trim();
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "Fecha no disponible";
  }

  const fechaNoticia = new Date(fecha);

  if (Number.isNaN(fechaNoticia.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(fechaNoticia);
}

function construirUrl(termino) {
  const busqueda = encodeURIComponent(termino);
  const rss = encodeURIComponent(
    `https://news.google.com/rss/search?q=${busqueda}&hl=es-419&gl=PE&ceid=PE:es-419`
  );

  return `https://api.rss2json.com/v1/api.json?rss_url=${rss}`;
}

function mostrarEstado(mensaje) {
  estadoNoticias.textContent = mensaje;
}

function crearTarjetaNoticia(noticia) {
  const articulo = document.createElement("article");
  articulo.className = "tarjeta-noticia";

  const fuente = noticia.author || "Fuente externa";
  const titulo = limpiarTexto(noticia.title);
  const descripcion = limpiarTexto(noticia.description).slice(0, 220);
  const fecha = formatearFecha(noticia.pubDate);

  articulo.innerHTML = `
    <p class="fuente-noticia">${fuente}</p>
    <h3>${titulo}</h3>
    <p class="fecha-noticia">${fecha}</p>
    <p>${descripcion}${descripcion.length >= 220 ? "..." : ""}</p>
    <a href="${noticia.link}" target="_blank" rel="noopener noreferrer">Leer noticia original</a>
  `;

  return articulo;
}

function mostrarNoticias(noticias, termino) {
  listaNoticias.innerHTML = "";

  if (!noticias.length) {
    mostrarEstado(`No se encontraron noticias recientes para "${termino}".`);
    return;
  }

  noticias.slice(0, LIMITE_NOTICIAS).forEach((noticia) => {
    listaNoticias.appendChild(crearTarjetaNoticia(noticia));
  });

  mostrarEstado(`Mostrando ${Math.min(noticias.length, LIMITE_NOTICIAS)} noticias para "${termino}".`);
}

async function cargarNoticias(termino) {
  const busqueda = termino.trim() || BUSQUEDA_INICIAL;
  entradaBusqueda.value = busqueda;
  listaNoticias.innerHTML = "";
  mostrarEstado(`Buscando noticias sobre "${busqueda}"...`);

  try {
    const respuesta = await fetch(construirUrl(busqueda));

    if (!respuesta.ok) {
      throw new Error("No fue posible conectar con el servicio de noticias.");
    }

    const datos = await respuesta.json();

    if (datos.status !== "ok" || !Array.isArray(datos.items)) {
      throw new Error("La fuente de noticias no devolvió resultados válidos.");
    }

    mostrarNoticias(datos.items, busqueda);
  } catch (error) {
    listaNoticias.innerHTML = `
      <div class="estado-carga error">
        No se pudieron cargar las noticias en este momento. Intenta actualizar o buscar con otra palabra clave.
      </div>
    `;
    mostrarEstado("Error al cargar noticias.");
  }
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  cargarNoticias(entradaBusqueda.value);
});

botonesTemas.forEach((boton) => {
  boton.addEventListener("click", () => {
    cargarNoticias(boton.dataset.tema);
  });
});

botonActualizar.addEventListener("click", () => {
  cargarNoticias(entradaBusqueda.value || BUSQUEDA_INICIAL);
});

cargarNoticias(BUSQUEDA_INICIAL);
