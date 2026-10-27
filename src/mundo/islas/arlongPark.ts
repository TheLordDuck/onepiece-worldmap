// Arlong Park según One Piece Fighting Path (juego oficial; captura en docs/referencias/east-blue.md) y la wiki:
// torre-pagoda amarilla de 5 pisos con tejados rojos y soportal de arcos, el cartel "ARLONG PARK" en la torre,
// la Jolly Roger arriba, un canal recto que entra desde el mar entre dos moles de roca con emblemas y
// compuertas de acero, dos glorietas rojas a los lados del canal, muralla gris con barandilla
// y la Puerta Este hacia los arrozales.
import * as THREE from 'three';
import { crearCartel, crearRoca, malla } from './utilidades';
import {
  colocarVentanas,
  crearBarandillaRect,
  crearGlorieta,
  crearPuertaArco,
  crearTejado,
  fusionarEstaticos,
  geometriaCaja,
  matTextura,
} from './arquitectura';
import { texturaEstuco, texturaPiedra } from '../texturas';
import type { Aleatorio, AlturaEn } from '../../tipos';

// Ejes locales: +X = este (hacia la isla), +Z = sur (hacia el mar abierto)
export const PLAZA = 4;
const MURO_ALTO = 8.5;
const FONDO = -4;
const GROSOR = 3;
/** Contorno exterior del recinto (sin contar las moles de roca de la entrada). */
export const RECINTO = { x0: -45, x1: 45, z0: -35, z1: 35 };
const INTERIOR = { x0: RECINTO.x0 + GROSOR, x1: RECINTO.x1 - GROSOR, z0: RECINTO.z0 + GROSOR, z1: RECINTO.z1 - GROSOR };
/** Moles de roca a ambos lados de la bocana del canal, por fuera de la muralla sur. */
export const ROCAS = { z0: RECINTO.z1, z1: RECINTO.z1 + 12, alto: 6 };

const HORMIGON = 0xa9a8a2;
const HORMIGON_OSCURO = 0x84837d;
const AMARILLO = 0xe7c14a;
const TEJA_ROJA = 0xb3302a;
const ROCA_ROJIZA = 0x9b5b3e;
const ACERO = 0x4a4f55;
const BARANDA = 0x6e2a22;

/** Canal central: la "piscina exterior conectada al mar" de la wiki. */
const CANAL = { x0: -8, x1: 8, z0: -3, z1: INTERIOR.z1 };
const enCanal = (x: number, z: number) => x > CANAL.x0 && x < CANAL.x1 && z > CANAL.z0 && z < CANAL.z1;
/** Puerta Este: única entrada desde la isla. */
const PUERTA_ESTE_Z = -22;
const TORRE = { x: 0, z: -19 };

const PISOS: Array<{
  ancho: number;
  fondo: number;
  alto: number;
  porLado: [number, number];
  ventana: { ancho: number; alto: number };
  vuelo: number;
  alturaTejado: number;
}> = [
  { ancho: 26, fondo: 18, alto: 8, porLado: [0, 5], ventana: { ancho: 1.5, alto: 2.8 }, vuelo: 3.5, alturaTejado: 3.6 },
  { ancho: 19, fondo: 13, alto: 6, porLado: [7, 5], ventana: { ancho: 1.1, alto: 2.2 }, vuelo: 3, alturaTejado: 3 },
  { ancho: 14, fondo: 10, alto: 5.5, porLado: [5, 4], ventana: { ancho: 0.95, alto: 1.9 }, vuelo: 2.5, alturaTejado: 2.6 },
  { ancho: 10, fondo: 7.5, alto: 4.5, porLado: [5, 3], ventana: { ancho: 0.8, alto: 1.6 }, vuelo: 2, alturaTejado: 2.2 },
  { ancho: 6.5, fondo: 5, alto: 3.5, porLado: [3, 2], ventana: { ancho: 0.7, alto: 1.4 }, vuelo: 1.7, alturaTejado: 3.2 },
];

function crearJollyRoger(): THREE.Group {
  const bandera = new THREE.Group();
  const asta = malla(new THREE.CylinderGeometry(0.08, 0.08, 6, 6), 0x3a3a3a);
  asta.position.y = 3;
  // Jolly Roger de los piratas de Arlong (simplificada): mandíbula de tiburón sobre fondo negro
  const lienzo = document.createElement('canvas');
  lienzo.width = 256;
  lienzo.height = 160;
  const ctx = lienzo.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = '#f4f1e8';
    ctx.beginPath();
    ctx.ellipse(128, 80, 70, 52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(128, 92, 52, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4f1e8';
    for (let i = 0; i < 9; i++) {
      const x = 82 + i * 11.5;
      ctx.beginPath();
      ctx.moveTo(x, 70);
      ctx.lineTo(x + 5.5, 86);
      ctx.lineTo(x + 11, 70);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, 116);
      ctx.lineTo(x + 5.5, 100);
      ctx.lineTo(x + 11, 116);
      ctx.fill();
    }
  }
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  const tela = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2), new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide }));
  tela.position.set(1.65, 5, 0);
  bandera.add(asta, tela);
  return bandera;
}

