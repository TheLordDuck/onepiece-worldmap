// Edificios y piezas compartidos por las islas del East Blue: casas de entramado (pueblos de estilo inglés),
// edificios de ciudad, torres-central de Shells Town, estatua de Morgan, cadalso de Roger,
// carpa de Buggy, mansión de Kaya, ruinas, tiendas de campaña y vacas.
import * as THREE from 'three';
import { crearRoca, malla } from './utilidades';
import { crearColumna, crearPuertaArco, crearTejado, escalarUV, geometriaCaja, matTextura } from './arquitectura';
import { texturaEstuco, texturaMadera, texturaPiedra, texturaRayas, texturaTejas } from '../texturas';
import type { Aleatorio } from '../../tipos';

const elegir = <T>(aleatorio: Aleatorio, lista: readonly T[]): T => lista[Math.floor(aleatorio() * lista.length)];

/** Ventana rectangular con marco y cruceta. Mira hacia +Z. */
export function crearVentanaSimple(ancho: number, alto: number, marco = 0xf2efe6, vidrio = 0x2d3f55): THREE.Group {
  const ventana = new THREE.Group();
  ventana.add(
    malla(new THREE.BoxGeometry(ancho + 0.22, alto + 0.22, 0.1), marco),
    malla(new THREE.BoxGeometry(ancho, alto, 0.13), vidrio),
    malla(new THREE.BoxGeometry(0.07, alto, 0.15), marco),
    malla(new THREE.BoxGeometry(ancho, 0.07, 0.15), marco),
  );
  return ventana;
}

/** Tejado a dos aguas de teja con la cumbrera a lo largo de X (aleros hacia ±Z). Base en y = 0. */
export function crearTejadoDosAguas(ancho: number, fondo: number, altura: number, color: number): THREE.Mesh {
  const forma = new THREE.Shape();
  forma.moveTo(-fondo / 2, 0);
  forma.lineTo(fondo / 2, 0);
  forma.lineTo(0, altura);
  forma.closePath();
  const geometria = new THREE.ExtrudeGeometry(forma, { depth: ancho, bevelEnabled: false });
  geometria.translate(0, 0, -ancho / 2);
  geometria.rotateY(Math.PI / 2);
  escalarUV(geometria, 0.5);
  return new THREE.Mesh(geometria, matTextura(texturaTejas(color), { side: THREE.DoubleSide }));
}

/** Hastial triangular (relleno bajo un tejado a dos aguas), en el plano Z-Y, mirando a ±X. */
function crearHastial(fondo: number, altura: number, color: number): THREE.Mesh {
  const forma = new THREE.Shape();
  forma.moveTo(-fondo / 2, 0);
  forma.lineTo(fondo / 2, 0);
  forma.lineTo(0, altura);
  forma.closePath();
  const geometria = new THREE.ExtrudeGeometry(forma, { depth: 0.2, bevelEnabled: false });
  geometria.translate(0, 0, -0.1);
  geometria.rotateY(Math.PI / 2);
  escalarUV(geometria, 0.25);
  return new THREE.Mesh(geometria, matTextura(texturaEstuco(color)));
}

export interface OpcionesCasaEntramado {
  ancho?: number;
  fondo?: number;
  pisos?: number;
  pared?: number;
  techo?: number;
  madera?: number;
}

const TECHOS_ENTRAMADO = [0xc0503a, 0xd9893b, 0xb0306a, 0x5c8fc1, 0xd46a8a];

