// Piezas reutilizables para construir islas: casas, árboles, muelles, carteles...
import * as THREE from 'three';
import type { Actualizable, Aleatorio, AlturaEn } from '../../tipos';

type OpcionesMaterial = Omit<THREE.MeshLambertMaterialParameters, 'color'>;

const materiales = new Map<string, THREE.MeshLambertMaterial>();

/** Material low-poly compartido por color (evita crear cientos de materiales iguales). */
export function mat(color: number, opciones: OpcionesMaterial = {}): THREE.MeshLambertMaterial {
  const clave = `${color}|${JSON.stringify(opciones)}`;
  let material = materiales.get(clave);
  if (!material) {
    material = new THREE.MeshLambertMaterial({ color, flatShading: true, ...opciones });
    materiales.set(clave, material);
  }
  return material;
}

export function malla(geometria: THREE.BufferGeometry, color: number, opciones?: OpcionesMaterial): THREE.Mesh {
  return new THREE.Mesh(geometria, mat(color, opciones));
}

/** Gira un objeto en Y para que su frente (+Z) mire hacia el punto (x, z). */
export function mirarHacia(objeto: THREE.Object3D, x: number, z: number): void {
  objeto.rotation.y = Math.atan2(x - objeto.position.x, z - objeto.position.z);
}

/** Avanza desde (x, z) en la dirección (dx, dz) hasta encontrar la orilla. */
export function buscarOrilla(
  alturaEn: AlturaEn,
  x: number,
  z: number,
  dx: number,
  dz: number,
  nivel = 1.6,
  maxPasos = 400,
): { x: number; z: number } {
  for (let i = 0; i < maxPasos && alturaEn(x, z) >= nivel; i++) {
    x += dx;
    z += dz;
  }
  return { x, z };
}

export interface OpcionesEsparcir {
  grupo: THREE.Group;
  alturaEn: AlturaEn;
  aleatorio: Aleatorio;
  radio: number;
  cantidad: number;
  condicion: (h: number, x: number, z: number) => boolean;
  crear: (aleatorio: Aleatorio) => THREE.Object3D;
}

/** Coloca `cantidad` objetos en puntos aleatorios de la isla que cumplan `condicion(h, x, z)`. */
export function esparcir({ grupo, alturaEn, aleatorio, radio, cantidad, condicion, crear }: OpcionesEsparcir): void {
  let colocados = 0;
  for (let intento = 0; intento < cantidad * 20 && colocados < cantidad; intento++) {
    const angulo = aleatorio() * Math.PI * 2;
    const r = Math.sqrt(aleatorio()) * radio;
    const x = Math.cos(angulo) * r;
    const z = Math.sin(angulo) * r;
    const h = alturaEn(x, z);
    if (!condicion(h, x, z)) continue;
    const objeto = crear(aleatorio);
    objeto.position.set(x, h - 0.2, z);
    grupo.add(objeto);
    colocados++;
  }
}

export interface OpcionesCartel {
  ancho?: number;
  alto?: number;
  /** Colores CSS. */
  fondo?: string;
  color?: string;
  fuente?: string;
  dobleCara?: boolean;
}

/** Camino de tierra que sigue el terreno entre varios puntos (x, z). */
export function crearCamino(grupo: THREE.Group, puntos: Array<[number, number]>, ancho: number, alturaEn: AlturaEn, color = 0xb79a6b): void {
  for (let k = 0; k < puntos.length - 1; k++) {
    const [ax, az] = puntos[k];
    const [bx, bz] = puntos[k + 1];
    const largo = Math.hypot(bx - ax, bz - az);
    const n = Math.ceil(largo / 4);
    const giro = Math.atan2(bx - ax, bz - az);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      // Grueso y algo elevado: la malla del terreno es más basta que alturaEn y lo taparía
      const tramo = malla(new THREE.BoxGeometry(ancho, 0.8, largo / n + 0.8), color);
      tramo.position.set(x, alturaEn(x, z) + 0.05, z);
      tramo.rotation.y = giro;
      grupo.add(tramo);
    }
  }
}

/** Cartel plano con texto dibujado en un canvas. */
export function crearCartel(
  texto: string,
  { ancho = 8, alto = 2, fondo = '#ffffff', color = '#2f5fa8', fuente = 'Georgia, serif', dobleCara = false }: OpcionesCartel = {},
): THREE.Mesh {
  const lienzo = document.createElement('canvas');
  lienzo.width = 512;
  lienzo.height = Math.max(32, Math.round((512 * alto) / ancho));
  const ctx = lienzo.getContext('2d');
  if (ctx) {
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(lienzo.height * 0.62)}px ${fuente}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, lienzo.width / 2, lienzo.height / 2, lienzo.width * 0.9);
  }

  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(ancho, alto),
    new THREE.MeshBasicMaterial({ map: textura, side: dobleCara ? THREE.DoubleSide : THREE.FrontSide }),
  );
}

