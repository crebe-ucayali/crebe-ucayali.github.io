const formularioRegistro = document.querySelector("#formulario-registro");
const mensajeRegistro = document.querySelector("#mensaje-registro");

const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbym3C4uxMNqm85n3d_9dvHfyh6xGtK-XLp6lY_a8VQhUhXyZV6BuSNtWrVEodXMNxfOfw/exec";

formularioRegistro.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const datos = {
    nombres: formularioRegistro.nombres.value.trim(),
    institucion: formularioRegistro.institucion.value.trim(),
    rol: formularioRegistro.rol.value,
    modulo: formularioRegistro.modulo.value,
    motivo: formularioRegistro.motivo.value,
    correo: formularioRegistro.correo.value.trim(),
    comentario: formularioRegistro.comentario.value.trim()
  };

  mensajeRegistro.textContent = "Enviando registro...";

  try {
    await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(datos)
    });

    mensajeRegistro.textContent = "Registro enviado correctamente.";
    formularioRegistro.reset();
  } catch (error) {
    mensajeRegistro.textContent = "No se pudo enviar el registro. Inténtalo nuevamente.";
  }
});
