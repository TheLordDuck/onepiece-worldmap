// Piezas de arquitectura detallada: tejados de pagoda, ventanas en arco, balaustradas,
// columnas, bóvedas, puertas y glorietas. Más la fusión de mallas para que todo siga fluido.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, malla } from './utilidades';
import { texturaEstuco, texturaMadera, texturaPiedra, texturaTejas } from '../texturas';
import type { Aleatorio } from '../../tipos';

// ---------------------------------------------------------------------------
// Materiales y geometrías base
// ---------------------------------------------------------------------------

type OpcionesMaterialTextura = Omit<THREE.MeshLambertMaterialParameters, 'map'>;

const materialesTextura = new Map<string, THREE.MeshLambertMaterial>();

/** Material con textura, compartido entre todas las piezas que usen la misma. */
export function matTextura(textura: THREE.Texture, opciones: OpcionesMaterialTextura = {}): THREE.MeshLambertMaterial {
  const clave = `${textura.uuid}|${JSON.stringify(opciones)}`;
  let material = materialesTextura.get(clave);
  if (!material) {
    material = new THREE.MeshLambertMaterial({ map: textura, ...opciones });
    materialesTextura.set(clave, material);
  }
  return material;
}

/** Caja con UVs en metros: la textura conserva su tamaño real sea cual sea la caja. */
export function geometriaCaja(ancho: number, alto: number, fondo: number, metrosPorRepeticion = 4): THREE.BoxGeometry {
  const geometria = new THREE.BoxGeometry(ancho, alto, fondo);
  const uv = geometria.attributes.uv;
  // Orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z (4 vértices cada una)
  const tamanos: Array<[number, number]> = [
    [fondo, alto], [fondo, alto], [ancho, fondo], [ancho, fondo], [ancho, alto], [ancho, alto],
  ];
  for (let cara = 0; cara < 6; cara++) {
    const [su, sv] = tamanos[cara];
    for (let i = 0; i < 4; i++) {
      const k = cara * 4 + i;
      uv.setXY(k, (uv.getX(k) * su) / metrosPorRepeticion, (uv.getY(k) * sv) / metrosPorRepeticion);
    }
  }
  return geometria;
}

/** Contorno de arco: rectángulo de `yBase` a `yCentro` rematado por un semicírculo de `radio`. */
function arco(radio: number, yCentro: number, yBase: number): THREE.Shape {
  const forma = new THREE.Shape();
  forma.moveTo(-radio, yBase);
  forma.lineTo(radio, yBase);
  forma.lineTo(radio, yCentro);
  forma.absarc(0, yCentro, radio, 0, Math.PI, false);
  forma.lineTo(-radio, yBase);
  return forma;
}

// ---------------------------------------------------------------------------
// Tejado de pagoda
// ---------------------------------------------------------------------------

export interface OpcionesTejado {
  anchoBase: number;
  fondoBase: number;
  /** Rectángulo superior; 0 para tejado en punta. */
  anchoCima: number;
  fondoCima: number;
  altura: number;
  /** >1 hace el alero más plano y la parte alta más empinada (curva oriental). */
  curva?: number;
  /** Cuánto se levantan las esquinas del alero. */
  levante?: number;
  segmentos?: number;
  color?: number;
}