export interface OpcionesCasa {
  ancho?: number;
  fondo?: number;
  alto?: number;
  pared?: number;
  techo?: number;
}

/** Casa sencilla con tejado a dos aguas. La puerta mira hacia +Z. */
export function crearCasa({ ancho = 6, fondo = 6, alto = 4, pared = 0xf3e6c8, techo = 0xc0503a }: OpcionesCasa = {}): THREE.Group {
  const casa = new THREE.Group();

  const cimiento = malla(new THREE.BoxGeometry(ancho * 1.04, 3, fondo * 1.04), 0x9a9088);
  cimiento.position.y = -1.4;
  casa.add(cimiento);

  const muros = malla(new THREE.BoxGeometry(ancho, alto, fondo), pared);
  muros.position.y = alto / 2;
  casa.add(muros);

  const anchoTecho = ancho * 1.2;
  const fondoTecho = fondo * 1.12;
  const forma = new THREE.Shape();
  forma.moveTo(-anchoTecho / 2, 0);
  forma.lineTo(anchoTecho / 2, 0);
  forma.lineTo(0, Math.min(ancho, fondo) * 0.55);
  forma.closePath();
  const geometriaTecho = new THREE.ExtrudeGeometry(forma, { depth: fondoTecho, bevelEnabled: false });
  geometriaTecho.translate(0, 0, -fondoTecho / 2);
  const tejado = malla(geometriaTecho, techo);
  tejado.position.y = alto;
  casa.add(tejado);

  const puerta = malla(new THREE.BoxGeometry(ancho * 0.22, alto * 0.5, 0.2), 0x6b4428);
  puerta.position.set(0, alto * 0.25, fondo / 2 + 0.05);
  casa.add(puerta);

  const geometriaVentana = new THREE.BoxGeometry(ancho * 0.18, alto * 0.2, 0.2);
  for (const lado of [-1, 1]) {
    const ventana = malla(geometriaVentana, 0x7cc6e8);
    ventana.position.set(lado * ancho * 0.3, alto * 0.6, fondo / 2 + 0.05);
    casa.add(ventana);
  }
  return casa;
}

/** Palmera con tronco curvado y hojas caídas. */
export function crearPalmera(aleatorio: Aleatorio): THREE.Group {
  const palmera = new THREE.Group();
  const segmentos = 5;
  const largo = 1.3;
  const curva = 0.08 + aleatorio() * 0.12;
  let x = 0;
  let y = 0;

  for (let i = 0; i < segmentos; i++) {
    const inclinacion = curva * (i + 1) * 0.5;
    const segmento = malla(new THREE.CylinderGeometry(0.28 - i * 0.02, 0.34 - i * 0.02, largo, 6), 0x9b7448);
    segmento.position.set(x + (Math.sin(inclinacion) * largo) / 2, y + (Math.cos(inclinacion) * largo) / 2, 0);
    segmento.rotation.z = -inclinacion;
    palmera.add(segmento);
    x += Math.sin(inclinacion) * largo;
    y += Math.cos(inclinacion) * largo;
  }

  const copa = new THREE.Group();
  copa.position.set(x, y, 0);
  const hojas = 7;
  for (let i = 0; i < hojas; i++) {
    const pivote = new THREE.Group();
    pivote.rotation.y = (i / hojas) * Math.PI * 2 + aleatorio() * 0.3;
    const hoja = malla(new THREE.BoxGeometry(3.2, 0.12, 0.9), i % 2 ? 0x3f9a3a : 0x52b043);
    hoja.position.x = 1.5;
    hoja.rotation.z = -0.35;
    pivote.add(hoja);
    copa.add(pivote);
  }
  const coco = malla(new THREE.IcosahedronGeometry(0.3, 0), 0x6b4a2e);
  coco.position.set(0.3, -0.3, 0.2);
  copa.add(coco);
  palmera.add(copa);

  palmera.rotation.y = aleatorio() * Math.PI * 2;
  palmera.scale.setScalar(0.9 + aleatorio() * 0.4);
  return palmera;
}