/** Casa de entramado de madera (pueblo inglés): vigas oscuras sobre estuco claro, tejado a dos aguas y chimenea. La puerta mira a +Z. */
export function crearCasaEntramado(aleatorio: Aleatorio, o: OpcionesCasaEntramado = {}): THREE.Group {
  const casa = new THREE.Group();
  const ancho = o.ancho ?? 6 + aleatorio() * 3;
  const fondo = o.fondo ?? 5 + aleatorio() * 2;
  const pisos = o.pisos ?? 1 + Math.floor(aleatorio() * 2);
  const pared = o.pared ?? 0xf3ead8;
  const techo = o.techo ?? elegir(aleatorio, TECHOS_ENTRAMADO);
  const madera = o.madera ?? 0x4a3222;
  const altoPiso = 3;
  const alto = pisos * altoPiso;
  const base = 0.3;

  const zocalo = malla(new THREE.BoxGeometry(ancho + 0.4, 1.6, fondo + 0.4), 0x8d8378);
  zocalo.position.y = -0.5;
  const muros = new THREE.Mesh(geometriaCaja(ancho, alto, fondo), matTextura(texturaEstuco(pared)));
  muros.position.y = base + alto / 2;
  casa.add(zocalo, muros);

  // Vigas horizontales en cada forjado
  for (let f = 0; f <= pisos; f++) {
    const y = Math.min(base + f * altoPiso, base + alto - 0.11);
    for (const lado of [-1, 1]) {
      const frente = malla(new THREE.BoxGeometry(ancho + 0.1, 0.22, 0.12), madera);
      frente.position.set(0, y, lado * (fondo / 2 + 0.04));
      const costado = malla(new THREE.BoxGeometry(0.12, 0.22, fondo + 0.1), madera);
      costado.position.set(lado * (ancho / 2 + 0.04), y, 0);
      casa.add(frente, costado);
    }
  }

  // Pies derechos y ventanas en las fachadas delantera y trasera
  const vanos = Math.max(2, Math.round(ancho / 2.2));
  const puerta = Math.floor(vanos / 2);
  for (const lado of [-1, 1]) {
    const z = lado * (fondo / 2 + 0.05);
    for (let i = 0; i <= vanos; i++) {
      const poste = malla(new THREE.BoxGeometry(0.2, alto, 0.12), madera);
      poste.position.set(-ancho / 2 + (i * ancho) / vanos, base + alto / 2, z);
      casa.add(poste);
    }
    for (let f = 0; f < pisos; f++) {
      for (let i = 0; i < vanos; i++) {
        if (f === 0 && lado === 1 && i === puerta) continue;
        const ventana = crearVentanaSimple(0.9, 1.1);
        ventana.position.set(-ancho / 2 + ((i + 0.5) * ancho) / vanos, base + f * altoPiso + 1.65, lado * (fondo / 2 + 0.08));
        ventana.rotation.y = lado < 0 ? Math.PI : 0;
        casa.add(ventana);
      }
    }
  }
  // Cruces de San Andrés en los costados
  const diagonal = Math.hypot(altoPiso, fondo);
  for (const lado of [-1, 1]) {
    for (let f = 0; f < pisos; f++) {
      for (const s of [-1, 1]) {
        const aspa = malla(new THREE.BoxGeometry(0.12, diagonal, 0.16), madera);
        aspa.position.set(lado * (ancho / 2 + 0.05), base + f * altoPiso + altoPiso / 2, 0);
        aspa.rotation.x = s * Math.atan2(fondo, altoPiso);
        casa.add(aspa);
      }
    }
  }

  const puertaMadera = malla(new THREE.BoxGeometry(1.1, 2.2, 0.16), 0x5a3d28);
  puertaMadera.position.set(-ancho / 2 + ((puerta + 0.5) * ancho) / vanos, base + 1.1, fondo / 2 + 0.08);
  casa.add(puertaMadera);

  const alturaTejado = fondo * 0.5;
  const tejado = crearTejadoDosAguas(ancho + 1, fondo + 1.4, alturaTejado + 0.35, techo);
  tejado.position.y = base + alto;
  casa.add(tejado);
  for (const lado of [-1, 1]) {
    const hastial = crearHastial(fondo, alturaTejado, pared);
    hastial.position.set(lado * (ancho / 2 - 0.1), base + alto, 0);
    casa.add(hastial);
  }
  if (aleatorio() < 0.7) {
    const chimenea = malla(new THREE.BoxGeometry(0.7, 2.6, 0.7), 0x8a4a3a);
    chimenea.position.set(ancho * 0.3, base + alto + alturaTejado * 0.6, -fondo * 0.15);
    casa.add(chimenea);
  }
  return casa;
}

