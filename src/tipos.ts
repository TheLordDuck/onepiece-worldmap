// Tipos compartidos por todo el proyecto.
import type * as THREE from 'three';

/** Función que devuelve un número pseudoaleatorio en [0, 1). */
export type Aleatorio = () => number;

/** Altura del terreno en coordenadas locales de una isla. */
export type AlturaEn = (x: number, z: number) => number;

/** Se llama en cada fotograma si un objeto la guarda en `userData.actualizar`. */
export type Actualizable = (t: number, dt: number, camara: THREE.Camera) => void;

/** Entrada del catálogo de islas (src/datos/islas.ts). */
export interface DatosIsla {
  id: string;
  nombre: string;
  mar: string;
  /** Posición en el mundo [x, y, z], en unidades ≈ metros. */
  posicion: [number, number, number];
  /** Clave del constructor en src/mundo/islas/index.ts. */
  construir: string;
  arco: string;
  descripcion: string;
  datos: string[];
}

/** Lo que devuelve el constructor de una isla. */
export interface IslaConstruida {
  grupo: THREE.Group;
  /** Omitir en islas sin terreno (barcos, plataformas). */
  alturaEn?: AlturaEn;
  /** Radio aproximado, usado para proximidad, colisiones y viaje rápido. */
  radio: number;
  alturaEtiqueta?: number;
  /** Sitios con nombre dentro de la isla (pueblos, edificios...). Llevan su propia etiqueta. */
  lugares?: Lugar[];
}

export interface Lugar {
  nombre: string;
  /** Posición local de la etiqueta dentro de la isla. */
  posicion: [number, number, number];
}

export type ConstructorIsla = (aleatorio: Aleatorio) => IslaConstruida;
