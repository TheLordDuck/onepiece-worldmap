import * as THREE from 'three';
import { crearRuido2D, fbm } from '../../utils/ruido';
import type { AlturaEn } from '../../tipos';

const COLORES_BASE = {
  arenaMojada: 0xcdb67c,
  arena: 0xeed9a0,
  pasto: 0x74c24f,
  pastoOscuro: 0x4f9a3b,
  roca: 0x8c8378,
};

type NombreColor = keyof typeof COLORES_BASE;

export interface ZonaPlana {
  x: number;
  z: number;
  radio: number;
  altura: number;
}

export interface OpcionesTerreno {
  /** Tamaño aproximado de la isla. */
  radio: number;
  /** Altura máxima de las colinas. */
  altura: number;
  semilla?: number;
  /** Subdivisiones de la malla por lado. */
  resolucion?: number;
  /** Cuánto se deforma la costa respecto a un círculo (0 = círculo). */
  irregularidad?: number;
  /** >1 da playas anchas y montaña en el centro, <1 da mesetas. */
  exponente?: number;
  /** Zonas que se aplanan para colocar pueblos o bases. */
  zonasPlanas?: ZonaPlana[];
  /** Sobrescribe la paleta (arena, pasto, roca...). */
  colores?: Partial<Record<NombreColor, number>>;
  /**
   * Forma libre: si se da, sustituye a la isla redonda generada a partir de `radio`.
   * Sirve para islas con geografía concreta (costas, acantilados, valles en su sitio).
   */
  alturaBase?: AlturaEn;
  /** Lado del cuadrado de malla; por defecto 2.6 × radio. */
  lado?: number;
}

export interface Terreno {
  malla: THREE.Mesh;
  /** Altura en coordenadas locales de la isla, para colocar objetos encima. */
  alturaEn: AlturaEn;
}

// ---------------------------------------------------------------------------
// Ayudas para islas de forma libre (con `alturaBase`)
// ---------------------------------------------------------------------------

/**
 * Costa elíptica irregular. Devuelve t(x, z): 1 en el centro, 0 en la orilla y negativo en el mar.
 * Multiplicar t por el semieje da, aproximadamente, los metros hasta la orilla.
 */
export function crearCosta(semiejeX: number, semiejeZ: number, semilla: number, irregularidad = 0.1): AlturaEn {
  const ruido = crearRuido2D(semilla);
  return (x, z) => {
    const angulo = Math.atan2(z / semiejeZ, x / semiejeX);
    const r = Math.hypot(x / semiejeX, z / semiejeZ);
    const borde = 1 + irregularidad * (ruido(Math.cos(angulo) * 3 + 20, Math.sin(angulo) * 3 + 20) - 0.5) * 2;
    return 1 - r / borde;
  };
}

/** Campana gaussiana centrada en (cx, cz): 1 en el centro, ~0 a 3 × `ancho`. */
export function campana(x: number, z: number, cx: number, cz: number, ancho: number): number {
  const d2 = (x - cx) ** 2 + (z - cz) ** 2;
  return Math.exp(-d2 / (2 * ancho * ancho));
}

/** Aplana la altura `h` dentro de cada zona (mezcla suave en el último 40 % del radio). */
export function aplanarZonas(h: number, x: number, z: number, zonas: ZonaPlana[]): number {
  for (const zona of zonas) {
    const d = Math.hypot(x - zona.x, z - zona.z);
    h = THREE.MathUtils.lerp(h, zona.altura, 1 - THREE.MathUtils.smoothstep(d, zona.radio * 0.6, zona.radio));
  }
  return h;
}

/** Perfil estándar de costa: el fondo cae hacia el mar y la playa sube a una llanura de ~4 m. */
export function alturaCostera(t: number): number {
  if (t <= 0) return Math.max(1 + t * 160, -14);
  return 1 + Math.min(t * 14, 1) * 3.2;
}

/** Genera el terreno de una isla con forma irregular, colinas y playas. */
export function crearTerreno({
  radio,
  altura,
  semilla = 1,
  resolucion = 90,
  irregularidad = 0.35,
  exponente = 1.4,
  zonasPlanas = [],
  colores = {},
  alturaBase,
  lado = radio * 2.6,
}: OpcionesTerreno): Terreno {
  const ruido = crearRuido2D(semilla);
  const hexes = { ...COLORES_BASE, ...colores };
  const paleta = Object.fromEntries(
    Object.entries(hexes).map(([nombre, hex]) => [nombre, new THREE.Color(hex)]),
  ) as Record<NombreColor, THREE.Color>;

  function alturaEn(x: number, z: number): number {
    if (alturaBase) return alturaBase(x, z);
    const angulo = Math.atan2(z, x);
    const borde =
      radio * (1 - irregularidad / 2 + irregularidad * ruido(Math.cos(angulo) * 2 + 10, Math.sin(angulo) * 2 + 10));
    const t = 1 - Math.hypot(x, z) / borde;

    let h: number;
    if (t > 0) {
      const detalle = 0.55 + 0.9 * fbm(ruido, x * 0.025 + 50, z * 0.025 + 50, 4);
      h = 1 + Math.pow(t, exponente) * altura * detalle;
    } else {
      h = 1 + t * 30; // cae rápido hacia el fondo marino
    }

    for (const zona of zonasPlanas) {
      const d = Math.hypot(x - zona.x, z - zona.z);
      const mezcla = 1 - THREE.MathUtils.smoothstep(d, zona.radio * 0.6, zona.radio);
      h = THREE.MathUtils.lerp(h, zona.altura, mezcla);
    }
    return Math.max(h, -12);
  }

  const plano = new THREE.PlaneGeometry(lado, lado, resolucion, resolucion);
  plano.rotateX(-Math.PI / 2);
  const posiciones = plano.attributes.position;
  for (let i = 0; i < posiciones.count; i++) {
    posiciones.setY(i, alturaEn(posiciones.getX(i), posiciones.getZ(i)));
  }

  // Sin índices, cada triángulo tiene sus propios vértices y puede llevar un color plano
  const geometria = plano.toNonIndexed();
  plano.dispose();
  const p = geometria.attributes.position;
  const colorVertices = new Float32Array(p.count * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const color = new THREE.Color();

  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    const normal = ab.subVectors(b, a).cross(ac.subVectors(c, a)).normalize();
    const pendiente = 1 - Math.abs(normal.y);
    const hMedia = (a.y + b.y + c.y) / 3;

    if (hMedia < 1.3) color.copy(paleta.arenaMojada);
    else if (hMedia < 2.6) color.copy(paleta.arena);
    else if (pendiente > 0.45 || hMedia > altura * 0.8) color.copy(paleta.roca);
    else {
      const cx = (a.x + b.x + c.x) / 3;
      const cz = (a.z + b.z + c.z) / 3;
      color.copy(paleta.pasto).lerp(paleta.pastoOscuro, ruido(cx * 0.05 + 200, cz * 0.05 + 200));
    }

    for (let v = 0; v < 3; v++) color.toArray(colorVertices, (i + v) * 3);
  }

  geometria.setAttribute('color', new THREE.BufferAttribute(colorVertices, 3));
  geometria.computeVertexNormals();

  const malla = new THREE.Mesh(
    geometria,
    new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
  );
  return { malla, alturaEn };
}
