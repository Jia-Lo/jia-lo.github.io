// El pasillo infinito · Galería Procedencia
// Viaje desde el espacio → fachada ilustrada → taller del grabador (preguntas) → pasillo infinito en CSS 3D
// → trabajador de sala que descuelga la obra → obra a pantalla completa con lupa y compra.
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const espera = ms => new Promise(r => setTimeout(r, RM ? Math.min(ms, 60) : ms));
  const sto = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} } };
  const OBRAS = PIECES.filter(p => (p.estado || "disponible") !== "vendido" || true);

  /* ---------- Preferencias del visitante ---------- */
  const ESTILO = { "PRC-001": "casas", "PRC-002": "ciudades", "PRC-003": "escenas", "PRC-004": "escenas", "PRC-005": "escenas", "PRC-006": "ciudades", "PRC-007": "ciudades" };
  let gustos = { estilo: null, fin: null };
  try { gustos = JSON.parse(sto.get("pasillo-gustos")) || gustos; } catch (_) {}
  function ordenar() {
    const original = p => !/reproducci/i.test(p.tech);
    const llamativo = p => /dorad|florentino|tallad/i.test(p.marco);
    const nota = p => {
      let n = 0;
      if (gustos.estilo && gustos.estilo !== "todo" && ESTILO[p.id] === gustos.estilo) n += 20;
      if (gustos.fin === "coleccionar") n += original(p) ? 8 : -8;
      if (gustos.fin === "regalar") n += (100 - p.price) / 8;
      if (gustos.fin === "decorar") n += llamativo(p) ? 6 : 0;
      return n;
    };
    return OBRAS.map((p, i) => ({ p, i, n: nota(p) })).sort((a, b) => b.n - a.n || a.i - b.i).map(x => x.p);
  }

  /* ---------- Gestión de escenas ---------- */
  const escenas = ["esc-espacio", "esc-fachada", "esc-taller", "esc-pasillo"].map(id => document.getElementById(id));
  const saltar = $("#saltar");
  let enPasillo = false;
  function mostrar(id) { escenas.forEach(e => { e.hidden = e.id !== id; }); }
  async function fundido(fn, color) {
    const f = document.createElement("div"); f.className = "fundido"; if (color) f.style.background = color;
    document.body.appendChild(f); await espera(30); f.classList.add("ve"); await espera(650);
    await fn(); f.classList.remove("ve"); await espera(700); f.remove();
  }
  saltar.onclick = () => irAlPasillo(true);

  /* ===================== 1 · El globo ===================== */
  async function viajeEspacio() {
    if (!window.d3 || !d3.geoOrthographic || !window.topojson) return;
    mostrar("esc-espacio");
    const cv = $("#globo"), ctx = cv.getContext("2d"), rot = $("#rotuloGeo");
    let W, H, dpr;
    const medir = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    medir(); addEventListener("resize", medir);
    let mundo, europa;
    try {
      const [a, b] = await Promise.all([fetch("/pasillo/datos/mundo.json").then(r => r.json()), fetch("/pasillo/datos/europa-oeste.json").then(r => r.json())]);
      mundo = topojson.feature(a, a.objects.countries); europa = topojson.feature(b, b.objects.paises);
      mundo.borders = topojson.mesh(a, a.objects.countries, (x, y) => x !== y);
    } catch (e) { return; }
    const ALCALA = [-3.364, 40.482], MADRID = [-3.703, 40.417];
    const estrellas = Array.from({ length: 260 }, () => [Math.random(), Math.random(), Math.random() * 1.2 + .2, Math.random()]);
    const proj = d3.geoOrthographic().clipAngle(90).precision(.4);
    const camino = d3.geoPath(proj, ctx), reticula = d3.geoGraticule10();
    const DUR = RM ? 1 : 8200, t0 = performance.now();
    const facil = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const ROT0 = [-28, -18], ROT1 = [-ALCALA[0], -ALCALA[1]];
    const rotulos = [[0, "La Tierra"], [.32, "Europa"], [.55, "España"], [.74, "Comunidad de Madrid"], [.88, "Alcalá de Henares"]];
    return new Promise(res => {
      function cuadro(ts) {
        if (enPasillo) return res();
        const k = Math.min(1, (ts - t0) / DUR), e = facil(k);
        const base = Math.min(W, H) * .4, escala = base * Math.pow(70, Math.max(0, (k - .18) / .82) ** 1.6);
        const r = [ROT0[0] + (ROT1[0] - ROT0[0]) * facil(Math.min(1, k / .7)), ROT0[1] + (ROT1[1] - ROT0[1]) * facil(Math.min(1, k / .7))];
        proj.scale(escala).translate([W / 2, H / 2]).rotate(r);
        ctx.clearRect(0, 0, W, H);
        // espacio y estrellas, que se alejan al acercarnos
        const g0 = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .8); g0.addColorStop(0, "#0d1426"); g0.addColorStop(1, "#03040a");
        ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
        const alfaE = Math.max(0, 1 - e * 2.2);
        estrellas.forEach(([x, y, s, f]) => { ctx.globalAlpha = alfaE * (.4 + .6 * Math.abs(Math.sin(ts / 900 + f * 9))); ctx.fillStyle = "#fff"; ctx.fillRect(x * W, y * H, s, s); });
        ctx.globalAlpha = 1;
        // halo de atmósfera
        const R = escala;
        if (R < Math.max(W, H) * 1.5) { const ha = ctx.createRadialGradient(W / 2, H / 2, R * .96, W / 2, H / 2, R * 1.14); ha.addColorStop(0, "rgba(120,170,255,.38)"); ha.addColorStop(1, "rgba(120,170,255,0)"); ctx.fillStyle = ha; ctx.beginPath(); ctx.arc(W / 2, H / 2, R * 1.14, 0, 7); ctx.fill(); }
        // océano como un globo antiguo
        const go = ctx.createRadialGradient(W / 2 - R * .35, H / 2 - R * .4, R * .1, W / 2, H / 2, R); go.addColorStop(0, "#2d4a6b"); go.addColorStop(1, "#0f2036");
        ctx.beginPath(); camino({ type: "Sphere" }); ctx.fillStyle = go; ctx.fill();
        ctx.beginPath(); camino(reticula); ctx.strokeStyle = "rgba(232,207,134,.13)"; ctx.lineWidth = .7; ctx.stroke();
        // tierras en tono pergamino
        const cerca = escala > base * 4;
        ctx.beginPath(); camino(mundo); ctx.fillStyle = "#d8c49a"; ctx.fill();
        if (cerca) { ctx.beginPath(); camino(europa); ctx.fillStyle = "#d8c49a"; ctx.fill(); }
        const esp = (cerca ? europa : mundo).features.find(f => String(f.id) === "724");
        if (esp && k > .45) { ctx.beginPath(); camino(esp); ctx.fillStyle = `rgba(201,162,74,${Math.min(1, (k - .45) * 4) * .85})`; ctx.fill(); }
        ctx.beginPath(); camino(cerca ? topojsonMesh(europa) : mundo.borders); ctx.strokeStyle = "rgba(90,60,30,.55)"; ctx.lineWidth = .8; ctx.stroke();
        // sombreado de esfera
        if (R < Math.max(W, H) * 2) { const sh = ctx.createRadialGradient(W / 2 - R * .3, H / 2 - R * .35, R * .2, W / 2, H / 2, R); sh.addColorStop(0, "rgba(255,255,255,.08)"); sh.addColorStop(.7, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,.45)"); ctx.beginPath(); camino({ type: "Sphere" }); ctx.fillStyle = sh; ctx.fill(); }
        // Madrid y Alcalá
        if (k > .66) {
          const a = Math.min(1, (k - .66) * 5);
          [[MADRID, "Madrid", 3], [ALCALA, "Alcalá de Henares", 5]].forEach(([c, n, rr], j) => {
            const p = proj(c); if (!p) return;
            if (j === 1) { const pulso = (ts % 1600) / 1600; ctx.beginPath(); ctx.arc(p[0], p[1], rr + pulso * 26, 0, 7); ctx.strokeStyle = `rgba(255,214,140,${a * (1 - pulso)})`; ctx.lineWidth = 2; ctx.stroke(); }
            ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.fillStyle = j ? `rgba(255,220,150,${a})` : `rgba(90,24,32,${a})`; ctx.fill();
            ctx.font = `${j ? "italic 600 " : ""}${j ? 20 : 14}px "Bodoni Moda", Georgia, serif`; ctx.fillStyle = `rgba(${j ? "255,240,210" : "40,25,15"},${a})`;
            ctx.textAlign = j ? "left" : "right"; ctx.fillText(n, p[0] + (j ? 14 : -10), p[1] + (j ? 6 : -8));
          });
        }
        const rt = rotulos.filter(x => k >= x[0]).pop();
        if (rt && rot.textContent !== rt[1]) { rot.classList.remove("ve"); void rot.offsetWidth; rot.textContent = rt[1]; rot.classList.add("ve"); }
        if (k < 1) requestAnimationFrame(cuadro); else setTimeout(res, RM ? 0 : 900);
      }
      requestAnimationFrame(cuadro);
    });
  }
  let mallaEuropa = null;
  function topojsonMesh(fc) { return mallaEuropa || (mallaEuropa = { type: "FeatureCollection", features: fc.features.map(f => ({ type: "Feature", geometry: f.geometry })) }); }

  /* ===================== 2 · La fachada ===================== */
  function dibujarFachada() {
    const svg = $("#fachadaSvg"); let v = "";
    v += `<defs>
      <linearGradient id="fCielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070b1c"/><stop offset=".7" stop-color="#1b2748"/><stop offset="1" stop-color="#2f3654"/></linearGradient>
      <radialGradient id="fVentana" cx=".5" cy=".55" r=".7"><stop offset="0" stop-color="#ffe2a0"/><stop offset=".6" stop-color="#f1b45a"/><stop offset="1" stop-color="#a8642a"/></radialGradient>
      <linearGradient id="fLadrillo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3c2c"/><stop offset="1" stop-color="#4a271c"/></linearGradient>
      <pattern id="fHilada" width="40" height="16" patternUnits="userSpaceOnUse"><rect width="40" height="16" fill="url(#fLadrillo)"/><path d="M0 15.5 H40 M20 0 V8 M0 8 H40 M0 8 V16 M40 8 V16" stroke="rgba(30,15,10,.35)" stroke-width="1"/></pattern>
      <radialGradient id="fFarola" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,214,140,.65)"/><stop offset="1" stop-color="rgba(255,214,140,0)"/></radialGradient>
      <linearGradient id="fOro" x1="0" x2="1"><stop offset="0" stop-color="#7a5a22"/><stop offset=".5" stop-color="#f1d98f"/><stop offset="1" stop-color="#7a5a22"/></linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#fCielo)"/>`;
    for (let i = 0; i < 90; i++) v += `<circle cx="${(i * 137.5) % 1200}" cy="${(i * 73.3) % 330}" r="${.4 + (i % 3) * .4}" fill="#fff" opacity="${.3 + (i % 5) * .12}"/>`;
    v += `<circle cx="980" cy="110" r="38" fill="#f6efd8" opacity=".95"/><circle cx="996" cy="102" r="34" fill="#1b2748" opacity=".25"/>`;
    // edificios vecinos
    v += `<path d="M0 280 H210 V800 H0 Z M1000 300 H1200 V800 H1000 Z" fill="#141a2c"/>
      <path d="M40 330 h30 v44 h-30z M120 330 h30 v44 h-30z M40 420 h30 v44 h-30z M1040 350 h30 v44 h-30z M1120 440 h30 v44 h-30z" fill="#e8b866" opacity=".55"/>`;
    // fachada principal con hiladas de ladrillo y zócalo de piedra
    v += `<rect x="230" y="150" width="740" height="620" fill="url(#fHilada)"/><rect x="230" y="150" width="740" height="620" fill="rgba(10,14,30,.25)"/>
      <path d="M215 150 H985 L975 128 H225 Z" fill="#3a2a22"/><rect x="230" y="640" width="740" height="130" fill="#8a8274"/><rect x="230" y="640" width="740" height="8" fill="#a39b8c"/>`;
    const ventana = (x, y, w, h, luz, id) => `<g ${id ? `id="${id}"` : ""}><rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 14}" rx="${w / 2 + 8}" fill="#c9bea8"/>
      <path d="M${x} ${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} H${x} Z" fill="${luz ? "url(#fVentana)" : "#1c2236"}"/>
      <path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h * .55} H${x + w}" stroke="#3a2a22" stroke-width="4"/>
      <rect x="${x - 10}" y="${y + h}" width="${w + 20}" height="8" fill="#b5ab96"/></g>`;
    const cols = [300, 430, 560, 690, 820];
    cols.forEach((x, i) => { v += ventana(x, 190, 80, 120, i !== 0, null); });
    cols.forEach((x, i) => { v += ventana(x, 360, 80, 130, true, i === 2 ? "ventanaMeta" : null); });
    // balcón de forja
    v += `<g stroke="#1a1410" stroke-width="3" fill="none"><path d="M540 500 H680 M540 470 H680"/>${[...Array(15)].map((_, i) => `<path d="M${545 + i * 9.5} 470 V500"/>`).join("")}</g><rect x="532" y="500" width="156" height="8" fill="#2a2420"/>`;
    // puerta y rótulo
    v += `<path d="M545 770 V640 A55 55 0 0 1 655 640 V770 Z" fill="#3a2414"/><path d="M552 770 V642 A48 48 0 0 1 648 642 V770 Z" fill="#5b3a20"/><path d="M600 600 V770" stroke="#2a180c" stroke-width="3"/>
      <circle cx="590" cy="700" r="3" fill="#e8cf86"/><circle cx="610" cy="700" r="3" fill="#e8cf86"/>
      <rect x="480" y="560" width="240" height="44" rx="3" fill="#2a0b0e" stroke="url(#fOro)" stroke-width="3"/>
      <text x="600" y="590" text-anchor="middle" font-family="Bodoni Moda, Georgia, serif" font-style="italic" font-size="26" fill="#f1d98f">Procedencia</text>`;
    // farolas y adoquines
    [[250, 560], [950, 560]].forEach(([x, y]) => { v += `<circle cx="${x}" cy="${y}" r="120" fill="url(#fFarola)"/><path d="M${x} ${y + 10} V790" stroke="#14110e" stroke-width="7"/><path d="M${x - 14} ${y - 18} H${x + 14} L${x + 10} ${y + 12} H${x - 10} Z" fill="#ffe2a0" stroke="#14110e" stroke-width="3"/>`; });
    v += `<rect y="770" width="1200" height="30" fill="#2a2a30"/>`;
    for (let i = 0; i < 40; i++) v += `<ellipse cx="${i * 31 + 10}" cy="${784 + (i % 2) * 6}" rx="13" ry="4" fill="#3a3a42"/>`;
    svg.innerHTML = v;
  }
  function prepararFachada() {
    mostrar("esc-fachada"); dibujarFachada();
    const cam = $("#fachadaCam"); cam.classList.remove("acerca");
    cam.style.transformOrigin = "50% 53.5%"; cam.style.transform = "scale(1)";
  }
  async function escenaFachada() {
    const cam = $("#fachadaCam");
    await espera(1700);
    cam.classList.add("acerca"); cam.style.transform = "scale(9)";
    await espera(2300);
  }

  /* ===================== 3 · El taller ===================== */
  function dibujarTaller() {
    const svg = $("#tallerSvg"), colgadas = OBRAS.slice(0, 5);
    let v = `<defs>
      <radialGradient id="tPared" cx=".5" cy=".25" r=".9"><stop offset="0" stop-color="#d9c29a"/><stop offset=".55" stop-color="#a88a5e"/><stop offset="1" stop-color="#4a3826"/></radialGradient>
      <linearGradient id="tMesa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5131"/><stop offset="1" stop-color="#3b2414"/></linearGradient>
      <radialGradient id="tLuz" cx=".5" cy="0" r="1"><stop offset="0" stop-color="rgba(255,226,160,.55)"/><stop offset="1" stop-color="rgba(255,226,160,0)"/></radialGradient>
      <linearGradient id="tCobre" x1="0" x2="1"><stop offset="0" stop-color="#8a4a26"/><stop offset=".5" stop-color="#e09a62"/><stop offset="1" stop-color="#8a4a26"/></linearGradient>
      <linearGradient id="tPiel" x1="0" x2="1"><stop offset="0" stop-color="#c99272"/><stop offset=".5" stop-color="#e2b592"/><stop offset="1" stop-color="#b98263"/></linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#tPared)"/>
    <!-- ventana por la que hemos entrado -->
    <rect x="80" y="110" width="200" height="270" rx="100" fill="#1b2748"/><path d="M180 110 V380 M80 250 H280" stroke="#3b2414" stroke-width="8"/><rect x="70" y="378" width="220" height="14" fill="#5b3a20"/>
    <circle cx="230" cy="170" r="16" fill="#f6efd8" opacity=".9"/>
    <!-- estanterías con carpetas -->
    <g fill="#5b3a20"><rect x="880" y="120" width="260" height="10"/><rect x="880" y="220" width="260" height="10"/><rect x="880" y="320" width="260" height="10"/></g>
    ${[...Array(18)].map((_, i) => `<rect x="${890 + (i % 9) * 27}" y="${i < 9 ? 140 : 240}" width="20" height="78" fill="${["#5a1820", "#2c3a5c", "#6b5a44", "#3e4a3a", "#7a2a30"][i % 5]}" opacity=".9"/>`).join("")}
    <!-- cuerda con estampas secándose: las obras de la galería -->
    <path d="M330 150 Q600 190 860 150" stroke="#3b2a1e" stroke-width="2" fill="none"/>
    ${colgadas.map((p, i) => { const x = 360 + i * 98, y = 162 + Math.sin(i / 4 * Math.PI) * 18; return `<g transform="translate(${x} ${y}) rotate(${(i % 2 ? 2 : -2)})"><rect x="-2" y="-8" width="6" height="14" fill="#c9a24a"/><rect x="-36" y="4" width="76" height="62" fill="#f6efe2" stroke="#b5a892"/><image href="/${p.thumb}" x="-32" y="8" width="68" height="54" preserveAspectRatio="xMidYMid slice"/></g>`; }).join("")}
    <!-- prensa de grabado -->
    <g transform="translate(930 470)"><rect x="-90" y="20" width="180" height="200" fill="#2b2b2e"/><rect x="-110" y="10" width="220" height="18" fill="#3a3a3e"/>
      <g class="rueda"><circle r="70" fill="none" stroke="#1a1a1c" stroke-width="10"/>${[...Array(6)].map((_, i) => `<path d="M0 0 L${Math.cos(i * Math.PI / 3) * 90} ${Math.sin(i * Math.PI / 3) * 90}" stroke="#1a1a1c" stroke-width="8" stroke-linecap="round"/>`).join("")}<circle r="12" fill="#c9a24a"/></g></g>
    <!-- lámpara -->
    <path d="M520 0 V170" stroke="#1a1410" stroke-width="3"/><path d="M470 210 L570 210 L545 170 L495 170 Z" fill="#2c3a2a"/><polygon points="460,210 580,210 760,620 280,620" fill="url(#tLuz)"/>
    <!-- mesa -->
    <rect x="160" y="560" width="760" height="40" fill="url(#tMesa)"/><rect x="190" y="600" width="26" height="200" fill="#3b2414"/><rect x="860" y="600" width="26" height="200" fill="#3b2414"/>
    <rect x="380" y="536" width="180" height="26" rx="2" fill="url(#tCobre)"/><rect x="600" y="548" width="90" height="12" fill="#1c1c1c"/>
    <!-- el grabador, de perfil, entintando -->
    <g id="grabadorPerfil">
      <path d="M220 800 L240 470 Q250 420 300 410 L340 410 Q380 420 384 470 L396 800 Z" fill="#e9e3d6"/>
      <path d="M244 520 L380 520 L392 800 L232 800 Z" fill="#5b3a20"/>
      <path d="M262 440 L360 440" stroke="#5b3a20" stroke-width="5"/>
      <rect x="300" y="380" width="28" height="34" fill="url(#tPiel)"/>
      <ellipse cx="318" cy="350" rx="38" ry="44" fill="url(#tPiel)"/>
      <path d="M352 346 l10 12 l-10 4 z" fill="#d9a987"/>
      <path d="M284 330 Q290 300 322 298 Q352 300 356 322 Q330 312 300 328 Z" fill="#9c9893"/>
      <path d="M300 370 Q318 402 350 372 Q346 392 320 398 Q298 392 300 370 Z" fill="#bdb8b0"/>
      <circle cx="340" cy="342" r="9" fill="none" stroke="#3a2a1e" stroke-width="2"/>
      <g class="brazo-entinta"><path d="M330 450 Q390 470 430 520" stroke="#e9e3d6" stroke-width="24" stroke-linecap="round" fill="none"/>
        <path d="M418 512 Q440 528 446 534" stroke="url(#tPiel)" stroke-width="14" stroke-linecap="round"/>
        <rect x="430" y="520" width="70" height="16" rx="8" fill="#1c1c1c"/><path d="M465 528 L470 500" stroke="#5b3a20" stroke-width="5"/></g>
    </g>
    <!-- el grabador, girado hacia el visitante -->
    <g id="grabadorFrente" opacity="0">
      <path d="M200 800 Q205 520 260 470 Q320 440 380 470 Q434 520 440 800 Z" fill="#e9e3d6"/>
      <path d="M248 540 Q320 520 392 540 L404 800 L236 800 Z" fill="#5b3a20"/>
      <path d="M262 470 L300 540 M378 470 L340 540" stroke="#5b3a20" stroke-width="6"/>
      <rect x="304" y="400" width="32" height="44" fill="url(#tPiel)"/>
      <ellipse cx="320" cy="360" rx="44" ry="52" fill="url(#tPiel)"/>
      <ellipse cx="276" cy="364" rx="7" ry="12" fill="#c99272"/><ellipse cx="364" cy="364" rx="7" ry="12" fill="#c99272"/>
      <path d="M278 330 Q282 300 320 298 Q358 300 362 330 Q340 316 320 318 Q300 316 278 330 Z" fill="#9c9893"/>
      <path d="M284 386 Q320 440 356 386 Q352 418 320 426 Q288 418 284 386 Z" fill="#bdb8b0"/>
      <g fill="none" stroke="#3a2a1e" stroke-width="2.4"><circle cx="304" cy="356" r="11"/><circle cx="336" cy="356" r="11"/><path d="M315 356 H325"/></g>
      <circle cx="304" cy="357" r="2.6" fill="#2a1d18"/><circle cx="336" cy="357" r="2.6" fill="#2a1d18"/>
      <path d="M296 338 Q304 334 312 338 M328 338 Q336 334 344 338" stroke="#8a857d" stroke-width="2.6" fill="none"/>
      <path d="M310 392 Q320 398 330 392" stroke="#8c4a3a" stroke-width="2" fill="none" class="boca"/>
      <path d="M320 362 Q316 376 320 380 Q324 378 322 372" stroke="#b98263" stroke-width="1.6" fill="none"/>
    </g>
    <rect width="1200" height="800" fill="rgba(20,10,4,.18)"/>`;
    svg.innerHTML = v;
  }
  function decir(txt, opciones) {
    const d = $("#dialogo"), t = $("#dlgTxt"), o = $("#dlgOpc");
    d.hidden = false; t.textContent = ""; o.innerHTML = "";
    return new Promise(res => {
      let i = 0;
      const escribe = () => { t.textContent = txt.slice(0, ++i); if (i < txt.length) setTimeout(escribe, RM ? 0 : 22); else pinta(); };
      const pinta = () => {
        if (!opciones) { res(); return; }
        opciones.forEach(([valor, etiqueta]) => {
          const b = document.createElement("button"); b.type = "button"; b.className = "dlg-b"; b.textContent = etiqueta;
          b.onclick = () => { o.querySelectorAll("button").forEach(x => x.disabled = true); b.classList.add("elegida"); res(valor); };
          o.appendChild(b);
        });
        o.querySelector("button").focus({ preventScroll: true });
      };
      escribe();
    });
  }
  function prepararTaller() { mostrar("esc-taller"); dibujarTaller(); $("#dialogo").hidden = true; }
  async function escenaTaller(soloPreguntas) {
    const sc = $("#esc-taller");
    sc.classList.remove("girado"); sc.classList.add("entintando");
    if (!soloPreguntas) await espera(2600);
    sc.classList.remove("entintando"); sc.classList.add("girado");
    await espera(500);
    gustos.estilo = await decir("Buenas noches. Perdone que no le haya oído entrar… ¿Qué tipo de arte le gusta?", [
      ["ciudades", "Vistas de ciudades"], ["casas", "Casas y paisajes"], ["escenas", "Escenas y retratos"], ["todo", "Un poco de todo"]]);
    const r1 = { ciudades: "Entonces le va a gustar Venecia… y un Dublín de 1844 que tengo colgado.", casas: "Tengo una casa señorial inglesa de la década de 1820 que le va a encantar.", escenas: "Las escenas y las damas de los cromos, entonces. Tienen mucha historia.", todo: "Mejor así: el pasillo es largo y hay de todo un poco." }[gustos.estilo];
    await decir(r1); await espera(1200);
    gustos.fin = await decir("¿Y la busca para decorar su casa, para coleccionar o para regalar?", [["decorar", "Decorar mi casa"], ["coleccionar", "Coleccionar"], ["regalar", "Regalar"]]);
    const r2 = { decorar: "Le pongo delante las que llenan una pared, con los mejores marcos.", coleccionar: "Le dejo primero las estampas originales del XIX. Las reproducciones, al final y bien señaladas.", regalar: "Le pongo delante las que mejor viajan y las de mejor precio." }[gustos.fin];
    sto.set("pasillo-gustos", JSON.stringify(gustos));
    await decir(r2); await espera(1100);
    await decir("Pase, pase. La galería está al fondo del pasillo.", [["entrar", "Entrar en la galería →"]]);
  }

  /* ===================== 4 · El pasillo infinito ===================== */
  const S = 760, HW = 520, FLOOR = 300, CEIL = -420, D = S * 9;
  // En pantallas estrechas se abre el ángulo de visión para que las paredes y sus cuadros se vean
  const P = innerWidth < 700 ? 470 : 800;
  document.documentElement.style.setProperty("--persp", P + "px");
  let orden = [], slots = [], arcos = [], t = 0, tMeta = 0, ry = 0, ryMeta = 0, dz = 0, dzMeta = 0, rx = 0, rxMeta = 0, mira = 0, raf = 0, ocupado = false, L = 1;
  const mundo = $("#mundo"), visor = $("#visor3d");
  const mod = (a, b) => ((a % b) + b) % b;
  function construir() {
    orden = ordenar();
    const vueltas = Math.max(1, Math.ceil(7 / orden.length));
    const lista = Array.from({ length: orden.length * vueltas }, (_, i) => orden[i % orden.length]);
    L = lista.length * S;
    let h = `<div class="suelo"></div><div class="techo"></div><div class="pared izq"></div><div class="pared der"></div>`;
    lista.forEach((p, k) => {
      h += `<button type="button" class="cuadro3d ${k % 2 ? "der" : "izq"}" data-k="${k}" aria-label="${p.t}. ${p.tech}. Ver de cerca">
        <span class="c3-lamp" aria-hidden="true"><i></i></span><img src="/${p.thumb}" alt="" width="${p.tw}" height="${p.th}" loading="eager" decoding="async">
        <span class="c3-placa"><b>${p.t}</b><small>${p.id} · ${p.puja ? "en puja" : euro(p.price)}</small></span></button>`;
    });
    for (let a = 0; a < lista.length; a++) h += `<div class="arco" data-a="${a}" aria-hidden="true"><i></i></div>`;
    mundo.innerHTML = h;
    slots = [...mundo.querySelectorAll(".cuadro3d")].map(el => ({ el, k: +el.dataset.k, p: lista[+el.dataset.k], izq: el.classList.contains("izq") }));
    arcos = [...mundo.querySelectorAll(".arco")].map(el => ({ el, a: +el.dataset.a }));
    slots.forEach(s => { s.el.onclick = () => acercar(s); });
    const suelo = mundo.querySelector(".suelo"), techo = mundo.querySelector(".techo"), pi = mundo.querySelector(".pared.izq"), pd = mundo.querySelector(".pared.der");
    suelo.style.cssText = `width:${HW * 2}px;height:${D}px;transform:translate(-50%,-50%) translate3d(0,${FLOOR}px,${P - D / 2}px) rotateX(90deg)`;
    techo.style.cssText = `width:${HW * 2}px;height:${D}px;transform:translate(-50%,-50%) translate3d(0,${CEIL}px,${P - D / 2}px) rotateX(-90deg)`;
    pi.style.cssText = `width:${D}px;height:${FLOOR - CEIL}px;transform:translate(-50%,-50%) translate3d(${-HW}px,${(FLOOR + CEIL) / 2}px,${P - D / 2}px) rotateY(90deg)`;
    pd.style.cssText = `width:${D}px;height:${FLOOR - CEIL}px;transform:translate(-50%,-50%) translate3d(${HW}px,${(FLOOR + CEIL) / 2}px,${P - D / 2}px) rotateY(-90deg)`;
    mundo._planos = { suelo, techo, pi, pd };
    pintarPasillo(true);
  }
  function pintarPasillo() {
    mundo.style.transform = `translateZ(${P}px) translateZ(${dz}px) rotateX(${rx}deg) rotateY(${ry + mira}deg) translateZ(${-P}px)`;
    slots.forEach(s => {
      const ahead = mod(s.k * S - t + 700, L) - 700;
      const z = P - (ahead + 420), x = s.izq ? -HW + 2 : HW - 2;
      const niebla = ahead < -330 ? 0 : Math.max(0, Math.min(1, 1 - (ahead - 2600) / 2600));
      s.el.style.transform = `translate(-50%,-50%) translate3d(${x}px,-40px,${z}px) rotateY(${s.izq ? 90 : -90}deg)`;
      s.el.style.opacity = niebla.toFixed(3); s.el.style.visibility = niebla < .02 ? "hidden" : "visible";
    });
    arcos.forEach(a => {
      const ahead = mod(a.a * S + S / 2 - t + 700, L) - 700, z = P - (ahead + 420);
      const niebla = ahead < -350 ? 0 : Math.max(0, Math.min(1, 1 - (ahead - 2900) / 2600));
      a.el.style.transform = `translate(-50%,-50%) translate3d(0,${(FLOOR + CEIL) / 2}px,${z}px)`;
      a.el.style.opacity = niebla.toFixed(3); a.el.style.visibility = niebla < .02 ? "hidden" : "visible";
    });
    const pl = mundo._planos, c = 420 + S / 2;
    pl.suelo.style.backgroundPosition = `0 ${mod(t, 160)}px`;
    pl.techo.style.backgroundPosition = `0 ${mod(-t, S)}px`;
    pl.pi.style.backgroundPosition = `${mod(c - t - 700 + S, S)}px 0`;
    pl.pd.style.backgroundPosition = `${mod(t - c + 700 + D, S)}px 0`;
  }
  function bucle() {
    const k = RM ? 1 : .12;
    t += (tMeta - t) * k; ry += (ryMeta - ry) * (RM ? 1 : .09); dz += (dzMeta - dz) * (RM ? 1 : .09); rx += (rxMeta - rx) * .08;
    pintarPasillo();
    const quieto = Math.abs(tMeta - t) < .3 && Math.abs(ryMeta - ry) < .02 && Math.abs(dzMeta - dz) < .3 && Math.abs(rxMeta - rx) < .01;
    raf = quieto ? 0 : requestAnimationFrame(bucle);
    if (quieto) { t = tMeta; ry = ryMeta; dz = dzMeta; pintarPasillo(); }
  }
  const mover = () => { if (!raf) raf = requestAnimationFrame(bucle); };
  function avanzar(d) { if (ocupado) return; tMeta += d; mover(); $("#hudPie").classList.add("visto"); }
  addEventListener("wheel", e => { if (!enPasillo || ocupado || !$("#vista").hidden) return; e.preventDefault(); avanzar(e.deltaY * 1.4); }, { passive: false });
  let toque = null;
  visor.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") toque = { y: e.clientY, x: e.clientX, t: tMeta, mov: false }; });
  addEventListener("pointermove", e => {
    if (toque && enPasillo && !ocupado) { const d = (toque.y - e.clientY) * 3.2 + (toque.x - e.clientX) * 1.2; if (Math.abs(d) > 12) toque.mov = true; tMeta = toque.t + d; mover(); }
    if (e.pointerType === "mouse" && enPasillo && !ocupado) { rxMeta = (e.clientY / innerHeight - .5) * -3; mira = (e.clientX / innerWidth - .5) * -6; mover(); }
  }, { passive: true });
  addEventListener("pointerup", () => { toque = null; });
  addEventListener("keydown", e => {
    if (!enPasillo) return;
    if (e.key === "Escape" && !$("#vista").hidden) { devolver(); return; }
    if (!$("#vista").hidden || !$("#listaObras").hidden) return;
    if (e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); avanzar(S); }
    if (e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); avanzar(-S); }
  });
  $("#btnAvanza").onclick = () => avanzar(S);
  $("#btnAtras").onclick = () => avanzar(-S);

  async function irAlPasillo(desdeSaltar) {
    if (enPasillo) return;
    enPasillo = true; saltar.hidden = true; sto.set("pasillo-visto", "1");
    await fundido(async () => { $("#dialogo").hidden = true; mostrar("esc-pasillo"); construir(); t = tMeta = -1400; ry = ryMeta = 0; pintarPasillo(); });
    tMeta = 0; mover();
  }
  $("#btnGustos").onclick = async () => {
    enPasillo = false; saltar.hidden = true;
    await fundido(async () => { prepararTaller(); });
    escenaTaller(true).then(() => irAlPasillo());
  };

  /* ===================== 5 · El trabajador de sala ===================== */
  const trab = $("#trabajo"), figura = $("#trabajador"), clon = $("#obraClon"), vista = $("#vista");
  figura.innerHTML = `<svg viewBox="0 0 160 360" class="trab-svg" aria-hidden="true">
    <defs><linearGradient id="wBata" x1="0" x2="1"><stop offset="0" stop-color="#4f5459"/><stop offset=".5" stop-color="#6c7277"/><stop offset="1" stop-color="#43474c"/></linearGradient>
    <linearGradient id="wPiel" x1="0" x2="1"><stop offset="0" stop-color="#c99272"/><stop offset=".5" stop-color="#e2b592"/><stop offset="1" stop-color="#b98263"/></linearGradient>
    <linearGradient id="wMadera" x1="0" x2="1"><stop offset="0" stop-color="#7a5131"/><stop offset=".5" stop-color="#a77548"/><stop offset="1" stop-color="#6b4627"/></linearGradient></defs>
    <g class="w-escalera"><rect x="0" y="0" width="7" height="300" rx="2" fill="url(#wMadera)"/><rect x="52" y="0" width="7" height="300" rx="2" fill="url(#wMadera)"/>
      ${[...Array(9)].map((_, i) => `<rect x="5" y="${18 + i * 32}" width="50" height="6" rx="2" fill="#8a5a32"/>`).join("")}</g>
    <g class="w-cuerpo">
      <g class="w-pierna wp1"><path d="M68 214 L82 214 L81 280 L80 340 L70 340 L69 280 Z" fill="#2a2d33"/><path d="M66 338 L82 338 Q92 340 93 348 L66 348 Z" fill="#141414"/></g>
      <g class="w-pierna wp2"><path d="M68 214 L82 214 L81 280 L80 340 L70 340 L69 280 Z" fill="#1f2227"/><path d="M66 338 L82 338 Q92 340 93 348 L66 348 Z" fill="#0d0d0d"/></g>
      <path d="M56 92 Q75 82 94 92 L98 150 L101 236 L52 236 L55 150 Z" fill="url(#wBata)"/><path d="M75 96 L75 236" stroke="#3a3e43" stroke-width="1.4"/>
      <circle cx="80" cy="128" r="1.8" fill="#c9c3b6"/><circle cx="80" cy="160" r="1.8" fill="#c9c3b6"/><rect x="84" y="112" width="10" height="7" fill="#c9a24a"/>
      <rect x="70" y="72" width="12" height="16" fill="url(#wPiel)"/>
      <ellipse cx="76" cy="54" rx="19" ry="21" fill="url(#wPiel)"/><path d="M94 52 L99 60 L94 62 Z" fill="#e2b592"/>
      <path d="M56 46 Q58 30 76 29 Q94 30 96 42 L94 44 Q76 38 58 50 Z" fill="#2b3348"/><path d="M90 42 L104 44 L96 48 Z" fill="#1d2433"/>
      <circle cx="88" cy="52" r="1.8" fill="#2a1d18"/><path d="M86 64 Q90 65 93 63" stroke="#8c4a3a" stroke-width="1.4" fill="none"/>
      <g class="w-brazo"><path d="M70 96 L84 96 L86 150 L83 192 L74 192 L72 150 Z" fill="url(#wBata)"/><circle cx="79" cy="197" r="7" fill="url(#wPiel)"/></g>
    </g></svg>`;
  function rectDe(el) { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }
  function colocar(el, r) { Object.assign(el.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" }); }
  async function acercar(s) {
    if (ocupado || (toque && toque.mov)) return;
    ocupado = true; document.body.classList.add("ocupado");
    // la cámara se gira hacia la obra
    const ahead = mod(s.k * S - t + 700, L) - 700;
    tMeta = t + ahead + 420; ryMeta = s.izq ? -90 : 90; dzMeta = 300; mira = 0; rxMeta = 0; mover();
    await espera(RM ? 50 : 1300);
    const img = s.el.querySelector("img"), r = rectDe(img), p = s.p;
    trab.hidden = false; trab.className = "escena-trabajo";
    clon.querySelector("img").src = "/" + p.thumb; colocar(clon, r); clon.style.transform = "none"; clon.classList.remove("vuela");
    img.style.visibility = "hidden";
    // el trabajador llega con la escalera
    const alto = Math.max(260, r.h * 2.3), ancho = alto * 160 / 360, suelo = Math.min(innerHeight - 10, r.y + r.h * 2.05);
    const xFin = r.x - ancho * .62;
    Object.assign(figura.style, { height: alto + "px", width: ancho + "px", top: (suelo - alto) + "px", left: "0px", transform: `translateX(${-ancho - 40}px)` });
    figura.className = "trabajador camina lleva";
    await espera(60);
    figura.style.transition = RM ? "none" : "transform 1.5s linear"; figura.style.transform = `translateX(${xFin}px)`;
    await espera(1500);
    figura.className = "trabajador apoya"; await espera(700);
    figura.style.setProperty("--sube", (r.h * .9 * 360 / alto).toFixed(1) + "px");
    figura.style.transition = RM ? "none" : "transform .9s ease-in-out"; figura.style.transform = `translateX(${xFin}px) translateY(${-(r.h * .9)}px)`;
    figura.classList.add("sube"); await espera(950);
    figura.classList.add("alcanza"); await espera(350);
    clon.classList.add("descuelga"); await espera(450);
    figura.style.transform = `translateX(${xFin}px) translateY(0)`; figura.classList.remove("alcanza", "sube");
    clon.style.transition = RM ? "none" : "transform .9s ease-in-out"; clon.style.transform = `translateY(${r.h * .9}px)`; await espera(950);
    // transición cinematográfica a pantalla completa
    trab.classList.add("cine"); figura.classList.add("se-aparta");
    await abrirVista(p, r);
  }
  async function abrirVista(p, r) {
    $("#vInv").textContent = `${p.id} · ${p.y}`; $("#vTitulo").textContent = p.t; $("#vAutor").textContent = p.a;
    $("#vDatos").innerHTML = [["Época", p.y], ["Técnica", p.tech], ["Marco", p.marco], ["Medidas", p.medidas || "A consultar"]].map(([a, b], i) => `<li style="--i:${i}"><span>${a}</span>${b}</li>`).join("");
    $("#vHistoria").textContent = p.story;
    const pj = p.puja ? estadoPuja(p) : null, e = p.estado || "disponible";
    $("#vPuja").innerHTML = pj && e === "disponible" ? htmlPuja(p) : "";
    $("#vPrecio").innerHTML = pj && e === "disponible" ? `<small>${pujaActual(p) == null ? "Salida" : "Puja actual"}</small> ${euro(pujaActual(p) == null ? p.puja.salida : pujaActual(p))}` : euro(p.price);
    const st = $("#vEstado"); st.className = "status " + (pj && e === "disponible" ? "en-puja" : e); st.innerHTML = `<i></i>${pj && e === "disponible" ? (pj.abierta ? "En puja" : "Puja cerrada") : ESTADOS[e]}`;
    const br = $("#vReservar"); br.textContent = pj && pj.abierta ? `Pujar · desde ${euro(minimoPuja(p))}` : e === "vendido" ? "Avísame de algo parecido" : "Reservar o preguntar";
    br.onclick = () => pj && pj.abierta && e === "disponible" ? ofertar(p) : reservar(p);
    $("#vCert").onclick = () => abrirCertificado(p);
    $("#vFicha").href = `/obra/${p.slug}/`;
    const stage = $("#vistaStage"); stage.innerHTML = `<img alt="${p.t}" id="vistaImg" src="/${p.img}">`;
    const img = stage.querySelector("img");
    await new Promise(res => { if (img.complete && img.naturalWidth) res(); else { img.onload = res; img.onerror = res; } });
    vista.hidden = false; vista.classList.remove("ve"); vista._p = p;
    const fin = rectDe(img); vista.style.visibility = "hidden";
    // vuelo del clon desde la pared hasta su lugar en la vista
    const c0 = rectDe(clon);
    clon.querySelector("img").src = "/" + p.img;
    clon.style.transition = RM ? "none" : "transform 1s cubic-bezier(.6,0,.2,1)";
    clon.style.transformOrigin = "0 0";
    clon.style.transform = `translate(${fin.x - c0.x + (clon.style.transform.includes("translateY") ? 0 : 0)}px, ${fin.y - r.y}px) scale(${fin.w / c0.w}, ${fin.h / c0.h})`;
    clon.classList.add("vuela");
    await espera(1050);
    vista.style.visibility = ""; vista.classList.add("ve"); trab.hidden = true;
    ponerLupa(stage, p); tickRelojes();
    $("#vCerrar").focus({ preventScroll: true });
  }
  async function devolver() {
    if (vista.hidden) return;
    const p = vista._p, s = slots.find(x => x.p === p && x.el.querySelector("img").style.visibility === "hidden");
    const vImg = $("#vistaImg"), v0 = rectDe(vImg);
    vista.classList.remove("ve"); await espera(RM ? 0 : 300); vista.hidden = true;
    if (!s) { volverAlPasillo(); return; }
    const img = s.el.querySelector("img"), r = rectDe(img);
    trab.hidden = false; trab.className = "escena-trabajo";
    clon.style.transition = "none"; clon.style.transformOrigin = "0 0"; colocar(clon, r);
    clon.style.transform = `translate(${v0.x - r.x}px, ${v0.y - r.y}px) scale(${v0.w / r.w}, ${v0.h / r.h})`; clon.querySelector("img").src = "/" + p.img;
    await espera(30);
    // el trabajador la recoge y la vuelve a colgar
    const alto = Math.max(260, r.h * 2.3), ancho = alto * 160 / 360, suelo = Math.min(innerHeight - 10, r.y + r.h * 2.05), xFin = r.x - ancho * .62;
    Object.assign(figura.style, { height: alto + "px", width: ancho + "px", top: (suelo - alto) + "px", left: "0px", transition: "none", transform: `translateX(${xFin}px) translateY(${-(r.h * .9)}px)` });
    figura.style.setProperty("--sube", (r.h * .9 * 360 / alto).toFixed(1) + "px");
    figura.className = "trabajador apoya sube alcanza";
    clon.style.transition = RM ? "none" : "transform 1s cubic-bezier(.6,0,.2,1)"; clon.style.transform = "translate(0,0) scale(1,1)";
    await espera(1050);
    img.style.visibility = ""; clon.style.transform = "none"; clon.style.left = "-9999px";
    figura.classList.remove("alcanza", "sube"); figura.style.transition = RM ? "none" : "transform .8s ease-in-out"; figura.style.transform = `translateX(${xFin}px) translateY(0)`;
    await espera(850);
    figura.className = "trabajador camina lleva"; figura.style.transition = RM ? "none" : "transform 1.3s linear"; figura.style.transform = `translateX(${-ancho - 60}px)`;
    await espera(400); volverAlPasillo(); await espera(950);
    trab.hidden = true;
  }
  function volverAlPasillo() { ryMeta = 0; dzMeta = 0; mover(); setTimeout(() => { ocupado = false; document.body.classList.remove("ocupado"); }, RM ? 0 : 700); }
  $("#vCerrar").onclick = devolver;

  /* ---------- Lista de todas las obras ---------- */
  const lista = $("#listaObras");
  $("#btnLista").onclick = () => {
    $("#listaUl").innerHTML = orden.map((p, i) => `<li><button type="button" data-i="${i}"><img src="/${p.thumb}" alt=""><span><b>${p.t}</b><small>${p.tech} · ${euro(p.price)}</small></span></button></li>`).join("");
    lista.hidden = false; $("#listaCerrar").focus();
    $("#listaUl").querySelectorAll("button").forEach(b => b.onclick = async () => {
      lista.hidden = true; const p = orden[+b.dataset.i];
      const s = slots.filter(x => x.p === p).sort((a, c) => mod(a.k * S - t, L) - mod(c.k * S - t, L))[0];
      tMeta = t + mod(s.k * S - t, L) - 900; mover(); await espera(RM ? 50 : 1400); acercar(s);
    });
  };
  $("#listaCerrar").onclick = () => { lista.hidden = true; };
  lista.addEventListener("click", e => { if (e.target === lista) lista.hidden = true; });

  /* ---------- Arranque ---------- */
  async function inicio() {
    const directo = /[?&]directo/.test(location.search) || RM;
    if (sto.get("pasillo-visto")) saltar.textContent = "Ir directo al pasillo →";
    if (directo) { irAlPasillo(); return; }
    await viajeEspacio(); if (enPasillo) return;
    await fundido(async () => prepararFachada(), "#03040a"); if (enPasillo) return;
    await escenaFachada(); if (enPasillo) return;
    await fundido(async () => prepararTaller(), "#f6e3b8"); if (enPasillo) return;
    await escenaTaller(); if (!enPasillo) irAlPasillo();
  }
  inicio();
})();
