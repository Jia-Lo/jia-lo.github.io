// Visitantes reales en la galería ahora mismo (Firebase Realtime Database, plan gratuito).
// Cada visitante abre una conexión y deja una marca que se borra sola al cerrar la página.
// Mientras FIREBASE sea null, el contador no se muestra y no se carga nada.
const FIREBASE = null;

(function () {
  if (!FIREBASE) return;
  const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
  const chip = document.createElement("div");
  chip.className = "aforo"; chip.hidden = true; chip.setAttribute("role", "status");
  chip.innerHTML = '<i aria-hidden="true"></i><span></span>';
  (document.querySelector(".top .wrap") || document.body).appendChild(chip);
  const texto = chip.querySelector("span");
  function pintar(n) {
    chip.hidden = !n;
    texto.textContent = n === 1 ? "Usted, a solas en la galería" : `${n} personas en la galería ahora`;
    window.aforoReal = n;
    document.dispatchEvent(new CustomEvent("aforo", { detail: n }));
  }
  async function arrancar() {
    try {
      const [{ initializeApp }, db] = await Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-database.js")]);
      const base = db.getDatabase(initializeApp(FIREBASE));
      const sala = db.ref(base, "presencia");
      const yo = db.push(sala);
      db.onValue(db.ref(base, ".info/connected"), s => {
        if (s.val() !== true) return;
        db.onDisconnect(yo).remove().then(() => db.set(yo, true));
      });
      db.onValue(sala, s => pintar(s.size));
      // Si la pestaña queda oculta mucho tiempo, deja de contar como presente
      let oculta;
      document.addEventListener("visibilitychange", () => {
        clearTimeout(oculta);
        if (document.hidden) oculta = setTimeout(() => db.remove(yo), 120000);
        else db.set(yo, true);
      });
    } catch (e) { chip.remove(); }
  }
  // Se carga cuando la página ya está pintada, para no restar velocidad
  if ("requestIdleCallback" in window) requestIdleCallback(arrancar, { timeout: 3000 }); else setTimeout(arrancar, 1200);
})();
