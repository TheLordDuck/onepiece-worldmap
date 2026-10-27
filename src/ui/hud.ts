import type * as THREE from 'three';
import type { Cercania, IslaCargada } from '../mundo/Mundo';
import type { DatosIsla } from '../tipos';

const DISTANCIA_FICHA = 200;
const INTERVALO = 100; // ms entre actualizaciones del texto

function $(id: string): HTMLElement {
  const elemento = document.getElementById(id);
  if (!elemento) throw new Error(`Falta el elemento #${id} en index.html`);
  return elemento;
}

interface OpcionesHud {
  islas: IslaCargada[];
  alExplorar: () => void;
  alVerMapa: () => void;
}

export interface EstadoHud {
  posicion: THREE.Vector3;
  rapidez: number;
  cercana: Cercania;
}

/** Interfaz HTML: pantalla de inicio, panel de ubicación, avisos y ficha de isla. */
export class Hud {
  private readonly intro = $('intro');
  private readonly hud = $('hud');
  private readonly ficha = $('ficha');
  private readonly mapa = $('mapa-ui');
  private readonly botonExplorar = $('boton-explorar');
  private readonly elMar = $('hud-mar');
  private readonly elLugar = $('hud-lugar');
  private readonly elCoords = $('hud-coords');
  private readonly elVelocidad = $('hud-velocidad');
  private readonly elAviso = $('hud-aviso');
  private islaCercana: IslaCargada | null = null;
  private ultimo = 0;

  constructor({ islas, alExplorar, alVerMapa }: OpcionesHud) {
    this.intro.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('#boton-mapa')) alVerMapa();
      else alExplorar();
    });
    $('hud-viajes').innerHTML = islas
      .map((isla, i) => `<span><kbd>${i + 1}</kbd> ${isla.datos.nombre}</span>`)
      .join('');
  }

  /** El mapa sustituye al HUD y a la pantalla de inicio mientras está abierto. */
  mostrarMapa(visible: boolean): void {
    this.mapa.classList.toggle('oculto', !visible);
    document.body.classList.toggle('modo-mapa', visible);
    if (visible) {
      this.intro.classList.add('oculto');
      this.hud.classList.add('oculto');
      this.ocultarFicha();
    }
  }

  get fichaVisible(): boolean {
    return !this.ficha.classList.contains('oculto');
  }

  mostrarIntro(visible: boolean): void {
    this.intro.classList.toggle('oculto', !visible);
    this.hud.classList.toggle('oculto', visible);
    if (visible) this.botonExplorar.textContent = 'Continuar explorando';
  }

  actualizar({ posicion, rapidez, cercana }: EstadoHud): void {
    const ahora = performance.now();
    if (ahora - this.ultimo < INTERVALO) return;
    this.ultimo = ahora;

    const { isla, distancia } = cercana;
    const nombre = isla?.datos.nombre;
    this.elMar.textContent = isla && distancia < 1500 ? isla.datos.mar : 'Mar abierto';
    this.elLugar.textContent =
      !isla || distancia > 600 ? 'Navegando…' : distancia < 20 ? (nombre ?? '') : `Cerca de ${nombre} · ${Math.round(distancia)} m`;
    this.elCoords.textContent = `X ${Math.round(posicion.x)} · Y ${Math.round(posicion.y)} · Z ${Math.round(posicion.z)}`;
    this.elVelocidad.textContent = `${Math.round(rapidez)} m/s`;

    this.islaCercana = isla && distancia < DISTANCIA_FICHA ? isla : null;
    this.elAviso.innerHTML =
      this.islaCercana && !this.fichaVisible ? `Pulsa <kbd>E</kbd> para ver la ficha de ${nombre}` : '';
  }

  alternarFicha(): void {
    if (this.fichaVisible) this.ocultarFicha();
    else if (this.islaCercana) this.mostrarFicha(this.islaCercana.datos);
  }

  mostrarFicha(datos: DatosIsla): void {
    $('ficha-mar').textContent = datos.mar;
    $('ficha-nombre').textContent = datos.nombre;
    $('ficha-arco').textContent = `Arco: ${datos.arco}`;
    $('ficha-descripcion').textContent = datos.descripcion;
    $('ficha-datos').replaceChildren(
      ...datos.datos.map((dato) => {
        const li = document.createElement('li');
        li.textContent = dato;
        return li;
      }),
    );
    this.ficha.classList.remove('oculto');
  }

  ocultarFicha(): void {
    this.ficha.classList.add('oculto');
  }
}