/** Árbol redondeado de bosque. */
export function crearArbol(aleatorio: Aleatorio): THREE.Group {
  const arbol = new THREE.Group();
  const tronco = malla(new THREE.CylinderGeometry(0.3, 0.45, 2.5, 6), 0x7a5634);
  tronco.position.y = 1.25;
  arbol.add(tronco);

  const verdes = [0x4f9a3b, 0x5fae46, 0x3f8a35];
  const tamano = 1.8 + aleatorio();
  const copa = malla(new THREE.IcosahedronGeometry(tamano, 0), verdes[Math.floor(aleatorio() * verdes.length)]);
  copa.position.y = 2.5 + tamano * 0.8;
  arbol.add(copa);

  if (aleatorio() > 0.5) {
    const extra = malla(new THREE.IcosahedronGeometry(tamano * 0.6, 0), verdes[0]);
    extra.position.set(tamano * 0.5, 2.5 + tamano * 1.4, 0);
    arbol.add(extra);
  }
  arbol.rotation.y = aleatorio() * Math.PI * 2;
  return arbol;
}

export function crearRoca(aleatorio: Aleatorio): THREE.Mesh {
  const roca = malla(new THREE.DodecahedronGeometry(1 + aleatorio() * 2, 0), 0x8c8378);
  roca.scale.set(1, 0.6 + aleatorio() * 0.5, 1 + aleatorio() * 0.4);
  roca.rotation.set(aleatorio(), aleatorio() * Math.PI, aleatorio());
  return roca;
}

/** Muelle de madera que avanza hacia +Z desde su origen. */
export function crearMuelle(largo = 24, ancho = 3): THREE.Group {
  const muelle = new THREE.Group();
  const tablas = malla(new THREE.BoxGeometry(ancho, 0.35, largo), 0xa57a4e);
  tablas.position.set(0, 2.2, largo / 2);
  muelle.add(tablas);

  const geometriaPoste = new THREE.CylinderGeometry(0.22, 0.22, 6, 6);
  for (let z = 2; z <= largo; z += 4) {
    for (const lado of [-1, 1]) {
      const poste = malla(geometriaPoste, 0x6b4a2e);
      poste.position.set((lado * ancho * 0.9) / 2, -0.3, z);
      muelle.add(poste);
    }
  }
  return muelle;
}

/** Barca pequeña que se mece con las olas. */
export function crearBarquito(color = 0xb5553a): THREE.Group {
  const barco = new THREE.Group();
  const flotante = new THREE.Group();
  barco.add(flotante);

  const casco = malla(new THREE.BoxGeometry(2.2, 1, 5.5), color);
  casco.position.y = 0.3;
  flotante.add(casco);
  const mastil = malla(new THREE.CylinderGeometry(0.08, 0.1, 4, 5), 0x6b4a2e);
  mastil.position.y = 2.6;
  flotante.add(mastil);
  const vela = malla(new THREE.BoxGeometry(0.05, 2.4, 1.8), 0xf7f2e6);
  vela.position.set(0.1, 2.9, 0.3);
  flotante.add(vela);

  const fase = Math.random() * 10;
  const actualizar: Actualizable = (t) => {
    flotante.position.y = Math.sin(t * 1.3 + fase) * 0.25;
    flotante.rotation.z = Math.sin(t * 1.1 + fase) * 0.06;
  };
  barco.userData.actualizar = actualizar;
  return barco;
}

/** Molino de viento con aspas giratorias. Con `cupula`, remate en media esfera en vez de cono. */
export function crearMolino(escala = 1, { techo: colorTecho = 0x8a4b2e, cupula = false }: { techo?: number; cupula?: boolean } = {}): THREE.Group {
  const molino = new THREE.Group();
  const torre = malla(new THREE.CylinderGeometry(2.2, 3.2, 12, 10), 0xf4f0e6, { flatShading: false });
  torre.position.y = 5;
  molino.add(torre);
  const techo = cupula
    ? malla(new THREE.SphereGeometry(2.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), colorTecho, { flatShading: false })
    : malla(new THREE.ConeGeometry(3, 3.5, 8), colorTecho);
  techo.position.y = cupula ? 11 : 12.75;
  molino.add(techo);

  const eje = new THREE.Group();
  eje.position.set(0, 9.5, 3);
  molino.add(eje);
  const buje = malla(new THREE.CylinderGeometry(0.6, 0.6, 1, 8), 0x6b4a2e);
  buje.rotation.x = Math.PI / 2;
  eje.add(buje);
  for (let i = 0; i < 4; i++) {
    const brazo = new THREE.Group();
    brazo.rotation.z = (i * Math.PI) / 2;
    const aspa = malla(new THREE.BoxGeometry(1.2, 7, 0.15), 0xe9dfc9);
    aspa.position.y = 3.8;
    brazo.add(aspa);
    eje.add(brazo);
  }

  molino.scale.setScalar(escala);
  const fase = Math.random() * 10;
  const actualizar: Actualizable = (t) => {
    eje.rotation.z = t * 0.6 + fase;
  };
  molino.userData.actualizar = actualizar;
  return molino;
}
