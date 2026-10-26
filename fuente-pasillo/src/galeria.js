import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

// Galería monumental de noche: suelo de mármol pulido que refleja, paredes de seda adamascada granate,
// zócalo de nogal, pilastras de mármol, bóveda de yeso con lucernario y lámparas de cuadro.
export const B = 4.6;          // longitud de cada tramo (entre pilastras)
export const ANCHO = 4.4;      // anchura del pasillo
const MW = ANCHO / 2, ALTO = 4.3, R = MW, CUELGUE = 1.62;
const ZOC = 1.0;               // altura del zócalo
export const OJOS = 1.62;

// medidas aproximadas de cada marco (m), a partir de la foto
const ANCHURA = { 'PRC-001': .58, 'PRC-002': .58, 'PRC-003': .54, 'PRC-004': .44, 'PRC-005': .68, 'PRC-006': .62, 'PRC-007': .62 };
const TEX = { 'obras/montacute.jpg': 'montacute', 'obras/four-courts.jpg': 'four-courts', 'obras/kininger.jpg': 'kininger', 'obras/cromos-francia.jpg': 'cromos-francia', 'obras/cromos-cuatro-paises.jpg': 'cromos-cuatro-paises', 'obras/venecia-san-marco.jpg': 'venecia-san-marco', 'obras/venecia-salute.jpg': 'venecia-salute' };