/** Tejado a cuatro aguas con aleros curvados, esquinas levantadas, tejas, cumbreras y canto de madera. */
export function crearTejado({
  anchoBase,
  fondoBase,
  anchoCima,
  fondoCima,
  altura,
  curva = 1.8,
  levante = 1,
  segmentos = 12,
  color = 0xb5543a,
}: OpcionesTejado): THREE.Group {
  const tejado = new THREE.Group();
  const base = [
    new THREE.Vector2(-anchoBase / 2, -fondoBase / 2),
    new THREE.Vector2(anchoBase / 2, -fondoBase / 2),
    new THREE.Vector2(anchoBase / 2, fondoBase / 2),
    new THREE.Vector2(-anchoBase / 2, fondoBase / 2),
  ];
  const cima = [
    new THREE.Vector2(-anchoCima / 2, -fondoCima / 2),
    new THREE.Vector2(anchoCima / 2, -fondoCima / 2),
    new THREE.Vector2(anchoCima / 2, fondoCima / 2),
    new THREE.Vector2(-anchoCima / 2, fondoCima / 2),
  ];

  /** Punto del faldón `cara` en (u a lo largo del alero, v desde el alero hasta la cima). */
  const punto = (cara: number, u: number, v: number, destino: THREE.Vector3) => {
    const a = base[cara];
    const b = base[(cara + 1) % 4];
    const c = cima[cara];
    const d = cima[(cara + 1) % 4];
    const bx = a.x + (b.x - a.x) * u;
    const bz = a.y + (b.y - a.y) * u;
    const tx = c.x + (d.x - c.x) * u;
    const tz = c.y + (d.y - c.y) * u;
    const alzado = levante * (1 - v) ** 2 * Math.abs(2 * u - 1) ** 3;
    return destino.set(bx + (tx - bx) * v, altura * v ** curva + alzado, bz + (tz - bz) * v);
  };

  const posiciones: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const canto: number[] = [];
  const p = new THREE.Vector3();
  const fila = segmentos + 1;

  for (let cara = 0; cara < 4; cara++) {
    const inicio = posiciones.length / 3;
    const largo = base[cara].distanceTo(base[(cara + 1) % 4]);
    const medioBase = base[cara].clone().add(base[(cara + 1) % 4]).multiplyScalar(0.5);
    const medioCima = cima[cara].clone().add(cima[(cara + 1) % 4]).multiplyScalar(0.5);
    const pendiente = Math.hypot(medioBase.distanceTo(medioCima), altura);

    for (let j = 0; j <= segmentos; j++) {
      const v = j / segmentos;
      for (let i = 0; i <= segmentos; i++) {
        const u = i / segmentos;
        punto(cara, u, v, p);
        posiciones.push(p.x, p.y, p.z);
        uvs.push((u * largo) / 2, (v * pendiente) / 2);
      }
    }
    for (let j = 0; j < segmentos; j++) {
      for (let i = 0; i < segmentos; i++) {
        const a = inicio + j * fila + i;
        indices.push(a, a + fila, a + 1, a + 1, a + fila, a + fila + 1);
      }
    }

    // Canto de madera bajo el alero
    for (let i = 0; i < segmentos; i++) {
      const p0 = punto(cara, i / segmentos, 0, new THREE.Vector3());
      const p1 = punto(cara, (i + 1) / segmentos, 0, new THREE.Vector3());
      canto.push(p0.x, p0.y, p0.z, p0.x, p0.y - 0.5, p0.z, p1.x, p1.y, p1.z);
      canto.push(p1.x, p1.y, p1.z, p0.x, p0.y - 0.5, p0.z, p1.x, p1.y - 0.5, p1.z);
    }

    // Cumbrera en la arista de la esquina
    const puntosArista: THREE.Vector3[] = [];
    for (let j = 0; j <= segmentos; j++) puntosArista.push(punto(cara, 0, j / segmentos, new THREE.Vector3()));
    const cumbrera = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntosArista), segmentos * 2, 0.22, 5);
    tejado.add(malla(cumbrera, new THREE.Color(color).multiplyScalar(0.7).getHex()));
  }

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometria.setIndex(indices);
  geometria.computeVertexNormals();
  tejado.add(new THREE.Mesh(geometria, matTextura(texturaTejas(color), { side: THREE.DoubleSide })));

  const geometriaCanto = new THREE.BufferGeometry();
  geometriaCanto.setAttribute('position', new THREE.Float32BufferAttribute(canto, 3));
  geometriaCanto.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((canto.length / 3) * 2), 2));
  geometriaCanto.computeVertexNormals();
  tejado.add(new THREE.Mesh(geometriaCanto, mat(0x5a2e1f, { side: THREE.DoubleSide })));

  if (anchoCima > 0.01) {
    const remate = malla(new THREE.BoxGeometry(anchoCima, 0.3, fondoCima), new THREE.Color(color).multiplyScalar(0.7).getHex());
    remate.position.y = altura + 0.15;
    tejado.add(remate);
  }
  return tejado;
}

// ---------------------------------------------------------------------------
// Ventanas, puertas, balaustradas, columnas, bóvedas
// ---------------------------------------------------------------------------

