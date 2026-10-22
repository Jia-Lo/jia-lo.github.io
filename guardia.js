// El guardia del gabinete: vigila con la linterna dentro de su sala y, de vez en cuando, pide silencio
(function () {
  const sitio = document.getElementById("guardia");
  if (!sitio) return;
  const sala = document.getElementById("gabinete") || sitio;
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  sitio.innerHTML = `
  <svg class="guardia-svg" viewBox="0 0 220 420" role="img" aria-label="Un guardia de sala vigila la puerta del gabinete con su linterna">
    <defs>
      <linearGradient id="gTela" x1="0" x2="1"><stop offset="0" stop-color="#141b2e"/><stop offset=".3" stop-color="#26324f"/><stop offset=".55" stop-color="#2d3a5c"/><stop offset="1" stop-color="#131a2c"/></linearGradient>
      <linearGradient id="gTelaV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3756"/><stop offset="1" stop-color="#161d31"/></linearGradient>
      <linearGradient id="gPierna" x1="0" x2="1"><stop offset="0" stop-color="#121829"/><stop offset=".45" stop-color="#232d48"/><stop offset=".55" stop-color="#2a3554"/><stop offset="1" stop-color="#10162a"/></linearGradient>
      <linearGradient id="gManga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e3b5e"/><stop offset=".6" stop-color="#202a45"/><stop offset="1" stop-color="#151c30"/></linearGradient>
      <radialGradient id="gCara" cx=".45" cy=".42" r=".65"><stop offset="0" stop-color="#ecc3a1"/><stop offset=".6" stop-color="#dcab86"/><stop offset="1" stop-color="#b98263"/></radialGradient>
      <linearGradient id="gPiel" x1="0" x2="1"><stop offset="0" stop-color="#c99272"/><stop offset=".5" stop-color="#e2b592"/><stop offset="1" stop-color="#b98263"/></linearGradient>
      <linearGradient id="gGorra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34436a"/><stop offset="1" stop-color="#1a2238"/></linearGradient>
      <linearGradient id="gVisera" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a3a"/><stop offset=".35" stop-color="#0c0c0c"/><stop offset="1" stop-color="#000"/></linearGradient>
      <linearGradient id="gOro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e2a0"/><stop offset=".5" stop-color="#c9a24a"/><stop offset="1" stop-color="#7a5a22"/></linearGradient>
      <linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d858e"/><stop offset=".35" stop-color="#e9edf0"/><stop offset=".6" stop-color="#9aa3ad"/><stop offset="1" stop-color="#4b525a"/></linearGradient>
      <linearGradient id="gZapato" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a2a"/><stop offset="1" stop-color="#050505"/></linearGradient>
      <linearGradient id="gHaz" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff4cc" stop-opacity=".8"/><stop offset=".5" stop-color="#ffe8a8" stop-opacity=".26"/><stop offset="1" stop-color="#ffe8a8" stop-opacity=".05"/></linearGradient>
      <radialGradient id="gPool" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3c4" stop-opacity=".6"/><stop offset=".6" stop-color="#ffe7a6" stop-opacity=".22"/><stop offset="1" stop-color="#ffe7a6" stop-opacity="0"/></radialGradient>
      <radialGradient id="gFoco" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#fff3c4" stop-opacity=".95"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>
      <filter id="gSombra" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="2" dy="3" stdDeviation="2.5" flood-color="#211715" flood-opacity=".28"/></filter>
    </defs>
    <ellipse cx="110" cy="408" rx="66" ry="7" fill="rgba(33,23,21,.25)"/>
    <g filter="url(#gSombra)">
      <!-- piernas -->
      <path d="M84 246 L80 392 L107 392 L111 262 Z" fill="url(#gPierna)"/>
      <path d="M136 246 L140 392 L113 392 L109 262 Z" fill="url(#gPierna)"/>
      <path d="M94 262 Q93 330 93 390" stroke="#3a4870" stroke-width="1.2" fill="none" opacity=".6"/>
      <path d="M126 262 Q127 330 127 390" stroke="#3a4870" stroke-width="1.2" fill="none" opacity=".6"/>
      <path d="M86 300 q8 6 18 2 M116 318 q9 5 18 0" stroke="#0b1020" stroke-width="1.4" fill="none" opacity=".55"/>
      <path d="M74 391 Q72 404 82 407 L108 407 Q111 399 107 390 Z" fill="url(#gZapato)"/>
      <path d="M146 391 Q148 404 138 407 L112 407 Q109 399 113 390 Z" fill="url(#gZapato)"/>
      <path d="M80 398 q10 -4 20 -2 M140 398 q-10 -4 -20 -2" stroke="#9a9a9a" stroke-width="1.3" fill="none" opacity=".55"/>
      <!-- brazo que descansa (lado derecho de la imagen) -->
      <g class="g-brazo-abajo">
        <path d="M146 112 Q166 118 168 150 L172 238 Q164 245 155 241 L150 160 Z" fill="url(#gManga)"/>
        <path d="M156 236 L171 234" stroke="#c9a24a" stroke-width="2" opacity=".8"/>
        <path d="M158 241 Q155 256 162 262 Q170 264 173 256 Q175 246 170 239 Z" fill="url(#gPiel)"/>
        <path d="M162 252 q2 6 6 7" stroke="#a87358" stroke-width="1" fill="none"/>
      </g>
      <!-- chaqueta -->
      <path d="M70 110 Q110 98 150 110 L156 160 Q160 206 155 254 Q110 264 65 254 Q60 206 64 160 Z" fill="url(#gTela)"/>
      <path d="M100 104 L120 104 L110 132 Z" fill="#ebe7df"/>
      <path d="M106 110 L114 110 L116 120 L104 120 Z" fill="#4a0f18"/>
      <path d="M104 120 L116 120 L119 172 L110 182 L101 172 Z" fill="#5a1820"/>
      <path d="M110 122 L110 178" stroke="#3a0a12" stroke-width="1" opacity=".6"/>
      <path d="M100 104 L86 150 L103 180 L109 126 Z" fill="url(#gTelaV)"/>
      <path d="M120 104 L134 150 L117 180 L111 126 Z" fill="url(#gTelaV)"/>
      <path d="M86 150 L103 180 M134 150 L117 180" stroke="#0e1424" stroke-width="1.2" opacity=".7"/>
      <path d="M110 180 L110 256" stroke="#0b1020" stroke-width="1.6"/>
      <g fill="url(#gOro)"><circle cx="114" cy="196" r="3"/><circle cx="114" cy="220" r="3"/><circle cx="114" cy="244" r="3"/></g>
      <path d="M74 224 L98 222 L98 230 L75 232 Z M146 224 L122 222 L122 230 L145 232 Z" fill="#1a223a" stroke="#0e1424" stroke-width=".8"/>
      <path d="M126 132 L140 130 L141 136 L127 138 Z" fill="#1a223a"/>
      <path d="M131 140 l5 -3 l5 3 l0 7 q-5 5 -10 0 z" fill="url(#gOro)" stroke="#6d4f1c" stroke-width=".6"/>
      <path d="M66 112 Q78 104 92 108 L90 116 Q78 113 68 120 Z M154 112 Q142 104 128 108 L130 116 Q142 113 152 120 Z" fill="#1a223a" stroke="url(#gOro)" stroke-width="1.6"/>
      <path d="M70 150 Q72 200 68 250" stroke="#0b1020" stroke-width="2" fill="none" opacity=".45"/>
      <path d="M150 150 Q148 200 152 250" stroke="#0b1020" stroke-width="2" fill="none" opacity=".45"/>
      <!-- cuello y cabeza -->
      <path d="M100 84 L100 103 Q110 110 120 103 L120 84 Z" fill="url(#gPiel)"/>
      <path d="M100 96 Q110 102 120 96" stroke="#a87358" stroke-width="1" fill="none" opacity=".6"/>
      <ellipse cx="87.5" cy="64" rx="4.5" ry="8" fill="#cf9a78"/><ellipse cx="132.5" cy="64" rx="4.5" ry="8" fill="#cf9a78"/>
      <path d="M110 34 C127 34 134 47 133 63 C132 80 122 92 110 92 C98 92 88 80 87 63 C86 47 93 34 110 34 Z" fill="url(#gCara)"/>
      <path d="M88 50 Q90 60 90 68 L94 52 Z M132 50 Q130 60 130 68 L126 52 Z" fill="#9c9893"/>
      <path d="M96 55 Q101 52 106 55 M114 55 Q119 52 124 55" stroke="#8e8a84" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <g class="g-ojos">
        <ellipse cx="101" cy="61" rx="4" ry="2.3" fill="#f3efe8"/><ellipse cx="119" cy="61" rx="4" ry="2.3" fill="#f3efe8"/>
        <circle cx="101.6" cy="61" r="1.7" fill="#3b2a20"/><circle cx="118.6" cy="61" r="1.7" fill="#3b2a20"/>
      </g>
      <path d="M97 59 Q101 57 105 59 M115 59 Q119 57 123 59" stroke="#7a4c36" stroke-width="1" fill="none"/>
      <path d="M98 65 q3 1.5 6 0 M116 65 q3 1.5 6 0" stroke="#b47a5c" stroke-width=".8" fill="none" opacity=".7"/>
      <path d="M110 60 Q108 69 104.5 73 Q107 76 110 75.5 Q113 76 115.5 73 Q112 69 110 60 Z" fill="#cf9a78"/>
      <path d="M110 60 Q108.5 69 105 73" stroke="#a87358" stroke-width=".9" fill="none" opacity=".8"/>
      <path d="M102 74 Q100 79 101 83 M118 74 Q120 79 119 83" stroke="#b47a5c" stroke-width=".8" fill="none" opacity=".6"/>
      <path d="M99 79.5 Q104.5 75.5 110 77.5 Q115.5 75.5 121 79.5 Q116 83 110 81 Q104 83 99 79.5 Z" fill="#a7a39d"/>
      <path d="M101 79 Q106 77 110 78.5 Q114 77 119 79" stroke="#d6d2cc" stroke-width=".6" fill="none" opacity=".7"/>
      <path class="g-boca" d="M105 85 Q110 86.5 115 85" stroke="#8c4a3a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M104 89 Q110 92 116 89" stroke="#b47a5c" stroke-width=".8" fill="none" opacity=".6"/>
      <!-- gorra de plato -->
      <g transform="translate(0 -6)">
      <path d="M83 47 Q84 25 110 22 Q136 25 137 47 Z" fill="url(#gGorra)"/>
      <path d="M86 32 Q110 26 134 32" stroke="#4a5b88" stroke-width="1" fill="none" opacity=".6"/>
      <rect x="85" y="42" width="50" height="8" fill="#0d0d0d"/>
      <path d="M85 44 L135 44" stroke="#c9a24a" stroke-width="1" opacity=".7"/>
      <path d="M83 49 Q110 57 137 49 L139 53 Q110 66 81 53 Z" fill="url(#gVisera)"/>
      <path d="M90 53 Q110 59 130 53" stroke="#5a5a5a" stroke-width=".8" fill="none"/>
      <path d="M110 27 l4 4 l-1 6 l-6 0 l-1 -6 z" fill="url(#gOro)" stroke="#6d4f1c" stroke-width=".5"/>
      </g>
      <!-- brazo con la linterna (gira para enfocar a quien mira) -->
      <g class="g-linterna">
        <polygon class="g-haz" points="-18,154 -18,166 -258,190 -258,130" fill="url(#gHaz)"/>
        <circle class="g-pool" cx="-258" cy="160" r="34" fill="url(#gPool)"/>
        <path d="M80 110 Q64 122 32 148 L38 170 Q66 150 80 140 Z" fill="url(#gManga)"/>
        <path d="M58 132 q4 6 2 12" stroke="#0e1424" stroke-width="1.2" fill="none" opacity=".6"/>
        <path d="M33 150 L39 168" stroke="#c9a24a" stroke-width="2" opacity=".8"/>
        <rect x="-12" y="153" width="36" height="14" rx="3" fill="url(#gMetal)"/>
        <path d="M-6 155 L-6 165 M0 155 L0 165 M6 155 L6 165" stroke="#5d646c" stroke-width="1" opacity=".7"/>
        <rect x="-19" y="149" width="9" height="22" rx="2" fill="#3e444b"/>
        <path d="M20 150 Q36 150 36 160 Q36 172 22 170 Q14 168 14 160 Q14 152 20 150 Z" fill="url(#gPiel)"/>
        <path d="M18 154 q6 1 10 0 M18 160 q6 1 11 0 M18 166 q6 1 9 0" stroke="#a87358" stroke-width=".9" fill="none"/>
        <circle class="g-foco" cx="-19" cy="160" r="20" fill="url(#gFoco)"/>
      </g>
      <!-- brazo que pide silencio -->
      <g class="g-brazo-shh">
        <path d="M146 112 Q168 122 172 160 L174 188 Q162 196 152 186 L148 150 Z" fill="url(#gManga)"/>
        <path d="M174 184 Q164 200 150 190 L120 114 Q128 102 138 110 Z" fill="url(#gManga)"/>
        <path d="M123 113 L137 109" stroke="#c9a24a" stroke-width="2" opacity=".8"/>
        <path d="M113 96 Q109 106 117 112 Q127 116 133 108 Q135 98 127 94 Z" fill="url(#gPiel)"/>
        <rect x="107.5" y="73" width="6" height="27" rx="3" fill="url(#gPiel)" stroke="#b98263" stroke-width=".7"/>
        <path d="M108.8 76.5 q1.7 -1.3 3.4 0" stroke="#f0d2bd" stroke-width="1" fill="none"/>
        <path d="M117 102 q5 1 10 0 M118 107 q4 1 8 0" stroke="#a87358" stroke-width=".9" fill="none"/>
      </g>
    </g>
  </svg>
  <span class="g-bocadillo" aria-hidden="true">Shhh…</span>`;

  const svg = sitio.querySelector("svg"), brazo = sitio.querySelector(".g-linterna");
  const haz = sitio.querySelector(".g-haz"), charco = sitio.querySelector(".g-pool");
  // Hombro y foco de la linterna en coordenadas del dibujo; el haz sale hacia la izquierda (180°)
  const S = { x: 74, y: 124 }, L0 = { x: -19, y: 160 }, ANCHO = 220;
  let meta = { t: 0, largo: 240 }, ang = 0, largo = 240, raf = 0, cursor = null;
  function focoGirado(t) {
    const r = t * Math.PI / 180, dx = L0.x - S.x, dy = L0.y - S.y;
    return { x: S.x + dx * Math.cos(r) - dy * Math.sin(r), y: S.y + dx * Math.sin(r) + dy * Math.cos(r) };
  }
  function dentro(c) {
    const r = sala.getBoundingClientRect();
    return c && c.x >= r.left && c.x <= r.right && c.y >= r.top && c.y <= r.bottom;
  }
  function calcular() {
    const r = svg.getBoundingClientRect(); if (!r.width) return;
    if (!dentro(cursor)) {
      // Fuera de la sala del gabinete: baja la linterna y apaga el haz
      sitio.classList.add("sin-haz"); meta = { t: 0, largo: 240 };
    } else {
      sitio.classList.remove("sin-haz");
      const k = r.width / ANCHO, C = { x: (cursor.x - r.left) / k, y: (cursor.y - r.top) / k };
      let t = ang;
      for (let i = 0; i < 4; i++) { const L = focoGirado(t); t = Math.atan2(C.y - L.y, C.x - L.x) * 180 / Math.PI - 180; }
      while (t - ang > 180) t -= 360; while (t - ang < -180) t += 360;
      const L = focoGirado(t);
      meta = { t, largo: Math.min(1600, Math.max(30, Math.hypot(C.x - L.x, C.y - L.y))) };
    }
    if (!raf) raf = requestAnimationFrame(paso);
  }
  function pintar() {
    const w = 7 + largo * 0.1, x = L0.x - largo;
    haz.setAttribute("points", `${L0.x},${L0.y - 6} ${L0.x},${L0.y + 6} ${x},${L0.y + w} ${x},${L0.y - w}`);
    charco.setAttribute("cx", x); charco.setAttribute("cy", L0.y); charco.setAttribute("r", (w * 1.25).toFixed(1));
    brazo.style.transform = `rotate(${ang.toFixed(2)}deg)`;
  }
  function paso() {
    ang += (meta.t - ang) * 0.3; largo += (meta.largo - largo) * 0.3;
    pintar();
    raf = (Math.abs(meta.t - ang) > 0.05 || Math.abs(meta.largo - largo) > 0.5) ? requestAnimationFrame(paso) : 0;
  }
  const seguir = (x, y) => { cursor = { x, y }; calcular(); };
  sitio.classList.add("sin-haz");
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
