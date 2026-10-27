import * as THREE from 'three';
import type { VueloCreativo } from './controles';

const MATRIZ = new THREE.Matrix4();

const suavizar = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface Animacion {
  desde: THREE.Vector3;
  hasta: THREE.Vector3;
  qDesde: THREE.Quaternion;
  qHasta: THREE.Quaternion;
  arco: number;
  duracion: number;
  t: number;
  alTerminar?: () => void;
}

/** Vuelo animado de la cámara hasta un destino, con un arco hacia arriba durante el trayecto. */
export class ViajeRapido {
  private animacion: Animacion | null = null;

  constructor(
    private readonly camara: THREE.Camera,
    private readonly vuelo: VueloCreativo,
  ) {}

  get enCurso(): boolean {
    return this.animacion !== null;
  }

  /** Vuela hasta `destino` mirando a `mirarA`; `alTerminar` se llama al llegar. */
  iniciar(destino: THREE.Vector3, mirarA: THREE.Vector3, alTerminar?: () => void): void {
    const desde = this.camara.position.clone();
    const distancia = desde.distanceTo(destino);
    MATRIZ.lookAt(destino, mirarA, this.camara.up);

    this.animacion = {
      desde,
      hasta: destino.clone(),
      qDesde: this.camara.quaternion.clone(),
      qHasta: new THREE.Quaternion().setFromRotationMatrix(MATRIZ),
      arco: Math.min(distancia * 0.15, 350),
      duracion: THREE.MathUtils.clamp(distancia / 400, 1.5, 4),
      t: 0,
      alTerminar,
    };
    this.vuelo.activo = false;
    this.vuelo.velocidad.set(0, 0, 0);
  }

  actualizar(dt: number): void {
    const a = this.animacion;
    if (!a) return;

    a.t = Math.min(a.t + dt / a.duracion, 1);
    const k = suavizar(a.t);
    this.camara.position.lerpVectors(a.desde, a.hasta, k);
    this.camara.position.y += Math.sin(k * Math.PI) * a.arco;
    this.camara.quaternion.slerpQuaternions(a.qDesde, a.qHasta, k);

    if (a.t >= 1) {
      this.animacion = null;
      this.vuelo.activo = true;
      a.alTerminar?.();
    }
  }
}