interface GeometriasVentana {
  marco: THREE.BufferGeometry;
  vidrio: THREE.BufferGeometry;
  parteluz: THREE.BufferGeometry;
  travesano: THREE.BufferGeometry;
  alfeizar: THREE.BufferGeometry;
}

const cacheVentanas = new Map<string, GeometriasVentana>();

function geometriasVentana(ancho: number, alto: number): GeometriasVentana {
  const clave = `${ancho}x${alto}`;
  const existente = cacheVentanas.get(clave);
  if (existente) return existente;

  const grosor = Math.max(0.1, ancho * 0.11);
  const yArco = alto - ancho / 2;
  const contorno = arco(ancho / 2, yArco, 0);
  contorno.holes.push(arco(ancho / 2 - grosor, yArco, grosor));
  const geometrias: GeometriasVentana = {
    marco: new THREE.ExtrudeGeometry(contorno, { depth: 0.22, bevelEnabled: false }),
    vidrio: new THREE.ExtrudeGeometry(arco(ancho / 2 - grosor, yArco, grosor), { depth: 0.04, bevelEnabled: false }),
    parteluz: new THREE.BoxGeometry(0.07, alto - grosor * 2, 0.08),
    travesano: new THREE.BoxGeometry(ancho - grosor * 2, 0.07, 0.08),
    alfeizar: new THREE.BoxGeometry(ancho * 1.25, 0.14, 0.4),
  };
  cacheVentanas.set(clave, geometrias);
  return geometrias;
}

/** Ventana con arco de medio punto, marco de madera, vidrio de color y cruceta. Mira hacia +Z. */
export function crearVentanaArco(ancho: number, alto: number, colorVidrio: number, colorMarco = 0x5a2e1f): THREE.Group {
  const g = geometriasVentana(ancho, alto);
  const ventana = new THREE.Group();
  const madera = colorMarco;
  ventana.add(new THREE.Mesh(g.marco, mat(madera)));
  const vidrio = new THREE.Mesh(g.vidrio, mat(colorVidrio, { emissive: colorVidrio, emissiveIntensity: 0.15 }));
  vidrio.position.z = 0.04;
  const parteluz = new THREE.Mesh(g.parteluz, mat(madera));
  parteluz.position.set(0, alto / 2, 0.12);
  const travesano = new THREE.Mesh(g.travesano, mat(madera));
  travesano.position.set(0, alto - ancho / 2, 0.12);
  const alfeizar = new THREE.Mesh(g.alfeizar, mat(0xd8d2c2));
  alfeizar.position.set(0, -0.05, 0.15);
  ventana.add(vidrio, parteluz, travesano, alfeizar);
  return ventana;
}

export type LadoFachada = 'frente' | 'atras' | 'derecha' | 'izquierda';

export interface OpcionesVentanas {
  /** Tamaño del cuerpo sobre el que van las ventanas. */
  ancho: number;
  fondo: number;
  /** Altura del alféizar respecto al grupo. */
  y: number;
  /** Ventanas por fachada: [frente y atrás, laterales]. */
  porLado: [number, number];
  ventana: { ancho: number; alto: number };
  coloresVidrio: number[];
  colorMarco?: number;
  aleatorio: Aleatorio;
  saltar?: (lado: LadoFachada, indice: number) => boolean;
}

/** Reparte ventanas en arco por las cuatro fachadas de un cuerpo rectangular. */
export function colocarVentanas(grupo: THREE.Object3D, o: OpcionesVentanas): void {
  const lados: Array<{ lado: LadoFachada; n: number; largo: number; colocar: (t: number) => [number, number, number] }> = [
    { lado: 'frente', n: o.porLado[0], largo: o.ancho, colocar: (t) => [t, o.fondo / 2, 0] },
    { lado: 'atras', n: o.porLado[0], largo: o.ancho, colocar: (t) => [-t, -o.fondo / 2, Math.PI] },
    { lado: 'derecha', n: o.porLado[1], largo: o.fondo, colocar: (t) => [o.ancho / 2, -t, Math.PI / 2] },
    { lado: 'izquierda', n: o.porLado[1], largo: o.fondo, colocar: (t) => [-o.ancho / 2, t, -Math.PI / 2] },
  ];
  for (const { lado, n, largo, colocar } of lados) {
    for (let i = 0; i < n; i++) {
      if (o.saltar?.(lado, i)) continue;
      const t = -largo / 2 + ((i + 0.5) * largo) / n;
      const [x, z, giro] = colocar(t);
      const color = o.coloresVidrio[Math.floor(o.aleatorio() * o.coloresVidrio.length)];
      const ventana = crearVentanaArco(o.ventana.ancho, o.ventana.alto, color, o.colorMarco);
      ventana.position.set(x, o.y, z);
      ventana.rotation.y = giro;
      grupo.add(ventana);
    }
  }
}

