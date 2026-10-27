// Registro de constructores de islas. La clave es el campo `construir` de src/datos/islas.ts.
import { construirFoosha } from './foosha';
import { construirShellsTown } from './shellsTown';
import { construirOrangeTown } from './orangeTown';
import { construirSyrup } from './syrup';
import { construirBaratie } from './baratie';
import { construirConomi } from './conomi';
import { construirLoguetown } from './loguetown';
import type { ConstructorIsla } from '../../tipos';

export const CONSTRUCTORES: Record<string, ConstructorIsla | undefined> = {
  foosha: construirFoosha,
  shellsTown: construirShellsTown,
  orangeTown: construirOrangeTown,
  syrup: construirSyrup,
  baratie: construirBaratie,
  conomi: construirConomi,
  loguetown: construirLoguetown,
};
