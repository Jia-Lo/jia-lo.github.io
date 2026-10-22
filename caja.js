// La caja fuerte del mes: dial de combinación de 0 a 99, tres números y apertura
(function () {
  const sec = document.getElementById("caja");
  if (!sec) return;
  const dial = sec.querySelector(".dial"), disco = sec.querySelector(".dial-disco"), lectura = sec.querySelector(".dial-lectura"),
    huecos = [...sec.querySelectorAll(".comb b")], fijar = sec.querySelector(".fijar"), borrar = sec.querySelector(".borrar"),
    msg = sec.querySelector(".caja-msg"), caja = sec.querySelector(".caja-cuerpo"), HASH = sec.dataset.h;
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Números grabados en el disco
  const svg = disco.querySelector("svg"); let marcas = "";
  for (let n = 0; n < 100; n++) {
    const a = n * 3.6, largo = n % 10 === 0 ? 11 : n % 5 === 0 ? 7 : 4;
    marcas += `<line x1="100" y1="${12}" x2="100" y2="${12 + largo}" transform="rotate(${a} 100 100)" class="${n % 10 === 0 ? "m10" : ""}"/>`;
    if (n % 10 === 0) marcas += `<text x="100" y="40" transform="rotate(${a} 100 100)" text-anchor="middle">${n}</text>`;
  }
  svg.querySelector(".marcas").innerHTML = marcas;
  let ang = 0, valor = 0, comb = [], abierta = false, arrastre = null;
  function numero(a) { return ((Math.round(-a / 3.6) % 100) + 100) % 100; }
  function girar(a, suave) {
    ang = a; disco.style.transition = suave ? "transform .25s ease" : "none"; disco.style.transform = `rotate(${ang}deg)`;
    const n = numero(ang); if (n !== valor) { valor = n; lectura.textContent = String(n).padStart(2, "0"); dial.setAttribute("aria-valuenow", n); dial.setAttribute("aria-valuetext", String(n)); clic(); }
  }
  function clic() { if (quieto) return; dial.classList.remove("clic"); void dial.offsetWidth; dial.classList.add("clic"); }
  function anguloPuntero(e) { const r = dial.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; }
  dial.addEventListener("pointerdown", e => { if (abierta) return; dial.setPointerCapture(e.pointerId); arrastre = { a0: anguloPuntero(e), base: ang }; dial.classList.add("agarrado"); });
  dial.addEventListener("pointermove", e => {
    if (!arrastre) return;
    let d = anguloPuntero(e) - arrastre.a0; if (d > 180) d -= 360; if (d < -180) d += 360;
    arrastre.a0 += d; arrastre.base += d; girar(arrastre.base, false);
  });
  const soltar = () => { if (!arrastre) return; arrastre = null; dial.classList.remove("agarrado"); girar(Math.round(ang / 3.6) * 3.6, true); };
  dial.addEventListener("pointerup", soltar); dial.addEventListener("pointercancel", soltar);
  dial.addEventListener("keydown", e => {
    const paso = { ArrowRight: -1, ArrowUp: -1, ArrowLeft: 1, ArrowDown: 1, PageUp: -10, PageDown: 10 }[e.key];
    if (paso) { e.preventDefault(); girar(Math.round(ang / 3.6) * 3.6 + paso * 3.6, true); }
    else if (e.key === "Enter") { e.preventDefault(); fijar.click(); }
  });
  function pintarComb() { huecos.forEach((h, k) => { h.textContent = comb[k] != null ? String(comb[k]).padStart(2, "0") : "··"; h.classList.toggle("lleno", comb[k] != null); }); }
  async function huella(t) { if (!(window.crypto && crypto.subtle)) return null; const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  fijar.onclick = async () => {
    if (abierta || comb.length >= 3) return;
    comb.push(valor); pintarComb(); msg.textContent = comb.length < 3 ? `Número ${comb.length} fijado. Gire hasta el siguiente.` : "Comprobando la combinación…";
    if (comb.length < 3) return;
    const h = await huella(comb.join("-"));
    if (h === HASH) {
      abierta = true; msg.textContent = "Clac. La caja cede.";
      caja.classList.add("girando");
      setTimeout(() => { caja.classList.add("abierta"); sec.querySelector(".botin").removeAttribute("aria-hidden"); msg.textContent = "Ha abierto la caja fuerte del mes."; }, quieto ? 0 : 900);
    } else {
      msg.textContent = h === null ? "Este navegador no puede comprobar la combinación." : "La caja no cede. Revise las pistas y vuelva a intentarlo.";
      caja.classList.remove("sacude"); void caja.offsetWidth; caja.classList.add("sacude");
      setTimeout(() => { comb = []; pintarComb(); }, 900);
    }
  };
  borrar.onclick = () => { if (abierta) return; comb = []; pintarComb(); msg.textContent = ""; };
  pintarComb(); girar(0, false);
})();
