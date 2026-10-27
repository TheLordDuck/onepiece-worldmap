// Isla Dawn (Reino de Goa) — cap. 1 y flashback de los cap. 582–590. Según docs/referencias/east-blue.md:
//   · Villa Foosha: puerto rural con casas de madera, muelles y molinos, AL ESTE de la capital y AL SUR del monte Colubo
//     (algo apartada de su base). Partys Bar de Makino, la pescadería UO, la carnicería Buffalo Meat. Vacas en las afueras.
//   · Monte Colubo: montaña baja y muy boscosa detrás del pueblo; casa de la familia Dadan y la casa del árbol.
//   · Gray Terminal: vertedero gigante AL NORTE del monte, junto a la Gran Puerta de la capital.
//   · Capital de Goa: ciudad amurallada rodeada de montañas bajas boscosas; Ciudad Alta y palacio en el centro.
// Estilo de Foosha según Fruit Seas: molinos blancos de cúpula roja y casas claras de entramado.
import * as THREE from 'three';
import { aplanarZonas, alturaCostera, campana, crearCosta, crearTerreno } from './terreno';
import {
  crearArbol,
  crearBarquito,
  crearCamino,
  crearCartel,
  crearMolino,
  crearMuelle,
  crearPalmera,
  crearRoca,
  esparcir,
  malla,
  mirarHacia,
} from './utilidades';
import { crearCasaEntramado, crearEdificioCiudad, crearTejadoDosAguas, crearValla, crearVaca } from './edificios';
import { crearPuertaArco, crearTejado, geometriaCaja, matTextura } from './arquitectura';
import { texturaMadera, texturaPiedra } from '../texturas';
import { crearRuido2D, fbm } from '../../utils/ruido';
import type { Aleatorio, AlturaEn, ConstructorIsla } from '../../tipos';

// Ejes: +X = este, +Z = sur
const SEMIEJE_X = 330;
const SEMIEJE_Z = 250;
const FOOSHA = { x: 120, z: 168 };
const PASTOS = { x: 40, z: 175 };
const COLUBO = { x: 30, z: -30 };
const DADAN = { x: 15, z: 45 };
const ARBOL = { x: -25, z: 10 };
const GRAY = { x: 30, z: -175 };
const CAPITAL = { x: -190, z: -85 };
const RADIO_MURALLA = 72;

/** Punto de la muralla de Goa que mira hacia el Gray Terminal: ahí está la Gran Puerta. */
const ANGULO_PUERTA = Math.atan2(GRAY.z - CAPITAL.z, GRAY.x - CAPITAL.x);

function crearAlturaBase(): AlturaEn {
  const costa = crearCosta(SEMIEJE_X, SEMIEJE_Z, 11);
  const ruido = crearRuido2D(11);
  const hueco = { x: CAPITAL.x + Math.cos(ANGULO_PUERTA) * 115, z: CAPITAL.z + Math.sin(ANGULO_PUERTA) * 115 };
  const zonas = [
    { ...FOOSHA, radio: 55, altura: 4.5 },
    { ...PASTOS, radio: 45, altura: 4.4 },
    { ...GRAY, radio: 62, altura: 5 },
    { ...CAPITAL, radio: 88, altura: 14 },
    { ...CAPITAL, radio: 32, altura: 22 }, // Ciudad Alta, donde viven los nobles
  ];
  return (x, z) => {
    const t = costa(x, z);
    let h = alturaCostera(t);
    if (t <= 0) return h;
    const tierra = Math.min(t * 3, 1);
    h += 12 * fbm(ruido, x * 0.012, z * 0.012, 4) * tierra;
    h += 105 * campana(x, z, COLUBO.x, COLUBO.z, 80) * tierra; // monte Colubo
    // Cadena de montañas bajas alrededor de la capital, abierta hacia la Gran Puerta
    const dc = Math.hypot(x - CAPITAL.x, z - CAPITAL.z);
    h += 38 * Math.exp(-((dc - 120) ** 2) / (2 * 26 * 26)) * (1 - campana(x, z, hueco.x, hueco.z, 30)) * tierra;
    return aplanarZonas(h, x, z, zonas);
  };
}

