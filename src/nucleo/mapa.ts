import * as THREE from 'three';
import type { Mundo } from '../mundo/Mundo';
import type { ViajeRapido } from './viaje';

const NIEBLA_NORMAL = { near: 400, far: 2800 };
const NIEBLA_MAPA = { near: 30000, far: 40000 };
const LEJANIA_NORMAL = 6000;
const LEJANIA_MAPA = 30000;
/** Inclinación de la cámara del mapa (casi cenital, pero no del todo, para que se vea el relieve). */
const INCLINACION = 0.18;

export interface OpcionesModoMapa {
  camara: THREE.PerspectiveCamera;
  escena: THREE.Scene;
  oceano: THREE.Object3D;
  mundo: Mundo;
  viaje: ViajeRapido;
  elemento: HTMLElement;
  /** Bajar a la isla elegida; `alLlegar` debe llamarse al terminar el vuelo. */
  alElegirIsla: (indice: number, alLlegar: () => void) => void;
  alCambiar: (activo: boolean) => void;
}

/**
 * Vista del mapa: la cámara sube hasta ver todo el mar desde arriba, sin niebla, con la ruta
 * de los Sombrero de Paja dibujada. La rueda acerca y aleja, arrastrar desplaza y
 * hacer clic en una isla (o en su nombre) baja volando hasta ella.
 */
export class ModoMapa {
  activo = false;
  private readonly centro = new THREE.Vector3();
  private altura = 4000;
  private readonly alturaInicial: number;
  private readonly centroInicial = new THREE.Vector3();
  private readonly vueltaPosicion = new THREE.Vector3();
  private readonly vueltaMirada = new THREE.Vector3();
  private readonly ruta: THREE.Group;
  private readonly rayo = new THREE.Raycaster();
  private readonly plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private arrastre: { x: number; y: number; movido: boolean } | null = null;

  constructor(private readonly o: OpcionesModoMapa) {
    // Encuadre que abarca todas las islas
    const caja = new THREE.Box3();
    for (const isla of o.mundo.islas) {
      const p = isla.grupo.position;
      caja.expandByPoint(new THREE.Vector3(p.x - isla.radio, 0, p.z - isla.radio));
      caja.expandByPoint(new THREE.Vector3(p.x + isla.radio, 0, p.z + isla.radio));
    }
    caja.getCenter(this.centroInicial);
    const tamano = caja.getSize(new THREE.Vector3());
    const mediaVertical = Math.tan(THREE.MathUtils.degToRad(o.camara.fov / 2));
    // Margen extra para que el título y la pista de abajo no tapen las islas de los extremos
    this.alturaInicial = Math.max(tamano.z / 2 / mediaVertical, tamano.x / 2 / (mediaVertical * o.camara.aspect)) * 1.3;

    this.ruta = crearRuta(o.mundo);
    this.ruta.visible = false;
    o.escena.add(this.ruta);

    o.mundo.islas.forEach((isla, i) => {
      isla.elemento.addEventListener('click', () => {
        if (this.activo) this.irAIsla(i);
      });
    });
    o.elemento.addEventListener('wheel', (e) => this.alRueda(e), { passive: true });
    o.elemento.addEventListener('pointerdown', (e) => {
      if (this.activo) this.arrastre = { x: e.clientX, y: e.clientY, movido: false };
    });
    window.addEventListener('pointermove', (e) => this.alMover(e));
    window.addEventListener('pointerup', (e) => this.alSoltar(e));
  }

  alternar(): void {
    if (this.activo) this.salir();
    else this.entrar();
  }

  /** Sube al mapa; con `animar = false` aparece directamente (p. ej. al abrir con ?mapa). */
  entrar(animar = true): void {
    if (this.activo || this.o.viaje.enCurso) return;
    const { camara } = this.o;
    this.vueltaPosicion.copy(camara.position);
    this.vueltaMirada.copy(camara.getWorldDirection(new THREE.Vector3()).multiplyScalar(50).add(camara.position));
    this.activo = true;
    this.centro.copy(this.centroInicial);
    this.altura = this.alturaInicial;
    this.ajustarVista(true);
    this.o.alCambiar(true);
    if (animar) this.o.viaje.iniciar(this.posicionCamara(), this.centro.clone());
    else this.colocarCamara();
  }

  salir(): void {
    if (!this.activo || this.o.viaje.enCurso) return;
    this.activo = false;
    this.ruta.visible = false;
    this.o.mundo.modoMapa = false;
    this.o.alCambiar(false);
    this.o.viaje.iniciar(this.vueltaPosicion.clone(), this.vueltaMirada.clone(), () => this.ajustarVista(false));
  }