/** Balaustrada rectangular con balaustres torneados (instanciados) y pasamanos. */
export function crearBarandillaRect(ancho: number, fondo: number, alto = 1.1, separacion = 0.45, color = 0x5a2e1f): THREE.Group {
  const barandilla = new THREE.Group();
  const h = alto - 0.12;
  const perfil = [
    [0, 0], [0.08, 0], [0.08, 0.06], [0.05, 0.12], [0.09, 0.35], [0.045, 0.62], [0.065, 0.8], [0.08, 0.86], [0.08, 0.9], [0, 0.9],
  ].map(([r, y]) => new THREE.Vector2(r * Math.min(1.2, alto), y * h));
  const geometria = new THREE.LatheGeometry(perfil, 6);

  const lados: Array<[THREE.Vector3, THREE.Vector3]> = [
    [new THREE.Vector3(-ancho / 2, 0, -fondo / 2), new THREE.Vector3(ancho / 2, 0, -fondo / 2)],
    [new THREE.Vector3(ancho / 2, 0, -fondo / 2), new THREE.Vector3(ancho / 2, 0, fondo / 2)],
    [new THREE.Vector3(ancho / 2, 0, fondo / 2), new THREE.Vector3(-ancho / 2, 0, fondo / 2)],
    [new THREE.Vector3(-ancho / 2, 0, fondo / 2), new THREE.Vector3(-ancho / 2, 0, -fondo / 2)],
  ];
  const posiciones: THREE.Vector3[] = [];
  for (const [a, b] of lados) {
    const n = Math.max(2, Math.round(a.distanceTo(b) / separacion));
    for (let i = 0; i < n; i++) posiciones.push(a.clone().lerp(b, i / n));
  }
  const balaustres = new THREE.InstancedMesh(geometria, mat(color), posiciones.length);
  const matriz = new THREE.Matrix4();
  posiciones.forEach((posicion, i) => balaustres.setMatrixAt(i, matriz.makeTranslation(posicion.x, 0, posicion.z)));
  barandilla.add(balaustres);

  for (const [y, grueso] of [[alto - 0.06, 0.14], [0.04, 0.1]] as const) {
    for (const [largo, x, z, giro] of [
      [ancho, 0, -fondo / 2, 0],
      [ancho, 0, fondo / 2, 0],
      [fondo, -ancho / 2, 0, Math.PI / 2],
      [fondo, ancho / 2, 0, Math.PI / 2],
    ] as const) {
      const pasamanos = malla(new THREE.BoxGeometry(largo + grueso, grueso, grueso * 1.4), color);
      pasamanos.position.set(x, y, z);
      pasamanos.rotation.y = giro;
      barandilla.add(pasamanos);
    }
  }
  return barandilla;
}

/** Balaustrada que sigue un contorno cerrado cualquiera (lista de puntos en planta, y = 0). */
export function crearBarandillaContorno(puntos: THREE.Vector3[], alto = 1.1, separacion = 0.5, color = 0x5a2e1f): THREE.Group {
  const barandilla = new THREE.Group();
  const h = alto - 0.12;
  const perfil = [
    [0, 0], [0.08, 0], [0.08, 0.06], [0.05, 0.12], [0.09, 0.35], [0.045, 0.62], [0.065, 0.8], [0.08, 0.86], [0.08, 0.9], [0, 0.9],
  ].map(([r, y]) => new THREE.Vector2(r, y * h));

  const posiciones: THREE.Vector3[] = [];
  for (let i = 0; i < puntos.length; i++) {
    const a = puntos[i];
    const b = puntos[(i + 1) % puntos.length];
    const largo = a.distanceTo(b);
    const n = Math.max(1, Math.round(largo / separacion));
    for (let k = 0; k < n; k++) posiciones.push(a.clone().lerp(b, k / n));
    for (const [y, grueso] of [[alto - 0.06, 0.14], [0.04, 0.1]] as const) {
      const pasamanos = malla(new THREE.BoxGeometry(grueso, grueso, largo + grueso), color);
      pasamanos.position.set((a.x + b.x) / 2, y, (a.z + b.z) / 2);
      pasamanos.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      barandilla.add(pasamanos);
    }
  }
  const balaustres = new THREE.InstancedMesh(new THREE.LatheGeometry(perfil, 6), mat(color), posiciones.length);
  const matriz = new THREE.Matrix4();
  posiciones.forEach((p, i) => balaustres.setMatrixAt(i, matriz.makeTranslation(p.x, 0, p.z)));
  barandilla.add(balaustres);
  return barandilla;
}

