// Texturas procedurales dibujadas en canvas: estuco, piedra, tejas, baldosas y madera.
// Todas se repiten sin costuras (RepeatWrapping) y se cachean por tipo y color.
import * as THREE from 'three';
import { crearAleatorio, semillaDeTexto } from '../utils/ruido';
import type { Aleatorio } from '../tipos';

type Pincel = (ctx: CanvasRenderingContext2D, tam: number, aleatorio: Aleatorio) => void;

const cache = new Map<string, THREE.CanvasTexture>();

function crearTextura(clave: string, pintar: Pincel, tam = 256): THREE.CanvasTexture {
  const existente = cache.get(clave);
  if (existente) return existente;

  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = tam;
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D no disponible');
  pintar(ctx, tam, crearAleatorio(semillaDeTexto(clave)));

  const textura = new THREE.CanvasTexture(lienzo);
  textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 8;
  cache.set(clave, textura);
  return textura;
}

/** Color CSS del hex multiplicado por `factor` (para variar tonos). */
function tono(hex: number, factor = 1): string {
  return new THREE.Color(hex).multiplyScalar(factor).getStyle();
}

/** Ruido fino por píxel. */
function grano(ctx: CanvasRenderingContext2D, tam: number, aleatorio: Aleatorio, intensidad: number): void {
  const imagen = ctx.getImageData(0, 0, tam, tam);
  const d = imagen.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (aleatorio() - 0.5) * intensidad;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(imagen, 0, 0);
}

/** Manchas suaves claras y oscuras, repetidas en los bordes para que la textura sea continua. */
function manchas(ctx: CanvasRenderingContext2D, tam: number, aleatorio: Aleatorio, cantidad: number, radioMax: number, alfa: number): void {
  for (let i = 0; i < cantidad; i++) {
    const x = aleatorio() * tam;
    const y = aleatorio() * tam;
    const r = 4 + aleatorio() * radioMax;
    const color = aleatorio() > 0.5 ? `rgba(255,250,235,${alfa})` : `rgba(40,30,15,${alfa})`;
    for (const dx of [-tam, 0, tam]) {
      for (const dy of [-tam, 0, tam]) {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        g.addColorStop(0, color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
      }
    }
  }
}

/** Pared de estuco con manchas de humedad. Una repetición ≈ 4 m. */
export function texturaEstuco(color: number): THREE.CanvasTexture {
  return crearTextura(`estuco-${color}`, (ctx, tam, aleatorio) => {
    ctx.fillStyle = tono(color);
    ctx.fillRect(0, 0, tam, tam);
    manchas(ctx, tam, aleatorio, 140, 30, 0.055);
    grano(ctx, tam, aleatorio, 14);
  });
}

/** Sillares de piedra en hiladas. Una repetición ≈ 4 m. */
export function texturaPiedra(color: number): THREE.CanvasTexture {
  return crearTextura(`piedra-${color}`, (ctx, tam, aleatorio) => {
    ctx.fillStyle = tono(color, 0.6);
    ctx.fillRect(0, 0, tam, tam);
    const hiladas = 6;
    const alto = tam / hiladas;
    for (let f = 0; f < hiladas; f++) {
      let x = -aleatorio() * 40;
      while (x < tam) {
        const ancho = 30 + aleatorio() * 40;
        ctx.fillStyle = tono(color, 0.85 + aleatorio() * 0.3);
        for (const dx of [0, tam, -tam]) ctx.fillRect(x + dx + 2, f * alto + 2, ancho - 4, alto - 4);
        x += ancho;
      }
    }
    manchas(ctx, tam, aleatorio, 80, 20, 0.1);
    grano(ctx, tam, aleatorio, 22);
  });
}

/** Tejas árabes en columnas, con sombra en cada solape. Una repetición ≈ 2 m. */
export function texturaTejas(color: number): THREE.CanvasTexture {
  return crearTextura(`tejas-${color}`, (ctx, tam, aleatorio) => {
    ctx.fillStyle = tono(color);
    ctx.fillRect(0, 0, tam, tam);
    const columnas = 8;
    const ancho = tam / columnas;
    for (let c = 0; c < columnas; c++) {
      ctx.fillStyle = tono(color, 0.9 + aleatorio() * 0.2);
      ctx.fillRect(c * ancho, 0, ancho, tam);
      const g = ctx.createLinearGradient(c * ancho, 0, (c + 1) * ancho, 0);
      g.addColorStop(0, 'rgba(50,12,4,0.6)');
      g.addColorStop(0.35, 'rgba(255,215,180,0.22)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.04)');
      g.addColorStop(1, 'rgba(50,12,4,0.6)');
      ctx.fillStyle = g;
      ctx.fillRect(c * ancho, 0, ancho, tam);
    }
    const filas = 8;
    const alto = tam / filas;
    for (let f = 0; f < filas; f++) {
      const y = f * alto;
      const g = ctx.createLinearGradient(0, y, 0, y + alto);
      g.addColorStop(0, 'rgba(35,8,0,0.5)');
      g.addColorStop(0.25, 'rgba(0,0,0,0)');
      g.addColorStop(0.9, 'rgba(255,220,190,0.1)');
      g.addColorStop(1, 'rgba(35,8,0,0.3)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, tam, alto);
    }
    grano(ctx, tam, aleatorio, 14);
  });
}

/** Baldosas cuadradas con juntas. Una repetición ≈ 4 m (baldosas de 1 m). */
export function texturaBaldosas(color: number): THREE.CanvasTexture {
  return crearTextura(`baldosas-${color}`, (ctx, tam, aleatorio) => {
    ctx.fillStyle = tono(color, 0.65);
    ctx.fillRect(0, 0, tam, tam);
    const n = 4;
    const lado = tam / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = tono(color, 0.9 + aleatorio() * 0.2);
        ctx.fillRect(i * lado + 2, j * lado + 2, lado - 4, lado - 4);
      }
    }
    grano(ctx, tam, aleatorio, 14);
  });
}

