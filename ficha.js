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

/* ---------- Puja en sobre cerrado ---------- */
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
function htmlPuja(p) {
  const st = estadoPuja(p); if (!st) return "";
  if (!st.abierta) return `<div class="puja cerrada"><p class="puja-k">Puja en sobre cerrado</p><p class="puja-fin">La puja cerró el ${p.puja.cierre_txt}. Adjudicación en curso.</p></div>`;
  return `<div class="puja" data-cierre="${p.puja.cierre}">
    <p class="puja-k">Puja en sobre cerrado</p>
    <div class="reloj" aria-label="Tiempo hasta el cierre de la puja"><span><b data-u="d">–</b>días</span><span><b data-u="h">–</b>horas</span><span><b data-u="m">–</b>min</span><span><b data-u="s">–</b>seg</span></div>
    <p class="puja-cierre">Cierra el ${p.puja.cierre_txt}, hora de Madrid · Salida <b>${euro(p.puja.salida)}</b></p>
    <p class="puja-reglas">Cada mes sale una pieza a puja y cierra el primer domingo del mes a las 20:00. Las ofertas son secretas: solo las conoce la galería. Al cierre, la obra se adjudica a la oferta más alta igual o superior al precio de salida y se avisa por correo a quienes hayan participado.</p>
  </div>`;
}
function ofertar(p) {
  openMail(`Oferta en sobre cerrado · ${p.id} · ${p.t}`,
    `Mi oferta en sobre cerrado para «${p.t}» (${p.id}):\n\nImporte: ____ €  (salida: ${euro(p.puja.salida)})\nNombre:\nTeléfono (opcional):\n\n${SITIO}/obra/${p.slug}/\n`, p.id, "oferta");
}
function tickRelojes() {
  document.querySelectorAll("[data-cierre]").forEach(el => {
    const falta = new Date(el.dataset.cierre).getTime() - Date.now();
    if (el.classList.contains("puja")) {
      const t = textoFalta(falta);
      el.querySelectorAll("[data-u]").forEach(b => { b.textContent = t[b.dataset.u]; });
    } else el.textContent = falta > 0 ? `En puja · cierra en ${textoFalta(falta, true)}` : "Puja cerrada · adjudicación en curso";
  });
}
tickRelojes(); setInterval(tickRelojes, 1000);
