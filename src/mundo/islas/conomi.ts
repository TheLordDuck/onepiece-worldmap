// Islas Conomi: la isla de Villa Cocoyasi (arco de Arlong Park, cap. 69–95).
// Distribución según docs/referencias/east-blue.md, de oeste a este por la costa sur:
//   Arlong Park (en la costa, con la piscina exterior abierta al mar)
//   → arrozales alrededor de la Puerta Este → Villa Cocoyasi (muelle, clínica, librería)
//   → casa de Bell-mère con el naranjal (loma en las afueras) → tumba en el acantilado
//   → ruinas de Gosa. Las montañas boscosas quedan al norte.
import * as THREE from 'three';
import { crearTerreno } from './terreno';
import { crearArlongPark, RECINTO } from './arlongPark';
import {
  crearArbol,
  crearBarquito,
  crearCamino,
  crearCartel,
  crearMuelle,
  crearPalmera,
  crearRoca,
  esparcir,
  malla,
  mirarHacia,
} from './utilidades';
import { crearTejado, geometriaCaja, matTextura } from './arquitectura';
import { texturaEstuco, texturaPiedra } from '../texturas';
import { sustituirPorModelo } from '../modelos';
import { crearRuido2D, fbm } from '../../utils/ruido';
import type { Aleatorio, AlturaEn, ConstructorIsla } from '../../tipos';

// Ejes: +X = este, +Z = sur (costa principal). Semiejes de la isla elíptica:
const SEMIEJE_X = 340;
const SEMIEJE_Z = 220;

const PARQUE = { x: -200, z: 165 };
const ARROZALES = { x0: -150, x1: -60, z0: 105, z1: 170 };
const COCOYASI = { x: 10, z: 168 };
const NARANJAL = { x: 75, z: 118 };
const TUMBA = { x: 112, z: 196 };
const GOSA = { x: 225, z: 100 };

/** [x, z, altura, anchura] de las cumbres del norte. */
const CUMBRES: Array<[number, number, number, number]> = [
  [-70, -95, 75, 85],
  [130, -70, 55, 75],
  [-230, -40, 35, 60],
];

interface Zona {
  x: number;
  z: number;
  radio: number;
  altura: number;
}

const ZONAS: Zona[] = [
  { ...COCOYASI, radio: 45, altura: 4.2 },
  { ...NARANJAL, radio: 42, altura: 10 },
  { ...GOSA, radio: 38, altura: 4 },
  { x: -105, z: 130, radio: 55, altura: 3.6 }, // arrozales
  { x: PARQUE.x + 70, z: PARQUE.z - 24, radio: 30, altura: 4 }, // explanada de la Puerta Este
];

function crearAlturaBase(): AlturaEn {
  const ruido = crearRuido2D(77);
  const plano = (d: number, radio: number) => 1 - THREE.MathUtils.smoothstep(d, radio * 0.6, radio);

  return (x, z) => {
    // Recinto de Arlong Park: el fondo marino queda bajo la plataforma y las piscinas
    if (x > PARQUE.x + RECINTO.x0 && x < PARQUE.x + RECINTO.x1 && z > PARQUE.z + RECINTO.z0 && z < PARQUE.z + RECINTO.z1) {
      return -4;
    }

    const angulo = Math.atan2(z / SEMIEJE_Z, x / SEMIEJE_X);
    const r = Math.hypot(x / SEMIEJE_X, z / SEMIEJE_Z);
    const borde = 1 + 0.09 * (ruido(Math.cos(angulo) * 3 + 20, Math.sin(angulo) * 3 + 20) - 0.5) * 2;
    const t = 1 - r / borde;
    if (t <= 0) return Math.max(1 + t * 160, -14);

    // Playa que sube a una llanura costera de ~4 m
    let h = 1 + Math.min(t * 14, 1) * 3.2;
    // Montañas boscosas al norte: dos cumbres principales más relieve de ruido
    const norte = THREE.MathUtils.smoothstep(-z, -60, 140);
    const relieve = fbm(ruido, x * 0.008 + 3, z * 0.008 + 7, 5);
    let montanas = norte * (15 + 70 * relieve * relieve);
    for (const [cx, cz, altura, ancho] of CUMBRES) {
      const d = Math.hypot(x - cx, z - cz);
      montanas += altura * Math.exp(-(d * d) / (2 * ancho * ancho));
    }
    h += montanas * Math.min(t * 3, 1);
    // Loma del naranjal
    const dn = Math.hypot(x - NARANJAL.x, z - NARANJAL.z);
    h += 7 * Math.exp(-(dn * dn) / (2 * 50 * 50));
    // Acantilado de la tumba: se levanta justo en la orilla
    const da = Math.hypot(x - TUMBA.x, z - (TUMBA.z - 8));
    h += 17 * Math.exp(-(da * da) / (2 * 32 * 32)) * Math.min(t * 40, 1);

    for (const zona of ZONAS) {
      h = THREE.MathUtils.lerp(h, zona.altura, plano(Math.hypot(x - zona.x, z - zona.z), zona.radio));
    }
    return h;
  };
}