/** Placa con el emblema en espiral de las moles de roca de la entrada. */
function crearEmblema(): THREE.Mesh {
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 128;
  const ctx = lienzo.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#d8d4c8';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 112, 112);
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.1) {
      const r = 4 + a * 3.2;
      const x = 64 + Math.cos(a) * r;
      const y = 64 + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshLambertMaterial({ map: textura }));
}

/** Fachada de soportal: muro con una fila de arcos abiertos. Mira hacia +Z. */
function crearSoportal(ancho: number, alto: number, arcos: number): THREE.Group {
  const soportal = new THREE.Group();
  const forma = new THREE.Shape();
  forma.moveTo(-ancho / 2, 0);
  forma.lineTo(ancho / 2, 0);
  forma.lineTo(ancho / 2, alto);
  forma.lineTo(-ancho / 2, alto);
  forma.closePath();
  const paso = ancho / arcos;
  const luz = paso * 0.68;
  for (let i = 0; i < arcos; i++) {
    const cx = -ancho / 2 + (i + 0.5) * paso;
    const hueco = new THREE.Path();
    const yArco = alto * 0.72 - luz / 2;
    hueco.moveTo(cx - luz / 2, 0.01);
    hueco.lineTo(cx + luz / 2, 0.01);
    hueco.lineTo(cx + luz / 2, yArco);
    hueco.absarc(cx, yArco, luz / 2, 0, Math.PI, false);
    hueco.lineTo(cx - luz / 2, 0.01);
    forma.holes.push(hueco);
  }
  const geometria = new THREE.ExtrudeGeometry(forma, { depth: 0.9, bevelEnabled: false, curveSegments: 10 });
  const uv = geometria.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4, uv.getY(i) / 4);
  soportal.add(new THREE.Mesh(geometria, matTextura(texturaEstuco(AMARILLO))));
  const cornisa = malla(new THREE.BoxGeometry(ancho + 0.4, 0.4, 1.4), 0xf2efe6);
  cornisa.position.set(0, alto + 0.2, 0.45);
  soportal.add(cornisa);
  return soportal;
}

/** La torre-pagoda: 5 pisos de estuco amarillo, tejados rojos con aleros curvos y balcones. */
function crearTorre(aleatorio: Aleatorio): THREE.Group {
  const torre = new THREE.Group();
  const estuco = matTextura(texturaEstuco(AMARILLO));
  let y = 0;

  PISOS.forEach((piso, i) => {
    const siguiente = PISOS[i + 1];
    const cuerpo = new THREE.Mesh(geometriaCaja(piso.ancho, piso.alto, piso.fondo), estuco);
    cuerpo.position.y = y + piso.alto / 2;
    const franja = malla(new THREE.BoxGeometry(piso.ancho + 0.4, 0.35, piso.fondo + 0.4), 0xf2efe6);
    franja.position.y = y + piso.alto - 0.17;
    torre.add(cuerpo, franja);

    colocarVentanas(torre, {
      ancho: piso.ancho,
      fondo: piso.fondo,
      y: y + piso.alto * 0.28,
      porLado: piso.porLado,
      ventana: piso.ventana,
      coloresVidrio: [0x3d5a80, 0x4a6890],
      aleatorio,
      // En el 3.er piso, el centro de la fachada lo ocupa el cartel
      saltar: (lado, indice) => i === 2 && lado === 'frente' && indice >= 1 && indice <= 3,
    });

    const tejado = crearTejado({
      anchoBase: piso.ancho + piso.vuelo * 2,
      fondoBase: piso.fondo + piso.vuelo * 2,
      anchoCima: siguiente ? siguiente.ancho + 0.6 : 0.4,
      fondoCima: siguiente ? siguiente.fondo + 0.6 : 0.4,
      altura: piso.alturaTejado,
      levante: piso.vuelo * 0.3,
      color: TEJA_ROJA,
    });
    tejado.position.y = y + piso.alto;
    torre.add(tejado);
    y += piso.alto + piso.alturaTejado;

    if (siguiente) {
      const suelo = malla(new THREE.BoxGeometry(siguiente.ancho + 2.2, 0.3, siguiente.fondo + 2.2), 0xf2efe6);
      suelo.position.y = y;
      const barandilla = crearBarandillaRect(siguiente.ancho + 2, siguiente.fondo + 2, 1, 0.45, 0x3a2a20);
      barandilla.position.y = y + 0.15;
      torre.add(suelo, barandilla);
    }
  });

  // Cartel en el tercer piso, mirando al canal
  const yTercero = PISOS[0].alto + PISOS[0].alturaTejado + PISOS[1].alto + PISOS[1].alturaTejado;
  const cartel = crearCartel('ARLONG PARK', { ancho: 7, alto: 1.5, fondo: '#f2efe6', color: '#2a2a2a' });
  cartel.position.set(0, yTercero + PISOS[2].alto * 0.55, PISOS[2].fondo / 2 + 0.06);
  torre.add(cartel);

  const jollyRoger = crearJollyRoger();
  jollyRoger.position.y = y - 0.3;
  torre.add(jollyRoger);

  // Soportal de arcos en la planta baja y puerta de la torre detrás
  const soportal = crearSoportal(PISOS[0].ancho - 2, 6, 5);
  soportal.position.set(0, 0, PISOS[0].fondo / 2 + 2.2);
  const techoSoportal = malla(new THREE.BoxGeometry(PISOS[0].ancho - 1.6, 0.4, 3), 0xf2efe6);
  techoSoportal.position.set(0, 6.2, PISOS[0].fondo / 2 + 1.5);
  const puerta = crearPuertaArco(3.2, 4.6);
  puerta.position.set(0, 0, PISOS[0].fondo / 2);
  torre.add(soportal, techoSoportal, puerta);
  return torre;
}

