import * as THREE from 'three';
// La Tierra de noche sobre Europa, con imágenes de satélite: día, noche (luces de ciudades), nubes y atmósfera.

export const ALCALA = { lon: -3.364, lat: 40.482 };

// posición en la esfera de radio r para una longitud/latitud (UV equirectangular de SphereGeometry)
export function punto(lon, lat, r = 1) {
  const u = (lon + 180) / 360, ph = THREE.MathUtils.degToRad(lat);
  return new THREE.Vector3(-Math.cos(u * Math.PI * 2) * Math.cos(ph), Math.sin(ph), Math.sin(u * Math.PI * 2) * Math.cos(ph)).multiplyScalar(r);
}

export function crearTierra(_c, base) {
  const escena = new THREE.Scene();
  let avisar; const listo = new Promise(r => avisar = r);
  const gestor = new THREE.LoadingManager(() => avisar(), undefined, undefined); gestor.onError = () => avisar();
  const cargador = new THREE.TextureLoader(gestor);
  const tex = n => { const t = cargador.load(base + n); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const dia = tex('tierra_dia.jpg'), noche = tex('tierra_noche.jpg');
  const nubes = cargador.load(base + 'tierra_nubes.jpg'); nubes.anisotropy = 8;
  const cielo = new THREE.CubeTextureLoader(gestor).setPath(base).load(['cielo_px.jpg', 'cielo_nx.jpg', 'cielo_py.jpg', 'cielo_ny.jpg', 'cielo_pz.jpg', 'cielo_nz.jpg']);
  cielo.colorSpace = THREE.SRGBColorSpace;
  escena.background = cielo; escena.backgroundIntensity = .35;

  // el sol: subsolar al oeste, para que España esté recién anochecida y se vean sus luces
  const sol = punto(ALCALA.lon - 112, -12).normalize();

  const mat = new THREE.ShaderMaterial({
    uniforms: { dia: { value: dia }, noche: { value: noche }, nubes: { value: nubes }, sol: { value: sol }, tiempo: { value: 0 } },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      uniform sampler2D dia, noche, nubes; uniform vec3 sol; uniform float tiempo;
      varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
        float l = dot(n, sol);
        float diaK = smoothstep(-.12, .22, l);
        vec3 cDia = texture2D(dia, vUv).rgb;
        vec3 brc = texture2D(nubes, vUv + vec2(tiempo * .0006, 0.)).rgb;
        float nube = smoothstep(.15, .9, brc.b);
        vec3 cNoche = texture2D(noche, vUv).rgb;
        // luces de las ciudades, cálidas, solo en la cara nocturna
        vec3 luces = pow(cNoche, vec3(2.0)) * vec3(1.6, 1.15, .7) * 2.2 * (1. - diaK) * (1. - nube * .85);
        float agua = 1. - brc.g;
        vec3 h = normalize(sol + v);
        float brillo = pow(max(dot(n, h), 0.), 90.) * agua * .45 * diaK;
        vec3 col = cDia * max(l, 0.) * 2.2 + brillo * vec3(1., .9, .75);
        col = mix(col, vec3(1.) * max(l, 0.) * 2.0, nube * .85);
        // anillo del terminador: rojizo
        float term = exp(-pow((l - .02) / .07, 2.));
        col += vec3(1., .5, .25) * term * .05 * (1. - nube * .5) * (.5 + .5 * max(cDia.r, cDia.g));
        col += cDia * .025 * (1. - diaK) + vec3(.004, .006, .012) * (1. - diaK);
        col += luces;
        // atmósfera en el borde
        float fres = pow(1. - max(dot(n, v), 0.), 3.);
        col += mix(vec3(.05, .08, .2), vec3(.35, .6, 1.), smoothstep(-.2, .4, l)) * fres * (.35 + diaK);
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const tierra = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 120), mat);
  escena.add(tierra);

  const halo = new THREE.Mesh(new THREE.SphereGeometry(1.035, 96, 64), new THREE.ShaderMaterial({
    uniforms: { sol: { value: sol } }, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 sol; varying vec3 vN; varying vec3 vW;
      void main(){ vec3 v = normalize(cameraPosition - vW); float r = dot(normalize(vN), v);
        float k = pow(clamp(r + .45, 0., 1.), 5.) * 1.4;
        float l = dot(normalize(vW), sol);
        vec3 c = mix(vec3(.9,.4,.15), vec3(.35,.6,1.), smoothstep(-.2,.3,l)) * smoothstep(-.5, .1, l);
        gl_FragColor = vec4(c * k, k); }`,
  }));
  escena.add(halo);

  // destello de Alcalá
  const brillo = new THREE.Sprite(new THREE.SpriteMaterial({ map: destello(), color: 0xffd28a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  brillo.position.copy(punto(ALCALA.lon, ALCALA.lat, 1.004)); brillo.scale.setScalar(.02);
  escena.add(brillo);

  const camara = new THREE.PerspectiveCamera(32, 1, .001, 100);
  return { escena, camara, tierra, mat, brillo, sol, listo };
}

function destello() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.15, 'rgba(255,230,180,.8)'); r.addColorStop(.5, 'rgba(255,200,120,.15)'); r.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