// ---------------------------------------------------------------------------
// Piezas propias de la isla
// ---------------------------------------------------------------------------

/** [pared, tejado] de las casas de Cocoyasi, como en One Piece Fighting Path. */
const PALETAS_COCOYASI: Array<[number, number]> = [
  [0x4f74a8, 0x2f4a72],
  [0x6a5a9a, 0x3a6a4a],
  [0x4a6fa5, 0xa83a32],
  [0xc9963f, 0x2f4a72],
  [0x5d82b8, 0x3a6a4a],
  [0x7a6aa8, 0xa83a32],
];

/** Ventana rectangular con marco blanco. Mira hacia +Z. */
function crearVentanaMarco(ancho: number, alto: number): THREE.Group {
  const ventana = new THREE.Group();
  const marco = malla(new THREE.BoxGeometry(ancho + 0.25, alto + 0.25, 0.12), 0xf2efe6);
  const vidrio = malla(new THREE.BoxGeometry(ancho, alto, 0.14), 0x2d3f55);
  const cruz = malla(new THREE.BoxGeometry(0.08, alto, 0.16), 0xf2efe6);
  ventana.add(marco, vidrio, cruz);
  return ventana;
}

/**
 * Casa de Cocoyasi de dos plantas (referencia: One Piece Fighting Path): paredes azules, moradas u ocres,
 * tejadillo corrido entre plantas y tejado a cuatro aguas. La puerta mira hacia +Z.
 */
function crearCasaCocoyasi(aleatorio: Aleatorio, opciones: { ancho?: number; fondo?: number; paleta?: [number, number] } = {}): THREE.Group {
  const casa = new THREE.Group();
  const ancho = opciones.ancho ?? 7 + aleatorio() * 3;
  const fondo = opciones.fondo ?? 6 + aleatorio() * 2;
  const [pared, techo] = opciones.paleta ?? PALETAS_COCOYASI[Math.floor(aleatorio() * PALETAS_COCOYASI.length)];
  const planta = 3.2;
  const estuco = matTextura(texturaEstuco(pared));

  const zocalo = malla(new THREE.BoxGeometry(ancho + 0.6, 1.6, fondo + 0.6), 0x8d8378);
  zocalo.position.y = -0.4;
  const baja = new THREE.Mesh(geometriaCaja(ancho, planta, fondo), estuco);
  baja.position.y = 0.4 + planta / 2;
  const alta = new THREE.Mesh(geometriaCaja(ancho - 0.6, planta, fondo - 0.6), estuco);
  alta.position.y = 0.4 + planta * 1.5 + 0.3;
  casa.add(zocalo, baja, alta);

  const tejadillo = crearTejado({
    anchoBase: ancho + 1.6, fondoBase: fondo + 1.6, anchoCima: ancho - 0.4, fondoCima: fondo - 0.4,
    altura: 0.7, curva: 1, levante: 0, segmentos: 3, color: techo,
  });
  tejadillo.position.y = 0.4 + planta;
  const tejado = crearTejado({
    anchoBase: ancho + 1.2, fondoBase: fondo + 1.2, anchoCima: ancho * 0.4, fondoCima: 0.3,
    altura: 2.4, curva: 1, levante: 0.1, segmentos: 3, color: techo,
  });
  tejado.position.y = 0.7 + planta * 2;
  casa.add(tejadillo, tejado);

  const puerta = malla(new THREE.BoxGeometry(1.1, 2.2, 0.16), 0x5a3d28);
  puerta.position.set(0, 0.4 + 1.1, fondo / 2 + 0.06);
  casa.add(puerta);
  for (const x of [-ancho * 0.3, ancho * 0.3]) {
    const ventana = crearVentanaMarco(1, 1.1);
    ventana.position.set(x, 0.4 + planta * 0.55, fondo / 2 + 0.06);
    casa.add(ventana);
  }
  for (const x of [-ancho * 0.28, 0, ancho * 0.28]) {
    const ventana = crearVentanaMarco(0.9, 1);
    ventana.position.set(x, 0.7 + planta * 1.55, (fondo - 0.6) / 2 + 0.06);
    casa.add(ventana);
  }
  return casa;
}

