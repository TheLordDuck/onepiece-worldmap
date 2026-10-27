// Loguetown — cap. 96–100. Según docs/referencias/east-blue.md:
//   · "La ciudad del principio y del fin": aquí nació y fue ejecutado Gol D. Roger. Última parada antes de la Grand Line,
//     justo al norte del Calm Belt y al noreste de la entrada de Reverse Mountain.
//   · El cadalso de Roger, en el corazón de la ciudad.
//   · La base de la Marina del capitán Smoker.
//   · La armería de Ipponmatsu (más de 200 años), donde Zoro consigue la Sandai Kitetsu y la Yubashiri.
// Aspecto según Fruit Seas: ciudad europea amurallada sobre el mar, casas de colores con cúpulas,
// paseo de palmeras junto a la muralla, gran plaza central y muelle.
import * as THREE from 'three';
import { alturaCostera, crearCosta, crearTerreno } from './terreno';
import { crearBarquito, crearCartel, crearMuelle, crearPalmera, crearRoca, esparcir, malla, mirarHacia } from './utilidades';
import { crearCadalso, crearEdificioCiudad } from './edificios';
import { geometriaCaja, matTextura } from './arquitectura';
import { texturaBaldosas, texturaEstuco, texturaPiedra } from '../texturas';
import type { AlturaEn, ConstructorIsla } from '../../tipos';

const SEMIEJE_X = 240;
const SEMIEJE_Z = 200;
const ALTO_CIUDAD = 9;
const PLAZA = { x: 0, z: 0 };
const BASE_SMOKER = { x: 95, z: 25 };
const ARMERIA = { x: -26, z: 34 };
const RADIO_MURALLA = { x: 205, z: 168 };

function crearAlturaBase(): AlturaEn {
  const costa = crearCosta(SEMIEJE_X, SEMIEJE_Z, 51, 0.06);
  return (x, z) => {
    const t = costa(x, z);
    if (t <= 0) return alturaCostera(t);
    // La ciudad se asienta sobre una plataforma por encima del mar, contenida por la muralla
    return t < 0.05 ? 1 + t * 40 : ALTO_CIUDAD;
  };
}

/** Base de la Marina de Smoker: bloque blanco con rótulo y torre. Mira a +Z. */
function crearBaseSmoker(): THREE.Group {
  const base = new THREE.Group();
  const estuco = matTextura(texturaEstuco(0xf2f2ee));
  const bloque = new THREE.Mesh(geometriaCaja(30, 13, 18), estuco);
  bloque.position.y = 6.5;
  const banda = malla(new THREE.BoxGeometry(30.4, 1.2, 18.4), 0x2f5fa8);
  banda.position.y = 12.4;
  const rotulo = crearCartel('MARINE', { ancho: 14, alto: 3.2, fondo: '#f2f2ee', color: '#2f5fa8' });
  rotulo.position.set(0, 8.5, 9.06);
  const torre = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.4, 24, 14), estuco);
  torre.position.set(-10, 12, -4);
  const remate = malla(new THREE.CylinderGeometry(5, 5, 2, 14), 0x2f5fa8, { flatShading: false });
  remate.position.set(-10, 24.5, -4);
  const puerta = malla(new THREE.BoxGeometry(4, 4.5, 0.3), 0x2a3a5a);
  puerta.position.set(0, 2.25, 9.1);
  base.add(bloque, banda, rotulo, torre, remate, puerta);
  for (let i = 0; i < 6; i++) {
    for (let f = 0; f < 2; f++) {
      if (f === 1 && i >= 2 && i <= 3) continue;
      const ventana = malla(new THREE.BoxGeometry(1.6, 1.8, 0.2), 0x3a5068);
      ventana.position.set(-12.5 + i * 5, 3.5 + f * 4.5, 9.08);
      base.add(ventana);
    }
  }
  return base;
}

