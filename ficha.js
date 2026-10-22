// Lupa de coleccionista y certificado de procedencia: comunes a la sala y a las fichas de obra
const LUPA_ZOOM = 2.6;
const ESTADOS = { disponible: "Disponible", reservado: "Reservada", vendido: "Vendida" };

/* ---------- Lupa ---------- */
function ponerLupa(stage, p) {
  const img = stage.querySelector("img");
  if (!img) return;
  stage.classList.add("con-lupa");
  const lente = document.createElement("div"); lente.className = "lupa"; lente.hidden = true; lente.setAttribute("aria-hidden", "true");
  const nota = document.createElement("div"); nota.className = "lupa-nota"; nota.hidden = true; nota.setAttribute("aria-live", "polite");
  stage.append(lente, nota);
  const ctl = document.createElement("div"); ctl.className = "lupa-ctl";
  const tactil = matchMedia("(hover: none)").matches;
  ctl.innerHTML = tactil
    ? `<button type="button" class="lupa-btn" aria-pressed="false"><span class="lupa-ico" aria-hidden="true"></span>Usar la lupa</button><span class="lupa-tip">Activa la lupa y desliza el dedo por la obra</span>`
    : `<span class="lupa-tip"><span class="lupa-ico" aria-hidden="true"></span>Pasa la lupa por la obra para ver las firmas</span>`;
  stage.appendChild(ctl);
  const btn = ctl.querySelector(".lupa-btn");
  let modoTactil = false;
  if (btn) btn.onclick = () => {
    modoTactil = !modoTactil; btn.setAttribute("aria-pressed", modoTactil);
    btn.lastChild.textContent = modoTactil ? "Guardar la lupa" : "Usar la lupa";
    img.style.touchAction = modoTactil ? "none" : ""; stage.classList.toggle("lupa-activa", modoTactil);
    if (!modoTactil) ocultar();
  };
  const notas = (p.notas || []).map(([x, y, t]) => ({ x, y, t }));
  let pintada = false;
  function mover(cx, cy, tocando) {
    const r = img.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const x = cx - r.left, y = cy - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) { ocultar(); return; }
    const R = lente.offsetWidth / 2 || 85;
    if (!pintada) { lente.style.backgroundImage = `url("${img.currentSrc || img.src}")`; pintada = true; }
    lente.style.backgroundSize = `${r.width * LUPA_ZOOM}px ${r.height * LUPA_ZOOM}px`;
    lente.style.backgroundPosition = `${-(x * LUPA_ZOOM - R)}px ${-(y * LUPA_ZOOM - R)}px`;
    const lx = r.left - s.left + x, ly = r.top - s.top + y - (tocando ? R + 30 : 0);
    lente.style.transform = `translate(${lx - R}px, ${ly - R}px)`;
    lente.hidden = false;
    const px = x / r.width * 100, py = y / r.height * 100;
    const cerca = notas.find(n => Math.hypot((n.x - px) * r.width / 100, (n.y - py) * r.height / 100) < R * 0.55);
    if (cerca) {
      nota.textContent = cerca.t; nota.hidden = false;
      const W = Math.min(220, s.width - 8);
      let nx, ny;
      if (lx + R + 12 + W < s.width) { nx = lx + R + 10; ny = Math.max(0, ly - 20); }
      else if (lx - R - 12 - W > 0) { nx = lx - R - 10 - W; ny = Math.max(0, ly - 20); }
      else { nx = Math.max(0, Math.min(lx - W / 2, s.width - W)); ny = ly + R + 12; }
      nota.style.maxWidth = W + "px";
      nota.style.transform = `translate(${nx}px, ${ny}px)`;
    } else nota.hidden = true;
  }
  function ocultar() { lente.hidden = true; nota.hidden = true; }
  img.addEventListener("pointermove", e => {
    if (e.pointerType === "mouse") { stage.classList.add("lupa-raton"); mover(e.clientX, e.clientY, false); }
    else if (modoTactil) { e.preventDefault(); mover(e.clientX, e.clientY, true); }
  });
  img.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse" && modoTactil) { e.preventDefault(); mover(e.clientX, e.clientY, true); } });
  img.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") ocultar(); });
  img.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") ocultar(); });
  img.addEventListener("pointercancel", ocultar);
}