/** Casa de Bell-mère: pequeña, paredes azul pálido con ventanales, tejado granate y chimenea. */
function crearCasaBellmere(): THREE.Group {
  const casa = new THREE.Group();
  const ancho = 8;
  const fondo = 6;
  const alto = 3.3;
  const zocalo = malla(new THREE.BoxGeometry(ancho + 0.4, 1.2, fondo + 0.4), 0x8d8378);
  zocalo.position.y = -0.3;
  const muros = new THREE.Mesh(geometriaCaja(ancho, alto, fondo), matTextura(texturaEstuco(0xbcd6e6)));
  muros.position.y = 0.3 + alto / 2;
  casa.add(zocalo, muros);
  // [x, z, giro, ventanales, largo de la fachada]
  const fachadas: Array<[number, number, number, number, number]> = [
    [0, fondo / 2, 0, 3, ancho],
    [0, -fondo / 2, Math.PI, 3, ancho],
    [ancho / 2, 0, Math.PI / 2, 2, fondo],
    [-ancho / 2, 0, -Math.PI / 2, 2, fondo],
  ];
  for (const [x, z, giro, n, largo] of fachadas) {
    for (let i = 0; i < n; i++) {
      const t = -largo / 2 + ((i + 0.5) * largo) / n;
      const ventanal = crearVentanaMarco(1.5, 1.8);
      ventanal.position.set(x + Math.cos(giro) * t, 0.3 + alto * 0.5, z - Math.sin(giro) * t);
      ventanal.rotation.y = giro;
      casa.add(ventanal);
    }
  }
  const tejado = crearTejado({
    anchoBase: ancho + 1.4, fondoBase: fondo + 1.4, anchoCima: ancho * 0.45, fondoCima: 0.3,
    altura: 2.6, curva: 1, levante: 0.15, segmentos: 3, color: 0x7a2a2e,
  });
  tejado.position.y = 0.3 + alto;
  const chimenea = malla(new THREE.BoxGeometry(0.7, 2.2, 0.7), 0x8a8a86);
  chimenea.position.set(ancho * 0.25, 0.3 + alto + 2, -0.8);
  casa.add(tejado, chimenea);
  return casa;
}

