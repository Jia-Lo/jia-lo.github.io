// Pasillos entre salas: visitantes que pasean, se detienen ante las obras y las señalan
(function () {
  const pasillos = [...document.querySelectorAll(".pasillo")];
  if (!pasillos.length || typeof PIECES === "undefined") return;
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TIPOS = [
    { piel: "#e2b592", piel2: "#c99272", pelo: "#3a2a1e", estilo: "corto", ropa: "#2c3a5c", ropa2: "#1c2640", baja: "#2a2a2e", zapato: "#1a1410", largo: true },
    { piel: "#efc9aa", piel2: "#d6a888", pelo: "#a97a3c", estilo: "largo", ropa: "#7a2a30", ropa2: "#561a20", baja: "#26232a", zapato: "#2a1810", falda: true, bolso: "#5b3a20" },
    { piel: "#c99a76", piel2: "#a8785a", pelo: "#c8c3ba", estilo: "corto", ropa: "#5c5a4a", ropa2: "#3f3e33", baja: "#3a3a40", zapato: "#2a1d14", largo: false },
    { piel: "#8d5b3e", piel2: "#6e4630", pelo: "#151515", estilo: "monio", ropa: "#2f4a52", ropa2: "#1f3238", baja: "#1d2224", zapato: "#151515", falda: false, bolso: "#a07a3a" },
    { piel: "#f1d0b5", piel2: "#d8ae90", pelo: "#6b3a1e", estilo: "largo", ropa: "#c9b49e", ropa2: "#a8927a", baja: "#3b3326", zapato: "#3a2414", largo: true },
    { piel: "#d9a987", piel2: "#bb8a68", pelo: "#2b1d14", estilo: "calvo", ropa: "#3a3a3a", ropa2: "#242424", baja: "#4a3f33", zapato: "#1a1410", largo: false },
  ];
  let uid = 0;
  function figura(t) {
    const id = "v" + (uid++);
    const torso = t.largo
      ? `<path d="M23 37 Q32 32 41 37 L44 72 L46 122 L19 122 L21 72 Z" fill="url(#${id}r)"/><path d="M32 40 L32 120" stroke="${t.ropa2}" stroke-width="1" opacity=".7"/>`
      : `<path d="M23 37 Q32 32 41 37 L43 70 L42 100 L22 100 L21 70 Z" fill="url(#${id}r)"/>`;
    const falda = t.falda ? `<path d="M21 96 L43 96 L48 138 L17 138 Z" fill="${t.ropa2}"/>` : "";
    const pelo = {
      corto: `<path d="M22 19 Q22 7 33 7 Q42 8 43 15 Q36 11 28 16 L26 25 Q22 24 22 19 Z" fill="${t.pelo}"/>`,
      largo: `<path d="M21 20 Q20 6 33 6 Q43 7 43 16 Q36 11 29 15 L28 44 Q20 42 21 20 Z" fill="${t.pelo}"/>`,
      monio: `<circle cx="23" cy="10" r="6" fill="${t.pelo}"/><path d="M22 19 Q22 7 33 7 Q42 8 43 15 Q36 11 28 16 L26 24 Q22 23 22 19 Z" fill="${t.pelo}"/>`,
      calvo: `<path d="M22 22 Q22 15 26 13 L27 24 Q23 25 22 22 Z" fill="${t.pelo}"/>`,
    }[t.estilo];
    const pierna = (cls, sombra) => `<g class="${cls}"><path d="M28 98 L37 98 L36 140 L35 174 L29 174 L28 140 Z" fill="${sombra ? t.ropa2 : t.baja}"/>
        ${t.falda ? `<path d="M29 136 L35 136 L34.5 174 L29.5 174 Z" fill="${t.piel2}"/>` : ""}
        <path d="M27 174 L36 174 Q42 175 43 180 L27 180 Z" fill="${t.zapato}"/></g>`;
    const brazo = (cls) => `<g class="${cls}"><path d="M28 39 L36 39 L36 70 L34.5 94 L29.5 94 L29 70 Z" fill="url(#${id}r)"/><circle cx="32" cy="97" r="3.6" fill="${t.piel}"/></g>`;
    const apunta = `<g class="v-apunta"><path d="M28 39 L36 39 L36 70 L34.5 92 L29.5 92 L29 70 Z" fill="url(#${id}r)"/>
        <ellipse cx="32" cy="95" rx="3.4" ry="3.8" fill="${t.piel}"/><path d="M32 97 L32.5 105" stroke="${t.piel}" stroke-width="2.4" stroke-linecap="round"/></g>`;
    return `<svg viewBox="-6 0 76 186" aria-hidden="true" class="v-svg">
      <defs><linearGradient id="${id}r" x1="0" x2="1"><stop offset="0" stop-color="${t.ropa2}"/><stop offset=".55" stop-color="${t.ropa}"/><stop offset="1" stop-color="${t.ropa2}"/></linearGradient></defs>
      <ellipse class="v-sombra" cx="33" cy="181" rx="20" ry="3.5" fill="rgba(33,23,21,.22)"/>
      <g class="v-cuerpo">
        ${brazo("v-brazo-b")}${pierna("v-pierna-b", true)}${pierna("v-pierna-a")}
        ${falda}${torso}
        ${t.bolso ? `<path d="M25 44 L21 92" stroke="#3a2414" stroke-width="1.2"/><rect x="15" y="88" width="13" height="15" rx="2" fill="${t.bolso}"/>` : ""}
        <rect x="29" y="27" width="7" height="9" fill="${t.piel2}"/>
        <g class="v-cabeza"><ellipse cx="32.5" cy="18" rx="10" ry="11" fill="${t.piel}"/>
          <path d="M42 16 L45 21 L42 22 Z" fill="${t.piel}"/><ellipse cx="29" cy="19" rx="2" ry="3" fill="${t.piel2}"/>
          <circle cx="38.5" cy="16.5" r="1" fill="#2a1d18"/><path d="M37 13.5 L41 13" stroke="${t.pelo === "#c8c3ba" ? "#8a857d" : t.pelo}" stroke-width="1"/>
          <path d="M38.5 25 Q40.5 25.6 42 24.8" stroke="#8c4a3a" stroke-width=".9" fill="none"/>${pelo}</g>
        ${brazo("v-brazo-a")}${apunta}
      </g></svg>`;
  }

  function montar(pas) {
    const huecos = [...pas.querySelectorAll(".pas-cuadro")];
    const gente = pas.querySelector(".pas-gente");
    // Cada cuadro del pasillo muestra una obra real de la sala y abre su ficha
    huecos.forEach(h => {
      const i = +h.dataset.obra, p = PIECES[i]; if (!p) { h.remove(); return; }
      h.innerHTML = `<span class="pas-lamp" aria-hidden="true"></span><img src="/${p.thumb}" alt="${p.t}" loading="lazy"><span class="pas-cart">${p.id}</span>`;
      h.onclick = () => openRoom(PIECES, i);
      h.setAttribute("aria-label", `${p.t}. Ver ficha`);
    });
    const centros = () => {
      const r = pas.getBoundingClientRect();
      return [...pas.querySelectorAll(".pas-cuadro")].filter(h => h.offsetParent).map(h => { const b = h.getBoundingClientRect(); return b.left - r.left + b.width / 2; });
    };
    if (quieto) {
      const c = centros()[0] || 120, el = document.createElement("div");
      el.className = "visitante para apunta"; el.innerHTML = figura(TIPOS[1]);
      el.style.left = Math.max(0, c - 95) + "px"; gente.appendChild(el); return;
    }
    let activo = false, vivos = [], ultimo = 0, raf = 0, prox = 800;
    function nace() {
      const W = pas.clientWidth, dir = Math.random() < .5 ? 1 : -1, t = TIPOS[Math.floor(Math.random() * TIPOS.length)];
      const el = document.createElement("div");
      el.className = "visitante camina" + (dir < 0 ? " izq" : "");
      el.innerHTML = figura(t);
      const vel = 38 + Math.random() * 18;
      el.style.setProperty("--paso", (52 / vel).toFixed(2) + "s");
      const paradas = centros().map(c => c - dir * (48 + Math.random() * 18)).filter(() => Math.random() < .75).sort((a, b) => dir * (a - b));
      gente.appendChild(el);
      vivos.push({ el, x: dir > 0 ? -90 : W + 20, dir, vel, paradas, espera: 0 });
    }
    function paso(ts) {
      const dt = Math.min(.05, (ts - (ultimo || ts)) / 1000); ultimo = ts;
      if (activo) { prox -= dt * 1000; if (prox <= 0 && vivos.length < (pas.clientWidth < 600 ? 2 : 3)) { nace(); prox = 3500 + Math.random() * 5500; } }
      const W = pas.clientWidth;
      vivos = vivos.filter(v => {
        if (v.espera > 0) {
          v.espera -= dt;
          if (v.espera <= 0) v.el.classList.remove("para", "apunta", "mira"), v.el.classList.add("camina");
        } else {
          v.x += v.dir * v.vel * dt;
          const p = v.paradas[0];
          if (p != null && (v.dir > 0 ? v.x >= p : v.x <= p)) {
            v.paradas.shift(); v.espera = 2.2 + Math.random() * 2.2;
            v.el.classList.remove("camina"); v.el.classList.add("para", Math.random() < .7 ? "apunta" : "mira");
          }
        }
        v.el.style.transform = `translateX(${v.x.toFixed(1)}px)`;
        const fuera = v.dir > 0 ? v.x > W + 30 : v.x < -110;
        if (fuera) v.el.remove();
        return !fuera;
      });
      raf = (activo || vivos.length) ? requestAnimationFrame(paso) : 0;
    }
    const io = new IntersectionObserver(es => {
      activo = es[0].isIntersecting;
      if (activo && !raf) { ultimo = 0; raf = requestAnimationFrame(paso); }
    }, { threshold: .15 });
    io.observe(pas);
  }
  pasillos.forEach(montar);
})();
