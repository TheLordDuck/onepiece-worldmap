// Aleatoriedad determinista: la misma semilla genera siempre la misma isla.
import type { Aleatorio } from '../tipos';

export type Ruido2D = (x: number, y: number) => number;

/** Generador pseudoaleatorio (mulberry32). Devuelve una función que da números en [0, 1). */
export function crearAleatorio(semilla = 1): Aleatorio {
  let a = semilla >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ruido de valor 2D suavizado. Devuelve una función ruido(x, y) en [0, 1]. */
export function crearRuido2D(semilla = 1): Ruido2D {
  const aleatorio = crearAleatorio(semilla);
  const valores = new Float32Array(256);
  const perm = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    valores[i] = aleatorio();
    perm[i] = i;
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }

  const valor = (x: number, y: number) => valores[perm[(perm[x & 255] + y) & 255]];
  const suave = (t: number) => t * t * (3 - 2 * t);

  return function ruido(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = suave(x - xi);
    const v = suave(y - yi);
    const a = valor(xi, yi);
    const b = valor(xi + 1, yi);
    const c = valor(xi, yi + 1);
    const d = valor(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

/** Suma de varias octavas de ruido (más detalle a menor escala). Resultado en [0, 1]. */
export function fbm(ruido: Ruido2D, x: number, y: number, octavas = 4): number {
  let suma = 0;
  let total = 0;
  let amplitud = 0.5;
  let frecuencia = 1;
  for (let i = 0; i < octavas; i++) {
    suma += ruido(x * frecuencia, y * frecuencia) * amplitud;
    total += amplitud;
    amplitud *= 0.5;
    frecuencia *= 2;
  }
  return suma / total;
}

/** Convierte un texto en una semilla numérica (FNV-1a). */
export function semillaDeTexto(texto: string): number {
  let h = 2166136261;
  for (const caracter of texto) {
    h ^= caracter.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