export interface OpcionesEdificioCiudad {
  ancho?: number;
  fondo?: number;
  pisos?: number;
  pared?: number;
  techo?: number;
  /** Radio de una cúpula sobre el tejado (0 = sin cúpula). */
  cupula?: number;
}

const PAREDES_CIUDAD = [0xf1e2c4, 0xe9d3d0, 0xd8e4d0, 0xf3e0b5, 0xdcd6ec, 0xf5efe4, 0xcfe0e8];
const TECHOS_CIUDAD = [0xb84a3a, 0x4d7fb3, 0x6e9a4a, 0x8a5a9a, 0xc9772f];

/** Edificio de ciudad de varias plantas: estuco, impostas blancas, ventanas en cuadrícula, puerta en arco y tejado a cuatro aguas. */
export function crearEdificioCiudad(aleatorio: Aleatorio, o: OpcionesEdificioCiudad = {}): THREE.Group {
  const edificio = new THREE.Group();
  const ancho = o.ancho ?? 8 + aleatorio() * 4;
  const fondo = o.fondo ?? 7 + aleatorio() * 3;
  const pisos = o.pisos ?? 2 + Math.floor(aleatorio() * 3);
  const pared = o.pared ?? elegir(aleatorio, PAREDES_CIUDAD);
  const techo = o.techo ?? elegir(aleatorio, TECHOS_CIUDAD);
  const altoPiso = 3.3;
  const alto = pisos * altoPiso;

  const zocalo = malla(new THREE.BoxGeometry(ancho + 0.4, 1.8, fondo + 0.4), 0x9a9088);
  zocalo.position.y = -0.6;
  const cuerpo = new THREE.Mesh(geometriaCaja(ancho, alto, fondo), matTextura(texturaEstuco(pared)));
  cuerpo.position.y = 0.3 + alto / 2;
  edificio.add(zocalo, cuerpo);

  for (let f = 1; f <= pisos; f++) {
    const imposta = malla(new THREE.BoxGeometry(ancho + 0.3, 0.25, fondo + 0.3), 0xf2efe6);
    imposta.position.y = 0.3 + f * altoPiso - 0.12;
    edificio.add(imposta);
  }

  const fachadas: Array<[number, number, number, number]> = [
    [0, fondo / 2, 0, ancho],
    [0, -fondo / 2, Math.PI, ancho],
    [ancho / 2, 0, Math.PI / 2, fondo],
    [-ancho / 2, 0, -Math.PI / 2, fondo],
  ];
  fachadas.forEach(([x, z, giro, largo], indiceFachada) => {
    const n = Math.max(1, Math.floor(largo / 2.6));
    for (let f = 0; f < pisos; f++) {
      for (let i = 0; i < n; i++) {
        if (f === 0 && indiceFachada === 0 && i === Math.floor(n / 2)) continue; // la puerta
        const t = -largo / 2 + ((i + 0.5) * largo) / n;
        const ventana = crearVentanaSimple(1, 1.4);
        ventana.position.set(x + Math.cos(giro) * t, 0.3 + f * altoPiso + 1.8, z - Math.sin(giro) * t);
        ventana.rotation.y = giro;
        edificio.add(ventana);
      }
    }
  });
  const nFrente = Math.max(1, Math.floor(ancho / 2.6));
  const puerta = crearPuertaArco(1.5, 2.6);
  puerta.position.set(-ancho / 2 + ((Math.floor(nFrente / 2) + 0.5) * ancho) / nFrente, 0.3, fondo / 2);
  edificio.add(puerta);

  const tejado = crearTejado({
    anchoBase: ancho + 1, fondoBase: fondo + 1, anchoCima: Math.max(ancho - fondo, 0.4), fondoCima: 0.3,
    altura: Math.min(ancho, fondo) * 0.35, curva: 1, levante: 0, segmentos: 3, color: techo,
  });
  tejado.position.y = 0.3 + alto;
  edificio.add(tejado);

  if (o.cupula) {
    const r = o.cupula;
    const tambor = malla(new THREE.CylinderGeometry(r, r, r * 0.8, 14), pared, { flatShading: false });
    tambor.position.y = 0.3 + alto + Math.min(ancho, fondo) * 0.35 + r * 0.2;
    const cupula = malla(new THREE.SphereGeometry(r * 1.05, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), techo, { flatShading: false });
    cupula.position.y = tambor.position.y + r * 0.4;
    edificio.add(tambor, cupula);
  }
  return edificio;
}