/** Pila de chatarra del Gray Terminal. */
function crearPilaChatarra(aleatorio: Aleatorio): THREE.Group {
  const pila = new THREE.Group();
  const colores = [0x6b5a4a, 0x7a6a55, 0x5a5048, 0x8a7a60, 0x4a453f];
  for (let i = 0; i < 16; i++) {
    const tipo = aleatorio();
    const color = colores[Math.floor(aleatorio() * colores.length)];
    const pieza = tipo < 0.4
      ? malla(new THREE.BoxGeometry(0.6 + aleatorio() * 2, 0.4 + aleatorio(), 0.6 + aleatorio() * 2), color)
      : tipo < 0.7
        ? malla(new THREE.CylinderGeometry(0.4, 0.4, 1 + aleatorio() * 1.5, 8), color)
        : malla(new THREE.DodecahedronGeometry(0.6 + aleatorio(), 0), color);
    const r = aleatorio() * 3.5;
    const a = aleatorio() * Math.PI * 2;
    pieza.position.set(Math.cos(a) * r, (3.5 - r) * 0.7 + aleatorio() * 0.5, Math.sin(a) * r);
    pieza.rotation.set(aleatorio() * 3, aleatorio() * 3, aleatorio() * 3);
    pila.add(pieza);
  }
  return pila;
}

/** Chabola del Gray Terminal: tablones y una lona por techo. */
function crearChabola(aleatorio: Aleatorio): THREE.Group {
  const chabola = new THREE.Group();
  const paredes = new THREE.Mesh(geometriaCaja(3.5, 2.2, 3, 1), matTextura(texturaMadera(0x6b5a48)));
  paredes.position.y = 1.1;
  const techo = malla(new THREE.BoxGeometry(4.2, 0.12, 3.6), [0x8a7a5a, 0x6a7a8a, 0x8a5a4a][Math.floor(aleatorio() * 3)]);
  techo.position.y = 2.3;
  techo.rotation.z = 0.15;
  chabola.add(paredes, techo);
  chabola.rotation.y = aleatorio() * Math.PI;
  return chabola;
}

/** Casa de la familia Dadan: cabaña grande de troncos con porche. */
function crearCasaDadan(): THREE.Group {
  const casa = new THREE.Group();
  const troncos = matTextura(texturaMadera(0x7a5636));
  const cuerpo = new THREE.Mesh(geometriaCaja(12, 4.2, 9, 1.5), troncos);
  cuerpo.position.y = 2.1;
  const pilotes = malla(new THREE.BoxGeometry(12.4, 2, 9.4), 0x5a4030);
  pilotes.position.y = -0.8;
  const tejado = crearTejadoDosAguas(13.5, 11, 3.6, 0x6b4a30);
  tejado.position.y = 4.2;
  const porche = malla(new THREE.BoxGeometry(8, 0.3, 3), 0x8a6a45);
  porche.position.set(0, 0.4, 6);
  const puerta = malla(new THREE.BoxGeometry(1.6, 2.6, 0.2), 0x4a3222);
  puerta.position.set(0, 1.3, 4.55);
  casa.add(cuerpo, pilotes, tejado, porche, puerta);
  for (const x of [-3.6, 3.6]) {
    const poste = malla(new THREE.BoxGeometry(0.3, 3.4, 0.3), 0x5a4030);
    poste.position.set(x, 1.9, 7.3);
    casa.add(poste);
  }
  return casa;
}

