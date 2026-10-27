// Shells Town — cap. 2–7. Según docs/referencias/east-blue.md:
//   · La silueta de la ciudad: torres con forma de central eléctrica, erizadas de cañones (wiki; también en Fruit Seas).
//   · Base de la Marina 153 del capitán Morgan, con la estatua gigante de Morgan en el tejado.
//   · Patio vallado de la base donde Zoro estaba atado a una cruz.
//   · Food Foo, el restaurante donde Luffy y Koby hablan de Zoro y Morgan. Puerto al sur.
import * as THREE from 'three';
import { aplanarZonas, alturaCostera, crearCosta, crearTerreno } from './terreno';
import { crearArbol, crearBarquito, crearCartel, crearMolino, crearMuelle, crearPalmera, esparcir, malla, mirarHacia } from './utilidades';
import { crearEdificioCiudad, crearEstatuaMorgan, crearTorreCentral } from './edificios';
import { geometriaCaja, matTextura } from './arquitectura';
import { texturaEstuco } from '../texturas';
import { crearRuido2D, fbm } from '../../utils/ruido';
import type { AlturaEn, ConstructorIsla } from '../../tipos';

const SEMIEJE_X = 230;
const SEMIEJE_Z = 180;
const CIUDAD = { x: 0, z: 30 };
const BASE = { x: -10, z: -55 };
const ALTO_CIUDAD = 5;
const BLANCO = 0xf2f2ee;
const AZUL = 0x2f5fa8;

function crearAlturaBase(): AlturaEn {
  const costa = crearCosta(SEMIEJE_X, SEMIEJE_Z, 21, 0.08);
  const ruido = crearRuido2D(21);
  return (x, z) => {
    const t = costa(x, z);
    let h = alturaCostera(t);
    if (t <= 0) return h;
    h += 22 * fbm(ruido, x * 0.01 + 4, z * 0.01, 4) * Math.min(t * 3, 1);
    return aplanarZonas(h, x, z, [{ ...CIUDAD, radio: 135, altura: ALTO_CIUDAD }]);
  };
}

/** Base de la Marina 153: edificio principal con rótulo MARINE, torre, patio vallado y la cruz de Zoro. Mira a +Z. */
function crearBaseMarina(): THREE.Group {
  const base = new THREE.Group();
  const estuco = matTextura(texturaEstuco(BLANCO));

  const edificio = new THREE.Mesh(geometriaCaja(44, 16, 16), estuco);
  edificio.position.set(0, 8, -14);
  const banda = malla(new THREE.BoxGeometry(44.4, 1.4, 16.4), AZUL);
  banda.position.set(0, 15.3, -14);
  const rotulo = crearCartel('MARINE', { ancho: 22, alto: 5, fondo: '#f2f2ee', color: '#2f5fa8' });
  rotulo.position.set(0, 10, -5.95);
  base.add(edificio, banda, rotulo);
  for (let f = 0; f < 3; f++) {
    for (let i = 0; i < 10; i++) {
      if (f < 2 && i >= 3 && i <= 6) continue; // el rótulo
      const ventana = malla(new THREE.BoxGeometry(1.6, 1.8, 0.2), 0x3a5068);
      ventana.position.set(-19.8 + i * 4.4, 3 + f * 4.6, -5.9);
      base.add(ventana);
    }
  }
  const puerta = malla(new THREE.BoxGeometry(4, 4.5, 0.3), 0x2a3a5a);
  puerta.position.set(0, 2.25, -5.85);
  base.add(puerta);

  // Torre con la gaviota de la Marina
  const torre = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 34, 16), estuco);
  torre.position.set(14, 17, -18);
  const anillo = malla(new THREE.CylinderGeometry(7, 7, 2.4, 16), AZUL, { flatShading: false });
  anillo.position.set(14, 34, -18);
  const remate = malla(new THREE.CylinderGeometry(5, 6, 3, 16), BLANCO, { flatShading: false });
  remate.position.set(14, 36.6, -18);
  base.add(torre, anillo, remate);

  // La estatua de Morgan sobre el tejado
  const estatua = crearEstatuaMorgan();
  estatua.position.set(-10, 16, -14);
  estatua.rotation.y = 0.15;
  base.add(estatua);

  // Patio vallado delante del edificio
  const muro = (ancho: number, fondo: number, x: number, z: number) => {
    const m = new THREE.Mesh(geometriaCaja(ancho, 3.2, fondo), estuco);
    m.position.set(x, 1.6, z);
    const coronacion = malla(new THREE.BoxGeometry(ancho + 0.2, 0.4, fondo + 0.2), AZUL);
    coronacion.position.set(x, 3.4, z);
    base.add(m, coronacion);
  };
  muro(0.8, 30, -22, 9);
  muro(0.8, 30, 22, 9);
  muro(18, 0.8, -13, 24);
  muro(18, 0.8, 13, 24);
  for (const x of [-4.2, 4.2]) {
    const pilar = malla(new THREE.BoxGeometry(1.4, 5, 1.4), AZUL);
    pilar.position.set(x, 2.5, 24);
    base.add(pilar);
  }
  const suelo = malla(new THREE.BoxGeometry(43, 0.2, 30), 0xcfc8bb);
  suelo.position.set(0, 0.1, 9);
  base.add(suelo);

  // La cruz de Zoro en el patio
  const madera = 0x7a5634;
  const poste = malla(new THREE.BoxGeometry(0.35, 4.2, 0.35), madera);
  poste.position.set(-12, 2.1, 12);
  const brazos = malla(new THREE.BoxGeometry(3.4, 0.35, 0.35), madera);
  brazos.position.set(-12, 3.2, 12);
  base.add(poste, brazos);

  // Mástil con la bandera de la Marina
  const asta = malla(new THREE.CylinderGeometry(0.15, 0.15, 14, 6), 0xdddddd);
  asta.position.set(16, 7, 18);
  const bandera = crearCartel('MARINE', { ancho: 4, alto: 2.4, fondo: '#ffffff', color: '#2f5fa8', dobleCara: true });
  bandera.position.set(18.1, 12.6, 18);
  base.add(asta, bandera);
  return base;
}

