// El guardia del gabinete: apunta con la linterna a quien mira y, de vez en cuando, pide silencio
(function () {
  const sitio = document.getElementById("guardia");
  if (!sitio) return;
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NAVY = "#1f2a44", NAVY2 = "#2c3a5c", PIEL = "#e8c09b", PIEL2 = "#d4a580", ORO = "#c9a24a";
  sitio.innerHTML = `
  <svg class="guardia-svg" viewBox="0 0 200 300" role="img" aria-label="Un guardia de sala vigila la puerta con su linterna">
    <defs>
      <radialGradient id="gFoco" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe8"/><stop offset=".35" stop-color="#ffe9a8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>
      <linearGradient id="gHaz" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff3c4" stop-opacity=".75"/><stop offset=".55" stop-color="#ffe7a6" stop-opacity=".22"/><stop offset="1" stop-color="#ffe7a6" stop-opacity="0"/></linearGradient>
      <radialGradient id="gPool" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3c4" stop-opacity=".55"/><stop offset=".6" stop-color="#ffe7a6" stop-opacity=".22"/><stop offset="1" stop-color="#ffe7a6" stop-opacity="0"/></radialGradient>
      <linearGradient id="gLat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa3ad"/><stop offset=".5" stop-color="#e6ebef"/><stop offset="1" stop-color="#6c747d"/></linearGradient>
    </defs>
    <ellipse cx="100" cy="292" rx="58" ry="7" fill="rgba(33,23,21,.22)"/>
    <!-- piernas y zapatos -->
    <path d="M72 205 L70 282 L94 282 L98 212 Z" fill="${NAVY}"/>
    <path d="M128 205 L130 282 L106 282 L102 212 Z" fill="${NAVY}"/>
    <path d="M84 210 L84 280" stroke="#c9a24a" stroke-width="1.6" opacity=".7"/><path d="M116 210 L116 280" stroke="#c9a24a" stroke-width="1.6" opacity=".7"/>
    <ellipse cx="80" cy="285" rx="17" ry="7" fill="#151515"/><ellipse cx="120" cy="285" rx="17" ry="7" fill="#151515"/>
    <!-- chaqueta -->
    <path d="M58 122 Q100 104 142 122 L148 214 Q100 222 52 214 Z" fill="${NAVY}"/>
    <path d="M100 112 L88 150 L100 214 L112 150 Z" fill="${NAVY2}"/>
    <path d="M92 112 L100 132 L108 112 Z" fill="#f4efe6"/><path d="M97 116 L100 140 L103 116 Z" fill="#5a1820"/>
    <rect x="54" y="196" width="94" height="8" fill="#151515"/><rect x="95" y="195" width="10" height="10" rx="1.5" fill="${ORO}"/>
    <g fill="${ORO}"><circle cx="100" cy="150" r="2.6"/><circle cx="100" cy="168" r="2.6"/><circle cx="100" cy="186" r="2.6"/></g>
    <path d="M118 136 l10 -3 l2 9 l-10 3 z" fill="${ORO}"/>
    <path d="M60 124 Q52 122 50 130" stroke="${ORO}" stroke-width="3" fill="none"/><path d="M140 124 Q148 122 150 130" stroke="${ORO}" stroke-width="3" fill="none"/>
    <!-- brazo que descansa -->
    <g class="g-brazo-abajo">
      <path d="M140 124 Q152 160 150 200" stroke="${NAVY}" stroke-width="17" stroke-linecap="round" fill="none"/>
      <circle cx="150" cy="206" r="8" fill="${PIEL}"/>
    </g>
    <!-- cabeza -->
    <rect x="92" y="96" width="16" height="16" fill="${PIEL2}"/>
    <circle cx="100" cy="78" r="25" fill="${PIEL}"/>
    <ellipse cx="75" cy="80" rx="4" ry="6" fill="${PIEL2}"/><ellipse cx="125" cy="80" rx="4" ry="6" fill="${PIEL2}"/>
    <g class="g-ojos" fill="#2a1d18"><ellipse cx="91" cy="79" rx="2.6" ry="3"/><ellipse cx="109" cy="79" rx="2.6" ry="3"/></g>
    <path d="M85 72 q6 -4 12 0 M103 72 q6 -4 12 0" stroke="#5a4030" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M100 82 q-2 6 1 8" stroke="${PIEL2}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M86 94 Q93 88 100 92 Q107 88 114 94 Q107 97 100 95 Q93 97 86 94 Z" fill="#6a4a34"/>
    <path class="g-boca" d="M94 100 q6 3 12 0" stroke="#7a3a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- gorra -->
    <path d="M72 62 Q74 40 100 38 Q126 40 128 62 Z" fill="${NAVY}"/>
    <rect x="72" y="58" width="56" height="7" fill="#151515"/>
    <path d="M70 64 Q100 74 130 64 L132 68 Q100 80 68 68 Z" fill="#0f1524"/>
    <path d="M96 44 l4 -5 l4 5 l-1.5 7 h-5 z" fill="${ORO}"/>
    <!-- brazo con la linterna (gira hacia quien mira) -->
    <g class="g-linterna">
      <polygon class="g-haz" points="2,147 2,159 -238,183 -238,123" fill="url(#gHaz)"/><circle class="g-pool" cx="-238" cy="153" r="34" fill="url(#gPool)"/>
      <path d="M62 126 Q44 138 30 150" stroke="${NAVY}" stroke-width="17" stroke-linecap="round" fill="none"/>
      <circle cx="28" cy="153" r="8.5" fill="${PIEL}"/>
      <rect x="6" y="147" width="26" height="12" rx="3" fill="url(#gLat)"/>
      <rect x="2" y="144" width="9" height="18" rx="2" fill="#4a5058"/>
      <circle class="g-foco" cx="2" cy="153" r="22" fill="url(#gFoco)"/>
    </g>
    <!-- brazo que pide silencio -->
    <g class="g-brazo-shh">
      <path d="M140 124 Q160 152 148 166 Q128 160 108 124" stroke="${NAVY}" stroke-width="16" stroke-linecap="round" fill="none"/>
      <path d="M140 124 Q160 152 148 166" stroke="${NAVY2}" stroke-width="3" fill="none" opacity=".6"/>
      <ellipse cx="103" cy="116" rx="10" ry="9" fill="${PIEL}" stroke="${PIEL2}" stroke-width="1.2"/>
      <rect x="97" y="84" width="8" height="30" rx="4" fill="${PIEL}" stroke="${PIEL2}" stroke-width="1.2"/>
      <path d="M98 88 h6" stroke="${PIEL2}" stroke-width="1.2" stroke-linecap="round"/>
    </g>
  </svg>
  <span class="g-bocadillo" aria-hidden="true">Shhh…</span>`;

  const svg = sitio.querySelector("svg"), brazo = sitio.querySelector(".g-linterna");
  const haz = sitio.querySelector(".g-haz"), charco = sitio.querySelector(".g-pool");
  // Hombro y foco de la linterna en coordenadas del dibujo; el haz se dibuja hacia la izquierda (180°)
  const S = { x: 62, y: 126 }, L0 = { x: 2, y: 153 };
  let meta = null, ang = 0, largo = 240, raf = 0, cursor = null;
  function focoGirado(t) {
    const r = t * Math.PI / 180, dx = L0.x - S.x, dy = L0.y - S.y;
    return { x: S.x + dx * Math.cos(r) - dy * Math.sin(r), y: S.y + dx * Math.sin(r) + dy * Math.cos(r) };
  }
  function calcular() {
    if (!cursor) return;
    const r = svg.getBoundingClientRect(); if (!r.width) return;
    const k = r.width / 200, C = { x: (cursor.x - r.left) / k, y: (cursor.y - r.top) / k };
    // Ángulo tal que la línea que sale del foco pase exactamente por el cursor
    let t = ang;
    for (let i = 0; i < 4; i++) { const L = focoGirado(t); t = Math.atan2(C.y - L.y, C.x - L.x) * 180 / Math.PI - 180; }
    while (t - ang > 180) t -= 360; while (t - ang < -180) t += 360;
    const L = focoGirado(t);
    meta = { t, largo: Math.min(1600, Math.max(30, Math.hypot(C.x - L.x, C.y - L.y))) };
    if (!raf) raf = requestAnimationFrame(paso);
  }
  function pintar() {
    const w = 7 + largo * 0.1, x = L0.x - largo;
    haz.setAttribute("points", `${L0.x},${L0.y - 6} ${L0.x},${L0.y + 6} ${x},${L0.y + w} ${x},${L0.y - w}`);
    charco.setAttribute("cx", x); charco.setAttribute("r", (w * 1.25).toFixed(1));
    brazo.style.transform = `rotate(${ang.toFixed(2)}deg)`;
  }
  function paso() {
    ang += (meta.t - ang) * 0.35; largo += (meta.largo - largo) * 0.35;
    pintar();
    raf = (Math.abs(meta.t - ang) > 0.05 || Math.abs(meta.largo - largo) > 0.5) ? requestAnimationFrame(paso) : 0;
  }
  const seguir = (x, y) => { cursor = { x, y }; calcular(); };
  if (!quieto) {
    addEventListener("pointermove", e => seguir(e.clientX, e.clientY), { passive: true });
    addEventListener("touchstart", e => { const t = e.touches[0]; if (t) seguir(t.clientX, t.clientY); }, { passive: true });
    addEventListener("touchmove", e => { const t = e.touches[0]; if (t) seguir(t.clientX, t.clientY); }, { passive: true });
    addEventListener("scroll", calcular, { passive: true });
  }
  pintar();

  // Pide silencio cada cierto tiempo
  let silencioT;
  function silencio(texto) {
    sitio.querySelector(".g-bocadillo").textContent = texto || "Shhh…";
    sitio.classList.add("shh");
    clearTimeout(silencioT);
    silencioT = setTimeout(() => sitio.classList.remove("shh"), 1900);
  }
  window.guardiaSilencio = silencio;
  if (!quieto) {
    const ronda = () => { silencio(); setTimeout(ronda, 6500 + Math.random() * 5000); };
    setTimeout(ronda, 3500);
  }
})();
