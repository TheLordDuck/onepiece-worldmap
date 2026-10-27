// El Baratie (cap. 43–68), según la wiki y la captura de referencia (docs/referencias/east-blue.md):
// casco ovalado de fondo redondo, aletas desplegadas como plataforma de combate,
// tres cubiertas (comedor, cocina y camarotes de los 23 cocineros), cabeza de pez
// (el Sabagashira I) con cañones en la boca, cañones en los costados y velas a rayas.
import * as THREE from 'three';
import { crearCartel, malla } from './utilidades';
import {
  colocarVentanas,
  crearBarandillaContorno,
  crearTejado,
  crearVentanaArco,
  escalarUV,
  fusionarEstaticos,
  geometriaCaja,
  matTextura,
} from './arquitectura';
import { texturaEstuco, texturaMadera, texturaRayas } from '../texturas';
import type { Actualizable, AlturaEn, ConstructorIsla } from '../../tipos';

const VERDE = 0x3fae7a;
const BLANCO = 0xf2efe6;
const GRANATE = 0x6b2a26;
const AMARILLO = 0xf2c230;
const ROJO = 0xc0392b;
const MADERA_CUBIERTA = 0x7a6150;
const VIDRIO = 0x2d4a6b;

/** Estadio (rectángulo con extremos semicirculares) en el plano X-Y; el largo va en Y. */
function formaEstadio(ancho: number, largo: number): THREE.Shape {
  const r = ancho / 2;
  const recto = Math.max(largo - ancho, 0);
  const forma = new THREE.Shape();
  forma.moveTo(-r, -recto / 2);
  forma.lineTo(-r, recto / 2);
  forma.absarc(0, recto / 2, r, Math.PI, 0, true);
  forma.lineTo(r, -recto / 2);
  forma.absarc(0, -recto / 2, r, 0, Math.PI, true);
  return forma;
}

/** Prisma vertical con planta de estadio, de y = 0 a y = alto. UV en metros / `metros`. */
function prismaEstadio(ancho: number, largo: number, alto: number, material: THREE.Material, metros = 4): THREE.Mesh {
  const geometria = new THREE.ExtrudeGeometry(formaEstadio(ancho, largo), { depth: alto, bevelEnabled: false, curveSegments: 16 });
  geometria.rotateX(-Math.PI / 2);
  escalarUV(geometria, 1 / metros);
  return new THREE.Mesh(geometria, material);
}

/** Puntos repartidos por el contorno de un estadio (largo en Z), con el giro que mira hacia fuera. */
function contornoEstadio(ancho: number, largo: number, n: number): Array<{ x: number; z: number; giro: number }> {
  const r = ancho / 2;
  const recto = Math.max(largo - ancho, 0);
  const perimetro = 2 * recto + 2 * Math.PI * r;
  const puntos: Array<{ x: number; z: number; giro: number }> = [];
  for (let i = 0; i < n; i++) {
    let s = ((i + 0.5) / n) * perimetro;
    let x: number;
    let z: number;
    let nx: number;
    let nz: number;
    if (s < recto) {
      [x, z, nx, nz] = [r, -recto / 2 + s, 1, 0];
    } else if ((s -= recto) < Math.PI * r) {
      const a = s / r;
      [x, z, nx, nz] = [r * Math.cos(a), recto / 2 + r * Math.sin(a), Math.cos(a), Math.sin(a)];
    } else if ((s -= Math.PI * r) < recto) {
      [x, z, nx, nz] = [-r, recto / 2 - s, -1, 0];
    } else {
      const a = Math.PI + (s - recto) / r;
      [x, z, nx, nz] = [r * Math.cos(a), -recto / 2 + r * Math.sin(a), Math.cos(a), Math.sin(a)];
    }
    puntos.push({ x, z, giro: Math.atan2(nx, nz) });
  }
  return puntos;
}

/** Vela cuadrada abombada, con rayas rojas y blancas. Mira hacia +Z. */
function crearVela(ancho: number, alto: number): THREE.Mesh {
  const geometria = new THREE.PlaneGeometry(ancho, alto, 10, 6);
  const p = geometria.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = (2 * p.getX(i)) / ancho;
    const v = (2 * p.getY(i)) / alto;
    p.setZ(i, 1.4 * (1 - u * u) * (1 - 0.4 * v * v));
  }
  geometria.computeVertexNormals();
  return new THREE.Mesh(geometria, matTextura(texturaRayas(ROJO, BLANCO, 5), { side: THREE.DoubleSide }));
}