/** Mandarino: copa redonda verde oscura salpicada de mandarinas. */
function crearMandarino(aleatorio: Aleatorio): THREE.Group {
  const arbol = new THREE.Group();
  const tronco = malla(new THREE.CylinderGeometry(0.18, 0.26, 1.4, 6), 0x6b4a2e);
  tronco.position.y = 0.7;
  const radio = 1.2 + aleatorio() * 0.4;
  const copa = malla(new THREE.IcosahedronGeometry(radio, 1), 0x3f7f2f);
  copa.position.y = 1.4 + radio * 0.8;
  copa.scale.y = 0.85;
  arbol.add(tronco, copa);
  const fruta = new THREE.IcosahedronGeometry(0.16, 0);
  for (let i = 0; i < 12; i++) {
    const theta = aleatorio() * Math.PI * 2;
    const phi = Math.acos(1 - aleatorio() * 1.3);
    const mandarina = malla(fruta, 0xf08a1c);
    mandarina.position.set(
      Math.sin(phi) * Math.cos(theta) * radio,
      1.4 + radio * 0.8 + Math.cos(phi) * radio * 0.85,
      Math.sin(phi) * Math.sin(theta) * radio,
    );
    arbol.add(mandarina);
  }
  return arbol;
}

/** Arrozales en terrazas: parcelas inundadas separadas por caballones de tierra. */
function crearArrozales(grupo: THREE.Group, zona: { x0: number; x1: number; z0: number; z1: number }, alturaEn: AlturaEn, aleatorio: Aleatorio): void {
  const celda = 13;
  const tonos = [0x8fc7c9, 0x9fd0cc, 0x86b9a8, 0x9cc98a]; // agua clara con brotes de arroz
  for (let x = zona.x0; x < zona.x1; x += celda) {
    for (let z = zona.z0; z < zona.z1; z += celda) {
      const cx = x + celda / 2;
      const cz = z + celda / 2;
      const h = alturaEn(cx, cz);
      if (h < 3 || h > 4.4) continue;
      const parcela = malla(new THREE.BoxGeometry(celda - 1, 0.2, celda - 1), tonos[Math.floor(aleatorio() * tonos.length)]);
      parcela.position.set(cx, h + 0.1, cz);
      const caballonX = malla(new THREE.BoxGeometry(celda, 0.45, 1), 0x7a6a45);
      caballonX.position.set(cx, h + 0.15, z);
      const caballonZ = malla(new THREE.BoxGeometry(1, 0.45, celda), 0x7a6a45);
      caballonZ.position.set(x, h + 0.15, cz);
      grupo.add(parcela, caballonX, caballonZ);
    }
  }
}


/** Casa en ruinas de Gosa: muros rotos y ennegrecidos, tejado hundido y escombros. */
function crearRuina(aleatorio: Aleatorio): THREE.Group {
  const ruina = new THREE.Group();
  const ancho = 6 + aleatorio() * 3;
  const fondo = 5 + aleatorio() * 2;
  const tono = () => [0x6d655c, 0x57504a, 0x7a7067][Math.floor(aleatorio() * 3)];
  const muros: Array<[number, number, number, number]> = [
    [0, -fondo / 2, ancho, 0],
    [0, fondo / 2, ancho, 0],
    [-ancho / 2, 0, fondo, Math.PI / 2],
    [ancho / 2, 0, fondo, Math.PI / 2],
  ];
  for (const [x, z, largo, giro] of muros) {
    if (aleatorio() < 0.25) continue; // muro caído del todo
    const alto = 0.8 + aleatorio() * 2.6;
    const muro = malla(new THREE.BoxGeometry(largo * (0.4 + aleatorio() * 0.6), alto, 0.35), tono());
    muro.position.set(x, alto / 2, z);
    muro.rotation.y = giro;
    ruina.add(muro);
  }
  const tejado = malla(new THREE.BoxGeometry(ancho * 0.8, 0.2, fondo * 0.7), 0x4a3a2c);
  tejado.position.set(0, 0.6, 0);
  tejado.rotation.set(0.35 * (aleatorio() - 0.5), aleatorio(), 0.5 * (aleatorio() - 0.5) + 0.3);
  ruina.add(tejado);
  for (let i = 0; i < 6; i++) {
    const escombro = crearRoca(aleatorio);
    escombro.scale.multiplyScalar(0.35);
    escombro.position.set((aleatorio() - 0.5) * ancho, 0.1, (aleatorio() - 0.5) * fondo);
    ruina.add(escombro);
  }
  return ruina;
}

