import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { prepararMano } from './mano.js';
const r=new THREE.WebGLRenderer({antialias:true});r.setSize(1200,600);document.body.appendChild(r.domElement);
r.toneMapping=THREE.ACESFilmicToneMapping;r.autoClear=false;
const s=new THREE.Scene();s.background=new THREE.Color(0x333333);
const c=new THREE.PerspectiveCamera(35,2,.01,10);c.position.set(0,0,.6);
s.add(new THREE.HemisphereLight(0xffffff,0x444444,2));const d=new THREE.DirectionalLight(0xffffff,2);d.position.set(1,2,2);s.add(d);
const L=new GLTFLoader();
L.load('/pasillo/modelos/right.glb',g=>{
 const ms=[];for(let i=0;i<3;i++){const m=i?THREE.SkeletonUtils?null:null:null;}
 const m=g.scene;s.add(m);m.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({color:0xf3f0e8,roughness:.9});});
 const box=new THREE.Box3().setFromObject(m);const ce=box.getCenter(new THREE.Vector3());m.position.sub(ce);
 const h=prepararMano(m, +(new URLSearchParams(location.search).get('s')||1));
 h.cerrar(+(new URLSearchParams(location.search).get('k')||1));
 m.rotation.y=+(new URLSearchParams(location.search).get('ry')||0);
 r.render(s,c);window.listo=1;});