/* ---------- Certificado de procedencia ---------- */
let certDlg = null, certPrevFocus = null;
function abrirCertificado(p) {
  if (!certDlg) {
    certDlg = document.createElement("div"); certDlg.className = "certdlg"; certDlg.hidden = true;
    certDlg.setAttribute("role", "dialog"); certDlg.setAttribute("aria-modal", "true"); certDlg.setAttribute("aria-labelledby", "certT");
    document.body.appendChild(certDlg);
    certDlg.addEventListener("click", e => { if (e.target === certDlg) cerrarCertificado(); });
    document.addEventListener("keydown", e => { if (!certDlg.hidden && e.key === "Escape") { e.stopImmediatePropagation(); cerrarCertificado(); } }, true);
  }
  certPrevFocus = document.activeElement;
  const e = p.estado || "disponible";
  const pasos = (p.cadena || []).map(c => `<li><span>${c}</span></li>`).join("")
    + `<li><span>Galería Procedencia, Alcalá de Henares</span></li>`
    + `<li class="futuro"><span>${e === "vendido" ? "Ya cuelga en otra casa" : "Su casa"}</span><span class="linea"></span></li>`;
  certDlg.innerHTML = `<div class="cert-wrap">
    <article class="cert">
      <div class="cert-in">
        <p class="cert-k">Galería Procedencia · Alcalá de Henares</p>
        <h2 id="certT">Certificado de procedencia</h2>
        <p class="cert-ref">Nº de inventario <b>${p.id}</b></p>
        <h3>${p.t}</h3>
        <p class="cert-art">${p.a}</p>
        <dl>
          <div><dt>Técnica</dt><dd>${p.tech}</dd></div>
          <div><dt>Época</dt><dd>${p.y}</dd></div>
          <div><dt>Marco</dt><dd>${p.marco}</dd></div>
          <div><dt>Medidas</dt><dd>${p.medidas || "A consultar"}</dd></div>
        </dl>
        <h4>Cadena de procedencia</h4>
        <ol class="cadena">${pasos}</ol>
        <div class="cert-pie">
          <div class="firma"><span>Procedencia</span><small>Por la galería</small></div>
          <div class="lacre" aria-hidden="true"><span>P</span></div>
          <div class="fecha"><span class="linea"></span><small>Fecha de adquisición</small></div>
        </div>
        <p class="cert-nota">Se entrega impreso y firmado con la obra.</p>
      </div>
    </article>
    <div class="cert-acts"><button type="button" class="btn" id="certPrint">Imprimir</button><button type="button" class="btn ghost-dark" id="certClose">Cerrar</button></div>
  </div>`;
  certDlg.hidden = false; document.documentElement.classList.add("cert-abierto");
  document.getElementById("certClose").onclick = cerrarCertificado;
  document.getElementById("certPrint").onclick = () => window.print();
  certDlg.scrollTop = 0;
  document.getElementById("certClose").focus({ preventScroll: true });
}
function cerrarCertificado() {
  certDlg.hidden = true; certDlg.innerHTML = ""; document.documentElement.classList.remove("cert-abierto");
  if (certPrevFocus) certPrevFocus.focus();
}

