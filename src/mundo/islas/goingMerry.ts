// El Going Merry: la carabela que Kaya regala a la tripulación en Villa Syrup (cap. 41).
// Casco de madera clara con franja blanca, mascarón de oveja, un mástil con cofa y vela blanca
// con la Jolly Roger de los Sombrero de Paja, y camarote a popa. La proa mira hacia +Z.
import * as THREE from 'three';
import { malla } from './utilidades';
import { fusionarEstaticos, matTextura } from './arquitectura';
import { texturaMadera } from '../texturas';
import type { Actualizable } from '../../tipos';

const LARGO = 20;
const MANGA = 7;
const PUNTAL = 3.6;

/** Casco "lofteado": secciones en U a lo largo de Z, afiladas en la proa y redondeadas en la popa. */
function crearCasco(): THREE.Mesh {
  const secciones = 24;
  const puntos = 10;
  const posiciones: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let k = 0; k <= secciones; k++) {
    const t = k / secciones; // 0 = popa, 1 = proa
    const z = (t - 0.5) * LARGO;
    const anchoRel = t < 0.7 ? 0.82 + 0.18 * Math.sin((t / 0.7) * Math.PI * 0.5) : Math.cos(((t - 0.7) / 0.3) * Math.PI * 0.5) ** 0.8;
    const semiancho = (MANGA / 2) * Math.max(anchoRel, 0.02);
    const fondo = PUNTAL * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(t * 1.1, 1)));
    const arrufo = 0.8 * (2 * t - 1) ** 2; // la borda sube en proa y popa
    for (let j = 0; j <= puntos; j++) {
      const a = (j / puntos) * Math.PI; // de babor a estribor pasando por la quilla
      posiciones.push(-Math.cos(a) * semiancho, arrufo - Math.sin(a) * fondo, z);
      uvs.push(z / 1, j / 2);
    }
  }
  const fila = puntos + 1;
  for (let k = 0; k < secciones; k++) {
    for (let j = 0; j < puntos; j++) {
      const a = k * fila + j;
      indices.push(a, a + 1, a + fila, a + 1, a + fila + 1, a + fila);
    }
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometria.setIndex(indices);
  geometria.computeVertexNormals();
  return new THREE.Mesh(geometria, matTextura(texturaMadera(0xc49358), { side: THREE.DoubleSide }));
}

/** Mascarón de oveja: cabeza blanca con lana rizada, cara clara y cuernos en espiral. */
function crearOveja(): THREE.Group {
  const oveja = new THREE.Group();
  const lana = 0xf7f5ef;
  const cabeza = malla(new THREE.SphereGeometry(1.3, 14, 10), lana, { flatShading: false });
  oveja.add(cabeza);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const rizo = malla(new THREE.SphereGeometry(0.55, 10, 8), lana, { flatShading: false });
    rizo.position.set(Math.cos(a) * 1.2, Math.sin(a) * 1.2 + 0.2, -0.3);
    oveja.add(rizo);
  }
  const cara = malla(new THREE.SphereGeometry(0.75, 12, 10), 0xf1dcc0, { flatShading: false });
  cara.scale.set(1, 0.9, 1.1);
  cara.position.set(0, -0.15, 0.95);
  oveja.add(cara);
  for (const lado of [-1, 1]) {
    const ojo = malla(new THREE.SphereGeometry(0.12, 8, 6), 0x111111, { flatShading: false });
    ojo.position.set(lado * 0.3, 0.05, 1.65);
    const cuerno = malla(new THREE.TorusGeometry(0.45, 0.16, 6, 14, Math.PI * 1.6), 0xe8dcc0, { flatShading: false });
    cuerno.position.set(lado * 1.2, 0.3, 0.3);
    cuerno.rotation.y = lado * Math.PI / 2;
    oveja.add(ojo, cuerno);
  }
  return oveja;
}