export const construirShellsTown: ConstructorIsla = (aleatorio) => {
  const grupo = new THREE.Group();
  const terreno = crearTerreno({
    radio: SEMIEJE_X, altura: 120, semilla: 21, resolucion: 150, lado: SEMIEJE_X * 2.5, alturaBase: crearAlturaBase(),
  });
  grupo.add(terreno.malla);
  const suelo = terreno.alturaEn;
  const sobre = <T extends THREE.Object3D>(objeto: T, x: number, z: number, hundir = 0): T => {
    objeto.position.set(x, suelo(x, z) - hundir, z);
    grupo.add(objeto);
    return objeto;
  };

  sobre(crearBaseMarina(), BASE.x, BASE.z);

  // Torres-central repartidas por la ciudad: son la silueta de Shells Town
  const torres: Array<[number, number, number, number]> = [
    [-70, -10, 34, 10], [60, -30, 40, 12], [80, 50, 30, 9], [-60, 70, 28, 9], [20, 90, 24, 8],
  ];
  for (const [x, z, alto, radio] of torres) sobre(crearTorreCentral(alto, radio), x, z, 0.5);

  // Molinos (como en Fruit Seas)
  for (const [x, z, techo] of [[-100, 30, 0x2f5fa8], [100, 0, 0xc0392b], [-30, 110, 0x2f5fa8]] as const) {
    sobre(crearMolino(1, { techo, cupula: true }), x, z, 1.5).rotation.y = aleatorio() * Math.PI;
  }

  // Calles en cuadrícula, dejando libres la base, las torres y la calle mayor (x = 0) hacia el puerto
  const ocupado = (x: number, z: number) =>
    (Math.abs(x - BASE.x) < 30 && z > BASE.z - 30 && z < BASE.z + 34) ||
    torres.some(([tx, tz, , r]) => Math.hypot(x - tx, z - tz) < r + 9) ||
    Math.abs(x) < 7;
  for (let x = -110; x <= 110; x += 15) {
    for (let z = -60; z <= 130; z += 15) {
      if (aleatorio() < 0.2) continue;
      const cx = x + (aleatorio() - 0.5) * 3;
      const cz = z + (aleatorio() - 0.5) * 3;
      if (ocupado(cx, cz) || Math.abs(suelo(cx, cz) - ALTO_CIUDAD) > 0.6) continue;
      const edificio = sobre(crearEdificioCiudad(aleatorio, { pisos: 1 + Math.floor(aleatorio() * 3), ancho: 7 + aleatorio() * 3, fondo: 6 + aleatorio() * 2 }), cx, cz);
      mirarHacia(edificio, Math.abs(cx) < 20 ? 0 : cx, Math.abs(cx) < 20 ? cz : cz + 100);
    }
  }

  // Food Foo, en la calle mayor
  const foodFoo = sobre(crearEdificioCiudad(aleatorio, { ancho: 10, fondo: 8, pisos: 2, pared: 0xf3e0b5, techo: 0xc9772f }), 14, 40);
  mirarHacia(foodFoo, 0, 40);
  const cartel = crearCartel('FOOD FOO', { ancho: 4.5, alto: 1, fondo: '#5a3520', color: '#f6d77a' });
  cartel.position.set(0, 3.4, 4.1);
  foodFoo.add(cartel);

  // Calle mayor hasta el puerto
  let zOrilla = CIUDAD.z;
  while (suelo(0, zOrilla) > 1.6 && zOrilla < 300) zOrilla += 1;
  for (let z = BASE.z + 26; z < zOrilla - 2; z += 4) {
    const tramo = malla(new THREE.BoxGeometry(9, 0.8, 4.8), 0xb9b2a4);
    tramo.position.set(0, suelo(0, z) + 0.05, z);
    grupo.add(tramo);
  }
  const muelle = crearMuelle(36, 8);
  muelle.position.set(0, 0, zOrilla - 6);
  grupo.add(muelle);
  for (const [dx, dz, color] of [[7, 18, 0x2f5fa8], [-7, 28, 0xb5553a], [7, 34, 0x4f7f5a]] as const) {
    const barca = crearBarquito(color);
    barca.position.set(dx, 0, zOrilla + dz);
    grupo.add(barca);
  }

  esparcir({ grupo, alturaEn: suelo, aleatorio, radio: 300, cantidad: 60, crear: crearPalmera, condicion: (h) => h > 1.3 && h < 3.2 });
  esparcir({ grupo, alturaEn: suelo, aleatorio, radio: 300, cantidad: 90, crear: crearArbol, condicion: (h) => h > ALTO_CIUDAD + 2 });

  return {
    grupo,
    alturaEn: suelo,
    radio: 220,
    alturaEtiqueta: 70,
    lugares: [
      { nombre: 'Base de la Marina 153', posicion: [BASE.x, 48, BASE.z] },
      { nombre: 'Cruz de Zoro', posicion: [BASE.x - 12, 12, BASE.z + 12] },
      { nombre: 'Food Foo', posicion: [14, 16, 40] },
      { nombre: 'Puerto', posicion: [0, 10, zOrilla] },
    ],
  };
};