/** La casa del árbol de Luffy, Ace y Sabo, con su bandera. */
function crearCasaArbol(): THREE.Group {
  const arbol = new THREE.Group();
  const tronco = malla(new THREE.CylinderGeometry(1.6, 2.4, 16, 10), 0x6b4a2e, { flatShading: false });
  tronco.position.y = 8;
  arbol.add(tronco);
  for (const [x, y, z, r] of [[0, 18, 0, 7], [4, 15, 2, 5], [-4, 16, -2, 5], [1, 21, -3, 4.5]]) {
    const copa = malla(new THREE.IcosahedronGeometry(r, 1), 0x3f8a35);
    copa.position.set(x, y, z);
    arbol.add(copa);
  }
  const plataforma = malla(new THREE.BoxGeometry(7, 0.4, 7), 0x8a6a45);
  plataforma.position.y = 11;
  const cabana = new THREE.Mesh(geometriaCaja(5, 3, 4.5, 1), matTextura(texturaMadera(0x9a7448)));
  cabana.position.set(0, 12.7, 0);
  const techo = crearTejadoDosAguas(5.8, 5.6, 1.8, 0x7a5a3a);
  techo.position.y = 14.2;
  arbol.add(plataforma, cabana, techo);
  for (let i = 0; i < 14; i++) {
    const peldano = malla(new THREE.BoxGeometry(1.2, 0.12, 0.12), 0x8a6a45);
    peldano.position.set(0, 0.6 + i * 0.75, 2.5);
    arbol.add(peldano);
  }
  const asta = malla(new THREE.CylinderGeometry(0.06, 0.06, 3, 5), 0x5a4030);
  asta.position.set(2.5, 15.5, 2);
  const bandera = crearCartel('ASL', { ancho: 1.6, alto: 1, fondo: '#151515', color: '#f4f1e8', dobleCara: true });
  bandera.position.set(3.3, 16.4, 2);
  arbol.add(asta, bandera);
  return arbol;
}

/** Puesto de la pescadería UO con toldo a rayas. */
function crearPuestoPescado(): THREE.Group {
  const puesto = new THREE.Group();
  const mostrador = new THREE.Mesh(geometriaCaja(5, 1.1, 2, 1), matTextura(texturaMadera(0x8a6a45)));
  mostrador.position.y = 0.55;
  puesto.add(mostrador);
  for (const x of [-2.4, 2.4]) {
    const poste = malla(new THREE.BoxGeometry(0.15, 3, 0.15), 0x5a4030);
    poste.position.set(x, 1.5, 0.9);
    puesto.add(poste);
  }
  const toldo = malla(new THREE.BoxGeometry(5.6, 0.1, 2.6), 0x3f7fc0);
  toldo.position.set(0, 3, 0.4);
  toldo.rotation.x = 0.2;
  const cartel = crearCartel('UO', { ancho: 1.6, alto: 0.8, fondo: '#f4f1e8', color: '#1f4a8a' });
  cartel.position.set(0, 2.4, 1.05);
  puesto.add(toldo, cartel);
  for (let i = 0; i < 5; i++) {
    const pez = malla(new THREE.SphereGeometry(0.25, 6, 4), 0x9ab0c0);
    pez.scale.set(2, 0.6, 0.8);
    pez.position.set(-1.8 + i * 0.9, 1.2, 0.2);
    puesto.add(pez);
  }
  return puesto;
}