export function crearGaleria({ renderer, cargador, base, obras, calidad, euro }) {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x050403);
  escena.fog = new THREE.FogExp2(0x0d0907, .034);
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const tx = (n, rep, srgb = true) => {
    const t = cargador.load(base + n); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t;
  };

  /* ---------- Materiales ---------- */
  const LARGO = B * 12; // longitud de los planos continuos (se recolocan con la cámara)
  const marmolRep = [ANCHO / (B / 2), LARGO / (B / 2)];
  const mSuelo = new THREE.MeshStandardMaterial({ map: tx('marmol_color.jpg', marmolRep), roughnessMap: tx('marmol_rough.jpg', marmolRep, false), normalMap: tx('marmol_normal.jpg', marmolRep, false), roughness: 1, metalness: 0 });
  mSuelo.normalScale.set(.6, .6);
  const sedaRep = [LARGO / (B / 12), (ALTO - ZOC) / (B / 12 * 1.5)];
  const mSeda = new THREE.MeshStandardMaterial({ map: tx('seda_color.jpg', sedaRep), roughnessMap: tx('seda_rough.jpg', sedaRep, false), normalMap: tx('seda_normal.jpg', sedaRep, false), roughness: 1, color: 0xffffff });
  mSeda.normalScale.set(.5, .5);
  const nogalRep = [LARGO / 2.2, 1];
  const mNogal = new THREE.MeshStandardMaterial({ map: tx('nogal_color.jpg', nogalRep), roughnessMap: tx('nogal_rough_src.jpg', nogalRep, false), roughness: .9, color: 0xb59a86 });
  const mNogalP = mNogal.clone(); mNogalP.map = tx('nogal_color.jpg', [1, .5]); mNogalP.roughnessMap = null; mNogalP.roughness = .45;
  const mOro = new THREE.MeshStandardMaterial({ color: 0xc8a15a, metalness: 1, roughness: .32 });
  const mOroViejo = new THREE.MeshStandardMaterial({ color: 0x9c7a3e, metalness: 1, roughness: .42 });
  const mYeso = new THREE.MeshStandardMaterial({ map: tx('yeso_color.jpg', [8, 8]), normalMap: tx('yeso_normal.jpg', [8, 8], false), color: 0xd9cdb8, roughness: .92 });
  const mPiedra = new THREE.MeshStandardMaterial({ map: tx('yeso_color.jpg', [1, 2]), normalMap: tx('yeso_normal.jpg', [1, 2], false), color: 0xd8cfc0, roughness: .55 });
  const mCuero = new THREE.MeshPhysicalMaterial({ color: 0x3a1512, roughness: .55, sheen: .4, sheenColor: 0x6a3a30 });
  const mLaton = new THREE.MeshStandardMaterial({ color: 0xb08a4a, metalness: 1, roughness: .28 });
  const mLuz = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffd9a0, emissiveIntensity: 2.2 });
  const mVidrio = new THREE.MeshStandardMaterial({ color: 0x0a0d18, emissive: 0x0d1630, emissiveIntensity: .9, roughness: .15, metalness: .2 });

  /* ---------- Envolvente continua (se recentra por tramos) ---------- */
  const caja = new THREE.Group(); escena.add(caja);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, LARGO), mSuelo);
  suelo.rotation.x = -Math.PI / 2; caja.add(suelo);
  // reflejo del suelo pulido
  const tamR = new THREE.Vector2(); renderer.getDrawingBufferSize(tamR);
  const espejo = new Reflector(new THREE.PlaneGeometry(ANCHO, LARGO), { textureWidth: tamR.x * calidad.reflejo, textureHeight: tamR.y * calidad.reflejo, multisample: 0, clipBias: .003 });
  espejo.rotation.x = -Math.PI / 2; espejo.visible = false;
  const reflMatrix = espejo.material.uniforms.textureMatrix.value;
  mSuelo.onBeforeCompile = sh => {
    sh.uniforms.tRefl = { value: espejo.getRenderTarget().texture };
    sh.uniforms.reflMatrix = { value: reflMatrix };
    sh.uniforms.reflRes = { value: new THREE.Vector2(1 / (tamR.x * calidad.reflejo), 1 / (tamR.y * calidad.reflejo)) };
    mSuelo.userData.sh = sh;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 reflMatrix; varying vec4 vRefl;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRefl = reflMatrix * vec4(position, 1.0);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRefl; uniform vec2 reflRes; varying vec4 vRefl;')
      .replace('#include <opaque_fragment>', `
        {
          vec2 ruv = vRefl.xy / vRefl.w + normal.xy * .012;
          float blur = mix(1.0, 9.0, clamp(roughnessFactor * 4.0, 0., 1.));
          vec3 rc = vec3(0.);
          rc += texture2D(tRefl, ruv).rgb * .2;
          rc += texture2D(tRefl, ruv + vec2(reflRes.x, 0.) * blur).rgb * .1;
          rc += texture2D(tRefl, ruv - vec2(reflRes.x, 0.) * blur).rgb * .1;
          rc += texture2D(tRefl, ruv + vec2(0., reflRes.y) * blur * 2.).rgb * .15;
          rc += texture2D(tRefl, ruv - vec2(0., reflRes.y) * blur * 2.).rgb * .15;
          rc += texture2D(tRefl, ruv + vec2(0., reflRes.y) * blur * 5.).rgb * .15;
          rc += texture2D(tRefl, ruv - vec2(0., reflRes.y) * blur * 5.).rgb * .15;
          float fres = .06 + .94 * pow(1. - clamp(dot(normal, normalize(vViewPosition)), 0., 1.), 5.);
          float pulido = 1. - clamp((roughnessFactor - .05) * 3., 0., 1.);
          outgoingLight = outgoingLight * (1. - fres * pulido * .5) + rc * (fres * .85 + .1) * pulido;
        }
        #include <opaque_fragment>`);
  };

  // paredes
  const paredGeo = new THREE.PlaneGeometry(LARGO, ALTO - ZOC);
  for (const lado of [-1, 1]) {
    const p = new THREE.Mesh(paredGeo, mSeda); p.position.set(lado * MW, ZOC + (ALTO - ZOC) / 2, 0); p.rotation.y = -lado * Math.PI / 2; caja.add(p);
    // zócalo de nogal con moldura dorada y rodapié
    const z = new THREE.Mesh(new THREE.BoxGeometry(.06, ZOC, LARGO), mNogal); z.position.set(lado * (MW - .03), ZOC / 2, 0); caja.add(z);
    const mol = new THREE.Mesh(new THREE.BoxGeometry(.11, .07, LARGO), mOroViejo); mol.position.set(lado * (MW - .055), ZOC + .02, 0); caja.add(mol);
    const rod = new THREE.Mesh(new THREE.BoxGeometry(.1, .2, LARGO), mNogalP); rod.position.set(lado * (MW - .05), .1, 0); caja.add(rod);
    // cornisa dorada y barra de colgar
    const cor = new THREE.Mesh(new THREE.BoxGeometry(.32, .26, LARGO), mYeso); cor.position.set(lado * (MW - .16), ALTO + .13, 0); caja.add(cor);
    const cor2 = new THREE.Mesh(new THREE.BoxGeometry(.2, .06, LARGO), mOro); cor2.position.set(lado * (MW - .1), ALTO - .03, 0); caja.add(cor2);
    const barra = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, LARGO, 8), mLaton); barra.rotation.x = Math.PI / 2; barra.position.set(lado * (MW - .04), ALTO - .2, 0); caja.add(barra);
  }
  // bóveda de cañón con lucernario
  const boveda = new THREE.Mesh(new THREE.CylinderGeometry(R, R, LARGO, 64, 1, true, Math.PI / 2 + .26, Math.PI - .52), mYeso);
  boveda.material = mYeso.clone(); boveda.material.side = THREE.BackSide;
  boveda.rotation.x = Math.PI / 2; boveda.rotation.z = Math.PI; boveda.position.y = ALTO + .26; caja.add(boveda);
  // franjas laterales de la bóveda que faltan (arranques) y lucernario en la clave
  const luc = new THREE.Mesh(new THREE.PlaneGeometry(1.5, LARGO), mVidrio); luc.rotation.x = Math.PI / 2; luc.position.y = ALTO + .26 + R - .03; caja.add(luc);
  const marcoLuc = new THREE.Group(); caja.add(marcoLuc);
  for (let i = 0; i < LARGO / .9; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(1.5, .04, .04), mNogalP); v.position.set(0, ALTO + .26 + R - .05, -LARGO / 2 + i * .9); marcoLuc.add(v); }
  for (const x of [-.75, 0, .75]) { const v = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, LARGO), mNogalP); v.position.set(x, ALTO + .26 + R - .055, 0); marcoLuc.add(v); }

  /* ---------- Tramos: pilastras, arcos fajones, banco, farol y dos obras ---------- */
  const N = calidad.tramos;
  const tramos = [];
  const geoPil = new THREE.BoxGeometry(.24, ALTO, .62);
  const geoBasa = new THREE.BoxGeometry(.32, .34, .74);
  const geoCap = new THREE.BoxGeometry(.34, .22, .76);
  const geoArco = new THREE.TorusGeometry(R - .02, .16, 12, 48, Math.PI);
  const marcoGeo = new THREE.BoxGeometry(1, 1, 1);
  const cartelaGeo = new THREE.BoxGeometry(.2, .13, .006);

  // materiales de cada obra (foto rectificada del marco, con un leve brillo de cristal)
  const matObra = new Map();
  function materialesDe(p) {
    if (matObra.has(p.id)) return matObra.get(p.id);
    const t = cargador.load(base + TEX[p.img] + '.jpg', tt => {
      // color medio del canto, sacado del borde de la foto
      const c = document.createElement('canvas'); c.width = 32; c.height = 32; const g = c.getContext('2d');
      g.drawImage(tt.image, 0, 0, 32, 32); const d = g.getImageData(0, 0, 32, 2).data;
      let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4; canto.color.setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace);
    });
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
    const frente = new THREE.MeshPhysicalMaterial({ map: t, roughness: .62, clearcoat: .3, clearcoatRoughness: .1 });
    const canto = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: .5, metalness: .3 });
    const trasera = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: .9 });
    const m = { arr: [canto, canto, canto, canto, frente, trasera], frente, cartela: cartela(p) };
    matObra.set(p.id, m); return m;
  }
  function cartela(p) {
    const c = document.createElement('canvas'); c.width = 640; c.height = 416; const g = c.getContext('2d');
    g.fillStyle = '#f4efe4'; g.fillRect(0, 0, 640, 416);
    g.fillStyle = 'rgba(120,100,70,.08)'; for (let i = 0; i < 1400; i++) g.fillRect(Math.random() * 640, Math.random() * 416, 1, 1);
    g.fillStyle = '#7a6040'; g.font = '500 22px "IBM Plex Mono", monospace'; g.fillText(p.id, 40, 58);
    g.fillStyle = '#1d1311'; g.font = 'italic 500 38px "Bodoni Moda", Georgia, serif';
    const pal = p.t.split(' '); let lin = '', y = 112; const lineas = [];
    for (const w of pal) { const t = lin ? lin + ' ' + w : w; if (g.measureText(t).width > 560) { lineas.push(lin); lin = w; } else lin = t; } lineas.push(lin);
    lineas.slice(0, 3).forEach(l => { g.fillText(l, 40, y); y += 44; });
    g.fillStyle = '#4a3b33'; g.font = '400 23px Archivo, Arial, sans-serif';
    y += 6; g.fillText(p.a.length > 46 ? p.a.slice(0, 45) + '…' : p.a, 40, y); y += 32; g.fillText(p.y, 40, y);
    g.fillStyle = '#5a1820'; g.font = '600 26px Archivo, Arial, sans-serif';
    g.fillText(p.puja ? 'En puja · salida ' + euro(p.puja.salida) : euro(p.price), 40, 380);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
    return new THREE.MeshStandardMaterial({ map: t, roughness: .85 });
  }

  for (let i = 0; i < N; i++) {
    const g = new THREE.Group(); escena.add(g);
    const tr = { g, idx: null, obras: [] };
    // pilastras y arco en el extremo +z del tramo
    for (const lado of [-1, 1]) {
      const pil = new THREE.Mesh(geoPil, mPiedra); pil.position.set(lado * (MW - .12), ALTO / 2, B / 2); g.add(pil);
      const ba = new THREE.Mesh(geoBasa, mPiedra); ba.position.set(lado * (MW - .16), .17, B / 2); g.add(ba);
      const ca = new THREE.Mesh(geoCap, mOroViejo); ca.position.set(lado * (MW - .17), ALTO + .02, B / 2); g.add(ca);
    }
    const arco = new THREE.Mesh(geoArco, mPiedra); arco.position.set(0, ALTO + .26, B / 2); g.add(arco);
    // farol colgante
    const farol = new THREE.Group(); farol.position.set(0, ALTO + .2, 0); g.add(farol);
    const cad = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, R - .5, 6), mLaton); cad.position.y = (R - .5) / 2 + .35; farol.add(cad);
    const glob = new THREE.Mesh(new THREE.SphereGeometry(.15, 24, 16), mLuz); farol.add(glob);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(.22, .018, 8, 32), mLaton); aro.rotation.x = Math.PI / 2; farol.add(aro);
    const tapa = new THREE.Mesh(new THREE.ConeGeometry(.16, .14, 24), mLaton); tapa.position.y = .24; farol.add(tapa);
    tr.farol = farol;
    // banco tapizado cada dos tramos
    if (i % 2 === 0) {
      const banco = new THREE.Group(); banco.position.set(0, 0, 0); g.add(banco);
      const asiento = new THREE.Mesh(new THREE.BoxGeometry(.62, .14, 2.0), mCuero); asiento.position.y = .44; asiento.castShadow = true; banco.add(asiento);
      const bastidor = new THREE.Mesh(new THREE.BoxGeometry(.66, .08, 2.04), mNogalP); bastidor.position.y = .34; banco.add(bastidor);
      for (const [x, z] of [[-.27, -.95], [.27, -.95], [-.27, .95], [.27, .95]]) { const pata = new THREE.Mesh(new THREE.CylinderGeometry(.03, .022, .3, 10), mNogalP); pata.position.set(x, .15, z); banco.add(pata); }
      tr.banco = banco;
    }
    // las dos obras: izquierda y derecha
    for (const lado of [-1, 1]) {
      const o = new THREE.Group(); o.position.set(lado * (MW - .02), 0, 0); o.rotation.y = lado * -Math.PI / 2; g.add(o);
      const marco = new THREE.Mesh(marcoGeo, []); marco.castShadow = true; marco.receiveShadow = false; o.add(marco);
      // cordones de colgar desde la barra
      const cord = []; for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.0025, .0025, 1, 4), mLaton); o.add(c); cord.push(c); }
      // lámpara de cuadro
      const lampara = new THREE.Group(); o.add(lampara);
      const brazo = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .26, 8), mLaton); brazo.rotation.x = Math.PI / 2; brazo.position.set(0, 0, .13); lampara.add(brazo);
      const pant = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .36, 20, 1, false, 0, Math.PI), mLaton); pant.rotation.z = Math.PI / 2; pant.rotation.x = -Math.PI / 2 - .5; pant.position.set(0, -.02, .27); lampara.add(pant);
      const tubo = new THREE.Mesh(new THREE.BoxGeometry(.33, .012, .02), mLuz); tubo.position.set(0, -.05, .27); lampara.add(tubo);
      const cart = new THREE.Mesh(cartelaGeo, []); o.add(cart);
      tr.obras.push({ o, marco, cord, lampara, cart, lado, p: null });
    }
    tramos.push(tr);
  }

  /* ---------- Luces: un grupo fijo de focos que acompaña a los tramos cercanos ---------- */
  const amb = new THREE.HemisphereLight(0xffe6c4, 0x3a2416, .55); escena.add(amb);
  const focos = [];
  for (let i = 0; i < calidad.focos; i++) {
    const s = new THREE.SpotLight(0xffe2b8, 0, 4.2, .62, .75, 2);
    s.castShadow = calidad.sombras; s.shadow.mapSize.set(512, 512); s.shadow.bias = -.0004; s.shadow.normalBias = .02; s.shadow.camera.near = .1; s.shadow.camera.far = 4.5;
    escena.add(s); escena.add(s.target); focos.push(s);
  }
  const faroles = [];
  for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffc98a, 0, 12, 2); escena.add(l); faroles.push(l); }

  /* ---------- Colocar las obras de un tramo ---------- */
  function vestir(tr, idx, orden) {
    tr.idx = idx; tr.g.position.z = -idx * B;
    tr.obras.forEach((ob, k) => {
      const n = orden.length, p = orden[(((idx * 2 + k) % n) + n) % n];
      ob.p = p;
      const m = materialesDe(p);
      const w = ANCHURA[p.id] || .56, h = w * (p.th / p.tw) || w * .8;
      const d = .05;
      ob.marco.material = m.arr; ob.marco.scale.set(w, h, d);
      ob.marco.position.set(0, CUELGUE, d / 2 + .01); ob.marco.rotation.x = -.035;
      ob.w = w; ob.h = h; ob.d = d;
      // cordones: de la barra a las esquinas superiores
      const top = CUELGUE + h / 2, barraY = ALTO - .2;
      ob.cord.forEach((c, i) => { const x = (i ? 1 : -1) * w * .32; const len = barraY - top; c.scale.y = len; c.position.set(x * .9, top + len / 2, .035); c.rotation.z = (i ? 1 : -1) * Math.atan2(x * .1, len); });
      ob.lampara.position.set(0, top + .07, .02);
      ob.cart.material = m.cartela; ob.cart.position.set(w / 2 + .32, 1.42, .004);
      ob.marco.userData.obra = ob;
    });
  }

  let ordenActual = obras, atenuada = null, factorAt = 1;
  function atenuar(ob, f) { atenuada = ob; factorAt = f; }
  function reordenar(orden) { ordenActual = orden; tramos.forEach(tr => { if (tr.idx !== null) vestir(tr, tr.idx, orden); }); }

  // actualizar con la posición de la cámara (z negativa hacia el fondo)
  const tmp = new THREE.Vector3();
  function actualizar(camZ) {
    const i0 = Math.floor(-camZ / B + .5) - 1;
    const quiero = new Set(); for (let k = 0; k < N; k++) quiero.add(i0 + k);
    const libres = tramos.filter(t => !quiero.has(t.idx));
    for (const idx of quiero) if (!tramos.some(t => t.idx === idx)) vestir(libres.pop(), idx, ordenActual);
    // envolvente: recolocada a múltiplos del tramo para que las texturas casen
    caja.position.z = Math.round(camZ / B) * B - LARGO / 2 + B * 3;
    espejo.position.set(0, 0, caja.position.z); espejo.updateMatrixWorld();
    // focos para las obras de los tramos más cercanos por delante
    const cerca = tramos.slice().sort((a, b) => Math.abs(-a.idx * B - camZ + 2.5) - Math.abs(-b.idx * B - camZ + 2.5));
    let f = 0;
    for (const tr of cerca) for (const ob of tr.obras) {
      if (f >= focos.length) break;
      const s = focos[f++];
      ob.lampara.getWorldPosition(tmp); s.position.copy(tmp); s.position.y -= .06;
      ob.marco.getWorldPosition(tmp); s.target.position.copy(tmp); s.target.position.y -= ob.h * .1;
      s.intensity = 22 * (ob === atenuada ? factorAt : 1); s.angle = Math.min(.95, Math.atan2(Math.max(ob.w, ob.h) * .95, .5));
      s.target.updateMatrixWorld();
    }
    for (; f < focos.length; f++) focos[f].intensity = 0;
    cerca.slice(0, faroles.length).forEach((tr, i) => { tr.farol.getWorldPosition(tmp); faroles[i].position.copy(tmp); faroles[i].position.y -= .1; faroles[i].intensity = 9; });
  }

  let cuadros = 0;
  function antesDeRender(camara) {
    if (++cuadros < 3) return;
    suelo.visible = false;
    espejo.onBeforeRender(renderer, escena, camara);
    suelo.visible = true;
  }
  function redimensionar() {
    renderer.getDrawingBufferSize(tamR);
    espejo.getRenderTarget().setSize(tamR.x * calidad.reflejo, tamR.y * calidad.reflejo);
    const sh = mSuelo.userData.sh; if (sh) sh.uniforms.reflRes.value.set(1 / (tamR.x * calidad.reflejo), 1 / (tamR.y * calidad.reflejo));
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  function generarEntorno(z) {
    const prev = escena.environment; const f = escena.fog; escena.fog = null;
    focos.forEach(x => x.castShadow = false);
    const rt = pmrem.fromScene(escena, .02, .1, 40, { position: new THREE.Vector3(0, 1.8, z) });
    focos.forEach(x => x.castShadow = calidad.sombras);
    escena.fog = f; escena.environment = rt.texture; escena.environmentIntensity = .55;
    if (prev) prev.dispose?.();
  }
  const marcos = () => tramos.flatMap(t => t.obras.map(o => o.marco));
  return { escena, atenuar, generarEntorno, actualizar, antesDeRender, redimensionar, reordenar, marcos, tramos, OJOS, B };
}