/** Torre con forma de torre de refrigeración (las "centrales eléctricas" de Shells Town), erizada de cañones. */
export function crearTorreCentral(alto: number, radio: number): THREE.Group {
  const torre = new THREE.Group();
  const perfil: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const v = i / 12;
    const r = radio * (0.6 + 0.4 * ((v - 0.72) ** 2) / (0.72 ** 2));
    perfil.push(new THREE.Vector2(r, v * alto));
  }
  const geometria = new THREE.LatheGeometry(perfil, 20);
  escalarUV(geometria, 3);
  torre.add(new THREE.Mesh(geometria, matTextura(texturaPiedra(0x6d86a8), { side: THREE.DoubleSide })));
  const rTope = perfil[perfil.length - 1].x;
  const borde = malla(new THREE.TorusGeometry(rTope, 0.5, 6, 24), 0x4f647f);
  borde.rotation.x = Math.PI / 2;
  borde.position.y = alto;
  torre.add(borde);
  // Cañones asomando alrededor de la parte alta
  for (const [yRel, cantidad] of [[0.86, 10], [0.55, 8]] as const) {
    const v = yRel;
    const r = radio * (0.6 + 0.4 * ((v - 0.72) ** 2) / (0.72 ** 2));
    for (let i = 0; i < cantidad; i++) {
      const a = (i / cantidad) * Math.PI * 2 + yRel;
      const canon = malla(new THREE.CylinderGeometry(0.35, 0.45, 2.6, 8), 0x2a2d33, { flatShading: false });
      canon.rotation.z = Math.PI / 2;
      const pivote = new THREE.Group();
      pivote.rotation.y = a;
      canon.position.set(r + 0.8, 0, 0);
      pivote.add(canon);
      pivote.position.y = v * alto;
      torre.add(pivote);
    }
  }
  return torre;
}

/** Estatua gigante del capitán Morgan "Mano de Hacha" (la que Luffy derriba del tejado de la base). */
export function crearEstatuaMorgan(): THREE.Group {
  const estatua = new THREE.Group();
  const piedra = matTextura(texturaPiedra(0xc2bdb0));
  const pieza = (an: number, al: number, fo: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geometriaCaja(an, al, fo, 2), piedra);
    m.position.set(x, y, z);
    estatua.add(m);
    return m;
  };
  pieza(3.8, 0.8, 3, 0, 0.4, 0); // peana
  pieza(1.2, 5, 1.3, -0.85, 3.3, 0); // piernas
  pieza(1.2, 5, 1.3, 0.85, 3.3, 0);
  pieza(3.8, 4.6, 2.1, 0, 8, 0); // torso con el abrigo de marine
  pieza(4.4, 5.4, 0.4, 0, 7.4, -1.2); // capa
  pieza(1.1, 4, 1.1, -2.5, 7.8, 0); // brazo izquierdo caído
  pieza(3.2, 1, 1, 3.4, 9.4, 0); // brazo derecho extendido: el del hacha
  pieza(1.7, 1.9, 1.7, 0, 11.3, 0); // cabeza
  const mandibula = new THREE.Mesh(geometriaCaja(1.9, 0.8, 1.9, 2), matTextura(texturaPiedra(0x8f949a)));
  mandibula.position.set(0, 10.5, 0.05); // la mandíbula de hierro
  estatua.add(mandibula);
  const mango = malla(new THREE.CylinderGeometry(0.22, 0.22, 4.2, 8), 0x8f949a);
  mango.position.set(5.2, 9.4, 0);
  const hoja = new THREE.Shape();
  hoja.moveTo(0, -1.4);
  hoja.quadraticCurveTo(2.2, 0, 0, 1.4);
  hoja.lineTo(0, -1.4);
  const geometriaHoja = new THREE.ExtrudeGeometry(hoja, { depth: 0.3, bevelEnabled: false });
  const cuchilla = new THREE.Mesh(geometriaHoja, matTextura(texturaPiedra(0x8f949a)));
  cuchilla.position.set(5.4, 11.1, -0.15);
  cuchilla.rotation.z = Math.PI / 2;
  estatua.add(mango, cuchilla);
  return estatua;
}

