import * as THREE from 'three';
import './estilos.css';
import { crearMotor } from './nucleo/motor';
import { VueloCreativo } from './nucleo/controles';
import { ViajeRapido } from './nucleo/viaje';
import { ModoMapa } from './nucleo/mapa';
import { crearCielo } from './mundo/cielo';
import { crearOceano } from './mundo/oceano';
import { crearNubes } from './mundo/nubes';
import { Mundo } from './mundo/Mundo';
import { ISLAS } from './datos/islas';
import { Hud } from './ui/hud';
import { crearAleatorio } from './utils/ruido';

const COLOR_HORIZONTE = new THREE.Color(0xcde7f3);
const DIRECCION_SOL = new THREE.Vector3(-0.6, 0.65, 0.45).normalize();

// --- Motor y ambiente ---
const app = document.getElementById('app');
if (!app) throw new Error('Falta el elemento #app en index.html');
const motor = crearMotor(app);
const { escena, camara, renderer } = motor;
escena.fog = new THREE.Fog(COLOR_HORIZONTE, 400, 2800);

escena.add(new THREE.HemisphereLight(0xdff2ff, 0x6d8a5a, 1.15));
const sol = new THREE.DirectionalLight(0xfff0d8, 2.4);
sol.position.copy(DIRECCION_SOL).multiplyScalar(1000);
escena.add(sol, sol.target);

// Sombras: el sol proyecta en una zona de 360 m alrededor de la cámara y la sigue
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -180, right: 180, top: 180, bottom: -180, near: 1, far: 1500 });
sol.shadow.bias = -0.0004;
sol.shadow.normalBias = 0.6;

function seguirSol(): void {
  sol.target.position.set(Math.round(camara.position.x), 0, Math.round(camara.position.z));
  sol.position.copy(sol.target.position).addScaledVector(DIRECCION_SOL, 700);
}

// --- Mundo ---
const mundo = new Mundo(escena);
mundo.agregar(crearCielo({ direccionSol: DIRECCION_SOL }));
const oceano = mundo.agregar(crearOceano({ colorHorizonte: COLOR_HORIZONTE, direccionSol: DIRECCION_SOL }));
mundo.agregar(crearNubes(crearAleatorio(42)));
mundo.cargarIslas(ISLAS);

// --- Cámara y controles ---
camara.position.set(175, 40, 300); // frente a Villa Foosha, desde el mar
camara.lookAt(120, 8, 175);

const vuelo = new VueloCreativo(camara, renderer.domElement, {
  alturaSuelo: (x, z) => mundo.alturaSuelo(x, z),
});
const viaje = new ViajeRapido(camara, vuelo);

const hud = new Hud({ islas: mundo.islas, alExplorar: () => vuelo.bloquear(), alVerMapa: () => mapa.entrar() });
vuelo.bloqueo.addEventListener('lock', () => hud.mostrarIntro(false));
// En el mapa el ratón queda libre para hacer clic, así que no se muestra la pantalla de pausa
vuelo.bloqueo.addEventListener('unlock', () => {
  if (!mapa.activo) hud.mostrarIntro(true);
});

function viajarAIsla(indice: number, alLlegar?: () => void): void {
  const isla = mundo.islas[indice];
  if (!isla) return;
  const centro = isla.grupo.position;
  const direccion = new THREE.Vector3().subVectors(camara.position, centro).setY(0);
  if (direccion.lengthSq() < 1) direccion.set(0, 0, 1);
  direccion.normalize();

  const destino = centro.clone().addScaledVector(direccion, isla.radio * 1.6 + 40);
  destino.y = isla.radio * 0.45 + 30;
  viaje.iniciar(destino, centro.clone().setY(8), alLlegar);
  hud.ocultarFicha();
}

const mapa = new ModoMapa({
  camara,
  escena,
  oceano,
  mundo,
  viaje,
  elemento: renderer.domElement,
  alElegirIsla: (indice, alLlegar) => {
    vuelo.bloquear(); // el clic en el mapa permite volver a capturar el ratón
    viajarAIsla(indice, alLlegar);
  },
  alCambiar: (activo) => {
    if (activo && vuelo.bloqueado) document.exitPointerLock();
    hud.mostrarMapa(activo);
    // Al volver del mapa sin elegir isla, el ratón está libre: se muestra la pausa para poder seguir
    if (!activo && !vuelo.bloqueado && !viaje.enCurso) hud.mostrarIntro(true);
  },
});

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const numero = /^Digit([1-9])$/.exec(e.code);
  if (numero) {
    if (mapa.activo) mapa.irAIsla(Number(numero[1]) - 1);
    else viajarAIsla(Number(numero[1]) - 1);
  }
  if (e.code === 'KeyM') mapa.alternar();
  if (e.code === 'Escape' && mapa.activo) mapa.salir();
  if (e.code === 'KeyE') hud.alternarFicha();
  if (e.code === 'KeyP') document.body.classList.toggle('modo-foto');
});

// ?foto en la URL arranca sin interfaz (útil para capturas); ?isla=N empieza junto a la isla N
const parametros = new URLSearchParams(location.search);
if (parametros.has('foto')) document.body.classList.add('modo-foto');
const islaInicial = mundo.islas[Number(parametros.get('isla')) - 1];
if (islaInicial) {
  const { grupo, radio } = islaInicial;
  camara.position.copy(grupo.position).add(new THREE.Vector3(radio * 0.6, radio * 0.5 + 30, radio * 1.6 + 40));
  camara.lookAt(grupo.position.x, 8, grupo.position.z);
}
// ?camara=x,y,z,mx,my,mz coloca la cámara en (x,y,z) mirando a (mx,my,mz)
const vista = parametros.get('camara')?.split(',').map(Number);
if (vista?.length === 6 && vista.every(Number.isFinite)) {
  camara.position.set(vista[0], vista[1], vista[2]);
  camara.lookAt(vista[3], vista[4], vista[5]);
}
// ?mapa abre directamente el mapa desde arriba
if (parametros.has('mapa')) mapa.entrar(false);

// --- Bucle principal ---
let anterior = performance.now();
let tiempo = 0;

renderer.setAnimationLoop((ahora) => {
  const dt = Math.min((ahora - anterior) / 1000, 0.1);
  anterior = ahora;
  tiempo += dt;

  vuelo.actualizar(dt);
  viaje.actualizar(dt);
  mundo.actualizar(tiempo, dt, camara);
  seguirSol();
  hud.actualizar({
    posicion: camara.position,
    rapidez: vuelo.velocidad.length(),
    cercana: mundo.islaMasCercana(camara.position),
  });
  motor.renderizar();
});