/** Multiplica las UV de una geometría (para pasar de "1 unidad = 1 repetición" a metros reales). */
export function escalarUV(geometria: THREE.BufferGeometry, factor: number): THREE.BufferGeometry {
  const uv = geometria.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * factor, uv.getY(i) * factor);
  return geometria;
}

/** Columna torneada con basa y capitel. */
export function crearColumna(alto: number, radio: number, color = 0xd9d4c7): THREE.Mesh {
  const r = radio;
  const perfil = [
    [0, 0], [r * 1.7, 0], [r * 1.7, 0.18], [r * 1.3, 0.3], [r, 0.38],
    [r * 0.88, alto - 0.45], [r * 1.2, alto - 0.3], [r * 1.6, alto - 0.15], [r * 1.6, alto], [0, alto],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.Mesh(new THREE.LatheGeometry(perfil, 10), mat(color, { flatShading: false }));
}

/** Bóveda de cañón (medio cilindro) con arcos de remate. Su eje va en Z y su base en y = 0. */
export function crearBoveda(radio: number, largo: number, color = 0xe8e5dc): THREE.Group {
  const boveda = new THREE.Group();
  const geometria = new THREE.CylinderGeometry(radio, radio, largo, 20, 1, true, -Math.PI / 2, Math.PI);
  geometria.rotateX(-Math.PI / 2);
  boveda.add(new THREE.Mesh(geometria, matTextura(texturaEstuco(color), { side: THREE.DoubleSide })));
  const geometriaArco = new THREE.TorusGeometry(radio, 0.16, 6, 20, Math.PI);
  for (const z of [-largo / 2, largo / 2]) {
    const remate = new THREE.Mesh(geometriaArco, mat(new THREE.Color(color).multiplyScalar(0.9).getHex(), { flatShading: false }));
    remate.position.z = z;
    boveda.add(remate);
  }
  return boveda;
}

/** Portón de madera en arco con marco de piedra, herrajes y aldaba. Mira hacia +Z. */
export function crearPuertaArco(ancho: number, alto: number): THREE.Group {
  const puerta = new THREE.Group();
  const yArco = alto - ancho / 2;

  const contornoMarco = arco(ancho / 2 + 0.6, yArco, 0);
  contornoMarco.holes.push(arco(ancho / 2, yArco, 0.05));
  puerta.add(new THREE.Mesh(
    new THREE.ExtrudeGeometry(contornoMarco, { depth: 0.5, bevelEnabled: false }),
    matTextura(texturaPiedra(0xc9b99a)),
  ));

  const hoja = new THREE.Mesh(
    new THREE.ExtrudeGeometry(arco(ancho / 2, yArco, 0.05), { depth: 0.25, bevelEnabled: false }),
    matTextura(texturaMadera(0x6b4428)),
  );
  puerta.add(hoja);

  const hierro = 0x2a2a2a;
  for (const y of [alto * 0.2, alto * 0.5, alto * 0.75]) {
    const herraje = malla(new THREE.BoxGeometry(ancho * 0.92, 0.12, 0.06), hierro);
    herraje.position.set(0, y, 0.28);
    puerta.add(herraje);
  }
  const aldaba = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 6, 16), mat(hierro, { flatShading: false }));
  aldaba.position.set(ancho * 0.22, alto * 0.42, 0.32);
  puerta.add(aldaba);
  return puerta;
}

