import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONSTRUCTORES } from './islas';
import { fusionarEstaticos } from './islas/arquitectura';
import { crearAleatorio, semillaDeTexto } from '../utils/ruido';
import type { Actualizable, AlturaEn, DatosIsla } from '../tipos';

export interface IslaCargada {
  datos: DatosIsla;
  grupo: THREE.Group;
  alturaEn: AlturaEn | null;
  radio: number;
  elemento: HTMLDivElement;
}

export interface Cercania {
  isla: IslaCargada | null;
  distancia: number;
}

/**
 * Contenedor del mundo: añade objetos a la escena, anima los que tengan
 * `userData.actualizar(t, dt, camara)` y sabe dónde está cada isla.
 */
export class Mundo {
  readonly islas: IslaCargada[] = [];
  /** En el mapa se ven todas las islas con su nombre y se ocultan los lugares. */
  modoMapa = false;
  private readonly animados: Actualizable[] = [];
  private readonly etiquetasLugar: Array<{ objeto: THREE.Object3D; elemento: HTMLDivElement }> = [];
  private readonly posicionLugar = new THREE.Vector3();

  constructor(private readonly escena: THREE.Scene) {}

  agregar<T extends THREE.Object3D>(objeto: T): T {
    this.escena.add(objeto);
    objeto.traverse((o) => {
      const actualizar = o.userData.actualizar as Actualizable | undefined;
      if (actualizar) this.animados.push(actualizar);
    });
    return objeto;
  }

  cargarIslas(lista: DatosIsla[]): void {
    for (const datos of lista) {
      const construir = CONSTRUCTORES[datos.construir];
      if (!construir) {
        console.warn(`No hay constructor para la isla "${datos.id}"`);
        continue;
      }

      const { grupo, alturaEn = null, radio, alturaEtiqueta = 40, lugares = [] } = construir(
        crearAleatorio(semillaDeTexto(datos.id)),
      );
      grupo.name = datos.id;
      grupo.position.fromArray(datos.posicion);
      fusionarEstaticos(grupo);
      grupo.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });

      const elemento = document.createElement('div');
      elemento.className = 'etiqueta-isla';
      elemento.innerHTML = `<div class="etiqueta-contenido"><strong>${datos.nombre}</strong><span>${datos.mar}</span><em class="etiqueta-arco">${datos.arco}</em></div>`;
      const etiqueta = new CSS2DObject(elemento);
      etiqueta.position.set(0, alturaEtiqueta, 0);
      grupo.add(etiqueta);

      for (const lugar of lugares) {
        const elementoLugar = document.createElement('div');
        elementoLugar.className = 'etiqueta-lugar';
        elementoLugar.textContent = lugar.nombre;
        const etiquetaLugar = new CSS2DObject(elementoLugar);
        etiquetaLugar.position.fromArray(lugar.posicion);
        grupo.add(etiquetaLugar);
        this.etiquetasLugar.push({ objeto: etiquetaLugar, elemento: elementoLugar });
      }

      this.agregar(grupo);
      this.islas.push({ datos, grupo, alturaEn, radio, elemento });
    }
  }

  /** Altura del terreno en coordenadas del mundo (-Infinity si solo hay mar). */
  alturaSuelo(x: number, z: number): number {
    let maxima = -Infinity;
    for (const isla of this.islas) {
      if (!isla.alturaEn) continue;
      const dx = x - isla.grupo.position.x;
      const dz = z - isla.grupo.position.z;
      if (Math.hypot(dx, dz) < isla.radio * 1.3) maxima = Math.max(maxima, isla.alturaEn(dx, dz));
    }
    return maxima;
  }

  /** Índice de la isla que hay en (x, z), o -1 si es mar abierto. */
  islaEnPunto(x: number, z: number): number {
    let mejor = -1;
    let menor = Infinity;
    this.islas.forEach((isla, i) => {
      const d = Math.hypot(x - isla.grupo.position.x, z - isla.grupo.position.z);
      if (d < isla.radio * 1.15 && d < menor) {
        menor = d;
        mejor = i;
      }
    });
    return mejor;
  }

  /** Isla más cercana y distancia horizontal hasta su costa aproximada. */
  islaMasCercana(posicion: THREE.Vector3): Cercania {
    let mejor: Cercania = { isla: null, distancia: Infinity };
    for (const isla of this.islas) {
      const centro = isla.grupo.position;
      const distancia = Math.max(Math.hypot(posicion.x - centro.x, posicion.z - centro.z) - isla.radio, 0);
      if (distancia < mejor.distancia) mejor = { isla, distancia };
    }
    return mejor;
  }

  actualizar(t: number, dt: number, camara: THREE.Camera): void {
    for (const actualizar of this.animados) actualizar(t, dt, camara);

    // Las etiquetas se desvanecen con la distancia, igual que la niebla
    for (const isla of this.islas) {
      const d = camara.position.distanceTo(isla.grupo.position);
      const opacidad = this.modoMapa ? 1 : 1 - THREE.MathUtils.smoothstep(d, 1400, 2400);
      isla.elemento.style.opacity = opacidad.toFixed(2);
      isla.elemento.style.visibility = opacidad < 0.01 ? 'hidden' : 'visible';
    }

    // Los nombres de los lugares solo se ven de cerca
    for (const { objeto, elemento } of this.etiquetasLugar) {
      const d = camara.position.distanceTo(objeto.getWorldPosition(this.posicionLugar));
      const opacidad = this.modoMapa ? 0 : 1 - THREE.MathUtils.smoothstep(d, 350, 600);
      elemento.style.opacity = opacidad.toFixed(2);
      elemento.style.visibility = opacidad < 0.01 ? 'hidden' : 'visible';
    }
  }
}