/** El cadalso de Loguetown donde ejecutaron a Gol D. Roger: plataforma alta de madera, escalera y travesaño. */
export function crearCadalso(): THREE.Group {
  const cadalso = new THREE.Group();
  const madera = matTextura(texturaMadera(0x5a3d28));
  const viga = (an: number, al: number, fo: number, x: number, y: number, z: number, rx = 0, rz = 0) => {
    const m = new THREE.Mesh(geometriaCaja(an, al, fo, 1), madera);
    m.position.set(x, y, z);
    m.rotation.set(rx, 0, rz);
    cadalso.add(m);
  };
  const lado = 9;
  const alto = 8;
  for (const x of [-lado / 2, lado / 2]) for (const z of [-lado / 2, lado / 2]) viga(0.6, alto, 0.6, x, alto / 2, z);
  const diagonal = Math.hypot(lado, alto);
  for (const s of [-1, 1]) {
    viga(0.3, diagonal, 0.3, 0, alto / 2, -lado / 2, 0, s * Math.atan2(lado, alto));
    viga(0.3, diagonal, 0.3, 0, alto / 2, lado / 2, 0, s * Math.atan2(lado, alto));
    viga(0.3, diagonal, 0.3, -lado / 2, alto / 2, 0, s * Math.atan2(lado, alto), 0);
  }
  viga(lado + 1, 0.5, lado + 1, 0, alto + 0.25, 0); // tablado
  // Escalera hacia +X
  const peldanos = 12;
  for (let i = 0; i < peldanos; i++) {
    const h = ((i + 1) / peldanos) * alto;
    viga(0.9, 0.3, 3, lado / 2 + 0.5 + (peldanos - i) * 0.75, h, 0);
  }
  viga(0.25, Math.hypot(peldanos * 0.75, alto), 0.25, lado / 2 + 0.5 + (peldanos * 0.75) / 2, alto / 2, -1.6, 0, Math.atan2(peldanos * 0.75, alto));
  viga(0.25, Math.hypot(peldanos * 0.75, alto), 0.25, lado / 2 + 0.5 + (peldanos * 0.75) / 2, alto / 2, 1.6, 0, Math.atan2(peldanos * 0.75, alto));
  // Pórtico en lo alto
  viga(0.5, 5, 0.5, -2.6, alto + 3, 0);
  viga(0.5, 5, 0.5, 2.6, alto + 3, 0);
  viga(6.4, 0.55, 0.55, 0, alto + 5.4, 0);
  // Barandilla del tablado
  for (const z of [-lado / 2 - 0.3, lado / 2 + 0.3]) viga(lado + 1, 0.15, 0.15, 0, alto + 1.4, z);
  viga(0.15, 0.15, lado + 1, -lado / 2 - 0.3, alto + 1.4, 0);
  return cadalso;
}

/** La carpa de circo de Buggy sobre el tejado del Drinker Pub: tambor y cono a rayas rojas y blancas. */
export function crearCarpaCirco(radio: number, alto: number): THREE.Group {
  const carpa = new THREE.Group();
  const lona = matTextura(texturaRayas(0xc0392b, 0xf4efe6, 8), { side: THREE.DoubleSide });
  const tambor = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, alto * 0.4, 24, 1, true), lona);
  tambor.position.y = alto * 0.2;
  const cono = new THREE.Mesh(new THREE.ConeGeometry(radio * 1.1, alto * 0.6, 24, 1, true), lona);
  cono.position.y = alto * 0.7;
  const mastil = malla(new THREE.CylinderGeometry(0.08, 0.08, 3, 6), 0x3a3a3a);
  mastil.position.y = alto + 1.5;
  // Bandera de Buggy (simplificada): calavera con nariz roja
  const lienzo = document.createElement('canvas');
  lienzo.width = 128;
  lienzo.height = 80;
  const ctx = lienzo.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 128, 80);
    ctx.fillStyle = '#f4f1e8';
    ctx.beginPath();
    ctx.arc(64, 40, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d0302a';
    ctx.beginPath();
    ctx.arc(64, 44, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  const bandera = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide }));
  bandera.position.set(1.25, alto + 2.4, 0);
  carpa.add(tambor, cono, mastil, bandera);
  return carpa;
}

