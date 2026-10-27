// Catálogo de islas del mundo, en el orden del viaje (las teclas 1–9 siguen este orden).
// Para añadir una isla nueva, ver README.md → "Cómo añadir una isla".
// `posicion` está en unidades del mundo (≈ metros). El mapa del East Blue está comprimido a propósito:
// la ruta va de Isla Dawn hacia el oeste y el norte, con las islas Conomi en el noroeste
// y Loguetown al final, junto a la entrada de la Grand Line.
import type { DatosIsla } from '../tipos';

export const ISLAS: DatosIsla[] = [
  {
    id: 'foosha',
    nombre: 'Isla Dawn',
    mar: 'East Blue',
    posicion: [0, 0, 0],
    construir: 'foosha',
    arco: 'Romance Dawn (cap. 1) · Flashback de Ace y Sabo (cap. 582–590)',
    descripcion:
      'La isla del Reino de Goa. En la costa, Villa Foosha, el pueblo de molinos donde creció Luffy y donde Shanks le confió su sombrero. Detrás, el monte Colubo con la casa de los bandidos de Dadan; al norte, el Gray Terminal; al oeste, la capital amurallada.',
    datos: [
      'Partys Bar de Makino: aquí Luffy se comió la Gomu Gomu no Mi',
      'Casa del árbol de Luffy, Ace y Sabo',
      'El Señor de la Costa se llevó el brazo de Shanks',
    ],
  },
  {
    id: 'shells-town',
    nombre: 'Shells Town',
    mar: 'East Blue',
    posicion: [900, 0, -500],
    construir: 'shellsTown',
    arco: 'Romance Dawn (cap. 2–7)',
    descripcion:
      'Ciudad de torres con forma de central eléctrica erizadas de cañones, oprimida por el capitán Morgan "Mano de Hacha". En el patio de la base 153, Zoro aguantaba atado a una cruz.',
    datos: [
      'Base de la Marina 153 y la estatua de Morgan en el tejado',
      'Primer nakama: Roronoa Zoro',
      'Coby se queda para convertirse en marine',
    ],
  },
  {
    id: 'orange-town',
    nombre: 'Orange Town',
    mar: 'East Blue',
    posicion: [1600, 0, -1300],
    construir: 'orangeTown',
    arco: 'Orange Town (cap. 8–21)',
    descripcion:
      'Pueblo colonial fundado por el alcalde Boodle. Los piratas de Buggy lo ocupan desde el Drinker Pub y una Bala Buggy arrasa parte de sus calles. Chouchou sigue guardando la tienda de su amo.',
    datos: [
      'Luffy llega volando, atrapado por un pájaro gigante',
      'Aquí la tripulación conoce a Nami',
      'Buggy el Payaso y su Bala Buggy',
    ],
  },
  {
    id: 'syrup',
    nombre: 'Villa Syrup',
    mar: 'East Blue',
    posicion: [1000, 0, -2200],
    construir: 'syrup',
    arco: 'Villa Syrup (cap. 22–41)',
    descripcion:
      'Pueblo tranquilo en lo alto de acantilados, con solo dos cuestas hasta la playa. En la colina, la mansión de Kaya. Usopp gritaba cada mañana que venían los piratas, hasta que llegaron de verdad.',
    datos: [
      'Kuro y los piratas del Gato Negro',
      'Kaya regala el Going Merry',
      'Usopp se une a la tripulación',
    ],
  },
  {
    id: 'baratie',
    nombre: 'Baratie',
    mar: 'East Blue',
    posicion: [0, 0, -2700],
    construir: 'baratie',
    arco: 'Baratie (cap. 43–68)',
    descripcion:
      'Restaurante flotante con forma de pez, dirigido por el chef "Pierna Roja" Zeff. Aquí Sanji se unió a la tripulación tras la batalla contra Don Krieg.',
    datos: [
      'Chef: "Pierna Roja" Zeff',
      'Duelo de Zoro contra Dracule Mihawk',
      'Sanji, cocinero de los Sombrero de Paja',
    ],
  },
  {
    id: 'conomi',
    nombre: 'Islas Conomi',
    mar: 'East Blue',
    posicion: [-1200, 0, -3300],
    construir: 'conomi',
    arco: 'Arlong Park (cap. 69–95)',
    descripcion:
      'La isla de Nami. En la costa oeste, Arlong Park, el cuartel de los hombres-pez, con su canal abierto al mar. Junto a su Puerta Este, los arrozales; después, Villa Cocoyasi, el naranjal de Bell-mère en una loma y su tumba en lo alto del acantilado. Al este, las ruinas de Gosa.',
    datos: [
      'Arlong tuvo sometida la región durante 8 años',
      'Nami dibujaba mapas en el 5.º piso de Arlong Park',
      '"¡Luffy… ayúdame!" — y el sombrero de paja sobre su cabeza',
      'Bell-mère vendía las mandarinas de su naranjal',
    ],
  },
  {
    id: 'loguetown',
    nombre: 'Loguetown',
    mar: 'East Blue',
    posicion: [-300, 0, -4500],
    construir: 'loguetown',
    arco: 'Loguetown (cap. 96–100)',
    descripcion:
      'La ciudad del principio y del fin: aquí nació y fue ejecutado Gol D. Roger. En su plaza sigue el cadalso. Última parada antes de la Grand Line, vigilada por el capitán Smoker.',
    datos: [
      'Buggy intenta ejecutar a Luffy en el cadalso y cae un rayo',
      'Zoro consigue la Sandai Kitetsu y la Yubashiri',
      'Dragon aparece entre la tormenta',
    ],
  },
];