/* ---------- Cajón del expediente ---------- */
function htmlExpediente(p) {
  const e = p.exp; if (!e) return "";
  const fig = (src, txt, cls) => src ? `<figure class="exp-fig ${cls || ""}"><img src="/${src}" alt="" loading="lazy"><figcaption>${txt}</figcaption></figure>` : "";
  const refs = (e.refs || []).length ? `<div class="exp-refs"><h5>En colecciones públicas</h5><ul>${e.refs.map(([t, s, u]) =>
    `<li><a href="${u}" target="_blank" rel="noopener">${t}</a><span>${s}</span></li>`).join("")}</ul></div>` : "";
  return `<div class="cajon">
    <button type="button" class="cajon-frente" aria-expanded="false"><span class="tirador" aria-hidden="true"></span><span class="cajon-rot">Expediente ${p.id}</span><span class="cajon-acc">Abrir el cajón</span></button>
    <div class="cajon-cuerpo" hidden><div class="cajon-fondo">
      <p class="exp-k">Archivo de la galería · ${p.id}</p>
      ${fig(e.detalle, e.detalle_txt, "ancho")}
      ${fig(e.reverso, e.reverso_txt)}
      ${(e.notas || []).length ? `<div class="exp-notas"><h5>Notas de la galería</h5><ul>${e.notas.map(n => `<li>${n}</li>`).join("")}</ul></div>` : ""}
      ${refs}
    </div></div></div>`;
}
function ponerExpediente(raiz) {
  raiz.querySelectorAll(".cajon").forEach(c => {
    const b = c.querySelector(".cajon-frente"), cu = c.querySelector(".cajon-cuerpo");
    b.onclick = () => {
      const abrir = cu.hidden;
      if (abrir) { cu.hidden = false; requestAnimationFrame(() => c.classList.add("abierto")); }
      else { c.classList.remove("abierto"); setTimeout(() => { cu.hidden = true; }, SIN_ANIM ? 0 : 450); }
      b.setAttribute("aria-expanded", abrir);
      b.querySelector(".cajon-acc").textContent = abrir ? "Cerrar el cajón" : "Abrir el cajón";
    };
  });
}

