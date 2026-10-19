import { Injectable, computed, effect, signal } from '@angular/core';
import { CartItem, EstadoPedido, Lote, MedioPago, MedioPreferido, Modalidad, MovimientoSaldo, Pedido, PedidoItem, Producto, Sesion } from './models';
import { CATEGORIAS, LOTES, PRODUCTOS, generarDatosIniciales, periodoDe } from './mock-data';

const STORAGE_KEY = 'mes-clubhouse-demo-v3';

interface EstadoDemo {
  sesion: Sesion | null;
  lotes: Lote[];
  productos: Producto[];
  pedidos: Pedido[];
  movimientos: MovimientoSaldo[];
}

export interface NuevoPedido {
  nombreSolicitante: string;
  telefonoContacto?: string;
  modalidad: Modalidad;
  mesa?: string;
  horaRetiro?: string;
  notas?: string;
  medioPreferido: MedioPreferido;
}

/** Siguiente estado según la modalidad. */
export function siguienteEstado(p: Pedido): EstadoPedido | null {
  switch (p.estado) {
    case 'pendiente': return 'aceptado';
    case 'aceptado': return 'en_preparacion';
    case 'en_preparacion': return 'listo';
    case 'listo': return p.modalidad === 'delivery' ? 'en_camino' : 'entregado';
    case 'en_camino': return 'entregado';
    default: return null;
  }
}

/**
 * Estado de la demo en memoria (con signals) y guardado en localStorage.
 * Cuando exista la API, cada acción se convierte en una llamada HTTP.
 */
@Injectable({ providedIn: 'root' })
export class StoreService {
  readonly categorias = CATEGORIAS;

  private readonly estado = signal<EstadoDemo>(this.cargar());

