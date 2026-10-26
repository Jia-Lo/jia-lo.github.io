// El pasillo infinito · Galería Procedencia (versión 3D fotorrealista)
// Viaje desde el espacio con imagen de satélite → preguntas de la galería → pasillo infinito en WebGL
// → unas manos con guantes de museo descuelgan la obra y se la acercan → vista a pantalla completa.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { crearTierra, punto, ALCALA } from './tierra.js';
import { crearGaleria, B, OJOS } from './galeria.js';
import { prepararMano } from './mano.js';

const $ = s => document.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOVIL = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700;
const espera = ms => new Promise(r => setTimeout(r, RM ? Math.min(ms, 60) : ms * (window.__lento || 1)));
const sto = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} } };
const BASE = '/pasillo/tex/';
const Q = new URLSearchParams(location.search);
const suave = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const suave2 = x => x * x * (3 - 2 * x);

/* ---------- Preferencias del visitante ---------- */
const OBRAS = typeof PIECES !== "undefined" ? PIECES : [];
const ESTILO = { 'PRC-001': 'casas', 'PRC-002': 'ciudades', 'PRC-003': 'escenas', 'PRC-004': 'escenas', 'PRC-005': 'escenas', 'PRC-006': 'ciudades', 'PRC-007': 'ciudades' };
let gustos = { estilo: null, fin: null };
try { gustos = JSON.parse(sto.get('pasillo-gustos')) || gustos; } catch (_) {}
function ordenar() {
  const original = p => !/reproducci/i.test(p.tech);
  const llamativo = p => /dorad|florentino|tallad/i.test(p.marco);
  const nota = p => {
    let n = 0;
    if (gustos.estilo && gustos.estilo !== 'todo' && ESTILO[p.id] === gustos.estilo) n += 20;
    if (gustos.fin === 'coleccionar') n += original(p) ? 8 : -8;
    if (gustos.fin === 'regalar') n += (100 - p.price) / 8;
    if (gustos.fin === 'decorar') n += llamativo(p) ? 6 : 0;
    return n;
  };
  return OBRAS.map((p, i) => ({ p, i, n: nota(p) })).sort((a, b) => b.n - a.n || a.i - b.i).map(x => x.p);
}

/* ---------- Motor ---------- */
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' }); }
catch (e) { sinWebGL(); throw e; }
const calidad = MOVIL
  ? { pr: Math.min(devicePixelRatio, 1.6), sombras: false, focos: 6, tramos: 6, reflejo: .5, msaa: 2, bloom: .5 }
  : { pr: Math.min(devicePixelRatio, 1.5), sombras: true, focos: 8, tramos: 7, reflejo: .5, msaa: 4, bloom: .5 };
if (Q.has('baja')) Object.assign(calidad, { pr: 1, sombras: false, focos: 4, msaa: 0, reflejo: .35 });
renderer.setPixelRatio(calidad.pr);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = calidad.sombras; renderer.shadowMap.type = THREE.PCFShadowMap;
const lienzo = renderer.domElement; lienzo.id = 'lienzo3d'; lienzo.setAttribute('aria-hidden', 'true');
$('#escenario').appendChild(lienzo);

const gestor = new THREE.LoadingManager();
const cargador = new THREE.TextureLoader(gestor);

const tierra = crearTierra(cargador, BASE);
const gal = crearGaleria({ renderer, cargador, base: BASE, obras: ordenar(), calidad, euro });
const camara = new THREE.PerspectiveCamera(MOVIL && innerWidth < innerHeight ? 62 : 48, innerWidth / innerHeight, .02, 80);
gal.escena.add(camara);