/** La muralla de la capital de Goa con torreones y la Gran Puerta hacia el Gray Terminal. */
function crearMuralla(grupo: THREE.Group, suelo: AlturaEn): void {
  const piedra = matTextura(texturaPiedra(0xb8ad96));
  const segmentos = 48;
  const largo = (2 * Math.PI * RADIO_MURALLA) / segmentos + 0.6;
  for (let i = 0; i < segmentos; i++) {
    const a = (i / segmentos) * Math.PI * 2;
    const diferencia = Math.atan2(Math.sin(a - ANGULO_PUERTA), Math.cos(a - ANGULO_PUERTA));
    if (Math.abs(diferencia) < 0.09) continue; // hueco de la Gran Puerta
    const x = CAPITAL.x + Math.cos(a) * RADIO_MURALLA;
    const z = CAPITAL.z + Math.sin(a) * RADIO_MURALLA;
    const muro = new THREE.Mesh(geometriaCaja(largo, 14, 4), piedra);
    muro.position.set(x, suelo(x, z) + 5, z);
    muro.rotation.y = -a - Math.PI / 2;
    grupo.add(muro);
    if (i % 6 === 0) {
      const torreon = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.5, 18, 12), piedra);
      torreon.position.set(x, suelo(x, z) + 7, z);
      const tejado = malla(new THREE.ConeGeometry(5, 5, 12), 0x3f5f8a);
      tejado.position.set(x, suelo(x, z) + 18.5, z);
      grupo.add(torreon, tejado);
    }
  }
  // Gran Puerta
  const x = CAPITAL.x + Math.cos(ANGULO_PUERTA) * RADIO_MURALLA;
  const z = CAPITAL.z + Math.sin(ANGULO_PUERTA) * RADIO_MURALLA;
  const puerta = crearPuertaArco(7, 10);
  puerta.position.set(x, suelo(x, z), z);
  puerta.rotation.y = Math.atan2(Math.cos(ANGULO_PUERTA), Math.sin(ANGULO_PUERTA));
  grupo.add(puerta);
  for (const s of [-1, 1]) {
    const a = ANGULO_PUERTA + s * 0.11;
    const px = CAPITAL.x + Math.cos(a) * RADIO_MURALLA;
    const pz = CAPITAL.z + Math.sin(a) * RADIO_MURALLA;
    const torre = new THREE.Mesh(geometriaCaja(6, 20, 6), piedra);
    torre.position.set(px, suelo(px, pz) + 8, pz);
    torre.rotation.y = -a;
    grupo.add(torre);
  }
}

/** Palacio real de Goa en la Ciudad Alta. */
function crearPalacio(): THREE.Group {
  const palacio = new THREE.Group();
  const estuco = matTextura(texturaPiedra(0xe9e2d0));
  const cuerpo = new THREE.Mesh(geometriaCaja(30, 14, 20), estuco);
  cuerpo.position.y = 7;
  const torreCentral = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.5, 28, 14), estuco);
  torreCentral.position.y = 14;
  const aguja = malla(new THREE.ConeGeometry(6, 9, 14), 0x3f5f8a);
  aguja.position.y = 32.5;
  palacio.add(cuerpo, torreCentral, aguja);
  for (const x of [-15, 15]) for (const z of [-10, 10]) {
    const torre = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.3, 20, 12), estuco);
    torre.position.set(x, 10, z);
    const cono = malla(new THREE.ConeGeometry(3.8, 6, 12), 0x3f5f8a);
    cono.position.set(x, 23, z);
    palacio.add(torre, cono);
  }
  const tejado = crearTejado({ anchoBase: 31, fondoBase: 21, anchoCima: 12, fondoCima: 2, altura: 5, curva: 1, levante: 0, color: 0x3f5f8a });
  tejado.position.y = 14;
  palacio.add(tejado);
  return palacio;
}

