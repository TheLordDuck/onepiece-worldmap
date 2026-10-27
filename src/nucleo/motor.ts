import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export interface Motor {
  renderer: THREE.WebGLRenderer;
  escena: THREE.Scene;
  camara: THREE.PerspectiveCamera;
  renderizar(): void;
}

/** Crea el renderizador WebGL, la escena, la cámara y la capa de etiquetas HTML. */
export function crearMotor(contenedor: HTMLElement): Motor {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  contenedor.appendChild(renderer.domElement);

  const etiquetas = new CSS2DRenderer();
  etiquetas.setSize(window.innerWidth, window.innerHeight);
  etiquetas.domElement.className = 'capa-etiquetas';
  contenedor.appendChild(etiquetas.domElement);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 6000);

  window.addEventListener('resize', () => {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    etiquetas.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    renderer,
    escena,
    camara,
    renderizar() {
      renderer.render(escena, camara);
      etiquetas.render(escena, camara);
    },
  };
}
