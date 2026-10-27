// Orange Town (islas Organ) — cap. 8–21. Según docs/referencias/east-blue.md:
//   · Pueblo colonial de 42 años junto al mar, con calles empedradas (fundado por el alcalde Boodle).
//   · Drinker Pub: guarida de los piratas de Buggy (la carpa de circo en el tejado), destruido por la Bala Buggy devuelta.
//   · Tienda de comida para mascotas de Hocker, guardada por el perro Chouchou.
//   · Gran parte del pueblo destruida por la Bala Buggy.
//   · Refugio de los vecinos en una colina a las afueras.
// Aspecto según Fruit Seas: casas de entramado con tejados naranjas y magenta, plaza central y muelles al oeste.
import * as THREE from 'three';
import { aplanarZonas, alturaCostera, campana, crearCosta, crearTerreno } from './terreno';
import { crearArbol, crearBarquito, crearCartel, crearMuelle, crearPalmera, esparcir, malla, mirarHacia } from './utilidades';
import { crearCarpaCirco, crearCasaEntramado, crearRuina, crearTienda } from './edificios';
import { geometriaCaja, matTextura } from './arquitectura';
import { texturaBaldosas, texturaMadera } from '../texturas';
import { crearRuido2D, fbm } from '../../utils/ruido';
import type { Aleatorio, AlturaEn, ConstructorIsla } from '../../tipos';

const SEMIEJE_X = 190;
const SEMIEJE_Z = 160;
const PUEBLO = { x: 0, z: 10 };
const PLAZA = { x: 0, z: 5 };
const PUB = { x: 0, z: -22 };
const TIENDA = { x: -38, z: 34 };
const REFUGIO = { x: 95, z: -80 };
const ALTO_PUEBLO = 4.5;
const TECHOS = [0xd9893b, 0xc9632f, 0xb0306a, 0xe0a040];

function crearAlturaBase(): AlturaEn {
  const costa = crearCosta(SEMIEJE_X, SEMIEJE_Z, 31, 0.06);
  const ruido = crearRuido2D(31);
  return (x, z) => {
    const t = costa(x, z);
    let h = alturaCostera(t);
    if (t <= 0) return h;
    h += 8 * fbm(ruido, x * 0.012, z * 0.012, 3) * Math.min(t * 3, 1);
    h += 22 * campana(x, z, REFUGIO.x, REFUGIO.z, 38) * Math.min(t * 4, 1); // colina del refugio
    return aplanarZonas(h, x, z, [{ ...PUEBLO, radio: 115, altura: ALTO_PUEBLO }]);
  };
}

/** Chouchou: el perrito blanco que guarda la tienda de su difunto amo. */
function crearChouchou(): THREE.Group {
  const perro = new THREE.Group();
  const blanco = 0xf4f2ee;
  const cuerpo = malla(new THREE.SphereGeometry(0.35, 10, 8), blanco, { flatShading: false });
  cuerpo.scale.set(0.9, 0.8, 1.3);
  cuerpo.position.y = 0.42;
  const cabeza = malla(new THREE.SphereGeometry(0.26, 10, 8), blanco, { flatShading: false });
  cabeza.position.set(0, 0.72, 0.38);
  const hocico = malla(new THREE.SphereGeometry(0.07, 6, 6), 0x222222, { flatShading: false });
  hocico.position.set(0, 0.7, 0.64);
  perro.add(cuerpo, cabeza, hocico);
  for (const x of [-0.15, 0.15]) for (const z of [-0.22, 0.22]) {
    const pata = malla(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 6), blanco);
    pata.position.set(x, 0.15, z);
    perro.add(pata);
  }
  return perro;
}

/** La tienda de comida para mascotas, con cartel, caseta y Chouchou en la puerta. */
function crearTiendaMascotas(aleatorio: Aleatorio): THREE.Group {
  const tienda = crearCasaEntramado(aleatorio, { ancho: 6, fondo: 5, pisos: 1, techo: 0xd9893b });
  const cartel = crearCartel('PET FOOD', { ancho: 3.2, alto: 0.8, fondo: '#f4f1e8', color: '#7a3b2a' });
  cartel.position.set(0, 2.6, 2.62);
  const caseta = new THREE.Group();
  const paredes = new THREE.Mesh(geometriaCaja(1.2, 0.9, 1.2, 1), matTextura(texturaMadera(0xb5864f)));
  paredes.position.y = 0.45;
  const tejadillo = malla(new THREE.ConeGeometry(1, 0.6, 4), 0xc0392b);
  tejadillo.rotation.y = Math.PI / 4;
  tejadillo.position.y = 1.2;
  caseta.add(paredes, tejadillo);
  caseta.position.set(2.2, 0, 3.4);
  const chouchou = crearChouchou();
  chouchou.position.set(-0.8, 0, 3.6);
  tienda.add(cartel, caseta, chouchou);
  return tienda;
}

