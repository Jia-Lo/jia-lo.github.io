// Contacto y compartir: común a la portada y a las fichas de cada obra
const CONTACTO = "jialivi26@gmail.com";
const SITIO = "https://jia-lo.github.io";
const euro = n => n.toLocaleString("es-ES") + " €";
const enc = encodeURIComponent;
const mailto = (subj, body) => `mailto:${CONTACTO}?subject=${enc(subj)}&body=${enc(body)}`;
const gmail = (subj, body) => `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(CONTACTO)}&su=${enc(subj)}&body=${enc(body)}`;

let mailDlg = document.getElementById("mailDlg");
if (!mailDlg) {
  mailDlg = document.createElement("div");
  mailDlg.id = "mailDlg"; mailDlg.className = "mdlg"; mailDlg.hidden = true;
  mailDlg.setAttribute("role", "dialog"); mailDlg.setAttribute("aria-modal", "true"); mailDlg.setAttribute("aria-labelledby", "mTitle");
  document.body.appendChild(mailDlg);
}
let mailPrevFocus = null;

const SIN_ANIM = matchMedia("(prefers-reduced-motion: reduce)").matches;
let sobreTimer;
function openMail(subj, body, ref) {
  mailPrevFocus = document.activeElement;
  if (ref && !SIN_ANIM) {
    // Sobre que se cierra y se sella con lacre antes de escribir
    mailDlg.innerHTML = `<div class="sobre" aria-label="Preparando la reserva de ${ref}">
      <div class="sobre-cuerpo"><div class="carta"><span>Reserva</span><b>${ref}</b></div><div class="sobre-frente"></div><div class="solapa"></div><div class="sello"><span>P</span></div></div>
      <p class="sobre-txt">Sellando su reserva…</p></div>`;
    mailDlg.hidden = false;
    const seguir = () => { clearTimeout(sobreTimer); mailDlg.onclick = null; pintarCorreo(subj, body, ref); };
    mailDlg.querySelector(".sobre").onclick = seguir;
    sobreTimer = setTimeout(seguir, 2300);
    return;
  }
  pintarCorreo(subj, body, ref);
}
function pintarCorreo(subj, body, ref) {
  mailDlg.innerHTML = `<div class="mbox"><button class="mclose" id="mClose" type="button" aria-label="Cerrar">✕</button>
    <h3 id="mTitle">${ref ? "Su reserva, sellada" : "Escribir a la galería"}</h3>
    <p>Reservas y consultas por correo. Respondo lo antes posible.</p>
    <div class="maddr"><span>${CONTACTO}</span></div>
    <div class="mopts">
      <a class="mopt" href="${gmail(subj, body)}" target="_blank" rel="noopener">Escribir con Gmail</a>
      <a class="mopt alt" href="${mailto(subj, body)}">Abrir mi app de correo</a>
      <button class="mopt alt" id="mCopy" type="button">Copiar dirección</button>
    </div>
    ${ref ? `<p class="mref">Indica la referencia <b>${ref}</b> y te aparto la obra 72 horas.</p>` : ""}</div>`;
  mailDlg.hidden = false;
  document.getElementById("mClose").onclick = closeMail;
  document.getElementById("mCopy").onclick = async e => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(CONTACTO); b.textContent = "Dirección copiada"; }
    catch (_) { selectText(mailDlg.querySelector(".maddr span")); b.textContent = "Selecciónala y cópiala"; }
  };
  document.getElementById("mClose").focus();
}
function closeMail() { clearTimeout(sobreTimer); mailDlg.hidden = true; mailDlg.innerHTML = ""; if (mailPrevFocus) mailPrevFocus.focus(); }
mailDlg.addEventListener("click", e => { if (e.target === mailDlg) closeMail(); });
document.addEventListener("keydown", e => { if (!mailDlg.hidden && e.key === "Escape") { e.stopImmediatePropagation(); closeMail(); } }, true);

function selectText(el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }

function reservar(p) {
  openMail(`Reserva ${p.id} · ${p.t}`,
    `Hola, me interesa «${p.t}» (${p.id}, ${euro(p.price)}).\n${SITIO}/obra/${p.slug}/\n\nMe gustaría reservarla / tengo una pregunta:\n\n`, p.id);
}

// Compartir: menú del móvil si existe; si no, copia el enlace
let toastTimer;
function aviso(txt) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = txt; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}
async function compartir(p) {
  const url = `${SITIO}/obra/${p.slug}/`;
  const data = { title: `${p.t} · Galería Procedencia`, text: `${p.t}, ${p.tech.toLowerCase()}. ${euro(p.price)}`, url };
  if (navigator.share) { try { await navigator.share(data); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  try { await navigator.clipboard.writeText(url); aviso("Enlace copiado"); }
  catch (_) { aviso(url); }
}