function crearRecinto(aleatorio: Aleatorio): THREE.Group {
  const recinto = new THREE.Group();
  const hormigon = matTextura(texturaEstuco(HORMIGON));
  const hormigonOscuro = matTextura(texturaEstuco(HORMIGON_OSCURO));
  const roca = matTextura(texturaPiedra(ROCA_ROJIZA));

  const caja = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, material: THREE.Material) => {
    const bloque = new THREE.Mesh(geometriaCaja(x1 - x0, y1 - y0, z1 - z0), material);
    bloque.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    recinto.add(bloque);
  };

  // Plaza: tres bloques alrededor del canal
  const { x0, x1, z0, z1 } = INTERIOR;
  for (const [a, b, c, d] of [
    [x0, CANAL.x0, z0, z1],
    [CANAL.x1, x1, z0, z1],
    [CANAL.x0, CANAL.x1, z0, CANAL.z0],
  ]) {
    caja(a, b, FONDO, PLAZA - 0.3, c, d, hormigonOscuro);
    caja(a, b, PLAZA - 0.3, PLAZA, c, d, hormigon);
  }
  // Bordillos del canal
  caja(CANAL.x0 - 0.5, CANAL.x0, PLAZA, PLAZA + 0.35, CANAL.z0 - 0.5, CANAL.z1, hormigon);
  caja(CANAL.x1, CANAL.x1 + 0.5, PLAZA, PLAZA + 0.35, CANAL.z0 - 0.5, CANAL.z1, hormigon);
  caja(CANAL.x0, CANAL.x1, PLAZA, PLAZA + 0.35, CANAL.z0 - 0.5, CANAL.z0, hormigon);

  // Muralla; la sur se abre para el canal, con dintel
  const r = RECINTO;
  caja(r.x0, r.x1, FONDO, MURO_ALTO, r.z0, r.z0 + GROSOR, hormigon);
  caja(r.x0, r.x0 + GROSOR, FONDO, MURO_ALTO, r.z0 + GROSOR, r.z1 - GROSOR, hormigon);
  caja(r.x1 - GROSOR, r.x1, FONDO, MURO_ALTO, r.z0 + GROSOR, r.z1 - GROSOR, hormigon);
  caja(r.x0, CANAL.x0, FONDO, MURO_ALTO, r.z1 - GROSOR, r.z1, hormigon);
  caja(CANAL.x1, r.x1, FONDO, MURO_ALTO, r.z1 - GROSOR, r.z1, hormigon);
  caja(CANAL.x0, CANAL.x1, MURO_ALTO - 1.8, MURO_ALTO, r.z1 - GROSOR, r.z1, hormigon);

  const barandilla = crearBarandillaRect(r.x1 - r.x0 - 0.4, r.z1 - r.z0 - 0.4, 1.1, 0.5, BARANDA);
  barandilla.position.y = MURO_ALTO;
  recinto.add(barandilla);

  // Compuertas de acero en la bocana
  const mitad = (CANAL.x0 + CANAL.x1) / 2;
  const alto = MURO_ALTO - 1.8 - FONDO;
  for (const [a, b] of [[CANAL.x0, mitad], [mitad, CANAL.x1]]) {
    const z = r.z1 - GROSOR / 2;
    for (const y of [FONDO + 0.3, PLAZA + 1.2, MURO_ALTO - 2.1]) {
      const travesano = malla(new THREE.BoxGeometry(b - a, 0.35, 0.4), ACERO);
      travesano.position.set((a + b) / 2, y, z);
      recinto.add(travesano);
    }
    for (let x = a + 0.25; x < b; x += 0.7) {
      const barrote = malla(new THREE.BoxGeometry(0.18, alto, 0.18), ACERO);
      barrote.position.set(x, FONDO + alto / 2, z);
      recinto.add(barrote);
    }
  }
  // Ruedas del mecanismo de las compuertas
  for (const lado of [-1, 1]) {
    const rueda = malla(new THREE.TorusGeometry(1.1, 0.18, 6, 16), ACERO, { flatShading: false });
    rueda.position.set(lado * (CANAL.x1 + 1.2), PLAZA + 1.4, r.z1 + 0.3);
    recinto.add(rueda);
  }

  // Moles de roca rojiza a ambos lados de la bocana, con sus emblemas
  for (const lado of [-1, 1]) {
    const xa = lado < 0 ? r.x0 : CANAL.x1 + 1;
    const xb = lado < 0 ? CANAL.x0 - 1 : r.x1;
    caja(xa, xb, FONDO, ROCAS.alto, ROCAS.z0, ROCAS.z1, roca);
    for (let i = 0; i < 9; i++) {
      const bloque = crearRoca(aleatorio);
      bloque.material = roca;
      bloque.scale.multiplyScalar(2.2 + aleatorio() * 1.5);
      bloque.position.set(xa + aleatorio() * (xb - xa), ROCAS.alto - 0.5 + aleatorio() * 1.5, ROCAS.z0 + aleatorio() * (ROCAS.z1 - ROCAS.z0));
      recinto.add(bloque);
    }
    const emblema = crearEmblema();
    emblema.position.set(lado * 20, ROCAS.alto - 3, ROCAS.z1 + 0.05);
    recinto.add(emblema);
  }

  // Puerta Este, por dentro y por fuera
  const puertaDentro = crearPuertaArco(3.4, 3.8);
  puertaDentro.position.set(r.x1 - GROSOR, PLAZA, PUERTA_ESTE_Z);
  puertaDentro.rotation.y = -Math.PI / 2;
  const puertaFuera = crearPuertaArco(3.4, 3.8);
  puertaFuera.position.set(r.x1, PLAZA, PUERTA_ESTE_Z);
  puertaFuera.rotation.y = Math.PI / 2;
  recinto.add(puertaDentro, puertaFuera);
  return recinto;
}

