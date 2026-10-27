# Modelos externos (.glb)

Si un archivo de esta carpeta existe, sustituye a la versión procedural al cargar el mundo.
Si no existe, se usa la versión hecha en código.

| Archivo | Sustituye a | Fuente | Licencia |
|---|---|---|---|
| `arlong-park.glb` | El recinto de Arlong Park (islas Conomi) | [Sketchfab, aryan_yadav](https://sketchfab.com/3d-models/arlong-park-one-piece-fish-man-island-0928d8621e25460791954b01ac3c2ce7) | CC BY 4.0: hay que dar crédito al autor |

Para descargarlo: abre el enlace, pulsa **Download 3D Model**, elige **glTF Binary (.glb)** y guárdalo aquí con ese nombre.
El modelo se escala solo al tamaño del recinto. Si queda girado, se ajusta el `giro` en `src/mundo/islas/conomi.ts`.