export const construirLoguetown: ConstructorIsla = (aleatorio) => {
  const grupo = new THREE.Group();
  const terreno = crearTerreno({
    radio: SEMIEJE_X, altura: 200, semilla: 51, resolucion: 150, lado: SEMIEJE_X * 2.5, alturaBase: crearAlturaBase(),
    colores: { pasto: 0xbcb5a6, pastoOscuro: 0xa8a192 }, // calles empedradas en vez de hierba
  });
  grupo.add(terreno.malla);
  const suelo = terreno.alturaEn;
  const sobre = <T extends THREE.Object3D>(objeto: T, x: number, z: number, hundir = 0): T => {
    objeto.position.set(x, suelo(x, z) - hundir, z);
    grupo.add(objeto);
    return objeto;
  };
  const dentro = (x: number, z: number, margen = 0) =>
    (x / (RADIO_MURALLA.x - margen)) ** 2 + (z / (RADIO_MURALLA.z - margen)) ** 2 < 1;

  // --- Plaza central con el cadalso de Roger ---
  const plaza = new THREE.Mesh(geometriaCaja(60, 0.3, 50, 4), matTextura(texturaBaldosas(0xc8c2b4)));
  plaza.position.set(PLAZA.x, ALTO_CIUDAD + 0.1, PLAZA.z);
  grupo.add(plaza);
  const cadalso = sobre(crearCadalso(), PLAZA.x, PLAZA.z - 4);
  cadalso.rotation.y = -Math.PI / 2;

  // --- Calles de casas de colores, algunas con cúpula ---
  const reservado = (x: number, z: number) =>
    (Math.abs(x - PLAZA.x) < 36 && Math.abs(z - PLAZA.z) < 31) ||
    Math.hypot(x - BASE_SMOKER.x, z - BASE_SMOKER.z) < 26 ||
    Math.hypot(x - ARMERIA.x, z - ARMERIA.z) < 9 ||
    Math.abs(x * 0.707 + z * 0.707) < 7; // calle diagonal hacia el puerto (suroeste)
  for (let x = -190; x <= 190; x += 14) {
    for (let z = -155; z <= 155; z += 14) {
      if (aleatorio() < 0.12) continue;
      const cx = x + (aleatorio() - 0.5) * 2;
      const cz = z + (aleatorio() - 0.5) * 2;
      if (!dentro(cx, cz, 14) || reservado(cx, cz)) continue;
      const edificio = sobre(crearEdificioCiudad(aleatorio, {
        pisos: 2 + Math.floor(aleatorio() * 3),
        ancho: 8 + aleatorio() * 3,
        fondo: 7 + aleatorio() * 3,
        cupula: aleatorio() < 0.1 ? 2.2 : 0,
      }), cx, cz);
      mirarHacia(edificio, PLAZA.x, PLAZA.z);
    }
  }
  sobre(crearBaseSmoker(), BASE_SMOKER.x, BASE_SMOKER.z).rotation.y = -Math.PI / 2;
  const armeria = sobre(crearEdificioCiudad(aleatorio, { ancho: 9, fondo: 8, pisos: 2, pared: 0xd8cbb0, techo: 0x5a3d28 }), ARMERIA.x, ARMERIA.z);
  mirarHacia(armeria, PLAZA.x, PLAZA.z);
  const cartelArmas = crearCartel('ARMS', { ancho: 3.2, alto: 1, fondo: '#2a1a12', color: '#e9dcc0' });
  cartelArmas.position.set(0, 3.6, 4.12);
  armeria.add(cartelArmas);

  // --- Muralla sobre el mar con paseo de palmeras ---
  const piedra = matTextura(texturaPiedra(0xc9c2b4));
  const segmentos = 72;
  for (let i = 0; i < segmentos; i++) {
    const a = (i / segmentos) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(a - Math.PI * 0.75), Math.cos(a - Math.PI * 0.75))) < 0.05) continue; // puerta al puerto
    const x = Math.cos(a) * RADIO_MURALLA.x;
    const z = Math.sin(a) * RADIO_MURALLA.z;
    const siguiente = { x: Math.cos(a + (Math.PI * 2) / segmentos) * RADIO_MURALLA.x, z: Math.sin(a + (Math.PI * 2) / segmentos) * RADIO_MURALLA.z };
    const largo = Math.hypot(siguiente.x - x, siguiente.z - z) + 0.6;
    const muro = new THREE.Mesh(geometriaCaja(largo, 4, 2.4), piedra);
    muro.position.set((x + siguiente.x) / 2, ALTO_CIUDAD + 1.2, (z + siguiente.z) / 2);
    muro.rotation.y = Math.atan2(siguiente.x - x, siguiente.z - z) + Math.PI / 2;
    grupo.add(muro);
    if (i % 3 === 0) {
      const palmera = crearPalmera(aleatorio);
      palmera.position.set(x * 0.95, ALTO_CIUDAD, z * 0.95);
      grupo.add(palmera);
    }
  }

  // --- Puerto al suroeste ---
  const aPuerto = Math.PI * 0.75;
  const salida = { x: Math.cos(aPuerto) * RADIO_MURALLA.x, z: Math.sin(aPuerto) * RADIO_MURALLA.z };
  let k = 1;
  while (suelo(salida.x * k, salida.z * k) > 1.6 && k < 2) k += 0.01;
  const orilla = { x: salida.x * k, z: salida.z * k };
  const muelle = crearMuelle(40, 9);
  muelle.position.set(orilla.x, 0, orilla.z);
  muelle.rotation.y = Math.atan2(Math.cos(aPuerto), Math.sin(aPuerto));
  grupo.add(muelle);
  for (const [dx, dz, color] of [[-14, 18, 0xb5553a], [-24, 6, 0x2f5fa8], [-6, 30, 0x4f7f5a]] as const) {
    const barca = crearBarquito(color);
    barca.position.set(orilla.x + dx, 0, orilla.z + dz);
    grupo.add(barca);
  }
  // Calle del puerto hasta la plaza
  for (let t = 0.05; t < 0.95; t += 0.02) {
    const x = salida.x * (1 - t);
    const z = salida.z * (1 - t);
    if (Math.abs(x) < 30 && Math.abs(z) < 25) continue;
    const tramo = malla(new THREE.BoxGeometry(7, 0.5, 5), 0xb9b2a4);
    tramo.position.set(x, ALTO_CIUDAD + 0.1, z);
    tramo.rotation.y = Math.atan2(salida.x, salida.z);
    grupo.add(tramo);
  }

  esparcir({ grupo, alturaEn: suelo, aleatorio, radio: 320, cantidad: 40, crear: crearRoca, condicion: (h) => h > -2 && h < 3 });

  return {
    grupo,
    alturaEn: suelo,
    radio: 230,
    alturaEtiqueta: 70,
    lugares: [
      { nombre: 'Cadalso de Gol D. Roger', posicion: [PLAZA.x, ALTO_CIUDAD + 22, PLAZA.z - 4] },
      { nombre: 'Base de Smoker', posicion: [BASE_SMOKER.x, ALTO_CIUDAD + 32, BASE_SMOKER.z] },
      { nombre: 'Armería de Ipponmatsu', posicion: [ARMERIA.x, ALTO_CIUDAD + 14, ARMERIA.z] },
      { nombre: 'Puerto', posicion: [orilla.x, 12, orilla.z] },
    ],
  };
};
