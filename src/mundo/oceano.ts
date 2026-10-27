import * as THREE from 'three';
import type { Actualizable } from '../tipos';

const TAMANO = 6000;
const SEGMENTOS = 400;
const PASO = TAMANO / SEGMENTOS;

const vertexShader = /* glsl */ `
  uniform float uTiempo;
  uniform float uAmplitud;
  varying float vAltura;
  varying vec3 vMundo;
  #include <common>
  #include <fog_pars_vertex>

  float olas(vec2 p, float t) {
    float h = 0.0;
    h += sin(p.x * 0.050 + t * 0.9) * 0.60;
    h += sin(p.y * 0.070 + t * 1.1) * 0.45;
    h += sin((p.x + p.y) * 0.090 + t * 1.6) * 0.25;
    h += sin((p.x - p.y * 0.6) * 0.120 + t * 2.1) * 0.12;
    return h;
  }

  void main() {
    vec4 mundo = modelMatrix * vec4(position, 1.0);
    float h = olas(mundo.xz, uTiempo) * uAmplitud;
    mundo.y += h;
    vAltura = h;
    vMundo = mundo.xyz;
    vec4 mvPosition = viewMatrix * mundo;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uProfundo;
  uniform vec3 uClaro;
  uniform vec3 uEspuma;
  uniform vec3 uCielo;
  uniform vec3 uSol;
  varying float vAltura;
  varying vec3 vMundo;
  #include <common>
  #include <fog_pars_fragment>

  void main() {
    // Normal por caras (derivadas de pantalla): da el aspecto low-poly facetado
    vec3 n = normalize(cross(dFdx(vMundo), dFdy(vMundo)));
    if (n.y < 0.0) n = -n;
    vec3 vista = normalize(cameraPosition - vMundo);

    vec3 color = mix(uProfundo, uClaro, smoothstep(-1.2, 1.2, vAltura));
    color *= 0.65 + 0.45 * max(dot(n, uSol), 0.0);

    float fresnel = pow(1.0 - max(dot(n, vista), 0.0), 4.0);
    color = mix(color, uCielo, fresnel * 0.6);

    float brillo = pow(max(dot(n, normalize(uSol + vista)), 0.0), 120.0);
    color += vec3(1.0, 0.96, 0.85) * brillo * 0.8;

    color = mix(color, uEspuma, smoothstep(1.05, 1.35, vAltura) * 0.85);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

interface OpcionesOceano {
  colorHorizonte: THREE.Color;
  direccionSol: THREE.Vector3;
}

/** Océano infinito con olas animadas. La malla se recoloca bajo la cámara en pasos de la rejilla. */
export function crearOceano({ colorHorizonte, direccionSol }: OpcionesOceano): THREE.Mesh {
  const geometria = new THREE.PlaneGeometry(TAMANO, TAMANO, SEGMENTOS, SEGMENTOS);
  geometria.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTiempo: { value: 0 },
        uAmplitud: { value: 1 },
        uProfundo: { value: new THREE.Color(0x1567a0) },
        uClaro: { value: new THREE.Color(0x38b4d6) },
        uEspuma: { value: new THREE.Color(0xf2fbff) },
        uCielo: { value: colorHorizonte.clone() },
        uSol: { value: direccionSol.clone() },
      },
    ]),
    vertexShader,
    fragmentShader,
    fog: true,
  });

  const oceano = new THREE.Mesh(geometria, material);
  oceano.frustumCulled = false;
  const actualizar: Actualizable = (t, _dt, camara) => {
    material.uniforms.uTiempo.value = t;
    oceano.position.x = Math.round(camara.position.x / PASO) * PASO;
    oceano.position.z = Math.round(camara.position.z / PASO) * PASO;
  };
  oceano.userData.actualizar = actualizar;
  return oceano;
}