/** La tumba de Bell-mère (referencia: One Piece Fighting Path): cruz de tablones sobre un montón de piedras, con una mandarina. */
function crearTumba(aleatorio: Aleatorio): THREE.Group {
  const tumba = new THREE.Group();
  const madera = 0x6e4e30;
  const vertical = malla(new THREE.BoxGeometry(0.28, 2.8, 0.22), madera);
  vertical.position.y = 1.6;
  const horizontal = malla(new THREE.BoxGeometry(1.7, 0.26, 0.22), madera);
  horizontal.position.y = 2.3;
  tumba.add(vertical, horizontal);
  for (let i = 0; i < 9; i++) {
    const piedra = crearRoca(aleatorio);
    piedra.scale.multiplyScalar(0.28);
    const angulo = (i / 9) * Math.PI * 2;
    piedra.position.set(Math.cos(angulo) * 0.7, 0.15 + (i % 3) * 0.12, Math.sin(angulo) * 0.7);
    tumba.add(piedra);
  }
  const mandarina = malla(new THREE.IcosahedronGeometry(0.17, 1), 0xf08a1c);
  mandarina.position.set(0.35, 0.55, 0.45);
  tumba.add(mandarina);
  return tumba;
}

// ---------------------------------------------------------------------------
// La isla
// ---------------------------------------------------------------------------