/** La mansión de Kaya: cuerpo central con pórtico de columnas y frontón, dos alas, tejado de pizarra y chimeneas. Mira a +Z. */
export function crearMansion(aleatorio: Aleatorio): THREE.Group {
  const mansion = new THREE.Group();
  const estuco = matTextura(texturaEstuco(0xf3ead8));
  const pizarra = 0x4a5566;
  const cuerpo = (ancho: number, alto: number, fondo: number, x: number, pisos: number) => {
    const bloque = new THREE.Mesh(geometriaCaja(ancho, alto, fondo), estuco);
    bloque.position.set(x, 0.3 + alto / 2, 0);
    const zocalo = malla(new THREE.BoxGeometry(ancho + 0.4, 1.4, fondo + 0.4), 0x9a9088);
    zocalo.position.set(x, -0.4, 0);
    mansion.add(bloque, zocalo);
    const n = Math.max(2, Math.floor(ancho / 2.8));
    for (let f = 0; f < pisos; f++) {
      for (let i = 0; i < n; i++) {
        for (const lado of [-1, 1]) {
          const ventana = crearVentanaSimple(1.1, 1.8, 0xffffff, 0x3a5068);
          ventana.position.set(x - ancho / 2 + ((i + 0.5) * ancho) / n, 0.3 + f * (alto / pisos) + 2, lado * (fondo / 2 + 0.07));
          ventana.rotation.y = lado < 0 ? Math.PI : 0;
          mansion.add(ventana);
        }
      }
    }
    const tejado = crearTejado({
      anchoBase: ancho + 1.2, fondoBase: fondo + 1.2, anchoCima: Math.max(ancho - fondo, 0.4), fondoCima: 0.3,
      altura: fondo * 0.4, curva: 1, levante: 0, segmentos: 3, color: pizarra,
    });
    tejado.position.set(x, 0.3 + alto, 0);
    mansion.add(tejado);
    for (const s of [-1, 1]) {
      const chimenea = malla(new THREE.BoxGeometry(0.9, 3, 0.9), 0x8a7a6a);
      chimenea.position.set(x + s * ancho * 0.3, 0.3 + alto + fondo * 0.25, 0);
      mansion.add(chimenea);
    }
  };
  cuerpo(22, 10, 12, 0, 2);
  cuerpo(11, 7, 10, -16.5, 2);
  cuerpo(11, 7, 10, 16.5, 2);

  // Pórtico de entrada con frontón
  for (const x of [-4.5, -1.5, 1.5, 4.5]) {
    const columna = crearColumna(7, 0.4, 0xffffff);
    columna.position.set(x, 0.3, 8.5);
    mansion.add(columna);
  }
  const entablamento = malla(new THREE.BoxGeometry(11, 0.8, 3.4), 0xffffff);
  entablamento.position.set(0, 7.7, 7.6);
  const forma = new THREE.Shape();
  forma.moveTo(-5.5, 0);
  forma.lineTo(5.5, 0);
  forma.lineTo(0, 2.4);
  forma.closePath();
  const fronton = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 3.4, bevelEnabled: false }), matTextura(texturaEstuco(0xffffff)));
  fronton.position.set(0, 8.1, 5.9);
  const puerta = crearPuertaArco(2.4, 3.6);
  puerta.position.set(0, 0.3, 6);
  const escalinata = malla(new THREE.BoxGeometry(11, 0.6, 3), 0xd8d2c2);
  escalinata.position.set(0, 0, 9.5);
  mansion.add(entablamento, fronton, puerta, escalinata);
  mansion.rotation.y = (aleatorio() - 0.5) * 0.001;
  return mansion;
}

