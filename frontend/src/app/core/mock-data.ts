import { Categoria, EstadoPedido, Lote, Modalidad, MovimientoSaldo, Pedido, Producto } from './models';

// Datos de ejemplo para la demo. Se reemplazan por la API cuando exista el backend.

export const COUNTRY = 'Lagos de San Eliseo';

export const LOTES: Lote[] = [
  { id: 1, numero: '112', titular: 'Familia Smania', email: 'lote112@example.com', telefono: '11 5555-0112', montoMensual: 100000, activo: true },
  { id: 2, numero: '045', titular: 'Familia Gómez', email: 'lote045@example.com', telefono: '11 5555-0045', montoMensual: 80000, activo: true },
  { id: 3, numero: '203', titular: 'Familia Pereyra', email: 'lote203@example.com', telefono: '11 5555-0203', montoMensual: 80000, activo: true },
  { id: 4, numero: '078', titular: 'Familia Ruiz', email: 'lote078@example.com', telefono: '11 5555-0078', montoMensual: 80000, activo: true },
  { id: 5, numero: '150', titular: 'Familia Benítez', email: 'lote150@example.com', telefono: '11 5555-0150', montoMensual: 80000, activo: true },
  { id: 6, numero: '009', titular: 'Familia Álvarez', email: 'lote009@example.com', telefono: '11 5555-0009', montoMensual: 80000, activo: false },
];

export const CATEGORIAS: Categoria[] = [
  { id: 1, nombre: 'Principales', orden: 1 },
  { id: 2, nombre: 'Pizzas y empanadas', orden: 2 },
  { id: 3, nombre: 'Ensaladas', orden: 3 },
  { id: 4, nombre: 'Acompañamientos', orden: 4 },
  { id: 5, nombre: 'Bebidas', orden: 5 },
  { id: 6, nombre: 'Postres', orden: 6 },
];

export const PRODUCTOS: Producto[] = [
  { id: 1, categoriaId: 1, nombre: 'Milanesa napolitana', descripcion: 'De ternera, con papas fritas.', precio: 14500, disponible: true },
  { id: 2, categoriaId: 1, nombre: 'Hamburguesa Club', descripcion: 'Doble carne, cheddar, panceta y papas.', precio: 12800, disponible: true },
  { id: 3, categoriaId: 1, nombre: 'Lomito completo', descripcion: 'Lomo, jamón, queso, huevo, lechuga y tomate.', precio: 15500, disponible: true },
  { id: 4, categoriaId: 1, nombre: 'Bife de chorizo', descripcion: '400 g, con guarnición a elección.', precio: 18900, disponible: true },
  { id: 5, categoriaId: 1, nombre: 'Sorrentinos de jamón y queso', descripcion: 'Con salsa fileto o crema.', precio: 11900, disponible: false },
  { id: 6, categoriaId: 2, nombre: 'Pizza muzzarella', descripcion: 'Grande, 8 porciones.', precio: 11000, disponible: true },
  { id: 7, categoriaId: 2, nombre: 'Pizza especial', descripcion: 'Jamón, morrones y aceitunas.', precio: 13500, disponible: true },
  { id: 8, categoriaId: 2, nombre: 'Empanadas x6', descripcion: 'Carne cortada a cuchillo, pollo o jamón y queso.', precio: 9000, disponible: true },
  { id: 9, categoriaId: 3, nombre: 'Ensalada César', descripcion: 'Pollo grillado, croutons y parmesano.', precio: 9800, disponible: true },
  { id: 10, categoriaId: 3, nombre: 'Ensalada mixta', descripcion: 'Lechuga, tomate y cebolla.', precio: 5200, disponible: true },
  { id: 11, categoriaId: 4, nombre: 'Papas fritas', descripcion: 'Porción grande.', precio: 5500, disponible: true },
  { id: 12, categoriaId: 4, nombre: 'Puré de papas', descripcion: 'Casero.', precio: 4500, disponible: true },
  { id: 13, categoriaId: 5, nombre: 'Agua mineral 500 ml', descripcion: 'Con o sin gas.', precio: 2000, disponible: true },
  { id: 14, categoriaId: 5, nombre: 'Gaseosa 500 ml', descripcion: 'Línea Coca-Cola.', precio: 2800, disponible: true },
  { id: 15, categoriaId: 5, nombre: 'Cerveza tirada', descripcion: 'Pinta.', precio: 4500, disponible: true },
  { id: 16, categoriaId: 5, nombre: 'Copa de vino', descripcion: 'Malbec de la casa.', precio: 4000, disponible: true },
  { id: 17, categoriaId: 6, nombre: 'Flan casero', descripcion: 'Con dulce de leche y crema.', precio: 4200, disponible: true },
  { id: 18, categoriaId: 6, nombre: 'Helado 2 bochas', descripcion: 'Sabores del día.', precio: 4800, disponible: true },
];