export const construirConomi: ConstructorIsla = (aleatorio) => {
  const grupo = new THREE.Group();
  const terreno = crearTerreno({
    radio: SEMIEJE_X,
    altura: 150, // solo para el color: la roca aparece por pendiente, no por altura
    semilla: 77,
    resolucion: 180,
    lado: SEMIEJE_X * 2.5,
    alturaBase: crearAlturaBase(),
  });
  grupo.add(terreno.malla);
  const suelo = terreno.alturaEn;
  const sobre = <T extends THREE.Object3D>(objeto: T, x: number, z: number, hundir = 0): T => {
    objeto.position.set(x, suelo(x, z) - hundir, z);
    grupo.add(objeto);
    return objeto;
  };

  // --- Arlong Park ---
  const parque = crearArlongPark(aleatorio);
  parque.grupo.position.set(PARQUE.x, 0, PARQUE.z);
  grupo.add(parque.grupo);
  // Si se descarga el modelo original de Sketchfab a public/modelos/arlong-park.glb, sustituye al procedural
  sustituirPorModelo(parque.grupo, { url: '/modelos/arlong-park.glb', ancho: RECINTO.x1 - RECINTO.x0, yBase: -4 });

  // --- Arrozales alrededor de la Puerta Este ---
  crearArrozales(grupo, ARROZALES, suelo, aleatorio);

  // --- Caminos: Puerta Este → arrozales → Cocoyasi → naranjal, y Cocoyasi → Gosa ---
  const puertaEste: [number, number] = [PARQUE.x + RECINTO.x1 + 3, PARQUE.z - 24];
  crearCamino(grupo, [puertaEste, [-110, 140], [-50, 160], [COCOYASI.x - 20, COCOYASI.z]], 3.5, suelo);
  crearCamino(grupo, [[COCOYASI.x + 15, COCOYASI.z - 15], [45, 140], [NARANJAL.x - 12, NARANJAL.z + 12]], 2.5, suelo);
  crearCamino(grupo, [[COCOYASI.x + 25, COCOYASI.z], [120, 160], [GOSA.x - 20, GOSA.z + 10]], 3, suelo);

  // --- Villa Cocoyasi: una calle de tierra sube recta desde el muelle, con casas a ambos lados ---
  const plaza = COCOYASI;
  let zOrilla = plaza.z;
  while (suelo(plaza.x, zOrilla) > 1.6 && zOrilla < plaza.z + 120) zOrilla += 1;
  crearCamino(grupo, [[plaza.x, zOrilla - 3], [plaza.x, plaza.z - 42]], 5, suelo);
  for (let k = 0; k < 5; k++) {
    const z = plaza.z - 30 + k * 12;
    for (const lado of [-1, 1]) {
      const x = plaza.x + lado * 11;
      let casa: THREE.Group;
      if (lado < 0 && k === 2) {
        // Clínica del Dr. Nako
        casa = crearCasaCocoyasi(aleatorio, { ancho: 9, fondo: 7, paleta: [0xf2efe6, 0xa83a32] });
        const cartel = crearCartel('+ CLINIC', { ancho: 3.6, alto: 0.9, fondo: '#ffffff', color: '#c0392b' });
        cartel.position.set(0, 3.25, 3.6);
        casa.add(cartel);
      } else if (lado > 0 && k === 1) {
        // Librería (de donde Nami robaba libros)
        casa = crearCasaCocoyasi(aleatorio, { ancho: 8, fondo: 6.5 });
        const cartel = crearCartel('BOOKS', { ancho: 3, alto: 0.8, fondo: '#5a3520', color: '#f6d77a' });
        cartel.position.set(0, 3.25, 3.35);
        casa.add(cartel);
      } else {
        casa = crearCasaCocoyasi(aleatorio);
      }
      sobre(casa, x, z);
      mirarHacia(casa, plaza.x, z);
    }
  }

  // Pozo junto a la calle
  const pozo = sobre(new THREE.Group(), plaza.x + 5.5, plaza.z - 12);
  const brocal = malla(new THREE.CylinderGeometry(1.2, 1.2, 1, 10, 1, true), 0x9a9088, { side: THREE.DoubleSide });
  brocal.position.y = 0.5;
  const tejadillo = malla(new THREE.ConeGeometry(1.6, 1, 4), 0x7a5634);
  tejadillo.position.y = 3;
  tejadillo.rotation.y = Math.PI / 4;
  for (const s of [-1, 1]) {
    const poste = malla(new THREE.BoxGeometry(0.15, 2.5, 0.15), 0x6b4a2e);
    poste.position.set(s * 1.1, 1.25, 0);
    pozo.add(poste);
  }
  pozo.add(brocal, tejadillo);

  // Muelle de madera con barandilla de aspas, entre dos grupos de rocas rojizas
  const muelle = crearMuelle(26, 7);
  muelle.position.set(plaza.x, 0, zOrilla - 5);
  for (const lado of [-1, 1]) {
    for (let z = 1; z < 26; z += 3.25) {
      const poste = malla(new THREE.BoxGeometry(0.2, 1.3, 0.2), 0x6b4a2e);
      poste.position.set(lado * 3.3, 3, z);
      const aspaA = malla(new THREE.BoxGeometry(0.12, 0.12, 3.6), 0x7a5634);
      aspaA.position.set(lado * 3.3, 3, z + 1.6);
      aspaA.rotation.x = 0.34;
      const aspaB = aspaA.clone();
      aspaB.rotation.x = -0.34;
      const pasamanos = malla(new THREE.BoxGeometry(0.16, 0.16, 3.3), 0x7a5634);
      pasamanos.position.set(lado * 3.3, 3.65, z + 1.6);
      muelle.add(poste, aspaA, aspaB, pasamanos);
    }
  }
  grupo.add(muelle);
  const rocaRojiza = matTextura(texturaPiedra(0x9b5b3e));
  for (const lado of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const roca = crearRoca(aleatorio);
      roca.material = rocaRojiza;
      roca.scale.multiplyScalar(1.6 + aleatorio() * 1.6);
      const x = plaza.x + lado * (7 + aleatorio() * 9);
      const z = zOrilla - 8 + aleatorio() * 10;
      roca.position.set(x, Math.max(suelo(x, z), 0) + 0.8, z);
      grupo.add(roca);
    }
  }
  for (const [dx, dz, color] of [[6, 14, 0xb5553a], [-6, 22, 0x4f7f5a]] as const) {
    const barca = crearBarquito(color);
    barca.position.set(plaza.x + dx, 0, zOrilla + dz);
    grupo.add(barca);
  }

  // --- Casa de Bell-mère y el naranjal en hileras de setos, con un camino alrededor ---
  const casaBellmere = sobre(crearCasaBellmere(), NARANJAL.x - 4, NARANJAL.z - 14);
  casaBellmere.rotation.y = 0.15;
  for (let fila = 0; fila < 5; fila++) {
    const z = NARANJAL.z - 3 + fila * 5.5;
    for (let x = NARANJAL.x - 17; x <= NARANJAL.x + 17; x += 2.1) {
      const mandarino = sobre(crearMandarino(aleatorio), x + (aleatorio() - 0.5) * 0.6, z, 0.1);
      mandarino.scale.set(1.15, 1, 1.15);
    }
  }
  const anillo: Array<[number, number]> = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    anillo.push([NARANJAL.x + Math.cos(a) * 27, NARANJAL.z + 5 + Math.sin(a) * 22]);
  }
  crearCamino(grupo, anillo, 3, suelo);

  // --- La tumba de Bell-mère, en lo alto del acantilado mirando al mar, junto a una palmera ---
  sobre(crearTumba(aleatorio), TUMBA.x, TUMBA.z - 10);
  sobre(crearPalmera(aleatorio), TUMBA.x + 4.5, TUMBA.z - 11);

  // --- Ruinas de Gosa ---
  for (let i = 0; i < 9; i++) {
    const angulo = (i / 9) * Math.PI * 2 + aleatorio() * 0.4;
    const r = 8 + aleatorio() * 18;
    const ruina = sobre(crearRuina(aleatorio), GOSA.x + Math.cos(angulo) * r, GOSA.z + Math.sin(angulo) * r);
    ruina.rotation.y = aleatorio() * Math.PI;
  }

  // --- Vegetación: palmeras en la costa y en el pueblo, bosque en las montañas del norte ---
  const lejosDe = (x: number, z: number, puntos: Array<{ x: number; z: number }>, margen: number) =>
    puntos.every((p) => Math.hypot(x - p.x, z - p.z) > margen);
  const zonasLibres = [COCOYASI, NARANJAL, GOSA, { x: PARQUE.x, z: PARQUE.z }, { x: -105, z: 138 }];
  esparcir({
    grupo, alturaEn: suelo, aleatorio, radio: 400, cantidad: 90, crear: crearPalmera,
    condicion: (h, x, z) => h > 1.3 && h < 3.2 && lejosDe(x, z, zonasLibres.slice(1), 45),
  });
  for (let i = 0; i < 14; i++) {
    const angulo = aleatorio() * Math.PI * 2;
    const r = 34 + aleatorio() * 14;
    sobre(crearPalmera(aleatorio), COCOYASI.x + Math.cos(angulo) * r, COCOYASI.z + Math.sin(angulo) * r);
  }
  esparcir({
    grupo, alturaEn: suelo, aleatorio, radio: 360, cantidad: 420, crear: crearArbol,
    condicion: (h, x, z) => h > 7 && h < 110 && z < 90 && lejosDe(x, z, zonasLibres, 50),
  });

  const alturaEn: AlturaEn = (x, z) => Math.max(suelo(x, z), parque.alturaEn(x - PARQUE.x, z - PARQUE.z));

  return {
    grupo,
    alturaEn,
    radio: 330,
    alturaEtiqueta: 110,
    lugares: [
      { nombre: 'Arlong Park', posicion: [PARQUE.x, 62, PARQUE.z] },
      { nombre: 'Arrozales', posicion: [-105, 14, 138] },
      { nombre: 'Villa Cocoyasi', posicion: [COCOYASI.x, 22, COCOYASI.z] },
      { nombre: 'Naranjal de Bell-mère', posicion: [NARANJAL.x, 26, NARANJAL.z] },
      { nombre: 'Tumba de Bell-mère', posicion: [TUMBA.x, 32, TUMBA.z - 10] },
      { nombre: 'Ruinas de Gosa', posicion: [GOSA.x, 16, GOSA.z] },
    ],
  };
};