/** Glorieta: cuatro postes y tejado en punta; con `dosNiveles`, un faldón bajo y una pirámide encima. */
export function crearGlorieta(lado: number, dosNiveles = false): THREE.Group {
  const glorieta = new THREE.Group();
  const base = new THREE.Mesh(geometriaCaja(lado + 1, 0.5, lado + 1), matTextura(texturaPiedra(0xb3a690)));
  base.position.y = 0.25;
  glorieta.add(base);

  const alto = 3;
  for (const x of [-lado / 2, lado / 2]) {
    for (const z of [-lado / 2, lado / 2]) {
      const columna = crearColumna(alto, 0.16, 0xe0d8c8);
      columna.position.set(x, 0.5, z);
      glorieta.add(columna);
    }
  }
  const viga = malla(new THREE.BoxGeometry(lado + 0.5, 0.35, lado + 0.5), 0x5a2e1f);
  viga.position.y = 0.5 + alto + 0.17;
  glorieta.add(viga);

  const arranque = 0.5 + alto + 0.35;
  if (dosNiveles) {
    const faldon = crearTejado({
      anchoBase: lado + 2.6, fondoBase: lado + 2.6, anchoCima: lado + 0.3, fondoCima: lado + 0.3,
      altura: 0.9, curva: 1.3, levante: 0.4, segmentos: 6,
    });
    faldon.position.y = arranque;
    const tambor = malla(new THREE.BoxGeometry(lado + 0.3, 0.7, lado + 0.3), 0x6b3a2a);
    tambor.position.y = arranque + 1.2;
    const piramide = crearTejado({
      anchoBase: lado + 1.4, fondoBase: lado + 1.4, anchoCima: 0.3, fondoCima: 0.3, altura: lado * 0.5, levante: 0.3, segmentos: 6,
    });
    piramide.position.y = arranque + 1.55;
    glorieta.add(faldon, tambor, piramide);
  } else {
    const tejado = crearTejado({
      anchoBase: lado + 2.6, fondoBase: lado + 2.6, anchoCima: 0.4, fondoCima: 0.4, altura: lado * 0.55, levante: 0.6, segmentos: 8,
    });
    tejado.position.y = arranque;
    glorieta.add(tejado);
  }
  return glorieta;
}

// ---------------------------------------------------------------------------
// Optimización
// ---------------------------------------------------------------------------

const ATRIBUTOS_FUSIONABLES = 'normal,position,uv';

/** Animados o marcados con `userData.aislado` (piezas que deben poder ocultarse o sustituirse). */
function esExcluido(objeto: THREE.Object3D, raiz: THREE.Object3D): boolean {
  for (let o: THREE.Object3D | null = objeto; o && o !== raiz; o = o.parent) {
    if (o.userData.actualizar || o.userData.aislado) return true;
  }
  return false;
}

/**
 * Junta todas las mallas estáticas que comparten material en una sola malla por material.
 * Cientos de piezas pasan a ser una docena de llamadas de dibujo, imprescindible con sombras.
 * No toca las mallas animadas, las instanciadas ni las que tienen colores por vértice.
 */
export function fusionarEstaticos(raiz: THREE.Object3D): void {
  raiz.updateMatrixWorld(true);
  const inversa = raiz.matrixWorld.clone().invert();
  const porMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const fusionadas: THREE.Mesh[] = [];

  raiz.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || o instanceof THREE.InstancedMesh) return;
    if (Array.isArray(o.material) || esExcluido(o, raiz)) return;
    const geometria = o.geometry as THREE.BufferGeometry;
    if (Object.keys(geometria.attributes).sort().join() !== ATRIBUTOS_FUSIONABLES) return;

    const copia = geometria.index ? geometria.toNonIndexed() : geometria.clone();
    copia.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inversa, o.matrixWorld));
    const lista = porMaterial.get(o.material) ?? [];
    lista.push(copia);
    porMaterial.set(o.material, lista);
    fusionadas.push(o);
  });

  const nuevas: THREE.Mesh[] = [];
  for (const [material, geometrias] of porMaterial) {
    const unida = mergeGeometries(geometrias);
    if (!unida) return; // si algo falla, se deja todo como estaba
    nuevas.push(new THREE.Mesh(unida, material));
  }
  for (const o of fusionadas) o.removeFromParent();
  raiz.add(...nuevas);
}