/** Lona a rayas verticales (velas). Una repetición = la vela entera, con `rayas` franjas de cada color. */
export function texturaRayas(colorA: number, colorB: number, rayas = 6): THREE.CanvasTexture {
  return crearTextura(`rayas-${colorA}-${colorB}-${rayas}`, (ctx, tam, aleatorio) => {
    const ancho = tam / (rayas * 2);
    for (let i = 0; i < rayas * 2; i++) {
      ctx.fillStyle = tono(i % 2 ? colorB : colorA);
      ctx.fillRect(i * ancho, 0, ancho, tam);
    }
    grano(ctx, tam, aleatorio, 10);
  });
}

/** Techo de paja o palma seca en hileras. Una repetición ≈ 2 m. */
export function texturaPaja(color: number): THREE.CanvasTexture {
  return crearTextura(`paja-${color}`, (ctx, tam, aleatorio) => {
    ctx.fillStyle = tono(color);
    ctx.fillRect(0, 0, tam, tam);
    const hileras = 6;
    const alto = tam / hileras;
    for (let f = 0; f < hileras; f++) {
      for (let i = 0; i < 260; i++) {
        const x = aleatorio() * tam;
        const y = f * alto + aleatorio() * alto * 0.3;
        ctx.strokeStyle = tono(color, 0.7 + aleatorio() * 0.6);
        ctx.lineWidth = 1 + aleatorio() * 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (aleatorio() - 0.5) * 4, y + alto * (0.8 + aleatorio() * 0.4));
        ctx.stroke();
      }
      const g = ctx.createLinearGradient(0, f * alto, 0, (f + 1) * alto);
      g.addColorStop(0, 'rgba(30,20,5,0.35)');
      g.addColorStop(0.3, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, f * alto, tam, alto);
    }
    grano(ctx, tam, aleatorio, 12);
  });
}

/** Tablones verticales con vetas. Una repetición ≈ 1 m. */
export function texturaMadera(color: number): THREE.CanvasTexture {
  return crearTextura(`madera-${color}`, (ctx, tam, aleatorio) => {
    const tablones = 4;
    const ancho = tam / tablones;
    for (let t = 0; t < tablones; t++) {
      ctx.fillStyle = tono(color, 0.85 + aleatorio() * 0.3);
      ctx.fillRect(t * ancho, 0, ancho, tam);
      ctx.strokeStyle = 'rgba(20,10,5,0.25)';
      for (let v = 0; v < 7; v++) {
        const x0 = t * ancho + aleatorio() * ancho;
        ctx.lineWidth = 0.5 + aleatorio() * 1.5;
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.bezierCurveTo(x0 + 4, tam * 0.33, x0 - 4, tam * 0.66, x0, tam);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(15,8,4,0.7)';
      ctx.fillRect(t * ancho, 0, 3, tam);
    }
    grano(ctx, tam, aleatorio, 16);
  });
}
