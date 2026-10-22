// Mesa de restauración: un velo simulado de barniz y polvo que el visitante limpia con un hisopo
(function () {
  const sec = document.getElementById("restauracion");
  if (!sec || typeof PIECES === "undefined") return;
  const i = PIECES.findIndex(p => p.id === sec.dataset.obra); if (i < 0) { sec.hidden = true; return; }
  const p = PIECES[i];
  const lienzo = sec.querySelector(".rest-obra"), img = lienzo.querySelector("img"), cv = lienzo.querySelector("canvas"),
    hisopo = sec.querySelector(".hisopo"), medidor = sec.querySelector(".rest-medidor i"), cifra = sec.querySelector(".rest-cifra"),
    fin = sec.querySelector(".rest-fin"), reiniciar = sec.querySelector(".rest-otra");
  img.src = "/" + p.img; img.alt = p.t;
  sec.querySelector(".rest-ver").onclick = () => openRoom(PIECES, i);
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  let dpr = 1, w = 0, h = 0, base = 0, limpiando = false, ultimo = null, terminado = false, rng;

  function azar(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function ensuciar() {
    const r = lienzo.getBoundingClientRect(); if (!r.width) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2); w = r.width; h = r.height;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rng = azar(1767);
    ctx.globalCompositeOperation = "source-over"; ctx.clearRect(0, 0, w, h);
    // barniz amarillento, más cargado en los bordes
    ctx.fillStyle = "rgba(146,104,38,.62)"; ctx.fillRect(0, 0, w, h);
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .2, w / 2, h / 2, Math.max(w, h) * .75);
    v.addColorStop(0, "rgba(90,60,20,0)"); v.addColorStop(1, "rgba(70,45,15,.45)"); ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    // manchas irregulares de suciedad
    for (let k = 0; k < 26; k++) {
      const x = rng() * w, y = rng() * h, rr = 20 + rng() * 70, g = ctx.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, `rgba(${110 + rng() * 30},${80 + rng() * 20},${30 + rng() * 15},${.12 + rng() * .14})`); g.addColorStop(1, "rgba(80,55,20,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill();
    }
    // polvo fino y puntitos de mosca
    for (let k = 0; k < w * h / 55; k++) { ctx.fillStyle = `rgba(60,40,15,${.08 + rng() * .18})`; ctx.fillRect(rng() * w, rng() * h, 1, 1); }
    for (let k = 0; k < 70; k++) { ctx.fillStyle = `rgba(35,22,10,${.35 + rng() * .4})`; ctx.beginPath(); ctx.arc(rng() * w, rng() * h, .6 + rng() * 1.3, 0, 7); ctx.fill(); }
    base = opacidad(); terminado = false; fin.hidden = true; lienzo.classList.remove("limpia"); pintarMedidor(0);
  }
  function opacidad() {
    // muestreo reducido del canal alfa
    const s = 6, d = ctx.getImageData(0, 0, cv.width, cv.height).data; let suma = 0, n = 0;
    for (let y = 0; y < cv.height; y += s * dpr) for (let x = 0; x < cv.width; x += s * dpr) { suma += d[(Math.floor(y) * cv.width + Math.floor(x)) * 4 + 3]; n++; }
    return suma / n;
  }
  function pintarMedidor(pc) { medidor.style.width = pc + "%"; cifra.textContent = pc + " %"; }
  function frotar(x, y) {
    ctx.globalCompositeOperation = "destination-out";
    const R = Math.max(18, Math.min(w, h) * .055), pasos = ultimo ? Math.max(1, Math.ceil(Math.hypot(x - ultimo.x, y - ultimo.y) / (R * .35))) : 1;
    for (let k = 1; k <= pasos; k++) {
      const px = ultimo ? ultimo.x + (x - ultimo.x) * k / pasos : x, py = ultimo ? ultimo.y + (y - ultimo.y) * k / pasos : y;
      const g = ctx.createRadialGradient(px, py, 0, px, py, R);
      g.addColorStop(0, "rgba(0,0,0,.32)"); g.addColorStop(.6, "rgba(0,0,0,.14)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, R, 0, 7); ctx.fill();
    }
    ultimo = { x, y };
  }
  let medirT = 0;
  function progreso() {
    if (terminado) return;
    const pc = Math.max(0, Math.min(100, Math.round((1 - opacidad() / base) * 100 / .9)));
    pintarMedidor(Math.min(pc, 100));
    if (pc >= 100) {
      terminado = true; lienzo.classList.add("limpia"); fin.hidden = false;
      setTimeout(() => { ctx.globalCompositeOperation = "source-over"; ctx.clearRect(0, 0, w, h); }, 900);
    }
  }
  function pos(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  cv.addEventListener("pointerdown", e => { limpiando = true; ultimo = null; cv.setPointerCapture(e.pointerId); const q = pos(e); frotar(q.x, q.y); hisopo.classList.add("frota"); });
  cv.addEventListener("pointermove", e => {
    const q = pos(e);
    hisopo.style.transform = `translate(${q.x}px, ${q.y}px)`; hisopo.classList.add("ve");
    if (limpiando && !terminado) { frotar(q.x, q.y); const ahora = performance.now(); if (ahora - medirT > 200) { medirT = ahora; progreso(); } }
  });
  const soltar = () => { limpiando = false; ultimo = null; hisopo.classList.remove("frota"); progreso(); };
  cv.addEventListener("pointerup", soltar); cv.addEventListener("pointercancel", soltar);
  cv.addEventListener("pointerleave", () => { hisopo.classList.remove("ve"); });
  cv.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ctx.globalCompositeOperation = "source-over"; ctx.clearRect(0, 0, w, h); progreso(); } });
  reiniciar.onclick = ensuciar;
  const listo = () => requestAnimationFrame(ensuciar);
  if (img.complete && img.naturalWidth) listo(); else img.addEventListener("load", listo, { once: true });
  let rT; addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(() => { if (!terminado) ensuciar(); }, 200); });
})();
