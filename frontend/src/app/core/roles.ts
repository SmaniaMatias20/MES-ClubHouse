import { Rol } from './models';

export const INICIO_POR_ROL: Record<Rol, string> = {
  vecino: '/menu',
  recepcion: '/recepcion',
  repartidor: '/repartidor',
  admin: '/admin',
};