// posproceso: brillo de las luces, viñeta, grano de película y una ligerísima aberración
const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: calidad.msaa });
const composer = new EffectComposer(renderer, rt);
const pasoRender = new RenderPass(gal.escena, camara);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .38, .5, .92);
const pelicula = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, t: { value: 0 }, vin: { value: .55 }, grano: { value: .045 }, fundido: { value: 0 }, colorF: { value: new THREE.Color(0, 0, 0) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float t, vin, grano, fundido; uniform vec3 colorF; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - .5; float d = dot(c, c);
      vec2 o = c * d * .006;
      vec3 col = vec3(texture2D(tDiffuse, vUv + o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - o).b);
      col *= 1. - vin * smoothstep(.12, .62, d * 1.6);
      col += (h(vUv * 1000. + t) - .5) * grano;
      col = mix(col, colorF, fundido);
      gl_FragColor = vec4(col, 1.);
    }`,
});
composer.addPass(pasoRender); composer.addPass(bloom); composer.addPass(new OutputPass()); composer.addPass(pelicula);

function medir() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h); composer.setSize(w, h); composer.setPixelRatio(calidad.pr);
  bloom.resolution.set(w * calidad.bloom, h * calidad.bloom);
  camara.aspect = w / h; camara.fov = w < h ? 62 : 48; camara.updateProjectionMatrix();
  tierra.camara.aspect = w / h; tierra.camara.updateProjectionMatrix();
  gal.redimensionar();
}
addEventListener('resize', medir); medir();
let entornoListo = false;
gestor.onLoad = () => { if (!entornoListo) { entornoListo = true; setTimeout(() => { gal.actualizar(camara.position.z); gal.generarEntorno(camara.position.z); }, 50); } };

/* ---------- Estado ---------- */
let modo = 'tierra';   // tierra | galeria
let enPasillo = false, ocupado = false, preguntando = false;
let s = -4, sMeta = -4;          // avance por el pasillo (m)
let yaw = 0, yawMeta = 0, pitch = 0, pitchMeta = 0, mirX = 0, mirY = 0;
const pos = new THREE.Vector3(0, OJOS, 4), posMeta = new THREE.Vector3(0, OJOS, 4);
let orden = ordenar();
let tPrev = performance.now(), tTot = 0;

function bucle() {
  const ahora = performance.now(), dt = Math.min(window.__dtmax || .1, (ahora - tPrev) / 1000); tPrev = ahora; tTot += dt;
  pelicula.uniforms.t.value = tTot % 100;
  if (modo === 'tierra') { pasoRender.scene = tierra.escena; pasoRender.camera = tierra.camara; tierra.mat.uniforms.tiempo.value = tTot; }
  else {
    const k = 1 - Math.pow(.0016, dt);
    if (!ocupado) { s += (sMeta - s) * k * .55; posMeta.set(0, OJOS, -s); }
    pos.lerp(posMeta, ocupado ? 1 - Math.pow(.02, dt) : 1);
    if (!ocupado && enPasillo) yawMeta = mirada();
    yaw += (yawMeta - yaw) * (1 - Math.pow(ocupado ? .03 : .25, dt)); pitch += (pitchMeta - pitch) * (1 - Math.pow(.03, dt));
    const paso = ocupado ? 0 : Math.min(1, Math.abs(sMeta - s) * 2);
    camara.position.copy(pos); camara.position.y += Math.sin(s * 3.1) * .012 * paso;
    camara.rotation.set(pitch + mirY, yaw + mirX, Math.sin(s * 1.55) * .002 * paso, 'YXZ');
    gal.actualizar(camara.position.z);
    camara.updateMatrixWorld();
    gal.antesDeRender(camara);
    animarManos(dt);
    pasoRender.scene = gal.escena; pasoRender.camera = camara;
  }
  composer.render(dt);
  requestAnimationFrame(bucle);
}

// en vertical, la mirada se va hacia el cuadro que tiene más cerca, como haría un visitante
function mirada() {
  const ret = innerWidth < innerHeight; if (!ret) return 0;
  const z = -s; let mejor = 0, peso = 0;
  for (const tr of gal.tramos) {
    const dz = z - tr.g.position.z; // positivo: el tramo está por delante
    if (dz < 1.2 || dz > 6.5) continue;
    const w = Math.exp(-Math.pow((dz - 3.3) / 1.25, 2));
    if (w > peso) { peso = w; mejor = (Math.abs(tr.idx) % 2 ? -1 : 1) * .5 * w; }
  }
  return mejor;
}
/* =========================== 1 · La Tierra =========================== */
async function viajeEspacio() {
  const rot = $('#rotuloGeo');
  const objetivo = punto(ALCALA.lon, ALCALA.lat).normalize();
  const inicio = punto(-35, 22).normalize();
  const DUR = RM ? 1 : 9500, t0 = performance.now();
  const rotulos = [[0, 'La Tierra'], [.3, 'Europa, de noche'], [.55, 'España'], [.74, 'Madrid'], [.86, 'Alcalá de Henares']];
  const cam = tierra.camara, dir = new THREE.Vector3();
  return new Promise(res => {
    function cuadro(ts) {
      if (enPasillo || modo !== 'tierra') return res();
      const k = Q.has('k') ? +Q.get('k') : Math.min(1, (ts - t0) / DUR), e = suave(k);
      dir.copy(inicio).lerp(objetivo, suave(Math.min(1, k / .75))).normalize();
      const zam = Math.max(0, (k - .86) / .14);
      const dist = 1.5 + 3.6 * Math.pow(1 - e, 1.5) - .36 * zam * zam;
      cam.position.copy(dir).multiplyScalar(dist);
      // inclinación: al final miramos ligeramente hacia el horizonte
      const mira = objetivo.clone().multiplyScalar(k > .6 ? 1 - (k - .6) * .3 : 1);
      cam.up.set(0, 1, 0); cam.lookAt(mira.lerp(new THREE.Vector3(), 1 - Math.min(1, k * 1.4)));
      tierra.tierra.rotation.y = 0;
      tierra.brillo.material.opacity = Math.max(0, Math.min(1, (k - .62) * 4));
      tierra.brillo.scale.setScalar((.01 + .008 * (1 + Math.sin(ts / 300))) * Math.min(1, (dist - .95) * 1.4));
      bloom.strength = .28 + zam * 1.2;
      pelicula.uniforms.colorF.value.setRGB(1, .86, .62); pelicula.uniforms.fundido.value = Math.max(0, (k - .9) * 10) ** 2;
      tierra.mat.uniforms.tiempo.value = tTot;
      const rt = rotulos.filter(x => k >= x[0]).pop();
      if (rt && rot.textContent !== rt[1]) { rot.classList.remove('ve'); void rot.offsetWidth; rot.textContent = rt[1]; rot.classList.add('ve'); }
      if (k > .74) { const c = $('#coords'); c.classList.add('ve'); const v = tierra.brillo.position.clone().project(cam); c.style.left = ((v.x * .5 + .5) * innerWidth) + 'px'; c.style.top = ((-v.y * .5 + .5) * innerHeight - 18) + 'px'; }
      if (k < 1 || Q.has('k')) requestAnimationFrame(cuadro); else res();
    }
    requestAnimationFrame(cuadro);
  });
}

/* =========================== 2 · Preguntas de la galería =========================== */
function decir(txt, opciones) {
  const t = $('#dlgTxt'), o = $('#dlgOpc');
  t.textContent = ''; o.innerHTML = '';
  return new Promise(res => {
    let i = 0;
    const escribe = () => { t.textContent = txt.slice(0, ++i); if (i < txt.length) setTimeout(escribe, RM ? 0 : 18); else pinta(); };
    const pinta = () => {
      if (!opciones) { res(); return; }
      opciones.forEach(([valor, etiqueta]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'dlg-b'; b.textContent = etiqueta;
        b.onclick = () => { o.querySelectorAll('button').forEach(x => x.disabled = true); b.classList.add('elegida'); res(valor); };
        o.appendChild(b);
      });
      o.querySelector('button').focus({ preventScroll: true });
    };
    escribe();
  });
}
async function preguntas() {
  preguntando = true;
  const d = $('#dialogo'); d.hidden = false; await espera(40); d.classList.add('ve');
  gustos.estilo = await decir('Bienvenido a Procedencia. Antes de pasar: ¿qué tipo de arte le gusta?', [
    ['ciudades', 'Vistas de ciudades'], ['casas', 'Casas y paisajes'], ['escenas', 'Escenas y retratos'], ['todo', 'Un poco de todo']]);
  const r1 = { ciudades: 'Entonces le va a gustar Venecia… y un Dublín de 1844 que tenemos colgado.', casas: 'Tenemos una casa señorial inglesa de la década de 1820 que le va a encantar.', escenas: 'Las escenas y las damas de los cromos, entonces. Tienen mucha historia.', todo: 'Mejor así: el pasillo es largo y hay de todo un poco.' }[gustos.estilo];
  await decir(r1); await espera(1100);
  gustos.fin = await decir('¿Y la busca para decorar su casa, para coleccionar o para regalar?', [['decorar', 'Decorar mi casa'], ['coleccionar', 'Coleccionar'], ['regalar', 'Regalar']]);
  const r2 = { decorar: 'Le colgamos delante las que llenan una pared, con los mejores marcos.', coleccionar: 'Primero las estampas originales del XIX. Las reproducciones, al final y bien señaladas.', regalar: 'Delante, las que mejor viajan y las de mejor precio.' }[gustos.fin];
  sto.set('pasillo-gustos', JSON.stringify(gustos));
  orden = ordenar(); gal.reordenar(orden);
  await decir(r2); await espera(900);
  await decir('Pase. Toque cualquier obra y se la acercamos.', [['entrar', 'Entrar en la galería →']]);
  d.classList.remove('ve'); await espera(500); d.hidden = true; preguntando = false;
}

/* =========================== 3 · El pasillo =========================== */
function entrarEnGaleria() {
  modo = 'galeria';
  pelicula.uniforms.colorF.value.setRGB(1, .86, .62); pelicula.uniforms.fundido.value = 1;
  bloom.strength = .38;
  s = sMeta = -4; pos.set(0, OJOS, 4); posMeta.copy(pos); yaw = yawMeta = 0; pitch = pitchMeta = 0;
}
async function abrirLuz(ms = 1600) {
  const t0 = performance.now();
  await new Promise(res => { const f = ts => { const k = Math.min(1, (performance.now() - t0) / (RM ? 1 : ms)); pelicula.uniforms.fundido.value = 1 - suave2(k); if (k < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
}
async function irAlPasillo() {
  if (enPasillo) return;
  enPasillo = true; $('#saltar').hidden = true; sto.set('pasillo-visto', '1');
  document.body.classList.add('en-pasillo');
  if (modo !== 'galeria') entrarEnGaleria();
  if (pelicula.uniforms.fundido.value > 0) abrirLuz(1200);
  $('#escPasillo').hidden = false;
  sMeta = 0;
}
function avanzar(d) { if (ocupado || !enPasillo) return; sMeta += d; $('#hudPie').classList.add('visto'); }
addEventListener('wheel', e => { if (!enPasillo || ocupado || !$('#vista').hidden || !$('#listaObras').hidden) return; e.preventDefault(); avanzar(e.deltaY * .006); }, { passive: false });
let toque = null;
lienzo.addEventListener('pointerdown', e => { toque = { y: e.clientY, x: e.clientX, s: sMeta, mov: false, raton: e.pointerType === 'mouse' }; });
addEventListener('pointermove', e => {
  if (toque && !toque.raton && enPasillo && !ocupado) { const d = (toque.y - e.clientY) * .012 + (toque.x - e.clientX) * .004; if (Math.abs(toque.y - e.clientY) + Math.abs(toque.x - e.clientX) > 10) toque.mov = true; sMeta = toque.s + d; $('#hudPie').classList.add('visto'); }
  if (e.pointerType === 'mouse' && !ocupado) { mirX = -(e.clientX / innerWidth - .5) * .16; mirY = -(e.clientY / innerHeight - .5) * .08; }
  if (e.pointerType === 'mouse' && enPasillo && !ocupado) lienzo.style.cursor = tocarObra(e) ? 'pointer' : '';
}, { passive: true });
addEventListener('pointerup', e => {
  const t = toque; toque = null;
  if (!t || t.mov || !enPasillo || ocupado) return;
  if (Math.abs(e.clientX - t.x) + Math.abs(e.clientY - t.y) > 8) return;
  const ob = tocarObra(e); if (ob) acercar(ob);
});
addEventListener('keydown', e => {
  if (!enPasillo) return;
  if (e.key === 'Escape' && !$('#vista').hidden) { devolver(); return; }
  if (!$('#vista').hidden || !$('#listaObras').hidden || ocupado) return;
  if (e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); avanzar(B); }
  if (e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); avanzar(-B); }
});
$('#btnAvanza').onclick = () => avanzar(B);
$('#btnAtras').onclick = () => avanzar(-B);

const rayo = new THREE.Raycaster(), ptr = new THREE.Vector2();
function tocarObra(e) {
  ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  rayo.setFromCamera(ptr, camara);
  const h = rayo.intersectObjects(gal.marcos(), false)[0];
  return h && h.distance < 14 ? h.object.userData.obra : null;
}

/* =========================== 4 · Las manos con guantes =========================== */
const manos = { lista: [], listo: false, t: 0, fase: null };
const luzMano = new THREE.PointLight(0xffe0bc, 0, 3.5, 2); luzMano.position.set(.15, .35, .1); camara.add(luzMano);
const matGuante = new THREE.MeshStandardMaterial({ color: 0xd9d4c8, roughness: .95 });
const matManga = new THREE.MeshStandardMaterial({ color: 0x1b2030, roughness: .88 });
const matPuno = new THREE.MeshStandardMaterial({ color: 0xece8de, roughness: .7 });
new GLTFLoader(gestor).load('/pasillo/modelos/right.glb', g => montarMano(g.scene, 1));
new GLTFLoader(gestor).load('/pasillo/modelos/left.glb', g => montarMano(g.scene, -1));
function montarMano(raiz, lado) {
  raiz.traverse(o => { if (o.isMesh) { o.material = matGuante; o.frustumCulled = false; o.castShadow = calidad.sombras; } });
  const cont = new THREE.Group(); cont.add(raiz); cont.visible = false; gal.escena.add(cont);
  raiz.updateMatrixWorld(true);
  const h = prepararMano(raiz, 1);
  // ¿el signo de flexión es el correcto? el pulgar debe quedar del lado de la palma
  if (h.palma.dot(h.pulgarDir) < 0) h.invertir();
  // manga oscura y puño blanco desde la muñeca hacia atrás
  const mu = h.muneca.clone(), atras = h.dedos.clone().negate();
  const manga = new THREE.Mesh(new THREE.CylinderGeometry(.046, .058, .5, 20, 1, true), matManga);
  manga.position.copy(mu).addScaledVector(atras, .3); manga.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), atras);
  const puno = new THREE.Mesh(new THREE.CylinderGeometry(.05, .052, .06, 20, 1, true), matPuno);
  puno.position.copy(mu).addScaledVector(atras, .06); puno.quaternion.copy(manga.quaternion);
  const vuelta = new THREE.Mesh(new THREE.CylinderGeometry(.044, .048, .045, 20, 1, true), matGuante);
  vuelta.position.copy(mu).addScaledVector(atras, .01); vuelta.quaternion.copy(manga.quaternion);
  [manga, puno, vuelta].forEach(m => { m.material.side = THREE.DoubleSide; raiz.add(m); m.castShadow = calidad.sombras; });
  // base del modelo: dedos, palma y centro de la palma, para orientarla
  const X = h.dedos.clone(), Y = h.palma.clone(), Z = new THREE.Vector3().crossVectors(X, Y).normalize();
  const mBase = new THREE.Matrix4().makeBasis(X, Y, Z);
  manos.lista.push({ cont, raiz, h, lado, mBase, centro: h.centro.clone() });
  if (manos.lista.length === 2) manos.listo = true;
}
// coloca una mano: su palma en "p", con los dedos hacia "dedos" y la palma mirando a "palma"
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3();
function situarMano(m, p, dedos, palma) {
  const Z = _v.crossVectors(dedos, palma).normalize();
  _m.makeBasis(dedos.clone().normalize(), palma.clone().normalize(), Z.clone());
  _m.multiply(m.mBase.clone().invert());
  m.cont.quaternion.setFromRotationMatrix(_m);
  m.cont.position.copy(p).sub(m.centro.clone().applyQuaternion(m.cont.quaternion));
}
function animarManos() {}

/* ---------- Secuencia: la obra baja de la pared y viene hacia usted ---------- */
const vista = $('#vista');
let actual = null;
function tween(ms, f) {
  return new Promise(res => { const t0 = performance.now(); const d = RM ? 1 : ms * (window.__lento || 1); const pasoT = () => { const k = Math.min(1, (performance.now() - t0) / d); f(k); if (k < 1) requestAnimationFrame(pasoT); else res(); }; requestAnimationFrame(pasoT); });
}
async function acercar(ob) {
  if (ocupado) return;
  ocupado = true; document.body.classList.add('ocupado'); actual = ob;
  const marco = ob.marco, grupo = ob.o;
  grupo.updateMatrixWorld(true);
  // 1 · la cámara se coloca frente a la obra
  const centro = marco.getWorldPosition(new THREE.Vector3());
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(grupo.getWorldQuaternion(new THREE.Quaternion()));
  const retrato = innerWidth < innerHeight;
  const de = centro.clone().addScaledVector(normal, Math.max(.78, ob.w * 1.3) * (retrato ? 1.7 : 1)); de.y = centro.y + .06;
  posMeta.copy(de);
  const yaw0 = yaw, yawF = Math.atan2(-normal.x, -normal.z) * -1 + 0;
  yawMeta = Math.atan2(normal.x, normal.z); pitchMeta = Math.atan2(centro.y - de.y, de.distanceTo(centro)) * .9;
  mirX = mirY = 0;
  tween(1500, k => { luzMano.intensity = k * .7; gal.atenuar(ob, 1 - k * .94); });
  await espera(1500);
  // 2 · entran las manos y la sujetan por los lados
  const st = { ob, centro, normal };
  manos.st = st;
  const der = new THREE.Vector3(1, 0, 0).applyQuaternion(grupo.getWorldQuaternion(new THREE.Quaternion()));
  const arriba = new THREE.Vector3(0, 1, 0);
  st.der = der; st.arriba = arriba;
  // posición original del marco (local) para devolverlo
  st.local0 = marco.position.clone(); st.rot0 = marco.rotation.clone();
  // trasladamos el marco a coordenadas del mundo para moverlo libremente
  const mw = marco.matrixWorld.clone();
  gal.escena.attach(marco);
  st.mundo0 = { p: marco.position.clone(), q: marco.quaternion.clone() };
  const agarre = (k, pc, q) => {
    for (const m of manos.lista) {
      const lado = m.lado; // 1 derecha
      const d = new THREE.Vector3(lado, 0, 0).applyQuaternion(q);
      const fw = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
      // la palma en el canto, un poco por detrás del frente; dedos hacia atrás y algo hacia abajo
      const p = pc.clone().addScaledVector(d, ob.w / 2 + .03).addScaledVector(up, -ob.h * .12).addScaledVector(fw, -.012);
      // entrada desde abajo y desde fuera
      const fuera = (1 - k);
      p.addScaledVector(d, fuera * .35).addScaledVector(up, -fuera * .7).addScaledVector(fw, fuera * .5);
      const dedos = fw.clone().multiplyScalar(-.5).addScaledVector(up, .87).normalize();
      const palma = d.clone().negate();
      situarMano(m, p, dedos, palma);
      m.cont.visible = true;
    }
  };
  if (manos.listo) {
    await tween(900, k => { agarre(suave(k), marco.position, marco.quaternion); manos.lista.forEach(m => m.h.cerrar(.15)); });
    await tween(350, k => manos.lista.forEach(m => m.h.cerrar(.15 + k * .55)));
  }
  if (window.__pausa) await new Promise(r => window.__seguir = r);
  // 3 · la levanta del gancho, la separa de la pared y se la acerca
  const p0 = marco.position.clone(), q0 = marco.quaternion.clone();
  const p1 = p0.clone().addScaledVector(arriba, .03).addScaledVector(normal, .12);
  const ojo = posMeta.clone();
  const dist = Math.max(.5, ob.w * .9) * (innerWidth < innerHeight ? 1.55 : 1);
  const p2 = ojo.clone().addScaledVector(normal, -dist); p2.y = ojo.y - .05;
  const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yawMeta, 0, 'YXZ')).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.06, 0, 0)));
  await tween(450, k => { marco.position.lerpVectors(p0, p1, suave(k)); if (manos.listo) agarre(1, marco.position, marco.quaternion); });
  pitchMeta = 0;
  await tween(1300, k => {
    const e = suave(k);
    marco.position.lerpVectors(p1, p2, e); marco.position.y += Math.sin(e * Math.PI) * .04;
    marco.quaternion.slerpQuaternions(q0, q2, e);
    if (manos.listo) agarre(1, marco.position, marco.quaternion);
  });
  st.p2 = p2.clone(); st.q2 = q2.clone(); st.p1 = p1; st.p0 = p0; st.q0 = q0; st.agarre = agarre;
  // 4 · la vista a pantalla completa
  await abrirVista(ob.p);
}
async function abrirVista(p) {
  $('#vInv').textContent = `${p.id} · ${p.y}`; $('#vTitulo').textContent = p.t; $('#vAutor').textContent = p.a;
  $('#vDatos').innerHTML = [['Época', p.y], ['Técnica', p.tech], ['Marco', p.marco], ['Medidas', p.medidas || 'A consultar']].map(([a, b], i) => `<li style="--i:${i}"><span>${a}</span>${b}</li>`).join('');
  $('#vHistoria').textContent = p.story;
  const pj = p.puja ? estadoPuja(p) : null, e = p.estado || 'disponible';
  $('#vPuja').innerHTML = pj && e === 'disponible' ? htmlPuja(p) : '';
  $('#vPrecio').innerHTML = pj && e === 'disponible' ? `<small>${pujaActual(p) == null ? 'Salida' : 'Puja actual'}</small> ${euro(pujaActual(p) == null ? p.puja.salida : pujaActual(p))}` : euro(p.price);
  const stt = $('#vEstado'); stt.className = 'status ' + (pj && e === 'disponible' ? 'en-puja' : e); stt.innerHTML = `<i></i>${pj && e === 'disponible' ? (pj.abierta ? 'En puja' : 'Puja cerrada') : ESTADOS[e]}`;
  const br = $('#vReservar'); br.textContent = pj && pj.abierta ? `Pujar · desde ${euro(minimoPuja(p))}` : e === 'vendido' ? 'Avísame de algo parecido' : 'Reservar o preguntar';
  br.onclick = () => pj && pj.abierta && e === 'disponible' ? ofertar(p) : reservar(p);
  $('#vCert').onclick = () => abrirCertificado(p);
  $('#vFicha').href = `/obra/${p.slug}/`;
  const stage = $('#vistaStage'); stage.innerHTML = `<img alt="${p.t}" id="vistaImg" src="/${p.img}">`;
  const img = stage.querySelector('img');
  await new Promise(res => { if (img.complete && img.naturalWidth) res(); else { img.onload = res; img.onerror = res; } });
  vista.hidden = false; await espera(20); vista.classList.add('ve');
  ponerLupa(stage, p); if (window.tickRelojes) tickRelojes();
  $('#vCerrar').focus({ preventScroll: true });
}
async function devolver() {
  if (vista.hidden) return;
  vista.classList.remove('ve'); await espera(RM ? 0 : 450); vista.hidden = true;
  const st = manos.st, ob = actual; if (!st) { fin(); return; }
  const marco = ob.marco;
  await tween(1200, k => {
    const e = suave(k);
    marco.position.lerpVectors(st.p2, st.p1, e); marco.position.y += Math.sin(e * Math.PI) * .03;
    marco.quaternion.slerpQuaternions(st.q2, st.q0, e);
    if (manos.listo) st.agarre(1, marco.position, marco.quaternion);
  });
  await tween(380, k => { marco.position.lerpVectors(st.p1, st.p0, suave(k)); if (manos.listo) st.agarre(1, marco.position, marco.quaternion); });
  ob.o.attach(marco); marco.position.copy(st.local0); marco.rotation.copy(st.rot0);
  if (manos.listo) {
    await tween(300, k => manos.lista.forEach(m => m.h.cerrar(.7 - k * .6)));
    await tween(700, k => st.agarre(1 - suave(k), marco.getWorldPosition(new THREE.Vector3()), marco.getWorldQuaternion(new THREE.Quaternion())));
    manos.lista.forEach(m => m.cont.visible = false);
  }
  fin();
}
function fin() {
  tween(900, k => { luzMano.intensity = .7 * (1 - k); gal.atenuar(null, 1); });
  // vuelta al centro del pasillo, mirando al fondo
  s = sMeta = -pos.z; posMeta.set(0, OJOS, pos.z); yawMeta = 0; pitchMeta = 0;
  setTimeout(() => { ocupado = false; document.body.classList.remove('ocupado'); }, RM ? 0 : 900);
}
$('#vCerrar').onclick = devolver;

/* ---------- Lista de todas las obras ---------- */
const lista = $('#listaObras');
$('#btnLista').onclick = () => {
  $('#listaUl').innerHTML = orden.map((p, i) => `<li><button type="button" data-i="${i}"><img src="/${p.thumb}" alt=""><span><b>${p.t}</b><small>${p.tech} · ${p.puja ? 'en puja' : euro(p.price)}</small></span></button></li>`).join('');
  lista.hidden = false; $('#listaCerrar').focus();
  $('#listaUl').querySelectorAll('button').forEach(b => b.onclick = async () => {
    lista.hidden = true; const p = orden[+b.dataset.i];
    // el tramo más cercano por delante que la tenga
    const n = orden.length, i0 = Math.floor(s / B) + 1;
    let idx = null, lado = 0;
    for (let i = i0; i < i0 + n + 1 && idx === null; i++) for (let k = 0; k < 2; k++) if (orden[(((i * 2 + k) % n) + n) % n] === p) { idx = i; lado = k; break; }
    sMeta = idx * B - 3.2; await espera(RM ? 50 : 2200);
    const tr = gal.tramos.find(t => t.idx === idx); if (tr) acercar(tr.obras[lado]);
  });
};
$('#listaCerrar').onclick = () => { lista.hidden = true; };
lista.addEventListener('click', e => { if (e.target === lista) lista.hidden = true; });
$('#btnGustos').onclick = async () => { if (ocupado || preguntando) return; $('#hudPie').classList.add('visto'); document.body.classList.add('ocupado'); await preguntas(); document.body.classList.remove('ocupado'); };

/* ---------- Sin WebGL ---------- */
function sinWebGL() {
  document.body.classList.add('sin-3d');
  const m = document.getElementById('sin3d'); if (m) m.hidden = false;
}

/* =========================== Arranque =========================== */
if (matchMedia('(pointer: coarse)').matches) $('#hudPie').textContent = 'Deslice el dedo para avanzar · toque una obra y se la acercamos';
$('#saltar').onclick = async () => { if (enPasillo) return; if (modo === 'tierra') { entrarEnGaleria(); } $('#dialogo').hidden = true; preguntando = false; irAlPasillo(); };
async function inicio() {
  const directo = Q.has('directo') || RM;
  if (sto.get('pasillo-visto')) $('#saltar').textContent = 'Ir directo al pasillo →';
  requestAnimationFrame(bucle);
  if (directo) { entrarEnGaleria(); irAlPasillo(); return; }
  $('#cargando').hidden = false;
  await Promise.race([tierra.listo, espera(12000)]);
  $('#cargando').hidden = true;
  await viajeEspacio(); if (enPasillo) return;
  entrarEnGaleria(); $('#rotuloGeo').classList.remove('ve'); $('#coords').classList.remove('ve');
  document.body.classList.add('en-galeria');
  abrirLuz(1800);
  // mientras pregunta, la cámara avanza muy despacio hacia la entrada del pasillo
  sMeta = -2.6;
  await preguntas(); if (enPasillo) return;
  irAlPasillo();
}
window.__pasillo = { luzMano, THREE, get s() { return s; }, set sMeta(v) { sMeta = v; }, gal, acercar, devolver, get ocupado() { return ocupado; }, manos, camara };
inicio();