export const construirFoosha: ConstructorIsla = (aleatorio) => {
  const grupo = new THREE.Group();
  const terreno = crearTerreno({
    radio: SEMIEJE_X,
    altura: 160,
    semilla: 11,
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

  // --- Villa Foosha: calle principal desde el muelle hacia el norte, plaza con el Partys Bar ---
  let zOrilla = FOOSHA.z;
  while (suelo(FOOSHA.x, zOrilla) > 1.6 && zOrilla < FOOSHA.z + 150) zOrilla += 1;
  const plaza = { x: FOOSHA.x, z: FOOSHA.z + 8 };

  const bar = sobre(crearCasaEntramado(aleatorio, { ancho: 11, fondo: 8, pisos: 1, techo: 0x7a3b2a, pared: 0xf7e7c4 }), plaza.x - 14, plaza.z + 4);
  mirarHacia(bar, plaza.x, plaza.z + 4);
  const cartelBar = crearCartel('PARTYS BAR', { ancho: 5, alto: 1.1, fondo: '#5a3520', color: '#f6d77a' });
  cartelBar.position.set(0, 2.9, 4.12);
  bar.add(cartelBar);
  const carniceria = sobre(crearCasaEntramado(aleatorio, { ancho: 7, fondo: 6, pisos: 1, techo: 0xb0306a }), plaza.x - 14, plaza.z - 10);
  mirarHacia(carniceria, plaza.x, plaza.z - 10);
  const cartelCarne = crearCartel('BUFFALO MEAT', { ancho: 4, alto: 0.8, fondo: '#f4f1e8', color: '#8a2a1a' });
  cartelCarne.position.set(0, 2.6, 3.1);
  carniceria.add(cartelCarne);
  sobre(crearPuestoPescado(), plaza.x + 6, zOrilla - 10).rotation.y = Math.PI;

  const casas: Array<[number, number, number]> = [
    [14, 4, 2], [14, -10, 1], [14, -24, 2], [-14, -24, 2], [0, -36, 3], [-26, -8, 1],
    [28, -16, 1], [26, 6, 2], [-28, 14, 1], [-4, -50, 2], [16, -44, 1], [-22, -40, 1],
  ];
  for (const [dx, dz, pisos] of casas) {
    const casa = sobre(crearCasaEntramado(aleatorio, { pisos }), plaza.x + dx, plaza.z + dz);
    mirarHacia(casa, plaza.x, plaza.z + dz * 0.5);
  }
  const alcaldia = sobre(crearCasaEntramado(aleatorio, { ancho: 9, fondo: 7, pisos: 2, techo: 0x5c8fc1 }), plaza.x + 2, plaza.z - 24);
  mirarHacia(alcaldia, plaza.x, plaza.z);

  for (const [dx, dz, escala] of [[-40, 8, 1], [38, -4, 0.9], [-30, -48, 1.1], [32, -40, 1]] as const) {
    const molino = sobre(crearMolino(escala, { techo: 0xc0392b, cupula: true }), plaza.x + dx, plaza.z + dz, 1.5);
    molino.rotation.y = 0.4 + aleatorio() * 0.3;
  }

  // Muelle grande (donde atracaba el barco de Shanks) y barcas
  const muelle = crearMuelle(34, 6);
  muelle.position.set(FOOSHA.x, 0, zOrilla - 6);
  grupo.add(muelle);
  const muelleChico = crearMuelle(18, 3);
  muelleChico.position.set(FOOSHA.x + 22, 0, zOrilla - 4);
  grupo.add(muelleChico);
  for (const [dx, dz, color] of [[5, 16, 0xb5553a], [-5, 26, 0x3f6fa0], [26, 12, 0x4f7f5a]] as const) {
    const barca = crearBarquito(color);
    barca.position.set(FOOSHA.x + dx, 0, zOrilla + dz);
    grupo.add(barca);
  }

  // --- Pastos con vacas, al oeste del pueblo ---
  const valla = crearValla(60, 40);
  sobre(valla, PASTOS.x, PASTOS.z);
  for (let i = 0; i < 10; i++) sobre(crearVaca(aleatorio), PASTOS.x + (aleatorio() - 0.5) * 50, PASTOS.z + (aleatorio() - 0.5) * 30);

  // --- Monte Colubo: casa de Dadan y la casa del árbol ---
  const casaDadan = sobre(crearCasaDadan(), DADAN.x, DADAN.z, 0.5);
  mirarHacia(casaDadan, FOOSHA.x, FOOSHA.z);
  sobre(crearCasaArbol(), ARBOL.x, ARBOL.z, 1);

  // --- Gray Terminal ---
  for (let i = 0; i < 55; i++) {
    const a = aleatorio() * Math.PI * 2;
    const r = Math.sqrt(aleatorio()) * 52;
    sobre(aleatorio() < 0.75 ? crearPilaChatarra(aleatorio) : crearChabola(aleatorio), GRAY.x + Math.cos(a) * r, GRAY.z + Math.sin(a) * r);
  }

  // --- Capital de Goa ---
  crearMuralla(grupo, suelo);
  for (let i = 0; i < 46; i++) {
    const a = aleatorio() * Math.PI * 2;
    const r = 36 + aleatorio() * 30;
    const x = CAPITAL.x + Math.cos(a) * r;
    const z = CAPITAL.z + Math.sin(a) * r;
    const edificio = sobre(crearEdificioCiudad(aleatorio, { pisos: 2 + Math.floor(aleatorio() * 2) }), x, z);
    mirarHacia(edificio, CAPITAL.x, CAPITAL.z);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const x = CAPITAL.x + Math.cos(a) * 24;
    const z = CAPITAL.z + Math.sin(a) * 24;
    const mansion = sobre(crearEdificioCiudad(aleatorio, { pisos: 3, pared: 0xf5efe4, techo: 0x3f5f8a, cupula: aleatorio() < 0.4 ? 2 : 0 }), x, z);
    mirarHacia(mansion, CAPITAL.x, CAPITAL.z);
  }
  sobre(crearPalacio(), CAPITAL.x, CAPITAL.z);

  // --- Caminos ---
  const camino = (puntos: Array<[number, number]>, ancho: number) => crearCamino(grupo, puntos, ancho, suelo);

  camino([[FOOSHA.x, zOrilla - 4], [FOOSHA.x, FOOSHA.z - 60]], 5);
  camino([[FOOSHA.x - 6, FOOSHA.z - 40], [70, 100], [DADAN.x + 10, DADAN.z + 10]], 3);
  camino([[FOOSHA.x - 30, FOOSHA.z], [PASTOS.x + 30, PASTOS.z], [-60, 120], [CAPITAL.x + 60, CAPITAL.z + 50]], 3.5);
  camino([[CAPITAL.x + Math.cos(ANGULO_PUERTA) * (RADIO_MURALLA + 4), CAPITAL.z + Math.sin(ANGULO_PUERTA) * (RADIO_MURALLA + 4)], [GRAY.x - 40, GRAY.z + 10]], 5);

  // --- Vegetación: el bosque denso del monte Colubo, montañas de la capital y palmeras en la costa ---
  const lejos = (x: number, z: number, puntos: Array<{ x: number; z: number }>, margen: number) =>
    puntos.every((p) => Math.hypot(x - p.x, z - p.z) > margen);
  const libres = [FOOSHA, PASTOS, GRAY, DADAN];
  esparcir({
    grupo, alturaEn: suelo, aleatorio, radio: 400, cantidad: 520, crear: crearArbol,
    condicion: (h, x, z) => h > 8 && lejos(x, z, libres, 40) && Math.hypot(x - CAPITAL.x, z - CAPITAL.z) > RADIO_MURALLA + 12,
  });
  esparcir({
    grupo, alturaEn: suelo, aleatorio, radio: 420, cantidad: 80, crear: crearPalmera,
    condicion: (h, x, z) => h > 1.3 && h < 3.2 && lejos(x, z, [GRAY], 60),
  });
  esparcir({
    grupo, alturaEn: suelo, aleatorio, radio: 420, cantidad: 30, crear: crearRoca,
    condicion: (h) => h > 0 && h < 2,
  });

  const alturaEn: AlturaEn = (x, z) => suelo(x, z);
  return {
    grupo,
    alturaEn,
    radio: 320,
    alturaEtiqueta: 140,
    lugares: [
      { nombre: 'Villa Foosha', posicion: [FOOSHA.x, 22, FOOSHA.z] },
      { nombre: 'Partys Bar', posicion: [plaza.x - 14, 12, plaza.z + 4] },
      { nombre: 'Monte Colubo', posicion: [COLUBO.x, 125, COLUBO.z] },
      { nombre: 'Casa de Dadan', posicion: [DADAN.x, suelo(DADAN.x, DADAN.z) + 12, DADAN.z] },
      { nombre: 'Casa del árbol', posicion: [ARBOL.x, suelo(ARBOL.x, ARBOL.z) + 26, ARBOL.z] },
      { nombre: 'Gray Terminal', posicion: [GRAY.x, 18, GRAY.z] },
      { nombre: 'Reino de Goa', posicion: [CAPITAL.x, 60, CAPITAL.z] },
    ],
  };
};