export const construirOrangeTown: ConstructorIsla = (aleatorio) => {
  const grupo = new THREE.Group();
  const terreno = crearTerreno({
    radio: SEMIEJE_X, altura: 120, semilla: 31, resolucion: 140, lado: SEMIEJE_X * 2.5, alturaBase: crearAlturaBase(),
  });
  grupo.add(terreno.malla);
  const suelo = terreno.alturaEn;
  const sobre = <T extends THREE.Object3D>(objeto: T, x: number, z: number, hundir = 0): T => {
    objeto.position.set(x, suelo(x, z) - hundir, z);
    grupo.add(objeto);
    return objeto;
  };

  // Plaza empedrada
  const plaza = new THREE.Mesh(geometriaCaja(46, 0.3, 34, 4), matTextura(texturaBaldosas(0xb3aa9a)));
  plaza.position.set(PLAZA.x, ALTO_PUEBLO + 0.1, PLAZA.z);
  grupo.add(plaza);

  // Drinker Pub con la carpa de Buggy en el tejado
  const pub = sobre(crearCasaEntramado(aleatorio, { ancho: 14, fondo: 10, pisos: 2, techo: 0x7a3b2a, pared: 0xeadbc0 }), PUB.x, PUB.z);
  const cartelPub = crearCartel('DRINKER PUB', { ancho: 6, alto: 1.2, fondo: '#2a1a12', color: '#f6d77a' });
  cartelPub.position.set(0, 2.8, 5.12);
  pub.add(cartelPub);
  const carpa = crearCarpaCirco(5.5, 9);
  carpa.position.set(0, 6.3 + 3, -0.5);
  pub.add(carpa);

  // Franja destruida por la Bala Buggy: sale del pub hacia el sureste
  const direccion = new THREE.Vector2(0.75, 0.66).normalize();
  const enFranja = (x: number, z: number) => {
    const dx = x - PUB.x;
    const dz = z - PUB.z;
    const aLoLargo = dx * direccion.x + dz * direccion.y;
    return aLoLargo > 18 && aLoLargo < 95 && Math.abs(-dx * direccion.y + dz * direccion.x) < 11;
  };

  // Casas por las calles, alrededor de la plaza
  for (let x = -95; x <= 95; x += 13) {
    for (let z = -70; z <= 95; z += 13) {
      if (aleatorio() < 0.15) continue;
      const cx = x + (aleatorio() - 0.5) * 3;
      const cz = z + (aleatorio() - 0.5) * 3;
      if (Math.abs(cx - PLAZA.x) < 30 && Math.abs(cz - PLAZA.z) < 24) continue;
      if (Math.hypot(cx - TIENDA.x, cz - TIENDA.z) < 9) continue;
      if (Math.abs(suelo(cx, cz) - ALTO_PUEBLO) > 0.6) continue;
      if (enFranja(cx, cz)) {
        sobre(crearRuina(aleatorio), cx, cz).rotation.y = aleatorio() * Math.PI;
        continue;
      }
      const casa = sobre(crearCasaEntramado(aleatorio, { pisos: 1 + Math.floor(aleatorio() * 2), techo: TECHOS[Math.floor(aleatorio() * TECHOS.length)] }), cx, cz);
      mirarHacia(casa, PLAZA.x, PLAZA.z);
    }
  }
  const tienda = sobre(crearTiendaMascotas(aleatorio), TIENDA.x, TIENDA.z);
  mirarHacia(tienda, PLAZA.x, PLAZA.z);

  // Refugio de los vecinos en la colina
  for (let i = 0; i < 12; i++) {
    const a = aleatorio() * Math.PI * 2;
    const r = 4 + aleatorio() * 16;
    sobre(crearTienda(aleatorio), REFUGIO.x + Math.cos(a) * r, REFUGIO.z + Math.sin(a) * r);
  }
  const fogata = malla(new THREE.ConeGeometry(0.8, 1.2, 6), 0xe0802a);
  sobre(fogata, REFUGIO.x, REFUGIO.z).position.y += 0.6;

  // Muelles al oeste
  let xOrilla = PUEBLO.x;
  while (suelo(xOrilla, 0) > 1.6 && xOrilla > -300) xOrilla -= 1;
  for (const z of [-15, 15]) {
    const muelle = crearMuelle(30, 5);
    muelle.position.set(xOrilla + 6, 0, z);
    muelle.rotation.y = -Math.PI / 2;
    grupo.add(muelle);
  }
  for (const [dx, z, color] of [[-16, -20, 0xb5553a], [-26, 20, 0x4f7f5a]] as const) {
    const barca = crearBarquito(color);
    barca.position.set(xOrilla + dx, 0, z);
    barca.rotation.y = Math.PI / 2;
    grupo.add(barca);
  }

  esparcir({ grupo, alturaEn: suelo, aleatorio, radio: 260, cantidad: 50, crear: crearPalmera, condicion: (h) => h > 1.3 && h < 3.2 });
  esparcir({
    grupo, alturaEn: suelo, aleatorio, radio: 260, cantidad: 80, crear: crearArbol,
    condicion: (h, x, z) => h > ALTO_PUEBLO + 1.5 && Math.hypot(x - REFUGIO.x, z - REFUGIO.z) > 22,
  });

  return {
    grupo,
    alturaEn: suelo,
    radio: 180,
    alturaEtiqueta: 60,
    lugares: [
      { nombre: 'Drinker Pub (guarida de Buggy)', posicion: [PUB.x, 30, PUB.z] },
      { nombre: 'Tienda de Chouchou', posicion: [TIENDA.x, 14, TIENDA.z] },
      { nombre: 'Destrozos de la Bala Buggy', posicion: [PUB.x + direccion.x * 55, 12, PUB.z + direccion.y * 55] },
      { nombre: 'Refugio de los vecinos', posicion: [REFUGIO.x, suelo(REFUGIO.x, REFUGIO.z) + 10, REFUGIO.z] },
    ],
  };
};