/** Casa en ruinas: muros rotos y ennegrecidos, tejado hundido y escombros. */
export function crearRuina(aleatorio: Aleatorio): THREE.Group {
  const ruina = new THREE.Group();
  const ancho = 6 + aleatorio() * 3;
  const fondo = 5 + aleatorio() * 2;
  const tono = () => elegir(aleatorio, [0x6d655c, 0x57504a, 0x7a7067]);
  const muros: Array<[number, number, number, number]> = [
    [0, -fondo / 2, ancho, 0],
    [0, fondo / 2, ancho, 0],
    [-ancho / 2, 0, fondo, Math.PI / 2],
    [ancho / 2, 0, fondo, Math.PI / 2],
  ];
  for (const [x, z, largo, giro] of muros) {
    if (aleatorio() < 0.25) continue;
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

/** Tienda de campaña de lona (refugio). */
export function crearTienda(aleatorio: Aleatorio): THREE.Group {
  const tienda = new THREE.Group();
  const lona = elegir(aleatorio, [0xd9c9a0, 0xc9b98a, 0xb8a88a]);
  const forma = new THREE.Shape();
  forma.moveTo(-1.6, 0);
  forma.lineTo(1.6, 0);
  forma.lineTo(0, 2.2);
  forma.closePath();
  const geometria = new THREE.ExtrudeGeometry(forma, { depth: 3.5, bevelEnabled: false });
  geometria.translate(0, 0, -1.75);
  tienda.add(malla(geometria, lona));
  tienda.rotation.y = aleatorio() * Math.PI;
  return tienda;
}

/** Vaca de las afueras de Villa Foosha. */
export function crearVaca(aleatorio: Aleatorio): THREE.Group {
  const vaca = new THREE.Group();
  const cuerpo = malla(new THREE.BoxGeometry(0.9, 0.85, 1.8), 0xf4f2ee);
  cuerpo.position.y = 1.1;
  const mancha = malla(new THREE.BoxGeometry(0.92, 0.5, 0.7), 0x2a2a2a);
  mancha.position.set(0, 1.25, 0.2 - aleatorio() * 0.5);
  const cabeza = malla(new THREE.BoxGeometry(0.5, 0.55, 0.6), 0xf4f2ee);
  cabeza.position.set(0, 1.35, 1.1);
  const morro = malla(new THREE.BoxGeometry(0.42, 0.28, 0.2), 0xe0a0a0);
  morro.position.set(0, 1.2, 1.45);
  vaca.add(cuerpo, mancha, cabeza, morro);
  for (const x of [-0.3, 0.3]) for (const z of [-0.65, 0.65]) {
    const pata = malla(new THREE.BoxGeometry(0.18, 0.7, 0.18), 0xe8e4dc);
    pata.position.set(x, 0.35, z);
    vaca.add(pata);
  }
  vaca.rotation.y = aleatorio() * Math.PI * 2;
  return vaca;
}

/** Valla de madera rectangular (cercados de ganado, huertos). */
export function crearValla(ancho: number, fondo: number, color = 0x8a6a45): THREE.Group {
  const valla = new THREE.Group();
  const lados: Array<[number, number, number, number]> = [
    [0, -fondo / 2, ancho, 0], [0, fondo / 2, ancho, 0], [-ancho / 2, 0, fondo, Math.PI / 2], [ancho / 2, 0, fondo, Math.PI / 2],
  ];
  for (const [x, z, largo, giro] of lados) {
    for (const y of [0.5, 0.95]) {
      const travesano = malla(new THREE.BoxGeometry(largo, 0.1, 0.08), color);
      travesano.position.set(x, y, z);
      travesano.rotation.y = giro;
      valla.add(travesano);
    }
    const n = Math.max(2, Math.round(largo / 2.5));
    for (let i = 0; i <= n; i++) {
      const t = -largo / 2 + (i * largo) / n;
      const estaca = malla(new THREE.BoxGeometry(0.14, 1.2, 0.14), color);
      estaca.position.set(x + Math.cos(giro) * t, 0.6, z - Math.sin(giro) * t);
      valla.add(estaca);
    }
  }
  return valla;
}
