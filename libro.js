// Libro de visitas: firmas publicadas (firmas.json) y una página en blanco para firmar con pluma
(function () {
  const sec = document.getElementById("libro");
  if (!sec || typeof FIRMAS === "undefined") return;
  const izq = sec.querySelector(".pag-firmas"), nav = sec.querySelector(".libro-nav"), contador = sec.querySelector(".libro-pag"),
    form = sec.querySelector("#libroForm"), vista = sec.querySelector(".firma-vista"), pluma = sec.querySelector(".pluma"),
    hoja = sec.querySelector(".hoja-izq");
  const POR_PAGINA = 4, quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lista = FIRMAS.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  let pag = 0;
  const escT = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fechaT = iso => { const [y, m, d] = iso.split("-").map(Number); return `${d} de ${["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][m - 1]} de ${y}`; };
  function pintar() {
    const trozo = lista.slice(pag * POR_PAGINA, pag * POR_PAGINA + POR_PAGINA);
    izq.innerHTML = trozo.map(f => `<li><p class="f-frase">«${escT(f.frase)}»</p><p class="f-firma">${escT(f.nombre)}${f.desde ? `, <span>${escT(f.desde)}</span>` : ""}</p><p class="f-fecha">${fechaT(f.fecha)}</p></li>`).join("");
    contador.textContent = `Página ${pag + 1} de ${paginas}`;
    nav.hidden = paginas < 2;
    nav.querySelector(".ant").disabled = pag === 0; nav.querySelector(".sig").disabled = pag >= paginas - 1;
  }
  function pasar(d) {
    const n = pag + d; if (n < 0 || n >= paginas) return;
    if (quieto) { pag = n; pintar(); return; }
    hoja.classList.remove("pasa-sig", "pasa-ant"); void hoja.offsetWidth; hoja.classList.add(d > 0 ? "pasa-sig" : "pasa-ant");
    setTimeout(() => { pag = n; pintar(); }, 330);
  }
  nav.querySelector(".ant").onclick = () => pasar(-1);
  nav.querySelector(".sig").onclick = () => pasar(1);
  pintar();

  // Vista previa en tinta mientras se escribe
  const campo = id => form.querySelector("#" + id);
  function previa() {
    const fr = campo("lvFrase").value.trim(), no = campo("lvNombre").value.trim(), de = campo("lvDesde").value.trim();
    vista.innerHTML = fr || no ? `<p class="f-frase">${fr ? "«" + escT(fr) + "»" : "&nbsp;"}</p><p class="f-firma">${escT(no) || "&nbsp;"}${de ? `, <span>${escT(de)}</span>` : ""}</p>` :
      `<p class="f-vacia">Su firma aparecerá aquí, en tinta.</p>`;
  }
  form.addEventListener("input", previa); previa();
  form.addEventListener("submit", e => {
    e.preventDefault();
    const no = campo("lvNombre").value.trim(), fr = campo("lvFrase").value.trim(), de = campo("lvDesde").value.trim(), err = form.querySelector(".lv-err");
    if (!no || !fr) { err.textContent = !no ? "Escriba un nombre o un apodo para firmar." : "Escriba una frase para el libro."; (no ? campo("lvFrase") : campo("lvNombre")).focus(); return; }
    err.textContent = "";
    const enviar = () => pintarCorreo("Firma para el libro de visitas · Galería Procedencia",
      `Firma para el libro de visitas:\n\nFrase: «${fr}»\nFirma: ${no}${de ? "\nDesde: " + de : ""}\n\nAcepto que esta firma se publique en el libro de visitas de la web.`, null, "firma");
    if (quieto) { enviar(); return; }
    vista.classList.remove("seca"); vista.classList.add("escribe"); pluma.classList.remove("firma"); void pluma.offsetWidth; pluma.classList.add("firma");
    setTimeout(() => { vista.classList.remove("escribe"); vista.classList.add("seca"); }, 1500);
    setTimeout(enviar, 2000);
  });
})();
