import { Pipe, PipeTransform } from '@angular/core';
import { EstadoPedido, MedioPago, Modalidad } from './models';

const ARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export const ESTADO_LABEL: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  rechazado: 'Rechazado',
};

export const MODALIDAD_LABEL: Record<Modalidad, string> = {
  delivery: 'Delivery',
  retiro: 'Retiro',
  en_lugar: 'En el lugar',
};

export const MODALIDAD_ICONO: Record<Modalidad, string> = {
  delivery: '🛵',
  retiro: '🛍️',
  en_lugar: '🍽️',
};

export const MEDIO_LABEL: Record<MedioPago, string> = {
  mercadopago: 'Mercado Pago',
  tarjeta: 'Tarjeta',
};

/** Clase de color del badge según el estado. */
export function estadoClase(e: EstadoPedido): string {
  return ({ pendiente: 'ambar', entregado: 'verde', rechazado: 'rojo', cancelado: 'rojo' } as Partial<Record<EstadoPedido, string>>)[e] ?? 'azul';
}

@Pipe({ name: 'ars' })
export class ArsPipe implements PipeTransform {
  transform(v: number | null | undefined): string {
    return ARS.format(v ?? 0);
  }
}

@Pipe({ name: 'estado' })
export class EstadoPipe implements PipeTransform {
  transform(v: EstadoPedido): string {
    return ESTADO_LABEL[v];
  }
}

@Pipe({ name: 'modalidad' })
export class ModalidadPipe implements PipeTransform {
  transform(v: Modalidad, conIcono = false): string {
    return conIcono ? `${MODALIDAD_ICONO[v]} ${MODALIDAD_LABEL[v]}` : MODALIDAD_LABEL[v];
  }
}

@Pipe({ name: 'medio' })
export class MedioPipe implements PipeTransform {
  transform(v: MedioPago | undefined): string {
    return v ? MEDIO_LABEL[v] : '';
  }
}

export const FORMAT_PIPES = [ArsPipe, EstadoPipe, ModalidadPipe, MedioPipe];
