// Cierre nocturno: persiana, lámparas que se apagan y sistema de haces láser que vigila la sala
(function () {
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cv, ctx, chip, alarma, persiana, raf = 0, activo = false, t0 = 0, puntero = null, enfriando = 0, dpr = 1, W = 0, H = 0;
  // Emisores: lado (0 izquierda, 1 derecha), altura relativa, ángulo base, amplitud, velocidad, fase
  const HACES = [
    [0, .22, 8, 10, .21, 0], [1, .34, 186, 12, .17, 1.3], [0, .52, -6, 14, .13, 2.1],
    [1, .63, 171, 11, .19, .4], [0, .80, -14, 9, .24, 3.2], [1, .90, 194, 8, .15, 2.6],
  ];
  function crear() {
    cv = document.createElement("canvas"); cv.className = "laseres"; cv.setAttribute("aria-hidden", "true");
    ctx = cv.getContext("2d");
    chip = document.createElement("div"); chip.className = "seg-chip"; chip.setAttribute("role", "status");
    chip.innerHTML = `<i></i><span>Sistema de seguridad activo · ${HACES.length} haces</span>`;
    alarma = document.createElement("div"); alarma.className = "seg-alarma"; alarma.setAttribute("aria-hidden", "true");
    persiana = document.createElement("div"); persiana.className = "persiana"; persiana.setAttribute("aria-hidden", "true");
    persiana.innerHTML = `<div class="pers-placa"><b>Cerrado</b><span>Sala abierta de 8:00 a 22:00</span></div>`;
    document.body.append(cv, alarma, chip, persiana);
    medir();
  }
  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function geometria(h, t) {
    const [lado, hy, base, amp, vel, fase] = h;
    const ang = (base + (quieto ? 0 : amp * Math.sin(t * vel + fase))) * Math.PI / 180;
    const x0 = lado ? W : 0, y0 = hy * H, L = Math.hypot(W, H) * 1.2;
    return { x0, y0, x1: x0 + Math.cos(ang) * L, y1: y0 + Math.sin(ang) * L };
  }
  function distancia(px, py, g) {
    const dx = g.x1 - g.x0, dy = g.y1 - g.y0, k = Math.max(0, Math.min(1, ((px - g.x0) * dx + (py - g.y0) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - (g.x0 + k * dx), py - (g.y0 + k * dy));
  }
  function emisor(x, y, lado, viva) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "#111"; ctx.strokeStyle = "#3a3a3a"; ctx.lineWidth = 1;
    const w = 14, hh = 22, ox = lado ? -w : 0;
    ctx.fillRect(ox, -hh / 2, w, hh); ctx.strokeRect(ox + .5, -hh / 2 + .5, w - 1, hh - 1);
    ctx.fillStyle = viva ? "#ff3030" : "#7a1010"; ctx.shadowColor = "#ff2020"; ctx.shadowBlur = viva ? 10 : 4;
    ctx.beginPath(); ctx.arc(lado ? -w / 2 : w / 2, -5, 2, 0, 7); ctx.fill();
    ctx.restore();
  }
  function pintar(ts) {
    if (!activo) return;
    const t = (ts - t0) / 1000, alerta = enfriando > ts;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    HACES.forEach((h, i) => {
      const g = geometria(h, t), parpadeo = .86 + .14 * Math.sin(t * 23 + i * 7);
      const tocado = puntero && distancia(puntero.x, puntero.y, g) < 9;
      if (tocado && !alerta) disparar(i, ts);
      const fuerza = (alerta ? 1 : .75) * parpadeo;
      // halo ancho, haz medio y núcleo
      [[16, .05], [6, .16], [1.6, .95]].forEach(([lw, a], k) => {
        ctx.strokeStyle = k === 2 ? `rgba(255,${alerta ? 150 : 205},${alerta ? 150 : 205},${a * fuerza})` : `rgba(255,30,40,${a * fuerza})`;
        ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(g.x0, g.y0); ctx.lineTo(g.x1, g.y1); ctx.stroke();
      });
      // motas de polvo que cruzan el haz
      if (!quieto) for (let k = 0; k < 4; k++) {
        const s = ((t * .06 + k * .23 + i * .11) % 1), x = g.x0 + (g.x1 - g.x0) * s * .7, y = g.y0 + (g.y1 - g.y0) * s * .7;
        ctx.fillStyle = `rgba(255,120,120,${.5 * Math.abs(Math.sin(t * 3 + k + i))})`; ctx.beginPath(); ctx.arc(x, y, 1.3, 0, 7); ctx.fill();
      }
    });
    ctx.globalCompositeOperation = "source-over";
    HACES.forEach(h => emisor(h[0] ? W : 0, h[1] * H, h[0], alerta));
    raf = requestAnimationFrame(pintar);
  }
  function disparar(i, ts) {
    enfriando = ts + 2600;
    chip.classList.add("alerta"); chip.querySelector("span").textContent = `Movimiento detectado · haz ${i + 1}`;
    alarma.classList.remove("ve"); void alarma.offsetWidth; alarma.classList.add("ve");
    if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch (_) {}
    clearTimeout(disparar.t);
    disparar.t = setTimeout(() => { chip.classList.remove("alerta"); chip.querySelector("span").textContent = `Sistema de seguridad activo · ${HACES.length} haces`; }, 2600);
  }
  const mover = (x, y) => { puntero = { x, y }; };
  addEventListener("pointermove", e => mover(e.clientX, e.clientY), { passive: true });
  addEventListener("touchmove", e => { const t = e.touches[0]; if (t) mover(t.clientX, t.clientY); }, { passive: true });
  addEventListener("touchend", () => { puntero = null; }, { passive: true });
  addEventListener("resize", () => { if (cv) medir(); });

  window.Seguridad = {
    activar(conCierre) {
      if (activo) return;
      if (!cv) crear();
      activo = true; document.documentElement.classList.add("cerrada");
      cv.classList.remove("ve"); chip.classList.remove("ve");
      const encender = () => { cv.classList.add("ve"); chip.classList.add("ve"); t0 = performance.now(); raf = requestAnimationFrame(pintar); };
      if (conCierre && !quieto) {
        persiana.classList.remove("baja", "sube"); void persiana.offsetWidth; persiana.classList.add("baja");
        setTimeout(() => { persiana.classList.add("sube"); encender(); }, 1700);
      } else encender();
    },
    desactivar() {
      if (!activo) return;
      activo = false; cancelAnimationFrame(raf); raf = 0;
      document.documentElement.classList.remove("cerrada");
      cv.classList.remove("ve"); chip.classList.remove("ve", "alerta"); persiana.classList.remove("baja", "sube");
      ctx.clearRect(0, 0, W, H);
    },
  };
})();