/** Construye el parque completo. Devuelve el grupo y su altura de suelo (coordenadas locales). */
export function crearArlongPark(aleatorio: Aleatorio): { grupo: THREE.Group; alturaEn: AlturaEn } {
  const grupo = new THREE.Group();
  grupo.add(crearRecinto(aleatorio));

  const torre = crearTorre(aleatorio);
  torre.position.set(TORRE.x, PLAZA, TORRE.z);
  grupo.add(torre);

  for (const lado of [-1, 1]) {
    const glorieta = crearGlorieta(4, true);
    glorieta.position.set(lado * 17, PLAZA, 16);
    grupo.add(glorieta);
  }

  fusionarEstaticos(grupo);
  grupo.userData.aislado = true; // ya fusionado; así puede sustituirse por un .glb

  const alturaEn: AlturaEn = (x, z) => {
    if (x < RECINTO.x0 || x > RECINTO.x1 || z < RECINTO.z0) return -Infinity;
    if (z > RECINTO.z1) {
      const enRoca = z < ROCAS.z1 && (x < CANAL.x0 - 1 || x > CANAL.x1 + 1);
      return enRoca ? ROCAS.alto + 1 : -Infinity;
    }
    if (x < INTERIOR.x0 || x > INTERIOR.x1 || z < INTERIOR.z0 || z > INTERIOR.z1) return MURO_ALTO + 1.4;
    return enCanal(x, z) ? -Infinity : PLAZA;
  };
  return { grupo, alturaEn };
}