  readonly sesion = computed(() => this.estado().sesion);
  readonly lotes = computed(() => this.estado().lotes);
  readonly productos = computed(() => this.estado().productos);
  readonly pedidos = computed(() => [...this.estado().pedidos].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)));
  readonly movimientos = computed(() => this.estado().movimientos);

  readonly loteActual = computed(() => {
    const id = this.sesion()?.loteId;
    return this.lotes().find(l => l.id === id) ?? null;
  });

  readonly periodoActual = periodoDe(new Date());

  readonly saldoActual = computed(() => {
    const lote = this.loteActual();
    return lote ? this.saldoDe(lote.id) : { asignado: 0, usado: 0, disponible: 0 };
  });

  readonly misPedidos = computed(() => {
    const lote = this.loteActual();
    return lote ? this.pedidos().filter(p => p.loteId === lote.id) : [];
  });

  // Carrito (no se persiste entre sesiones distintas de lote)
  readonly carrito = signal<CartItem[]>([]);
  readonly totalCarrito = computed(() => this.carrito().reduce((a, i) => a + i.producto.precio * i.cantidad, 0));
  readonly cantidadCarrito = computed(() => this.carrito().reduce((a, i) => a + i.cantidad, 0));

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.estado()));
      } catch { /* sin storage: la demo funciona igual en memoria */ }
    });
  }

  private cargar(): EstadoDemo {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignorar */ }
    return this.inicial();
  }

  private inicial(): EstadoDemo {
    const { pedidos, movimientos } = generarDatosIniciales();
    return {
      sesion: null,
      lotes: structuredClone(LOTES),
      productos: structuredClone(PRODUCTOS),
      pedidos,
      movimientos,
    };
  }

  reiniciarDemo() {
    const sesion = this.estado().sesion;
    this.estado.set({ ...this.inicial(), sesion });
    this.carrito.set([]);
  }

  // ---------- Sesión ----------
  ingresarComoLote(numero: string): boolean {
    const lote = this.lotes().find(l => l.numero === numero.padStart(3, '0') && l.activo);
    if (!lote) return false;
    this.estado.update(e => ({ ...e, sesion: { rol: 'vecino', loteId: lote.id } }));
    return true;
  }

  ingresarComo(rol: Exclude<Sesion['rol'], 'vecino'>) {
    this.estado.update(e => ({ ...e, sesion: { rol } }));
  }

  salir() {
    this.estado.update(e => ({ ...e, sesion: null }));
    this.carrito.set([]);
  }

  // ---------- Saldo ----------
  saldoDe(loteId: number, periodo = this.periodoActual) {
    const movs = this.movimientos().filter(m => m.loteId === loteId && m.periodo === periodo);
    const asignado = movs.filter(m => m.tipo === 'asignacion').reduce((a, m) => a + m.monto, 0);
    const disponible = movs.reduce((a, m) => a + m.monto, 0);
    return { asignado, usado: asignado - disponible, disponible };
  }

  loteDe(id: number) {
    return this.lotes().find(l => l.id === id);
  }

  // ---------- Carrito ----------
  agregar(producto: Producto) {
    this.carrito.update(c => {
      const ex = c.find(i => i.producto.id === producto.id);
      return ex ? c.map(i => (i === ex ? { ...i, cantidad: i.cantidad + 1 } : i)) : [...c, { producto, cantidad: 1 }];
    });
  }

  quitar(productoId: number) {
    this.carrito.update(c =>
      c.flatMap(i => (i.producto.id !== productoId ? [i] : i.cantidad > 1 ? [{ ...i, cantidad: i.cantidad - 1 }] : [])),
    );
  }

  cantidadEnCarrito(productoId: number) {
    return this.carrito().find(i => i.producto.id === productoId)?.cantidad ?? 0;
  }

  notaItem(productoId: number, notas: string) {
    this.carrito.update(c => c.map(i => (i.producto.id === productoId ? { ...i, notas } : i)));
  }

  repetir(pedido: Pedido) {
    const items: CartItem[] = pedido.items.flatMap(it => {
      const p = this.productos().find(x => x.id === it.productoId && x.disponible);
      return p ? [{ producto: p, cantidad: it.cantidad, notas: it.notas }] : [];
    });
    this.carrito.set(items);
  }

  // ---------- Pedidos ----------
  confirmarPedido(datos: NuevoPedido): Pedido | null {
    const lote = this.loteActual();
    if (!lote || this.carrito().length === 0) return null;
    const items = this.carrito().map(i => ({
      productoId: i.producto.id, nombre: i.producto.nombre, precioUnitario: i.producto.precio,
      cantidad: i.cantidad, notas: i.notas,
    }));
    const pedido = this.crearPedido(lote.id, items, datos);
    this.carrito.set([]);
    return pedido;
  }

  /** Solo para la demo: genera un pedido de otro lote para ver cómo entra al panel. */
  simularPedido() {
    const lotes = this.lotes().filter(l => l.activo);
    const lote = lotes[Math.floor(Math.random() * lotes.length)];
    const disponibles = this.productos().filter(p => p.disponible);
    const elegidos = [...disponibles].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
    const modalidades: Modalidad[] = ['delivery', 'retiro', 'en_lugar'];
    const modalidad = modalidades[Math.floor(Math.random() * 3)];
    const nombres = ['Julieta', 'Pedro', 'Valentina', 'Lucas', 'Camila', 'Nicolás'];
    this.crearPedido(lote.id, elegidos.map(p => ({ productoId: p.id, nombre: p.nombre, precioUnitario: p.precio, cantidad: 1 + Math.floor(Math.random() * 2) })), {
      nombreSolicitante: nombres[Math.floor(Math.random() * nombres.length)],
      modalidad,
      mesa: modalidad === 'en_lugar' ? String(1 + Math.floor(Math.random() * 12)) : undefined,
      horaRetiro: modalidad === 'retiro' ? 'Lo antes posible' : undefined,
      medioPreferido: (['saldo', 'mercadopago', 'tarjeta'] as MedioPreferido[])[Math.floor(Math.random() * 3)],
    });
  }

  private crearPedido(loteId: number, items: PedidoItem[], datos: NuevoPedido): Pedido {
    const total = items.reduce((a, i) => a + i.precioUnitario * i.cantidad, 0);
    const ahora = new Date().toISOString();
    const id = Math.max(0, ...this.estado().pedidos.map(p => p.id)) + 1;

    const pedido: Pedido = {
      id,
      numero: String(1000 + id),
      loteId,
      nombreSolicitante: datos.nombreSolicitante.trim(),
      telefonoContacto: datos.telefonoContacto?.trim() || undefined,
      modalidad: datos.modalidad,
      mesa: datos.modalidad === 'en_lugar' ? datos.mesa : undefined,
      horaRetiro: datos.modalidad === 'retiro' ? datos.horaRetiro : undefined,
      notas: datos.notas?.trim() || undefined,
      items,
      total,
      medioPreferido: datos.medioPreferido,
      estado: 'pendiente',
      historial: [{ estado: 'pendiente', fecha: ahora }],
      creadoEn: ahora,
    };

    // El pedido no toca el saldo: se descuenta recién cuando Recepción registra el cobro.
    this.estado.update(e => ({ ...e, pedidos: [...e.pedidos, pedido] }));
    return pedido;
  }

  private movimiento(e: EstadoDemo, loteId: number, tipo: MovimientoSaldo['tipo'], monto: number, detalle: string, pedidoId?: number): MovimientoSaldo {
    return {
      id: Math.max(0, ...e.movimientos.map(m => m.id)) + 1,
      loteId, periodo: this.periodoActual, tipo, monto, detalle, pedidoId, fecha: new Date().toISOString(),
    };
  }

  avanzar(pedidoId: number) {
    const p = this.estado().pedidos.find(x => x.id === pedidoId);
    const sig = p && siguienteEstado(p);
    if (sig) this.cambiarEstado(pedidoId, sig);
  }

  /** Rechazar o cancelar devuelve el saldo usado al lote. */
  cambiarEstado(pedidoId: number, estado: EstadoPedido) {
    this.estado.update(e => {
      const p = e.pedidos.find(x => x.id === pedidoId);
      if (!p) return e;
      const actualizado: Pedido = { ...p, estado, historial: [...p.historial, { estado, fecha: new Date().toISOString() }] };
      let movimientos = e.movimientos;
      if ((estado === 'rechazado' || estado === 'cancelado') && p.pago?.montoSaldo) {
        movimientos = [...movimientos, this.movimiento(e, p.loteId, 'reintegro', p.pago.montoSaldo, `Reintegro pedido #${p.numero}`, p.id)];
      }
      return { ...e, pedidos: e.pedidos.map(x => (x.id === pedidoId ? actualizado : x)), movimientos };
    });
  }

  /**
   * Recepción o Administración registran el cobro: cuánto se descuenta del saldo del lote
   * y cuánto se pagó por fuera de la app. Devuelve un error si no se puede registrar.
   */
  registrarCobro(pedidoId: number, montoSaldo: number, medioOtro: MedioPago): string | null {
    const p = this.estado().pedidos.find(x => x.id === pedidoId);
    if (!p) return 'No se encontró el pedido.';
    if (p.pago) return 'El pedido ya tiene un cobro registrado.';
    const saldo = Math.round(montoSaldo) || 0;
    if (saldo < 0 || saldo > p.total) return 'El monto del saldo tiene que estar entre 0 y el total.';
    if (saldo > this.saldoDe(p.loteId).disponible) return 'El lote no tiene saldo suficiente.';
    const montoOtro = p.total - saldo;
    const pago = { montoSaldo: saldo, montoOtro, medioOtro: montoOtro > 0 ? medioOtro : undefined, registradoEn: new Date().toISOString() };
    this.estado.update(e => ({
      ...e,
      pedidos: e.pedidos.map(x => (x.id === pedidoId ? { ...x, pago } : x)),
      movimientos: saldo > 0 ? [...e.movimientos, this.movimiento(e, p.loteId, 'consumo', -saldo, `Pedido #${p.numero}`, p.id)] : e.movimientos,
    }));
    return null;
  }

  // ---------- Admin ----------
  actualizarProducto(id: number, cambios: Partial<Producto>) {
    this.estado.update(e => ({ ...e, productos: e.productos.map(p => (p.id === id ? { ...p, ...cambios } : p)) }));
  }

  actualizarLote(id: number, cambios: Partial<Lote>) {
    this.estado.update(e => ({ ...e, lotes: e.lotes.map(l => (l.id === id ? { ...l, ...cambios } : l)) }));
  }

  ajustarSaldo(loteId: number, monto: number, detalle: string) {
    this.estado.update(e => ({ ...e, movimientos: [...e.movimientos, this.movimiento(e, loteId, 'ajuste', monto, detalle)] }));
  }

  agregarLote(lote: Omit<Lote, 'id'>) {
    this.estado.update(e => {
      const id = Math.max(0, ...e.lotes.map(l => l.id)) + 1;
      const nuevo = { ...lote, id };
      const asignacion = this.movimiento(e, id, 'asignacion', lote.montoMensual, 'Saldo mensual asignado');
      return { ...e, lotes: [...e.lotes, nuevo], movimientos: [...e.movimientos, asignacion] };
    });
  }

  /** Importa lotes desde filas de Excel: actualiza los existentes por número y crea los nuevos. */
  importarLotes(filas: { numero: string; titular: string; email?: string; telefono?: string; montoMensual: number }[]) {
    let creados = 0, actualizados = 0;
    for (const f of filas) {
      const numero = String(f.numero).padStart(3, '0');
      const ex = this.lotes().find(l => l.numero === numero);
      if (ex) {
        this.actualizarLote(ex.id, { titular: f.titular || ex.titular, email: f.email ?? ex.email, telefono: f.telefono ?? ex.telefono, montoMensual: Number(f.montoMensual) || ex.montoMensual });
        actualizados++;
      } else {
        this.agregarLote({ numero, titular: f.titular, email: f.email ?? '', telefono: f.telefono ?? '', montoMensual: Number(f.montoMensual) || 0, activo: true });
        creados++;
      }
    }
    return { creados, actualizados };
  }
}