/** Cabeza de pez de la proa (el Sabagashira I): blanca, labios naranjas, collar amarillo y cañones en la boca. */
function crearCabezaPez(): THREE.Group {
  const cabeza = new THREE.Group();
  const craneo = malla(new THREE.SphereGeometry(1, 20, 14), 0xf4f2ee, { flatShading: false });
  craneo.scale.set(7, 6.5, 9);
  cabeza.add(craneo);

  const collar = malla(new THREE.TorusGeometry(6.6, 1.3, 10, 28), AMARILLO, { flatShading: false });
  collar.position.z = -3.5;
  cabeza.add(collar);

  // Boca abierta con labios gruesos
  const labios = malla(new THREE.TorusGeometry(2.6, 1.1, 10, 24), 0xe8742a, { flatShading: false });
  labios.scale.set(1.25, 0.8, 1);
  labios.position.set(0, -1.6, 8.6);
  const garganta = malla(new THREE.CircleGeometry(2.6, 20), 0x3a1410);
  garganta.scale.set(1.25, 0.8, 1);
  garganta.position.set(0, -1.6, 8.5);
  cabeza.add(labios, garganta);

  // Tres cañones asomando por la boca
  for (const x of [-1.4, 0, 1.4]) {
    const canon = malla(new THREE.CylinderGeometry(0.55, 0.65, 4, 12), 0x2a2d33, { flatShading: false });
    canon.rotation.x = Math.PI / 2;
    canon.position.set(x, -1.6, 9.6);
    const boca = malla(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12), 0x0c0c0c);
    boca.rotation.x = Math.PI / 2;
    boca.position.set(x, -1.6, 11.62);
    cabeza.add(canon, boca);
  }

  for (const lado of [-1, 1]) {
    const ojo = malla(new THREE.SphereGeometry(1.5, 12, 10), 0xffffff, { flatShading: false });
    ojo.position.set(lado * 5.2, 2.2, 5.2);
    const pupila = malla(new THREE.SphereGeometry(0.85, 12, 10), 0x111111, { flatShading: false });
    pupila.position.set(lado * 6.1, 2.4, 5.8);
    cabeza.add(ojo, pupila);
  }
  return cabeza;
}

