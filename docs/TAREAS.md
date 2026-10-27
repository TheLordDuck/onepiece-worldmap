# Tareas

Plan de trabajo por fases. Cada fase deja algo que se puede usar.
Leyenda: ✅ hecho · 🔲 pendiente · 🚧 en curso

---

## Fase 1: El mar y las primeras islas ✅

**Objetivo:** poder volar libremente sobre un océano infinito y visitar las primeras islas del East Blue.

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 1.1 | Montar el proyecto (Vite + Three.js) | ✅ | `pnpm dev` para arrancar |
| 1.2 | Motor base: renderizador, escena, cámara, redimensionado | ✅ | `src/nucleo/motor.js` |
| 1.3 | Océano infinito con olas animadas | ✅ | Shader propio con aspecto facetado, brillo del sol y espuma en las crestas. La malla sigue a la cámara |
| 1.4 | Cielo con degradado, sol y niebla de horizonte | ✅ | El horizonte usa el color de la niebla para que no haya costura entre mar y cielo |
| 1.5 | Nubes low-poly que se mueven con el viento | ✅ | `src/mundo/nubes.js` |
| 1.6 | Vuelo estilo modo creativo | ✅ | WASD horizontal, Espacio/Shift, sprint con doble W, rueda para la velocidad, sin atravesar agua ni terreno |
| 1.7 | Generador de terreno de islas | ✅ | Forma irregular, colinas, playas, roca en pendientes, zonas planas para pueblos |
| 1.8 | Kit de piezas | ✅ | Casas, palmeras, árboles, rocas, molinos, muelles, barcas, carteles con texto |
| 1.9 | Isla: **Villa Foosha** | ✅ | Pueblo, Partys Bar, 3 molinos, muelle, bosque |
| 1.10 | Isla: **Shells Town** | ✅ | Base de la Marina con muralla, torre y bandera, poste de Zoro, ciudad en cuadrícula |
| 1.11 | Isla: **Baratie** | ✅ | Restaurante flotante con forma de pez que se mece |
| 1.12 | Etiquetas flotantes con el nombre de cada isla | ✅ | Se desvanecen con la distancia |
| 1.13 | HUD: mar actual, isla cercana, coordenadas, velocidad | ✅ | `src/ui/hud.js` |
| 1.14 | Ficha de isla estilo pergamino (tecla E) | ✅ | Descripción, arco y datos curiosos |
| 1.15 | Viaje rápido animado (teclas 1–9) | ✅ | La cámara vuela en arco hasta la isla |
| 1.16 | Modo foto (tecla P, `?foto`) y arranque en una isla (`?isla=N`) | ✅ | |
| 1.17 | Documentación: README, tareas, ideas | ✅ | |
| 1.18 | Migración a **TypeScript** (modo estricto) | ✅ | Tipos compartidos en `src/tipos.ts`. `pnpm build` comprueba los tipos |

---

## Fase 2: El mapa del mundo 🔲

**Objetivo:** la estructura global de One Piece visible a gran escala.

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.1 | Definir la escala y el mapa global (coordenadas de cada mar) | 🔲 | Mundo comprimido. Decidir el tamaño total |
| 2.2 | **Red Line**: el continente-muralla que rodea el mundo | 🔲 | Acantilados gigantes, posiblemente en tramos |
| 2.3 | **Grand Line**, perpendicular a la Red Line | 🔲 | |
| 2.4 | **Calm Belts**: agua quieta y más oscura a los lados de la Grand Line | 🔲 | Requiere que el océano varíe según la zona |
| 2.5 | Los **cuatro Blues** como cuadrantes | 🔲 | El HUD ya muestra el mar de cada isla |
| 2.6 | **Reverse Mountain** | 🔲 | Canales que suben la Red Line |
| 2.7 | Islas lejanas como marcadores simples | 🔲 | Para ver el mundo entero aunque no estén modeladas |
| 2.8 | Carga por distancia (LOD) | 🔲 | Versión simple de lejos y completa de cerca |
| 2.9 | Mapa desde arriba (tecla M) | ✅ | La cámara sube y ve el mar entero sin niebla, con la ruta del viaje dibujada en rojo. Clic en una isla o en su nombre para bajar volando. Rueda para acercar y arrastrar para mover. También se abre con `?mapa` o con el botón "Ver mapa" |

## Fase 3: Más islas e interfaz 🔲

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 3.1 | Orange Town | 🔲 | |
| 3.2 | Villa Syrup | 🔲 | Mansión de Kaya, acantilado |
| 3.3 | **Islas Conomi completas** (Arlong Park, arrozales, Cocoyasi, naranjal, tumba, Gosa) | ✅ | Fiel a la wiki y al modelo de Sketchfab. Ver docs/referencias/east-blue.md |
| 3.4 | Loguetown | 🔲 | El cadalso de Gol D. Roger |
| 3.5 | Minimapa en una esquina | 🔲 | |
| 3.6 | Buscador de islas | 🔲 | |

