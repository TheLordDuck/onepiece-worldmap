# One Piece Reality 🏴‍☠️

Maqueta 3D navegable del mundo de One Piece, hecha para la web. Se recorre volando libremente, como en el modo creativo de Minecraft, y se viaja de isla en isla.

Proyecto personal (fan-made).

## Cómo ejecutarlo

```bash
pnpm install     # solo la primera vez
pnpm dev         # abre http://localhost:5173
```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `pnpm tipos` | Comprueba los tipos de TypeScript sin compilar |
| `pnpm build` | Comprueba los tipos y genera la versión final en `dist/` |
| `pnpm preview` | Sirve la versión de `dist/` para probarla |

## Controles

| Tecla | Acción |
|---|---|
| Clic | Entrar en el mundo (captura el ratón) |
| `W` `A` `S` `D` / flechas | Moverse en horizontal |
| Ratón | Mirar |
| `Espacio` / `Shift` | Subir / bajar |
| `W` `W` (doble toque) | Sprint (×3) |
| Rueda del ratón | Cambiar la velocidad de vuelo |
| `1` … `9` | Viaje rápido a una isla |
| `E` | Abrir/cerrar la ficha de la isla cercana |
| `M` | Mapa desde arriba (clic en una isla para bajar a ella, rueda para acercar, arrastrar para mover; `M` o `Esc` para volver) |
| `P` | Modo foto (oculta toda la interfaz) |
| `Esc` | Pausa |

Parámetros de URL útiles: `?foto` arranca en modo foto, `?isla=2` empieza junto a la isla 2 , `?mapa` abre directamente el mapa desde arriba y `?camara=x,y,z,mx,my,mz` coloca la cámara en (x,y,z) mirando a (mx,my,mz). Se pueden combinar: `?foto&isla=2`.

## Estructura

```
src/
├── main.ts              Punto de entrada: monta todo y corre el bucle principal
├── tipos.ts             Tipos compartidos (DatosIsla, ConstructorIsla, Actualizable...)
├── estilos.css          Estilos de la interfaz (intro, HUD, fichas, etiquetas)
├── nucleo/
│   ├── motor.ts         Renderizador, escena, cámara y capa de etiquetas HTML
│   ├── controles.ts     Vuelo creativo (WASD, sprint, colisión con el terreno)
│   ├── viaje.ts         Viaje rápido animado entre islas
│   └── mapa.ts          Modo mapa: vista desde arriba, ruta del viaje y clic para ir a una isla
├── mundo/
│   ├── Mundo.ts         Contenedor del mundo: islas, animaciones, consultas
│   ├── cielo.ts         Cúpula de cielo con degradado y sol
│   ├── oceano.ts        Océano infinito con olas (shader propio)
│   ├── nubes.ts         Nubes low-poly
│   ├── modelos.ts       Carga opcional de modelos .glb externos
│   ├── texturas.ts      Texturas procedurales (estuco, piedra, tejas, baldosas, madera)
│   └── islas/
│       ├── index.ts     Registro de constructores de islas
│       ├── terreno.ts   Generador de terreno de isla (forma, colinas, playas)
│       ├── utilidades.ts Piezas: casas, palmeras, árboles, molinos, muelles, carteles
│       ├── arquitectura.ts Kit detallado: tejados de pagoda, ventanas en arco, balaustradas, bóvedas, fusión de mallas
│       ├── edificios.ts   Casas de entramado, edificios de ciudad, torres-central, estatua de Morgan, cadalso, mansión...
│       ├── goingMerry.ts  El Going Merry
│       ├── foosha.ts      Isla Dawn: Foosha, monte Colubo, Gray Terminal y Goa
│       ├── shellsTown.ts
│       ├── orangeTown.ts
│       ├── syrup.ts       Villa Syrup (islas Gecko)
│       ├── baratie.ts
│       ├── arlongPark.ts  El recinto de Arlong Park
│       ├── conomi.ts      Isla completa de Cocoyasi
│       └── loguetown.ts
├── datos/
│   └── islas.ts         Catálogo de islas: nombre, mar, posición, ficha...
├── ui/
│   └── hud.ts           Interfaz HTML encima del 3D
└── utils/
    └── ruido.ts         Aleatoriedad con semilla y ruido para el terreno
```

### Ideas clave de la arquitectura

- **Datos separados del código.** `src/datos/islas.ts` dice *qué* islas hay y *dónde* están. Cada constructor de `src/mundo/islas/` dice *cómo* se ven.
- **Cualquier objeto puede animarse.** Si un objeto tiene `userData.actualizar = (t, dt, camara) => {...}`, el `Mundo` lo llama en cada fotograma (molinos, barcas, el Baratie, las olas...).
- **Todo es determinista.** Cada isla usa una semilla sacada de su `id`, así que se genera igual cada vez.
- **Estilo low-poly con colores planos** (`flatShading`). Se ve como una maqueta y pesa muy poco.

## Cómo añadir una isla

1. Crea `src/mundo/islas/miIsla.ts` con una función que devuelva `{ grupo, alturaEn?, radio, alturaEtiqueta? }`:

   ```ts
   import * as THREE from 'three';
   import { crearTerreno } from './terreno';
   import { crearPalmera, esparcir } from './utilidades';
   import type { ConstructorIsla } from '../../tipos';

   export const construirMiIsla: ConstructorIsla = (aleatorio) => {
     const grupo = new THREE.Group();
     const terreno = crearTerreno({ radio: 80, altura: 20, semilla: 99 });
     grupo.add(terreno.malla);
     esparcir({
       grupo, alturaEn: terreno.alturaEn, aleatorio, radio: 100, cantidad: 20,
       crear: crearPalmera, condicion: (h) => h > 1.3 && h < 2.6,
     });
     return { grupo, alturaEn: terreno.alturaEn, radio: 85, alturaEtiqueta: 40 };
   };
   ```

2. Regístrala en `src/mundo/islas/index.ts`: `miIsla: construirMiIsla`.
3. Añádela al catálogo en `src/datos/islas.ts` con `construir: 'miIsla'`, su posición y su ficha. El tipo `DatosIsla` te avisa si falta algún campo.

Las islas sin terreno (barcos, plataformas) omiten `alturaEn`.

## TypeScript

El proyecto usa TypeScript en modo estricto. Vite ejecuta el código directamente y `tsc` solo comprueba los tipos.

- Los tipos compartidos (`DatosIsla`, `ConstructorIsla`, `Actualizable`...) están en `src/tipos.ts`.
- Los imports van sin extensión (`'./terreno'`), y los que solo traen tipos usan `import type`.
- `pnpm build` falla si hay errores de tipos, así nunca se publica una versión rota.

## Documentación

- [`docs/TAREAS.md`](docs/TAREAS.md): plan por fases, tareas hechas y pendientes, y registro de cambios.
- [`docs/IDEAS.md`](docs/IDEAS.md): banco de ideas para más adelante.
- [`docs/referencias/east-blue.md`](docs/referencias/east-blue.md): qué hay en cada isla del East Blue y dónde, con sus capítulos. **Se consulta antes de modelar cualquier isla.**
- [`public/modelos/LEEME.md`](public/modelos/LEEME.md): modelos .glb externos que sustituyen a los procedurales.

## Créditos

- Diseño de referencia de Arlong Park: [aryan_yadav en Sketchfab](https://sketchfab.com/3d-models/arlong-park-one-piece-fish-man-island-0928d8621e25460791954b01ac3c2ce7) (CC BY 4.0).
- Información de las islas: [One Piece Wiki](https://onepiece.fandom.com).