/** Bandera del Baratie (simplificada): calavera con gorro de cocinero. */
function crearBandera(): THREE.Mesh {
  const lienzo = document.createElement('canvas');
  lienzo.width = 192;
  lienzo.height = 128;
  const ctx = lienzo.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 192, 128);
    ctx.fillStyle = '#f4f1e8';
    ctx.beginPath();
    ctx.arc(96, 74, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(72, 30, 48, 22); // gorro
    for (const x of [74, 96, 118]) {
      ctx.beginPath();
      ctx.arc(x, 30, 13, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#121212';
    for (const x of [86, 106]) {
      ctx.beginPath();
      ctx.arc(x, 72, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide }));
}

export const construirBaratie: ConstructorIsla = (aleatorio) => {
  const grupo = new THREE.Group();
  const barco = new THREE.Group();
  grupo.add(barco);

  const estucoVerde = matTextura(texturaEstuco(VERDE));
  const cubierta = matTextura(texturaMadera(MADERA_CUBIERTA));
  const granate = matTextura(texturaMadera(GRANATE));

  // --- Aletas desplegadas: la gran plataforma ovalada de combate a ras del agua ---
  const aletas = new THREE.Group();
  const formaAletas = new THREE.Shape();
  formaAletas.absellipse(0, 0, 58, 72, 0, Math.PI * 2, false, 0);
  const geometriaAletas = new THREE.ExtrudeGeometry(formaAletas, { depth: 1.4, bevelEnabled: false, curveSegments: 48 });
  geometriaAletas.rotateX(-Math.PI / 2);
  const plataforma = new THREE.Mesh(geometriaAletas, cubierta);
  plataforma.position.y = 0.4;
  const canto = new THREE.Mesh(
    new THREE.ExtrudeGeometry(formaAletas, { depth: 0.6, bevelEnabled: false, curveSegments: 48 }).rotateX(-Math.PI / 2).scale(1.01, 1, 1.01),
    granate,
  );
  canto.position.y = 0.1;
  aletas.add(plataforma, canto);
  // Juntas de las aletas (se pliegan en dos mitades bajo el casco)
  const junta = malla(new THREE.BoxGeometry(0.3, 0.1, 144), 0x3a2a20);
  junta.position.y = 1.85;
  aletas.add(junta);
  // Barriles y cajas sobre la plataforma
  for (let i = 0; i < 16; i++) {
    const angulo = aleatorio() * Math.PI * 2;
    const r = 0.55 + aleatorio() * 0.35;
    const x = Math.cos(angulo) * 58 * r;
    const z = Math.sin(angulo) * 72 * r;
    if (Math.abs(x) < 18 && Math.abs(z) < 34) continue;
    const objeto = aleatorio() < 0.5
      ? malla(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 10), 0x5a3d28)
      : malla(new THREE.BoxGeometry(1.2, 1.2, 1.2), 0x6b4a30);
    objeto.position.set(x, 2.4, z);
    objeto.rotation.y = aleatorio() * Math.PI;
    aletas.add(objeto);
  }
  barco.add(aletas);

  // --- Casco ovalado ---
  const casco = prismaEstadio(30, 56, 5, granate, 1);
  casco.position.y = -2;
  barco.add(casco);
  const bordeCasco = prismaEstadio(31, 57, 0.5, matTextura(texturaEstuco(AMARILLO)));
  bordeCasco.position.y = 3;
  barco.add(bordeCasco);
  // Cañones en los costados
  for (const lado of [-1, 1]) {
    for (const z of [-15, -5, 5, 15]) {
      const canon = malla(new THREE.CylinderGeometry(0.4, 0.5, 2.4, 10), 0x2a2d33, { flatShading: false });
      canon.rotation.z = Math.PI / 2;
      canon.position.set(lado * 15.6, 1.6, z);
      barco.add(canon);
    }
  }

  // --- Cubierta baja: el comedor ---
  const pisos = [
    { ancho: 26, largo: 44, alto: 7, ventanas: 30 },
    { ancho: 20, largo: 34, alto: 6, ventanas: 22 },
  ];
  let y = 3.5;
  pisos.forEach((piso, i) => {
    const muros = prismaEstadio(piso.ancho, piso.largo, piso.alto, estucoVerde);
    muros.position.y = y;
    const franja = prismaEstadio(piso.ancho + 0.4, piso.largo + 0.4, 0.6, matTextura(texturaEstuco(BLANCO)));
    franja.position.y = y + piso.alto - 0.6;
    const suelo = prismaEstadio(piso.ancho + 3, piso.largo + 3, 0.4, cubierta, 1);
    suelo.position.y = y + piso.alto;
    barco.add(muros, franja, suelo);

    contornoEstadio(piso.ancho, piso.largo, piso.ventanas).forEach(({ x, z, giro }, k) => {
      // Puertas rojas en los costados; el resto, ventanas en arco con marco amarillo
      const esPuerta = i === 0 && (k === Math.round(piso.ventanas / 4 - 0.5) || k === Math.round((3 * piso.ventanas) / 4 - 0.5));
      const pieza = esPuerta ? malla(new THREE.BoxGeometry(1.8, 3.2, 0.3), ROJO) : crearVentanaArco(1.3, 2.4, VIDRIO, AMARILLO);
      pieza.position.set(x * 1.005, y + (esPuerta ? 1.6 : piso.alto * 0.3), z * 1.005);
      pieza.rotation.y = giro;
      barco.add(pieza);
    });

    const borde = contornoEstadio(piso.ancho + 2.6, piso.largo + 2.6, 64).map(({ x, z }) => new THREE.Vector3(x, 0, z));
    const barandilla = crearBarandillaContorno(borde, 1.1, 0.55, 0x3a2a20);
    barandilla.position.y = y + piso.alto + 0.4;
    barco.add(barandilla);
    y += piso.alto + 0.4;
  });

  // Carteles en los costados de la cubierta media
  for (const lado of [-1, 1]) {
    const cartel = crearCartel('BARATIE', { ancho: 8, alto: 1.6, fondo: '#f2efe6', color: '#1f4a8a' });
    cartel.position.set(lado * 10.05, 3.5 + 7.4 + 4.6, 4);
    cartel.rotation.y = lado * Math.PI / 2;
    barco.add(cartel);
  }

  // --- Cubierta alta: camarotes de los cocineros, con tejado rojo ---
  const alta = { ancho: 13, fondo: 20, alto: 5 };
  const camarotes = new THREE.Mesh(geometriaCaja(alta.ancho, alta.alto, alta.fondo), estucoVerde);
  camarotes.position.y = y + alta.alto / 2;
  barco.add(camarotes);
  const grupoAlta = new THREE.Group();
  grupoAlta.position.y = y;
  colocarVentanas(grupoAlta, {
    ancho: alta.ancho, fondo: alta.fondo, y: 1.2, porLado: [3, 5],
    ventana: { ancho: 1, alto: 2 }, coloresVidrio: [VIDRIO], colorMarco: AMARILLO, aleatorio,
    saltar: (lado, indice) => lado === 'frente' && indice === 1,
  });
  const puertaAlta = malla(new THREE.BoxGeometry(1.6, 2.8, 0.3), ROJO);
  puertaAlta.position.set(0, 1.4, alta.fondo / 2 + 0.1);
  const cartelRestaurante = crearCartel('RESTAURANT', { ancho: 8, alto: 1.4, fondo: '#f2efe6', color: '#1f4a8a' });
  cartelRestaurante.position.set(0, 3.9, alta.fondo / 2 + 0.06);
  grupoAlta.add(puertaAlta, cartelRestaurante);
  const tejado = crearTejado({
    anchoBase: alta.ancho + 2, fondoBase: alta.fondo + 2, anchoCima: 2, fondoCima: alta.fondo - 6,
    altura: 4.5, curva: 1.1, levante: 0, color: 0xa8322c,
  });
  tejado.position.y = alta.alto;
  grupoAlta.add(tejado);
  barco.add(grupoAlta);
  const cimaTejado = y + alta.alto + 4.5;

  // --- Proa: cabeza de pez ---
  const cabeza = crearCabezaPez();
  cabeza.position.set(0, 3.5, 30);
  barco.add(cabeza);

  // --- Mástiles, velas, banderas y jarcia ---
  const cuerdas: number[] = [];
  for (const [z, alto, velas] of [[14, 34, [[15, 7, 22], [12, 6, 31]]], [-14, 30, [[14, 6.5, 20], [10, 5, 28]]]] as const) {
    const base = 3.5 + 7.4;
    const mastil = malla(new THREE.CylinderGeometry(0.45, 0.6, alto, 8), 0x5a3d28, { flatShading: false });
    mastil.position.set(0, base + alto / 2, z);
    barco.add(mastil);
    const cofa = malla(new THREE.CylinderGeometry(1.4, 1.1, 0.8, 10), 0x5a3d28);
    cofa.position.set(0, base + alto * 0.82, z);
    barco.add(cofa);
    for (const [ancho, altoVela, yVela] of velas) {
      const verga = malla(new THREE.CylinderGeometry(0.22, 0.22, ancho + 1.5, 6), 0x5a3d28);
      verga.rotation.z = Math.PI / 2;
      verga.position.set(0, base + yVela - 3.5 + altoVela / 2, z + 0.4);
      const vela = crearVela(ancho, altoVela);
      vela.position.set(0, base + yVela - 3.5, z + 0.6);
      barco.add(verga, vela);
    }
    const bandera = crearBandera();
    bandera.position.set(1.6, base + alto + 0.6, z);
    barco.add(bandera);
    const tope = new THREE.Vector3(0, base + alto, z);
    for (const destino of [[0, 4, 36], [0, 4, -28], [15, 4, z], [-15, 4, z]]) cuerdas.push(...tope.toArray(), ...destino);
  }
  const jarcia = new THREE.BufferGeometry();
  jarcia.setAttribute('position', new THREE.Float32BufferAttribute(cuerdas, 3));
  barco.add(new THREE.LineSegments(jarcia, new THREE.LineBasicMaterial({ color: 0x3a2a20 })));

  // El barco entero se mece, así que se fusiona por dentro (la fusión de la isla lo salta por ser animado)
  fusionarEstaticos(barco);
  const actualizar: Actualizable = (t) => {
    barco.position.y = Math.sin(t * 0.8) * 0.3;
    barco.rotation.z = Math.sin(t * 0.6) * 0.008;
    barco.rotation.x = Math.sin(t * 0.5) * 0.006;
  };
  barco.userData.actualizar = actualizar;

  // Se puede "pisar" la plataforma de las aletas y las cubiertas
  const alturaEn: AlturaEn = (x, z) => {
    if ((x / 58) ** 2 + (z / 72) ** 2 > 1) return -Infinity;
    if (Math.abs(x) < 13 && Math.abs(z) < 22) return cimaTejado - 4;
    return 1.8;
  };

  return {
    grupo,
    alturaEn,
    radio: 70,
    alturaEtiqueta: 58,
    lugares: [{ nombre: 'Restaurante flotante', posicion: [0, 30, 0] }],
  };
};
