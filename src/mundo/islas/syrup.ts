// Villa Syrup (islas Gecko) — cap. 22–41. Según docs/referencias/east-blue.md:
//   · Pueblo tranquilo entre praderas, caminos de tierra, colinas y bosques; casas modestas (estilo rural inglés).
//   · La mansión de Kaya destaca en lo alto de una colina, vallada y vigilada.
//   · Solo dos cuestas suben desde la playa al pueblo, una al norte y otra al sur; el resto de la costa son acantilados.
//   · Meshi, el restaurante donde comen con Usopp.
//   · Aquí la tripulación recibe el Going Merry.
import * as THREE from 'three';
import { alturaCostera, aplanarZonas, campana, crearCosta, crearTerreno } from './terreno';
import { crearArbol, crearCamino, crearCartel, crearPalmera, crearRoca, esparcir, mirarHacia } from './utilidades';
import { crearCasaEntramado, crearMansion, crearValla } from './edificios';
import { crearGoingMerry } from './goingMerry';
import { crearRuido2D, fbm } from '../../utils/ruido';
import type { AlturaEn, ConstructorIsla } from '../../tipos';

const SEMIEJE_X = 220;
const SEMIEJE_Z = 200;
const MESETA = 26;
const PUEBLO = { x: -10, z: 10 };
const MANSION = { x: 70, z: -70 };
/** Las dos cuestas: eje X de cada una y lado (norte = -1, sur = +1). */
const CUESTAS = [
  { x: -30, lado: -1 },
  { x: 35, lado: 1 },
];

function crearAlturaBase(): AlturaEn {
  const costa = crearCosta(SEMIEJE_X, SEMIEJE_Z, 41, 0.08);
  const ruido = crearRuido2D(41);
  return (x, z) => {
    const t = costa(x, z);
    if (t <= 0) return alturaCostera(t);
    // Playa estrecha y acantilado casi vertical hasta la meseta
    let h = t < 0.03 ? 1 + t * 50 : t < 0.06 ? THREE.MathUtils.lerp(2.5, MESETA, (t - 0.03) / 0.03) : MESETA;
    h += 6 * fbm(ruido, x * 0.012, z * 0.012, 3) * THREE.MathUtils.smoothstep(t, 0.06, 0.2);
    h += 16 * campana(x, z, MANSION.x, MANSION.z, 40); // la colina de la mansión
    // Las cuestas norte y sur bajan en rampa hasta la playa
    for (const cuesta of CUESTAS) {
      if (Math.sign(z) !== cuesta.lado) continue;
      const mascara = 1 - THREE.MathUtils.smoothstep(Math.abs(x - cuesta.x), 9, 17);
      if (mascara <= 0) continue;
      const rampa = THREE.MathUtils.clamp(2.5 + ((t - 0.02) / 0.4) * (MESETA - 2.5), 1, MESETA);
      h = THREE.MathUtils.lerp(h, Math.min(h, rampa), mascara);
    }
    return aplanarZonas(h, x, z, [{ ...PUEBLO, radio: 50, altura: MESETA + 1 }]);
  };
}