## Modelos detallados 🚧

**Objetivo:** subir el nivel de los modelos, tomando como referencia el
[Arlong Park de Sketchfab](https://sketchfab.com/3d-models/arlong-park-one-piece-fish-man-island-0928d8621e25460791954b01ac3c2ce7).

| # | Tarea | Estado | Notas |
|---|---|---|---|
| M.1 | Texturas procedurales en canvas: estuco, piedra, tejas, baldosas, madera | ✅ | `src/mundo/texturas.ts`. Se repiten sin costuras |
| M.2 | Kit de arquitectura | ✅ | `src/mundo/islas/arquitectura.ts`: tejado de pagoda con aleros curvos, ventana en arco, balaustrada torneada, columna, bóveda, portón, glorieta |
| M.3 | Cajas con UV en metros (`geometriaCaja`) | ✅ | La textura mantiene su escala real en cualquier tamaño |
| M.4 | Sombras del sol en tiempo real | ✅ | Zona de 360 m que sigue a la cámara |
| M.5 | Fusión de mallas estáticas por material (`fusionarEstaticos`) | ✅ | Cientos de piezas pasan a unas pocas llamadas de dibujo. Se aplica a todas las islas |
| M.6 | Parámetro `?camara=x,y,z,mx,my,mz` | ✅ | Para revisar detalles y compartir vistas |
| M.7 | Rehacer el Baratie con el kit nuevo | 🔲 | |
| M.8 | Rehacer la base de la Marina de Shells Town | 🔲 | |
| M.9 | Casas de Foosha y Shells Town más detalladas | 🔲 | Ventanas con marco, chimeneas, tejas |
| M.10 | Cargador de modelos `.glb` externos | ✅ | `src/mundo/modelos.ts` + `public/modelos/`. Si el archivo existe, sustituye al procedural |

## Fidelidad al canon 🚧

**Regla:** nada se inventa. Cada isla se modela a partir de su sección en
[`docs/referencias/east-blue.md`](referencias/east-blue.md) (capítulos, wiki, imágenes de referencia),
con cada cosa en su sitio.

| # | Isla | Estado | Qué falta según la referencia |
|---|---|---|---|
| C.1 | Islas Conomi | ✅ | Opcional: cargar el .glb original de Sketchfab (ver public/modelos/LEEME.md) |
| C.2 | Villa Foosha (Isla Dawn) | ✅ | Monte Colubo al norte con la casa de Dadan, Gray Terminal y muralla de Goa al fondo, UO y Buffalo Meat junto al bar, vacas |
| C.3 | Shells Town | ✅ | Torres con forma de central eléctrica llenas de cañones, estatua de Morgan en el tejado, patio vallado con la cruz de Zoro, Food Foo |
| C.4 | Baratie | ✅ | Casco ovalado de fondo redondo, 3 cubiertas, aletas laterales desplegables, cabeza de pez con cañones en la boca, cañones en los costados |
| C.5 | Orange Town | ✅ | Pueblo colonial empedrado, Drinker Pub con la carpa de Buggy, tienda de mascotas de Chouchou, zona destruida, refugio en la colina |
| C.6 | Villa Syrup | ✅ | Costa de acantilados con solo dos cuestas (norte y sur), mansión de Kaya en lo alto de la colina, Meshi |
| C.7 | Loguetown | ✅ | Cadalso de Roger en la plaza central, base de Smoker, armería de Ipponmatsu |
| C.8 | Mapa del East Blue | ✅ | Orden y posiciones de las islas según la ruta; Conomi en el noroeste, Loguetown junto a Reverse Mountain |

## Fase 4: Navegar 🔲

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 4.1 | Modelo del Going Merry | 🔲 | |
| 4.2 | Modo barco: timón, velocidad, inclinación con las olas | 🔲 | |
| 4.3 | Log Pose que apunta a la siguiente isla | 🔲 | |
| 4.4 | Modelo del Thousand Sunny | 🔲 | |

## Fase 5: Lugares especiales 🔲

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 5.1 | Skypiea, sobre las nubes | 🔲 | Nivel vertical |
| 5.2 | Fishman Island, bajo el mar | 🔲 | Necesita poder bajar del agua |
| 5.3 | Mary Geoise, en la cima de la Red Line | 🔲 | |
| 5.4 | Línea temporal (antes y después de eventos) | 🔲 | |

---

## Registro de cambios

### 2026-10-27: Modo mapa
- Tecla **M** o botón **Ver mapa**: la cámara sube hasta ver todo el East Blue desde arriba.
- Al entrar se quita la niebla, el océano se estira y se calma, y aparece la **ruta de los Sombrero de Paja** en trazos rojos.
- Las etiquetas muestran el nombre, el mar y el arco con sus capítulos. Al hacer clic en una isla o en su nombre, bajas volando a la vista 3D de esa isla.
- Rueda para acercar, arrastrar para desplazar, y `M` o `Esc` para volver a donde estabas.

### 2026-10-27: Todo el East Blue
- **Isla Dawn** completa: Villa Foosha (Partys Bar, Buffalo Meat, UO, molinos y muelles), pastos con vacas, monte Colubo con la casa de Dadan y la casa del árbol, Gray Terminal y la capital de Goa amurallada con la Gran Puerta y el palacio.
- **Shells Town**: torres-central con cañones, base 153 con la estatua de Morgan, patio con la cruz de Zoro, Food Foo y el puerto.
- **Orange Town** (nueva): Drinker Pub con la carpa de Buggy, destrozos de la Bala Buggy, tienda de Chouchou y refugio en la colina.
- **Villa Syrup** (nueva): meseta de acantilados con las cuestas norte y sur, mansión de Kaya y Meshi. Primer **Going Merry**.
- **Loguetown** (nueva): ciudad amurallada con el cadalso de Roger, la base de Smoker, la armería y el puerto.
- **Mapa del East Blue** en el orden del viaje (teclas 1–7): Dawn → Shells → Orange → Syrup → Baratie → Conomi → Loguetown.
- Piezas nuevas en `edificios.ts` (casa de entramado, edificio de ciudad, torre-central, estatua de Morgan, cadalso, carpa, mansión, ruina, tienda, vaca, valla), `goingMerry.ts`, ayudas de terreno (`crearCosta`, `campana`, `aplanarZonas`, `alturaCostera`) y `crearCamino` compartido.

### 2026-10-27: Baratie nuevo y Conomi según One Piece Fighting Path
- **Baratie** rehecho: aletas desplegadas, casco ovalado, 3 cubiertas, cabeza de pez con cañones, velas a rayas y cañones en los costados.
- **Arlong Park** según el juego oficial: torre amarilla y roja de 5 pisos con soportal de arcos y cartel, y canal desde el mar entre moles de roca con emblemas.
- **Cocoyasi**: casas de dos plantas de colores a lo largo de la calle del muelle, y muelle con barandilla de aspas entre rocas rojizas.
- **Bell-mère**: casa azul pálido de tejado granate con chimenea, naranjal en hileras con un camino alrededor y tumba de tablones junto a una palmera.
- Piezas nuevas: `crearBarandillaContorno`, `escalarUV`, `texturaRayas` y ventanas con marco de color.

### 2026-10-27: Islas Conomi fieles al canon
- Investigación del East Blue (cap. 1–100) en docs/referencias/east-blue.md.
- **Arlong Park rehecho** según el modelo de Sketchfab: torre en la esquina noroeste, bóvedas en la fachada de la puerta,
  piscinas en cuadrícula, glorietas de dos niveles, muralla de hormigón, Puerta Este y compuertas de acero hacia el mar (wiki).
- **La isla entera**: arrozales junto a la Puerta Este, Villa Cocoyasi (tejados de inspiración indonesia, clínica del Dr. Nako,
  librería, pozo, muelle de madera), naranjal y casa de Bell-mère, su tumba de dos troncos en el acantilado y las ruinas de Gosa.
  Montañas boscosas al norte. Los caminos unen todos los lugares.
- Etiquetas de lugares dentro de cada isla.
- Cargador opcional de modelos .glb (public/modelos/).

### 2026-10-27: Modelos detallados y Arlong Park
- Nueva isla **Arlong Park** (tecla 4): recinto amurallado sobre el mar, canales con compuertas,
  torre-pagoda de 4 pisos con balcones, ~100 ventanas en arco, galería de bóvedas, glorietas, portón con cartel, muelle e islote.
- Texturas procedurales y kit de arquitectura reutilizable.
- Sombras en tiempo real en todo el mundo.
- Fusión de mallas para mantener el rendimiento.
- Cambio a pnpm como gestor de paquetes.

### 2026-10-27: Fase 1 completa
- Proyecto creado con Vite 8 + Three.js 0.186 + TypeScript (estricto).
- Todo el código pasado de JavaScript a TypeScript, a petición, sin cambios visuales.
- Océano, cielo, nubes, vuelo creativo, viaje rápido.
- Primeras islas: Villa Foosha, Shells Town y Baratie.
- HUD, fichas de isla, modo foto.
- Probado con un navegador sin ventana: las 3 islas se ven bien y no hay errores en consola.
