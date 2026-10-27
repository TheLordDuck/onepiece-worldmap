// Carga opcional de modelos 3D externos (.glb), hechos en Blender o descargados de Sketchfab.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const cargador = new GLTFLoader();

export interface OpcionesSustitucion {
  /** Ruta dentro de `public/`, p. ej. '/modelos/arlong-park.glb'. */
  url: string;
  /** Ancho (lado mayor en planta) al que se escala el modelo. */
  ancho: number;
  /** Altura a la que queda la base del modelo, relativa a la pieza procedural. */
  yBase?: number;
  /** Giro en Y para alinearlo con la maqueta. */
  giro?: number;
}

/**
 * Si existe el archivo, carga el modelo y sustituye a la pieza procedural (que se oculta).
 * Si no existe, no hace nada y se queda la versión procedural.
 */
export function sustituirPorModelo(procedural: THREE.Object3D, { url, ancho, yBase = 0, giro = 0 }: OpcionesSustitucion): void {
  cargador.load(
    url,
    (gltf) => {
      const modelo = gltf.scene;
      modelo.rotation.y = giro;
      const caja = new THREE.Box3().setFromObject(modelo);
      const tamano = caja.getSize(new THREE.Vector3());
      modelo.scale.setScalar(ancho / Math.max(tamano.x, tamano.z));

      caja.setFromObject(modelo);
      const centro = caja.getCenter(new THREE.Vector3());
      modelo.position.set(
        procedural.position.x - centro.x,
        procedural.position.y + yBase - caja.min.y,
        procedural.position.z - centro.z,
      );
      modelo.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });

      procedural.parent?.add(modelo);
      procedural.visible = false;
      console.info(`Modelo externo cargado: ${url}`);
    },
    undefined,
    () => {
      // No hay archivo: se mantiene el modelo procedural
    },
  );
}
