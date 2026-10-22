// La luz real del día: la sala cambia según la hora en Madrid
(function () {
  const FASES = [
    { de: 8, a: 12, id: "manana", nombre: "Luz de la mañana" },
    { de: 12, a: 16, id: "mediodia", nombre: "Luz de mediodía" },
    { de: 16, a: 20, id: "tarde", nombre: "Luz de la tarde" },
    { de: 20, a: 22, id: "anochecer", nombre: "Lámparas encendidas" },
  ];
  const capa = document.createElement("div");
  capa.className = "luz-dia"; capa.setAttribute("aria-hidden", "true");
  capa.innerHTML = '<div class="ventana"></div>';
  document.body.prepend(capa);
  const info = document.getElementById("luzInfo");

  function ahoraMadrid() {
    try {
      const f = new Intl.DateTimeFormat("es-ES", { hour: "numeric", minute: "numeric", hourCycle: "h23", timeZone: "Europe/Madrid" }).formatToParts(new Date());
      const h = +f.find(x => x.type === "hour").value, m = +f.find(x => x.type === "minute").value;
      return { h, m };
    } catch (_) { const d = new Date(); return { h: d.getHours(), m: d.getMinutes() }; }
  }
  function aplicar(forzada) {
    const { h, m } = ahoraMadrid(), t = h + m / 60;
    let fase = FASES.find(f => t >= f.de && t < f.a), avance = 0;
    if (forzada) { fase = FASES.find(f => f.id === forzada) || null; avance = .5; }
    else if (fase) avance = (t - fase.de) / (fase.a - fase.de);
    const raiz = document.documentElement;
    raiz.dataset.luz = fase ? fase.id : "noche";
    // La mancha de luz de la ventana cruza la pared a lo largo de cada fase
    raiz.style.setProperty("--luz-x", (fase && fase.id === "tarde" ? 70 - avance * 55 : 5 + avance * 55).toFixed(1) + "vw");
    if (info) {
      const hh = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
      info.textContent = fase ? `${fase.nombre} · ${hh} en Alcalá` : `Sala cerrada · ${hh} en Alcalá`;
    }
  }
  window.ponerLuz = aplicar;
  aplicar();
  setInterval(() => aplicar(), 60000);
})();
