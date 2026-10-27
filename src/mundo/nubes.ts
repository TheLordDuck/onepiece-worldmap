import * as THREE from 'three';
import type { Actualizable, Aleatorio } from '../tipos';

const LIMITE = 3000;

/** Nubes low-poly esponjosas (grupos de esferas) que derivan lentamente con el viento. */
export function crearNubes(aleatorio: Aleatorio, cantidad = 40): THREE.Group {
  const grupo = new THREE.Group();
  const geometria = new THREE.IcosahedronGeometry(1, 1);
  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    flatShading: true,
    emissive: 0x8899aa,
    emissiveIntensity: 0.35,
  });

  for (let i = 0; i < cantidad; i++) {
    const nube = new THREE.Group();
    const bolitas = 5 + Math.floor(aleatorio() * 5);
    for (let j = 0; j < bolitas; j++) {
      const bolita = new THREE.Mesh(geometria, material);
      const escala = 10 + aleatorio() * 18;
      bolita.scale.set(escala, escala * 0.7, escala);
      bolita.position.set((aleatorio() - 0.5) * 80, (aleatorio() - 0.5) * 16, (aleatorio() - 0.5) * 30);
      nube.add(bolita);
    }
    nube.position.set((aleatorio() - 0.5) * LIMITE * 2, 160 + aleatorio() * 160, (aleatorio() - 0.5) * LIMITE * 2);
    nube.rotation.y = aleatorio() * Math.PI;
    grupo.add(nube);
  }

  const actualizar: Actualizable = (_t, dt) => {
    for (const nube of grupo.children) {
      nube.position.x += dt * 3;
      if (nube.position.x > LIMITE) nube.position.x = -LIMITE;
    }
  };
  grupo.userData.actualizar = actualizar;
  return grupo;
}
