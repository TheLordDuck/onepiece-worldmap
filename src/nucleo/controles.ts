import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const ADELANTE = new THREE.Vector3();
const DERECHA = new THREE.Vector3();
const OBJETIVO = new THREE.Vector3();

const MULTIPLICADOR_SPRINT = 3;
const VENTANA_DOBLE_TOQUE = 300; // ms

export interface OpcionesVuelo {
  /** Altura del suelo en coordenadas del mundo, para no atravesar el terreno. */
  alturaSuelo?: (x: number, z: number) => number;
}

/**
 * Vuelo libre estilo "modo creativo":
 * W/S/A/D mueven en horizontal (aunque mires arriba o abajo), Espacio sube, Shift baja,
 * doble toque de W activa el sprint y la rueda del ratón ajusta la velocidad base.
 */
export class VueloCreativo {
  readonly camara: THREE.Camera;
  readonly bloqueo: PointerLockControls;
  readonly velocidad = new THREE.Vector3();
  rapidezBase = 35;
  sprint = false;
  /** Se desactiva durante un viaje rápido para que la animación controle la cámara. */
  activo = true;

  private readonly alturaSuelo: (x: number, z: number) => number;
  private readonly teclas = new Set<string>();
  private ultimaW = 0;

  constructor(camara: THREE.Camera, elemento: HTMLElement, { alturaSuelo = () => -Infinity }: OpcionesVuelo = {}) {
    this.camara = camara;
    this.bloqueo = new PointerLockControls(camara, elemento);
    this.alturaSuelo = alturaSuelo;

    document.addEventListener('keydown', (e) => this.alPresionar(e));
    document.addEventListener('keyup', (e) => this.alSoltar(e));
    document.addEventListener('wheel', (e) => this.alRueda(e), { passive: true });
    this.bloqueo.addEventListener('unlock', () => {
      this.teclas.clear();
      this.sprint = false;
    });
  }

  get bloqueado(): boolean {
    return this.bloqueo.isLocked;
  }

  get rapidez(): number {
    return this.rapidezBase * (this.sprint ? MULTIPLICADOR_SPRINT : 1);
  }

  bloquear(): void {
    this.bloqueo.lock();
  }

  private alPresionar(e: KeyboardEvent): void {
    if (e.code === 'Space') e.preventDefault();
    if (e.code === 'KeyW' && !e.repeat) {
      const ahora = performance.now();
      if (ahora - this.ultimaW < VENTANA_DOBLE_TOQUE) this.sprint = true;
      this.ultimaW = ahora;
    }
    this.teclas.add(e.code);
  }

  private alSoltar(e: KeyboardEvent): void {
    this.teclas.delete(e.code);
    if (e.code === 'KeyW') this.sprint = false;
  }

  private alRueda(e: WheelEvent): void {
    if (!this.bloqueado) return;
    const factor = e.deltaY > 0 ? 1 / 1.15 : 1.15;
    this.rapidezBase = THREE.MathUtils.clamp(this.rapidezBase * factor, 5, 400);
  }

  private eje(positivas: string[], negativas: string[]): number {
    const t = this.teclas;
    return (positivas.some((k) => t.has(k)) ? 1 : 0) - (negativas.some((k) => t.has(k)) ? 1 : 0);
  }

  actualizar(dt: number): void {
    OBJETIVO.set(0, 0, 0);

    if (this.bloqueado && this.activo) {
      const avance = this.eje(['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']);
      const lateral = this.eje(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']);
      const vertical = this.eje(['Space'], ['ShiftLeft', 'ShiftRight']);

      this.camara.getWorldDirection(ADELANTE);
      ADELANTE.y = 0;
      ADELANTE.normalize();
      DERECHA.crossVectors(ADELANTE, this.camara.up).normalize();

      OBJETIVO.addScaledVector(ADELANTE, avance).addScaledVector(DERECHA, lateral);
      if (OBJETIVO.lengthSq() > 0) OBJETIVO.normalize();
      OBJETIVO.multiplyScalar(this.rapidez);
      OBJETIVO.y = vertical * this.rapidez * 0.8;
    }

    // Aceleración y frenado suaves
    this.velocidad.lerp(OBJETIVO, 1 - Math.exp(-dt * 6));
    if (!this.activo) return;

    const p = this.camara.position;
    p.addScaledVector(this.velocidad, dt);

    // No atravesar el agua ni el terreno de las islas
    const suelo = Math.max(this.alturaSuelo(p.x, p.z), 0) + 2.5;
    if (p.y < suelo) {
      p.y = suelo;
      if (this.velocidad.y < 0) this.velocidad.y = 0;
    }
  }
}