export function periodoDe(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

interface PedidoSemilla {
  loteId: number;
  nombre: string;
  modalidad: Modalidad;
  items: [number, number][]; // productoId, cantidad
  diasAtras: number;
  hora: number;
  estado: EstadoPedido;
  mesa?: string;
}

// Pedidos de ejemplo relativos a hoy, para que la demo siempre se vea "al día".
const SEMILLAS: PedidoSemilla[] = [
  { loteId: 1, nombre: 'Matías', modalidad: 'delivery', items: [[2, 2], [11, 1], [14, 2]], diasAtras: 12, hora: 21, estado: 'entregado' },
  { loteId: 1, nombre: 'Laura', modalidad: 'en_lugar', items: [[9, 1], [16, 2]], diasAtras: 8, hora: 13, estado: 'entregado', mesa: '4' },
  { loteId: 1, nombre: 'Matías', modalidad: 'retiro', items: [[6, 1], [8, 1]], diasAtras: 3, hora: 20, estado: 'entregado' },
  { loteId: 2, nombre: 'Carlos', modalidad: 'delivery', items: [[4, 2], [10, 1], [15, 2]], diasAtras: 10, hora: 21, estado: 'entregado' },
  { loteId: 2, nombre: 'Sofía', modalidad: 'retiro', items: [[8, 2]], diasAtras: 2, hora: 19, estado: 'entregado' },
  { loteId: 3, nombre: 'Martín', modalidad: 'en_lugar', items: [[3, 2], [15, 2]], diasAtras: 6, hora: 22, estado: 'entregado', mesa: '7' },
  { loteId: 4, nombre: 'Ana', modalidad: 'delivery', items: [[7, 2], [14, 3], [18, 2]], diasAtras: 5, hora: 21, estado: 'entregado' },
  { loteId: 5, nombre: 'Diego', modalidad: 'delivery', items: [[1, 1], [11, 1]], diasAtras: 1, hora: 21, estado: 'entregado' },
  // Pedidos "de hoy" en distintos estados para el panel del restaurante.
  { loteId: 3, nombre: 'Paula', modalidad: 'delivery', items: [[1, 2], [14, 2]], diasAtras: 0, hora: -1, estado: 'pendiente' },
  { loteId: 4, nombre: 'Ana', modalidad: 'retiro', items: [[6, 1], [7, 1]], diasAtras: 0, hora: -1, estado: 'en_preparacion' },
  { loteId: 2, nombre: 'Carlos', modalidad: 'en_lugar', items: [[2, 1], [15, 1]], diasAtras: 0, hora: -1, estado: 'listo', mesa: '2' },
  { loteId: 5, nombre: 'Diego', modalidad: 'delivery', items: [[3, 1], [17, 1]], diasAtras: 0, hora: -1, estado: 'en_camino' },
];

const FLUJO: EstadoPedido[] = ['pendiente', 'aceptado', 'en_preparacion', 'listo', 'en_camino', 'entregado'];

export function generarDatosIniciales(hoy = new Date()) {
  const periodo = periodoDe(hoy);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0, 1);
  const pedidos: Pedido[] = [];
  const movimientos: MovimientoSaldo[] = [];
  let movId = 1;

  for (const lote of LOTES.filter(l => l.activo)) {
    movimientos.push({
      id: movId++, loteId: lote.id, periodo, tipo: 'asignacion', monto: lote.montoMensual,
      detalle: 'Saldo mensual asignado', fecha: inicioMes.toISOString(),
    });
  }

  const disponible = new Map(LOTES.map(l => [l.id, l.montoMensual]));

  SEMILLAS.forEach((s, i) => {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() - Math.min(s.diasAtras, hoy.getDate() - 1));
    if (s.hora >= 0) fecha.setHours(s.hora, 10 + i, 0, 0);
    else fecha.setMinutes(fecha.getMinutes() - (40 - i * 3));

    const items = s.items.map(([pid, cant]) => {
      const p = PRODUCTOS.find(x => x.id === pid)!;
      return { productoId: p.id, nombre: p.nombre, precioUnitario: p.precio, cantidad: cant };
    });
    const total = items.reduce((a, it) => a + it.precioUnitario * it.cantidad, 0);
    const saldo = disponible.get(s.loteId) ?? 0;
    // Los pedidos entregados ya tienen el cobro registrado; los de hoy todavía no.
    const cobrado = s.estado === 'entregado';
    const montoSaldo = cobrado ? Math.min(saldo, total) : 0;
    disponible.set(s.loteId, saldo - montoSaldo);
    const montoOtro = total - montoSaldo;
    const medioPreferido = !cobrado ? (['saldo', 'mercadopago', 'tarjeta'] as const)[i % 3] : montoSaldo === total ? 'saldo' : i % 2 ? 'tarjeta' : 'mercadopago';
    const id = i + 1;

    const flujo: EstadoPedido[] = s.modalidad === 'delivery' ? FLUJO : FLUJO.filter(e => e !== 'en_camino');
    const hasta = flujo.indexOf(s.estado);
    const historial = flujo.slice(0, hasta + 1).map((estado, k) => ({
      estado, fecha: new Date(fecha.getTime() + k * 8 * 60000).toISOString(),
    }));

    pedidos.push({
      id, numero: String(1000 + id), loteId: s.loteId, nombreSolicitante: s.nombre,
      modalidad: s.modalidad, mesa: s.mesa, items, total, medioPreferido,
      pago: cobrado ? {
        montoSaldo, montoOtro, medioOtro: montoOtro > 0 ? (i % 2 ? 'tarjeta' : 'mercadopago') : undefined,
        registradoEn: historial[historial.length - 1].fecha,
      } : undefined,
      estado: s.estado, historial, creadoEn: fecha.toISOString(),
    });

    if (montoSaldo > 0) {
      movimientos.push({
        id: movId++, loteId: s.loteId, periodo, tipo: 'consumo', monto: -montoSaldo, pedidoId: id,
        detalle: `Pedido #${1000 + id}`, fecha: fecha.toISOString(),
      });
    }
  });

  // Mes anterior, para que el filtro por mes tenga algo que mostrar.
  const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1, 0, 1);
  const periodoAnterior = periodoDe(mesAnterior);
  for (const lote of LOTES.filter(l => l.activo)) {
    movimientos.push(
      { id: movId++, loteId: lote.id, periodo: periodoAnterior, tipo: 'asignacion', monto: lote.montoMensual, detalle: 'Saldo mensual asignado', fecha: mesAnterior.toISOString() },
      { id: movId++, loteId: lote.id, periodo: periodoAnterior, tipo: 'consumo', monto: -Math.round(lote.montoMensual * 0.7), detalle: 'Consumos del mes', fecha: new Date(mesAnterior.getTime() + 15 * 86400000).toISOString() },
    );
  }

  return { pedidos, movimientos };
}
