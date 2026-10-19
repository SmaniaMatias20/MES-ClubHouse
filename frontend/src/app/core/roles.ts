import { Rol } from './models';

export const INICIO_POR_ROL: Record<Rol, string> = {
  vecino: '/menu',
  restaurante: '/restaurante',
  repartidor: '/repartidor',
  admin: '/admin',
};
