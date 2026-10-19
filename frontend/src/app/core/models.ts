export type Rol = 'vecino' | 'recepcion' | 'repartidor' | 'admin';

export type Modalidad = 'delivery' | 'retiro' | 'en_lugar';

export type EstadoPedido =
  | 'pendiente'
  | 'aceptado'
  | 'en_preparacion'
  | 'listo'
  | 'en_camino'
  | 'entregado'
  | 'cancelado'
  | 'rechazado';

export type MedioPago = 'mercadopago' | 'tarjeta';

export interface Lote {
  id: number;
  numero: string;
  titular: string;
  email: string;
  telefono: string;
  montoMensual: number;
  activo: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  orden: number;
}

export interface Producto {
  id: number;
  categoriaId: number;
  nombre: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
}

export interface PedidoItem {
  productoId: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  notas?: string;
}

export interface CambioEstado {
  estado: EstadoPedido;
  fecha: string;
}

export interface Pedido {
  id: number;
  numero: string;
  loteId: number;
  nombreSolicitante: string;
  telefonoContacto?: string;
  modalidad: Modalidad;
  mesa?: string;
  horaRetiro?: string;
  notas?: string;
  items: PedidoItem[];
  total: number;
  montoSaldo: number;
  montoResto: number;
  medioResto?: MedioPago;
  restoCobrado: boolean;
  estado: EstadoPedido;
  historial: CambioEstado[];
  creadoEn: string;
}

export type TipoMovimiento = 'asignacion' | 'consumo' | 'reintegro' | 'ajuste';

export interface MovimientoSaldo {
  id: number;
  loteId: number;
  periodo: string; // YYYY-MM
  tipo: TipoMovimiento;
  monto: number; // positivo suma, negativo resta
  pedidoId?: number;
  detalle: string;
  fecha: string;
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
  notas?: string;
}

export interface Sesion {
  rol: Rol;
  loteId?: number;
}
