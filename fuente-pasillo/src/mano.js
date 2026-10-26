import * as THREE from 'three';
// Convierte las articulaciones planas del modelo WebXR en cadenas y permite cerrar los dedos
const DEDOS = ['index-finger', 'middle-finger', 'ring-finger', 'pinky-finger'];
const FAL = ['metacarpal', 'phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip'];
const PUL = ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'];
export function prepararMano(root, signo0 = 1) {
  let signo = signo0;
  root.updateMatrixWorld(true);
  const B = {}; root.traverse(o => { if (o.isBone) B[o.name] = o; });
  const wrist = B['wrist'];
  const cadenas = [];
  for (const d of DEDOS) cadenas.push(FAL.map(f => B[d + '-' + f]));
  cadenas.push(PUL.map(n => B[n]));
  for (const c of cadenas) { let p = wrist; for (const b of c) { p.attach(b); p = b; } }
  root.updateMatrixWorld(true);
  // eje de flexión de cada dedo: perpendicular a la dirección del dedo y a la anchura de la palma
  const P = n => new THREE.Vector3().setFromMatrixPosition(B[n].matrixWorld);
  const ancho = P('pinky-finger-phalanx-proximal').sub(P('index-finger-phalanx-proximal')).normalize();
  const ejeDe = (i, dir) => i < 4 ? new THREE.Vector3().crossVectors(ancho, dir).normalize().multiplyScalar(signo) : new THREE.Vector3().crossVectors(dir, ancho).normalize().multiplyScalar(signo);
  const info = cadenas.map((c, i) => {
    const dir = new THREE.Vector3().setFromMatrixPosition(c[c.length - 1].matrixWorld).sub(new THREE.Vector3().setFromMatrixPosition(c[1].matrixWorld)).normalize();
    return { c, dir, eje: ejeDe(i, dir), rest: c.map(b => b.quaternion.clone()), i };
  });
  const q = new THREE.Quaternion(), qp = new THREE.Quaternion(), qr = new THREE.Quaternion(), ax = new THREE.Vector3();
  // cierre: 0 abierta, 1 agarre
  function cerrar(k, pulgar = k) {
    (root.parent || root).updateMatrixWorld(true);
    info.forEach((f, i) => {
      f.c.forEach((b, j) => b.quaternion.copy(f.rest[j]));
      root.updateMatrixWorld(true);
      const ang = i < 4 ? [0, 1.05, 1.2, .75] : [0, .35, .5];
      const kk = i < 4 ? k : pulgar;
      for (let j = 1; j < f.c.length - 1; j++) {
        const b = f.c[j];
        if (ang[j] === undefined) continue;
        b.parent.getWorldQuaternion(qp); root.getWorldQuaternion(qr);
        ax.copy(f.eje).applyQuaternion(qr).applyQuaternion(qp.invert());
        q.setFromAxisAngle(ax, ang[j] * kk);
        b.quaternion.premultiply(q);
        b.updateMatrixWorld(true);
      }
    });
  }
  const dedos = info[1].dir.clone();
  const palma = () => new THREE.Vector3().crossVectors(info[1].eje, dedos).normalize();
  const muneca = P('wrist');
  const centro = P('middle-finger-metacarpal').add(P('middle-finger-phalanx-proximal')).add(P('index-finger-phalanx-proximal')).add(P('ring-finger-phalanx-proximal')).multiplyScalar(.25);
  const pulgarDir = P('thumb-tip').sub(centro).normalize();
  const api = { cerrar, huesos: B, dedos, muneca, centro, pulgarDir, palma: palma(),
    invertir() { signo = -signo; info.forEach(f => { f.eje = ejeDe(f.i, f.dir); }); api.palma = palma(); } };
  return api;
}