  irAIsla(indice: number): void {
    if (!this.activo || this.o.viaje.enCurso || !this.o.mundo.islas[indice]) return;
    this.activo = false;
    this.ruta.visible = false;
    this.o.mundo.modoMapa = false;
    // Primero empieza el vuelo: así alCambiar sabe que no hay que mostrar la pausa
    this.o.alElegirIsla(indice, () => this.ajustarVista(false));
    this.o.alCambiar(false);
  }

  private ajustarVista(mapa: boolean): void {
    const { escena, camara, oceano, mundo } = this.o;
    if (escena.fog instanceof THREE.Fog) {
      Object.assign(escena.fog, mapa ? NIEBLA_MAPA : NIEBLA_NORMAL);
    }
    camara.far = mapa ? LEJANIA_MAPA : LEJANIA_NORMAL;
    camara.updateProjectionMatrix();
    // El océano se estira para cubrir todo el mapa (desde tan alto no se notan las olas más bastas)
    oceano.scale.set(mapa ? 5 : 1, 1, mapa ? 5 : 1);
    // Mar casi en calma: desde arriba las olas formarían franjas repetidas
    if (oceano instanceof THREE.Mesh && oceano.material instanceof THREE.ShaderMaterial) {
      oceano.material.uniforms.uAmplitud.value = mapa ? 0.15 : 1;
    }
    this.ruta.visible = mapa;
    mundo.modoMapa = mapa;
  }

  private posicionCamara(): THREE.Vector3 {
    return new THREE.Vector3(this.centro.x, this.altura, this.centro.z + this.altura * INCLINACION);
  }

  private colocarCamara(): void {
    this.o.camara.position.copy(this.posicionCamara());
    this.o.camara.lookAt(this.centro);
  }

  private alRueda(e: WheelEvent): void {
    if (!this.activo || this.o.viaje.enCurso) return;
    this.altura = THREE.MathUtils.clamp(this.altura * (e.deltaY > 0 ? 1.12 : 1 / 1.12), 500, this.alturaInicial * 1.6);
    this.colocarCamara();
  }

  private alMover(e: PointerEvent): void {
    if (!this.activo || !this.arrastre || this.o.viaje.enCurso) return;
    const dx = e.clientX - this.arrastre.x;
    const dy = e.clientY - this.arrastre.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) this.arrastre.movido = true;
    if (!this.arrastre.movido) return;
    // Metros por píxel a la altura actual
    const metros = (2 * this.altura * Math.tan(THREE.MathUtils.degToRad(this.o.camara.fov / 2))) / window.innerHeight;
    this.centro.x -= dx * metros;
    this.centro.z -= dy * metros;
    this.arrastre.x = e.clientX;
    this.arrastre.y = e.clientY;
    this.colocarCamara();
  }

  private alSoltar(e: PointerEvent): void {
    const arrastre = this.arrastre;
    this.arrastre = null;
    if (!this.activo || !arrastre || arrastre.movido || this.o.viaje.enCurso) return;
    if (e.target !== this.o.elemento) return;
    // Clic sin arrastrar: ¿hay una isla debajo?
    const puntero = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    this.rayo.setFromCamera(puntero, this.o.camara);
    const punto = this.rayo.ray.intersectPlane(this.plano, new THREE.Vector3());
    if (!punto) return;
    const indice = this.o.mundo.islaEnPunto(punto.x, punto.z);
    if (indice >= 0) this.irAIsla(indice);
  }
}

/** Ruta del viaje dibujada en el mar: trazos rojos de costa a costa, isla tras isla. */
function crearRuta(mundo: Mundo): THREE.Group {
  const ruta = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xd9443a });
  const geometria = new THREE.BoxGeometry(32, 1, 90);
  for (let i = 0; i < mundo.islas.length - 1; i++) {
    const a = mundo.islas[i];
    const b = mundo.islas[i + 1];
    const direccion = new THREE.Vector3().subVectors(b.grupo.position, a.grupo.position).setY(0);
    const distancia = direccion.length();
    direccion.normalize();
    const desde = a.radio * 0.95;
    const hasta = distancia - b.radio * 0.95;
    for (let d = desde + 45; d < hasta - 45; d += 150) {
      const trazo = new THREE.Mesh(geometria, material);
      trazo.position.copy(a.grupo.position).addScaledVector(direccion, d).setY(8);
      trazo.rotation.y = Math.atan2(direccion.x, direccion.z);
      ruta.add(trazo);
    }
  }
  return ruta;
}
