import * as THREE from 'three';
import type { Actualizable } from '../tipos';

const vertexShader = /* glsl */ `
  varying vec3 vDireccion;
  void main() {
    vDireccion = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position.z = gl_Position.w; // siempre en el fondo
  }
`;

// El horizonte usa exactamente el color de la niebla para que mar y cielo se fundan sin costura.
const fragmentShader = /* glsl */ `
  uniform vec3 uCenit;
  uniform vec3 uColorSol;
  uniform vec3 uSol;
  varying vec3 vDireccion;
  #include <common>
  #include <fog_pars_fragment>
  void main() {
    vec3 dir = normalize(vDireccion);
    float h = clamp(dir.y, 0.0, 1.0);
    vec3 color = mix(fogColor, uCenit, pow(h, 0.45));
    float s = max(dot(dir, uSol), 0.0);
    color += uColorSol * (pow(s, 900.0) * 1.5 + pow(s, 12.0) * 0.25);
    gl_FragColor = vec4(color, 1.0);
  }
`;

/** Cúpula de cielo con degradado y sol. Sigue a la cámara para parecer infinita. */
export function crearCielo({ direccionSol }: { direccionSol: THREE.Vector3 }): THREE.Mesh {
  // Los colores van en sRGB "crudo" porque se mezclan con fogColor, que ya está en espacio de salida.
  const crudo = (hex: number) => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);

  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uCenit: { value: crudo(0x3c8fd8) },
        uColorSol: { value: crudo(0xfff2d0) },
        uSol: { value: direccionSol.clone() },
      },
    ]),
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
    fog: true,
  });

  const cielo = new THREE.Mesh(new THREE.SphereGeometry(4000, 32, 16), material);
  cielo.frustumCulled = false;
  cielo.renderOrder = -1;
  const actualizar: Actualizable = (_t, _dt, camara) => cielo.position.copy(camara.position);
  cielo.userData.actualizar = actualizar;
  return cielo;
}