/* ---------- Puja pública ---------- */
const escH = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function estadoPuja(p) {
  if (!p.puja) return null;
  const fin = new Date(p.puja.cierre).getTime(), falta = fin - Date.now();
  return { abierta: falta > 0, falta };
}
function textoFalta(ms, corto) {
  const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
  if (corto) return d ? `${d} d ${h} h` : h ? `${h} h ${m} min` : `${m} min`;
  const dos = n => String(n).padStart(2, "0");
  return { d, h: dos(h), m: dos(m), s: dos(ss) };
}
const pujasDe = p => ((p.puja && p.puja.pujas) || []).slice().sort((x, y) => new Date(x.fecha) - new Date(y.fecha));
const pujaActual = p => { const l = pujasDe(p); return l.length ? Math.max(...l.map(b => b.importe)) : null; };
const incremento = p => (p.puja && p.puja.incremento) || 5;
const minimoPuja = p => { const a = pujaActual(p); return a == null ? p.puja.salida : a + incremento(p); };
function cuando(iso) {
  const d = new Date(iso);
  try { return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" }).format(d); }
  catch (_) { return d.toLocaleString("es-ES"); }
}
function tablero(p) {
  const l = pujasDe(p).reverse();
  if (!l.length) return `<p class="tab-vacio">Todavía no hay pujas. La primera abre la sala, desde ${euro(p.puja.salida)}.</p>`;
  return `<ol class="tablero">${l.map((b, i) => `<li class="${i === 0 ? "lider" : ""}">
    <span class="tab-pal">${b.paleta}</span>
    <span class="tab-quien">${b.alias ? escH(b.alias) : "Paleta nº " + b.paleta}<small>${cuando(b.fecha)}</small></span>
    <b>${euro(b.importe)}</b></li>`).join("")}</ol>`;
}
function htmlPuja(p) {
  const st = estadoPuja(p); if (!st) return "";
  const act = pujaActual(p), l = pujasDe(p);
  if (!st.abierta) {
    const top = l.length ? l.reduce((x, y) => y.importe > x.importe ? y : x) : null;
    return `<div class="puja cerrada"><p class="puja-k">Puja pública · cerrada</p>
      <p class="puja-fin">${top ? `Remató la paleta nº ${top.paleta} con <b>${euro(top.importe)}</b>. Adjudicación en curso.` : `La puja cerró el ${p.puja.cierre_txt} sin pujas.`}</p>${tablero(p)}</div>`;
  }
  return `<div class="puja" data-cierre="${p.puja.cierre}">
    <p class="puja-k">Puja pública · martillo el ${p.puja.cierre_txt}</p>
    <div class="reloj" aria-label="Tiempo hasta el cierre de la puja"><span><b data-u="d">–</b>días</span><span><b data-u="h">–</b>horas</span><span><b data-u="m">–</b>min</span><span><b data-u="s">–</b>seg</span></div>
    <div class="puja-estado"><span>${act == null ? "Salida" : "Puja actual"}</span><b>${euro(act == null ? p.puja.salida : act)}</b><small>${l.length} ${l.length === 1 ? "puja" : "pujas"} · siguiente desde ${euro(minimoPuja(p))}</small></div>
    ${tablero(p)}
    <p class="puja-reglas">Las pujas son públicas: aparecen en este tablero con su número de paleta y el importe, nunca con su nombre. Se publican en cuanto la galería las recibe y las confirma. Cada puja debe superar a la anterior en ${euro(incremento(p))} como mínimo. Al martillazo, la obra es para la puja más alta.</p>
  </div>`;
}

/* La paleta: el visitante escribe su puja y la levanta */
function ofertar(p) {
  const prev = document.activeElement, min = minimoPuja(p);
  mailDlg.innerHTML = `<div class="mbox pujabox"><button class="mclose" id="mClose" type="button" aria-label="Cerrar">✕</button>
    <p class="puja-k">Puja pública · ${p.id}</p>
    <h3 id="mTitle">Levantar la paleta</h3>
    <p>${escH(p.t)}. ${pujaActual(p) == null ? "Salida" : "Puja actual"}: <b>${euro(pujaActual(p) == null ? p.puja.salida : pujaActual(p))}</b>.</p>
    <form id="pujaForm" class="puja-form" novalidate>
      <label for="pjImporte">Su puja, en euros</label>
      <div class="pj-imp"><input id="pjImporte" type="number" inputmode="numeric" min="${min}" step="1" value="${min}" required><span>€</span></div>
      <label for="pjAlias">Cómo quiere aparecer en el tablero <small>(opcional, sin su nombre real)</small></label>
      <input id="pjAlias" type="text" maxlength="28" placeholder="Por ejemplo: Coleccionista de Alcalá" autocomplete="off">
      <p class="pj-err" id="pjErr" aria-live="polite"></p>
      <button class="btn" type="submit">Levantar la paleta</button>
    </form></div>`;
  mailDlg.hidden = false; mailPrevFocus = prev;
  document.getElementById("mClose").onclick = closeMail;
  const imp = document.getElementById("pjImporte"); imp.focus(); imp.select();
  document.getElementById("pujaForm").onsubmit = e => {
    e.preventDefault();
    const v = Math.round(+imp.value), alias = document.getElementById("pjAlias").value.trim();
    if (!v || v < min) { document.getElementById("pjErr").textContent = `La puja mínima ahora es de ${euro(min)}.`; imp.focus(); return; }
    paleta(p, v, alias);
  };
}
function paleta(p, v, alias) {
  const seguir = () => {
    clearTimeout(sobreTimer);
    pintarCorreo(`Puja ${p.id} · ${euro(v)} · ${p.t}`,
      `Levanto la paleta por «${p.t}» (${p.id}).\n\nMi puja: ${euro(v)}\nCómo aparecer en el tablero: ${alias || "solo con mi número de paleta"}\nMi nombre (no se publica):\nTeléfono (opcional, no se publica):\n\n${SITIO}/obra/${p.slug}/\n`, p.id, "puja");
  };
  if (SIN_ANIM) { seguir(); return; }
  mailDlg.innerHTML = `<div class="alzada" role="status" aria-label="Puja de ${euro(v)} preparada">
    <div class="alz-escena">
      <div class="alz-brazo"><div class="alz-paleta"><span class="alz-sello">P</span><b>${euro(v)}</b><small>${p.id}</small></div><div class="alz-mango"></div><div class="alz-mano"></div><div class="alz-manga"></div></div>
    </div>
    <p class="alz-txt">«${euro(v)}… ¿alguien da más?»</p></div>`;
  mailDlg.querySelector(".alzada").onclick = seguir;
  sobreTimer = setTimeout(seguir, 2600);
}

/* La sala de pujas: atril con la obra, subastador y público de espaldas */
function salaPujas(p) {
  const pelo = ["#2b1d14", "#6b4a2e", "#a7a29a", "#c58b45", "#1c1c1c", "#8a3b20", "#d8d2c4", "#4a3524", "#3a2a1e", "#b07a3c"];
  const ropa = ["#2c3a5c", "#5a1820", "#3e4a3a", "#4a3b5c", "#6b5a44", "#1f2a44", "#704030", "#2f4a52", "#555", "#7a5a2a"];
  const asientos = [[78, 300, .78], [170, 300, .78], [262, 300, .78], [354, 300, .78], [446, 300, .78], [538, 300, .78], [124, 362, 1], [246, 362, 1], [368, 362, 1], [490, 362, 1]];
  const persona = (x, y, s, i) => `<g class="fig" data-i="${i}" transform="translate(${x} ${y}) scale(${s})">
      <g class="fig-cuerpo" style="animation-delay:${(i * .37) % 3}s">
        <g class="fig-brazo"><path d="M16 -22 Q30 -46 32 -78" stroke="${ropa[i]}" stroke-width="10" stroke-linecap="round" fill="none"/>
          <circle cx="32" cy="-82" r="5.5" fill="#e0b392"/><path d="M32 -84 L33 -98" stroke="#5b3a20" stroke-width="3"/>
          <circle cx="33" cy="-112" r="15" fill="#f4ecd8" stroke="#9c7631" stroke-width="2"/><text class="fig-num" x="33" y="-107" text-anchor="middle">${i + 1}</text></g>
        <path d="M-27 2 Q-25 -26 0 -29 Q25 -26 27 2 Z" fill="${ropa[i]}"/>
        <rect x="-5" y="-36" width="10" height="9" fill="#d4a580"/>
        <circle cx="0" cy="-47" r="14" fill="${pelo[i]}"/><path d="M-14 -46 Q-13 -36 -9 -33 M14 -46 Q13 -36 9 -33" stroke="#d4a580" stroke-width="3" fill="none"/>
      </g>
      <rect x="-26" y="-4" width="52" height="38" rx="5" fill="#4a2c18"/><rect x="-21" y="0" width="42" height="28" rx="3" fill="#7a1622"/>
    </g>`;
  return `<div class="sala-pujas" id="salaPujas">
  <svg viewBox="0 0 620 400" role="img" aria-label="Sala de pujas: ${escH(p.t)} en un caballete, el subastador en su atril y el público sentado">
    <defs>
      <linearGradient id="spPared" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0d13"/><stop offset="1" stop-color="#5a1820"/></linearGradient>
      <linearGradient id="spSuelo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4627"/><stop offset="1" stop-color="#3b2414"/></linearGradient>
      <linearGradient id="spMadera" x1="0" x2="1"><stop offset="0" stop-color="#4f321b"/><stop offset=".5" stop-color="#7a5131"/><stop offset="1" stop-color="#4f321b"/></linearGradient>
      <linearGradient id="spFoco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c0" stop-opacity=".45"/><stop offset="1" stop-color="#fff0c0" stop-opacity="0"/></linearGradient>
      <linearGradient id="spOro" x1="0" x2="1"><stop offset="0" stop-color="#7a5a22"/><stop offset=".5" stop-color="#ecd28c"/><stop offset="1" stop-color="#7a5a22"/></linearGradient>
    </defs>
    <rect width="620" height="262" fill="url(#spPared)"/>
    <path d="M0 220 H620" stroke="#9c7631" stroke-width="2" opacity=".6"/>
    <rect y="262" width="620" height="138" fill="url(#spSuelo)"/>
    <g opacity=".25" stroke="#2a180c">${[...Array(12)].map((_, k) => `<path d="M${k * 60 - 40} 400 L${k * 52 + 10} 262"/>`).join("")}</g>
    <!-- tablero de precio -->
    <g transform="translate(250 26)"><rect width="150" height="62" rx="3" fill="#1a1206" stroke="url(#spOro)" stroke-width="3"/>
      <text x="75" y="22" text-anchor="middle" class="sp-et">${pujaActual(p) == null ? "SALIDA" : "PUJA ACTUAL"}</text>
      <text x="75" y="50" text-anchor="middle" class="sp-precio">${euro(pujaActual(p) == null ? p.puja.salida : pujaActual(p))}</text></g>
    <!-- caballete con la obra -->
    <polygon points="70,40 230,40 250,262 50,262" fill="url(#spFoco)"/>
    <path d="M100 290 L150 52 M200 290 L150 52 M150 52 L156 292" stroke="url(#spMadera)" stroke-width="8" stroke-linecap="round"/>
    <rect x="86" y="196" width="128" height="9" rx="2" fill="#5b3a20"/>
    <rect x="88" y="82" width="124" height="116" fill="#1a1206"/>
    <image href="/${p.thumb}" x="90" y="84" width="120" height="112" preserveAspectRatio="xMidYMid meet"/>
    <!-- subastador -->
    <g transform="translate(500 150)">
      <circle cx="0" cy="-26" r="15" fill="#d9a987"/><path d="M-15 -30 Q-14 -44 0 -45 Q14 -44 15 -30 Q8 -38 0 -37 Q-8 -38 -15 -30 Z" fill="#9c9893"/>
      <circle cx="-5" cy="-27" r="1.8" fill="#2a1d18"/><circle cx="5" cy="-27" r="1.8" fill="#2a1d18"/><path d="M-4 -18 Q0 -16 4 -18" stroke="#8c4a3a" stroke-width="1.6" fill="none"/>
      <path d="M-30 30 Q-28 -6 0 -9 Q28 -6 30 30 Z" fill="#1c1c1c"/><path d="M-4 -9 L0 4 L4 -9 Z" fill="#f4efe6"/><path d="M-2 -6 L0 2 L2 -6 Z" fill="#5a1820"/>
      <g class="martillo"><path d="M24 4 Q40 -4 48 -18" stroke="#1c1c1c" stroke-width="9" stroke-linecap="round" fill="none"/>
        <circle cx="49" cy="-21" r="5" fill="#d9a987"/><path d="M49 -21 L60 -36" stroke="#5b3a20" stroke-width="3.5" stroke-linecap="round"/>
        <rect x="52" y="-46" width="18" height="10" rx="2" transform="rotate(-36 61 -41)" fill="#6b4627"/></g>
      <g class="sp-bocadillo"><rect x="-120" y="-92" width="150" height="36" rx="10" fill="#f4ecd8"/><path d="M-20 -57 L-8 -46 L-10 -57 Z" fill="#f4ecd8"/>
        <text x="-45" y="-69" text-anchor="middle" class="sp-voz">¿Quién da más?</text></g>
    </g>
    <path d="M440 170 L560 170 L548 262 L452 262 Z" fill="url(#spMadera)"/><rect x="434" y="164" width="132" height="10" rx="2" fill="#4f321b"/>
    <circle cx="500" cy="212" r="16" fill="none" stroke="url(#spOro)" stroke-width="3"/><text x="500" y="219" text-anchor="middle" class="sp-p">P</text>
    <!-- público -->
    ${asientos.map(([x, y, s], i) => persona(x, y, s, i)).join("")}
    <g class="sp-tag" opacity="0"><rect x="-42" y="-20" width="84" height="30" rx="4" fill="#c9a24a"/><text x="0" y="1" text-anchor="middle" class="sp-tag-t"></text></g>
  </svg>
  <button type="button" class="sp-repetir" hidden>Repetir la sesión</button>
  </div>`;
}
function iniciarSala(root, p) {
  if (!root) return;
  const svg = root.querySelector("svg"), figs = [...root.querySelectorAll(".fig")], voz = root.querySelector(".sp-voz"),
    precio = root.querySelector(".sp-precio"), et = root.querySelector(".sp-et"), tag = root.querySelector(".sp-tag"), tagT = root.querySelector(".sp-tag-t"),
    mart = root.querySelector(".martillo"), rep = root.querySelector(".sp-repetir");
  const l = pujasDe(p), st = estadoPuja(p);
  const golpe = () => { mart.classList.remove("golpe"); void mart.getBBox(); mart.classList.add("golpe"); };
  if (!l.length) { voz.textContent = st && st.abierta ? `Salida, ${euro(p.puja.salida)}` : "Sin pujas"; return; }
  let timers = [];
  function sesion() {
    timers.forEach(clearTimeout); timers = []; rep.hidden = true;
    figs.forEach(f => f.classList.remove("alza"));
    et.textContent = "SALIDA"; precio.textContent = euro(p.puja.salida); voz.textContent = `Salida, ${euro(p.puja.salida)}`;
    l.forEach((b, k) => {
      timers.push(setTimeout(() => {
        const f = figs[(b.paleta - 1) % figs.length];
        figs.forEach(x => x.classList.remove("alza")); f.classList.add("alza");
        f.querySelector(".fig-num").textContent = b.paleta;
        const m = f.transform.baseVal.consolidate().matrix;
        tag.setAttribute("transform", `translate(${m.e + 33 * m.a} ${m.f - 140 * m.a})`); tagT.textContent = euro(b.importe);
        tag.classList.remove("ve"); void tag.getBBox(); tag.classList.add("ve");
        et.textContent = "PUJA ACTUAL"; precio.textContent = euro(b.importe);
        voz.textContent = `${euro(b.importe)}, la ${b.paleta}`; golpe();
      }, 900 + k * 2100));
    });
    timers.push(setTimeout(() => {
      figs.forEach(x => x.classList.remove("alza"));
      voz.textContent = st && st.abierta ? "¿Alguien da más?" : "¡Adjudicada!"; golpe(); rep.hidden = false;
    }, 900 + l.length * 2100));
  }
  rep.onclick = sesion;
  if (SIN_ANIM) { const t = l[l.length - 1]; et.textContent = "PUJA ACTUAL"; precio.textContent = euro(pujaActual(p)); voz.textContent = `${euro(pujaActual(p))}, la ${t.paleta}`; return; }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); sesion(); } }, { threshold: .4 });
    io.observe(svg);
  } else sesion();
}
function tickRelojes() {
  document.querySelectorAll("[data-cierre]").forEach(el => {
    const falta = new Date(el.dataset.cierre).getTime() - Date.now();
    if (el.classList.contains("puja")) {
      const t = textoFalta(falta);
      el.querySelectorAll("[data-u]").forEach(b => { b.textContent = t[b.dataset.u]; });
    } else el.textContent = falta > 0 ? `En puja · martillo en ${textoFalta(falta, true)}` : "Puja cerrada · adjudicación en curso";
  });
}
tickRelojes(); setInterval(tickRelojes, 1000);