/** Vela blanca con la Jolly Roger de los Sombrero de Paja (calavera con sombrero de paja). */
function crearVelaMugiwara(ancho: number, alto: number): THREE.Mesh {
  const lienzo = document.createElement('canvas');
  lienzo.width = 256;
  lienzo.height = 256;
  const ctx = lienzo.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f6f3ea';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#151515';
    // Tibias cruzadas
    ctx.save();
    ctx.translate(128, 150);
    for (const giro of [0.7, -0.7]) {
      ctx.save();
      ctx.rotate(giro);
      ctx.fillRect(-80, -8, 160, 16);
      ctx.beginPath();
      ctx.arc(-80, -8, 10, 0, Math.PI * 2);
      ctx.arc(-80, 8, 10, 0, Math.PI * 2);
      ctx.arc(80, -8, 10, 0, Math.PI * 2);
      ctx.arc(80, 8, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // Calavera
    ctx.beginPath();
    ctx.arc(128, 128, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(100, 150, 56, 36);
    ctx.fillStyle = '#f6f3ea';
    for (const x of [108, 148]) {
      ctx.beginPath();
      ctx.arc(x, 132, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    // Sombrero de paja con cinta roja
    ctx.fillStyle = '#e8c547';
    ctx.beginPath();
    ctx.ellipse(128, 92, 78, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(128, 80, 46, 28, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(82, 78, 92, 10);
  }
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  const geometria = new THREE.PlaneGeometry(ancho, alto, 10, 6);
  const p = geometria.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = (2 * p.getX(i)) / ancho;
    p.setZ(i, 1.1 * (1 - u * u));
  }
  geometria.computeVertexNormals();
  return new THREE.Mesh(geometria, new THREE.MeshLambertMaterial({ map: textura, side: THREE.DoubleSide }));
}

export function crearGoingMerry(): THREE.Group {
  const barco = new THREE.Group();
  const flotante = new THREE.Group();
  barco.add(flotante);

  flotante.add(crearCasco());
  // Franja blanca y regala
  const borda = malla(new THREE.TorusGeometry(1, 0.12, 4, 40), 0xf6f3ea);
  borda.scale.set(MANGA / 2, LARGO / 2 * 0.96, 1);
  borda.rotation.x = Math.PI / 2;
  borda.position.y = 0.15;
  flotante.add(borda);
  const cubierta = malla(new THREE.BoxGeometry(MANGA * 0.86, 0.2, LARGO * 0.8), 0xa8784a);
  cubierta.position.set(0, -0.1, -0.6);
  flotante.add(cubierta);

  // Barandilla blanca
  for (let z = -LARGO * 0.4; z <= LARGO * 0.3; z += 1.2) {
    for (const lado of [-1, 1]) {
      const balaustre = malla(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 5), 0xf6f3ea);
      balaustre.position.set(lado * MANGA * 0.43, 0.5, z);
      flotante.add(balaustre);
    }
  }

  // Camarote a popa con ventanas y cubierta superior
  const camarote = malla(new THREE.BoxGeometry(MANGA * 0.8, 2.4, 4.5), 0xb5864f);
  camarote.position.set(0, 1.1, -LARGO * 0.32);
  const techoCamarote = malla(new THREE.BoxGeometry(MANGA * 0.86, 0.25, 4.8), 0xf6f3ea);
  techoCamarote.position.set(0, 2.4, -LARGO * 0.32);
  flotante.add(camarote, techoCamarote);
  for (const x of [-1.4, 0, 1.4]) {
    const ventana = malla(new THREE.CircleGeometry(0.35, 12), 0x2d3f55);
    ventana.position.set(x, 1.2, -LARGO * 0.32 + 2.27);
    flotante.add(ventana);
  }

  // Mascarón
  const oveja = crearOveja();
  oveja.position.set(0, 1.6, LARGO / 2 + 0.6);
  flotante.add(oveja);

  // Mástil, cofa, verga, vela y banderín
  const mastil = malla(new THREE.CylinderGeometry(0.22, 0.3, 14, 8), 0x8a6a45, { flatShading: false });
  mastil.position.set(0, 7, 1);
  const cofa = malla(new THREE.CylinderGeometry(0.9, 0.7, 0.9, 10), 0x8a6a45);
  cofa.position.set(0, 12.5, 1);
  const verga = malla(new THREE.CylinderGeometry(0.12, 0.12, 9, 6), 0x8a6a45);
  verga.rotation.z = Math.PI / 2;
  verga.position.set(0, 10.6, 1.3);
  const vela = crearVelaMugiwara(8.5, 6.2);
  vela.position.set(0, 7.4, 1.4);
  flotante.add(mastil, cofa, verga, vela);
  const banderin = malla(new THREE.PlaneGeometry(1.6, 1), 0x151515, { side: THREE.DoubleSide });
  banderin.position.set(0.85, 14.3, 1);
  flotante.add(banderin);

  fusionarEstaticos(flotante);
  const actualizar: Actualizable = (t) => {
    flotante.position.y = 1.6 + Math.sin(t * 1.1) * 0.25; // calado: la borda queda sobre el agua
    flotante.rotation.z = Math.sin(t * 0.9) * 0.03;
    flotante.rotation.x = Math.sin(t * 0.7) * 0.015;
  };
  flotante.userData.actualizar = actualizar;
  return barco;
}