export const construirSyrup: ConstructorIsla = (aleatorio) => {
  const grupo = new THREE.Group();
  const terreno = crearTerreno({
    radio: SEMIEJE_X, altura: 200, semilla: 41, resolucion: 170, lado: SEMIEJE_X * 2.5, alturaBase: crearAlturaBase(),
  });
  grupo.add(terreno.malla);
  const suelo = terreno.alturaEn;
  const sobre = <T extends THREE.Object3D>(objeto: T, x: number, z: number, hundir = 0): T => {
    objeto.position.set(x, suelo(x, z) - hundir, z);
    grupo.add(objeto);
    return objeto;
  };

  // --- El pueblo ---
  const casas: Array<[number, number]> = [
    [-24, -14], [-8, -22], [10, -18], [22, -4], [-30, 4], [-22, 22], [4, 26], [20, 18], [-40, -20], [34, 10],
  ];
  for (const [dx, dz] of casas) {
    const casa = sobre(crearCasaEntramado(aleatorio, { pisos: 1 + Math.floor(aleatorio() * 2), pared: 0xf1e6cf }), PUEBLO.x + dx, PUEBLO.z + dz);
    mirarHacia(casa, PUEBLO.x, PUEBLO.z);
  }
  const meshi = sobre(crearCasaEntramado(aleatorio, { ancho: 10, fondo: 7, pisos: 1, techo: 0x7a3b2a }), PUEBLO.x + 6, PUEBLO.z - 2);
  mirarHacia(meshi, PUEBLO.x - 10, PUEBLO.z + 10);
  const cartel = crearCartel('MESHI', { ancho: 3, alto: 0.9, fondo: '#5a3520', color: '#f6d77a' });
  cartel.position.set(0, 2.7, 3.62);
  meshi.add(cartel);

  // --- La mansión de Kaya en lo alto de la colina, vallada, con el árbol junto a su ventana ---
  const mansion = sobre(crearMansion(aleatorio), MANSION.x, MANSION.z, 0.5);
  mirarHacia(mansion, PUEBLO.x, PUEBLO.z);
  const valla = crearValla(70, 50, 0x2a2a2a);
  sobre(valla, MANSION.x, MANSION.z, 0.2);
  valla.rotation.y = mansion.rotation.y;
  const arbolKaya = crearArbol(aleatorio);
  arbolKaya.scale.setScalar(2.4);
  const lateral = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), mansion.rotation.y);
  sobre(arbolKaya, MANSION.x + lateral.x * 26, MANSION.z + lateral.z * 26);

  // --- Caminos: las dos cuestas, el pueblo y la subida a la mansión ---
  const camino = (puntos: Array<[number, number]>, ancho: number) => crearCamino(grupo, puntos, ancho, suelo);

  const pieCuesta = (cuesta: { x: number; lado: number }) => {
    let z = 0;
    while (suelo(cuesta.x, z) > 1.8 && Math.abs(z) < 320) z += cuesta.lado;
    return z;
  };
  const zNorte = pieCuesta(CUESTAS[0]);
  const zSur = pieCuesta(CUESTAS[1]);
  camino([[CUESTAS[0].x, zNorte + 4], [CUESTAS[0].x, -60], [PUEBLO.x - 10, PUEBLO.z - 20]], 5);
  camino([[CUESTAS[1].x, zSur - 4], [CUESTAS[1].x, 70], [PUEBLO.x + 10, PUEBLO.z + 22]], 5);
  camino([[PUEBLO.x + 20, PUEBLO.z - 10], [MANSION.x - 10, MANSION.z + 30]], 4);

  // --- El Going Merry, amarrado al pie de la cuesta sur ---
  const merry = new THREE.Group();
  merry.add(crearGoingMerry());
  merry.position.set(CUESTAS[1].x + 14, 0, zSur + 22);
  merry.rotation.y = Math.PI * 0.6;
  grupo.add(merry);

  // Rocas al pie de los acantilados y vegetación
  esparcir({ grupo, alturaEn: suelo, aleatorio, radio: 290, cantidad: 50, crear: crearRoca, condicion: (h) => h > -1 && h < 2.5 });
  esparcir({
    grupo, alturaEn: suelo, aleatorio, radio: 260, cantidad: 260, crear: crearArbol,
    condicion: (h, x, z) => h > MESETA - 2 && Math.hypot(x - PUEBLO.x, z - PUEBLO.z) > 55 && Math.hypot(x - MANSION.x, z - MANSION.z) > 38,
  });
  esparcir({ grupo, alturaEn: suelo, aleatorio, radio: 290, cantidad: 24, crear: crearPalmera, condicion: (h) => h > 1.2 && h < 2.4 });

  return {
    grupo,
    alturaEn: suelo,
    radio: 210,
    alturaEtiqueta: 90,
    lugares: [
      { nombre: 'Villa Syrup', posicion: [PUEBLO.x, MESETA + 16, PUEBLO.z] },
      { nombre: 'Mansión de Kaya', posicion: [MANSION.x, suelo(MANSION.x, MANSION.z) + 24, MANSION.z] },
      { nombre: 'Meshi', posicion: [PUEBLO.x + 6, MESETA + 10, PUEBLO.z - 2] },
      { nombre: 'Cuesta norte', posicion: [CUESTAS[0].x, 18, zNorte + 40] },
      { nombre: 'Cuesta sur', posicion: [CUESTAS[1].x, 18, zSur - 40] },
      { nombre: 'Going Merry', posicion: [CUESTAS[1].x + 14, 20, zSur + 22] },
    ],
  };
};
