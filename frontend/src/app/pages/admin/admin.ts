import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ESTADO_LABEL, FORMAT_PIPES, MEDIO_LABEL, MODALIDAD_LABEL, estadoClase } from '../../core/format';
import { exportarExcel, leerExcel } from '../../core/excel';
import { Modalidad, Pedido } from '../../core/models';
import { StoreService } from '../../core/store.service';

type Tab = 'resumen' | 'lotes' | 'menu' | 'pedidos';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, DatePipe, ...FORMAT_PIPES],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminPage {
  protected readonly store = inject(StoreService);
  protected readonly tab = signal<Tab>('resumen');
  protected readonly toast = signal('');
  protected readonly estadoClase = estadoClase;
  protected readonly mesActual = (t => t.charAt(0).toUpperCase() + t.slice(1))(new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }));

  // ---------- Resumen del mes ----------
  private readonly pedidosMes = computed(() => {
    const inicio = new Date();
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);
    return this.store.pedidos().filter(p => new Date(p.creadoEn) >= inicio && p.estado !== 'rechazado' && p.estado !== 'cancelado');
  });

  protected readonly kpis = computed(() => {
    const ps = this.pedidosMes();
    const ventas = ps.reduce((a, p) => a + p.total, 0);
    const saldo = ps.reduce((a, p) => a + p.montoSaldo, 0);
    return {
      ventas,
      pedidos: ps.length,
      ticket: ps.length ? ventas / ps.length : 0,
      saldo,
      porCobrar: ps.filter(p => !p.restoCobrado).reduce((a, p) => a + p.montoResto, 0),
    };
  });

  protected readonly porDia = computed(() => {
    const dias = new Map<string, number>();
    const hoy = new Date();
    for (let d = 1; d <= hoy.getDate(); d++) dias.set(String(d), 0);
    for (const p of this.pedidosMes()) {
      const k = String(new Date(p.creadoEn).getDate());
      dias.set(k, (dias.get(k) ?? 0) + p.total);
    }
    const max = Math.max(1, ...dias.values());
    return [...dias].map(([dia, total]) => ({ dia, total, pct: (total / max) * 100 }));
  });

  protected readonly porModalidad = computed(() => {
    const ps = this.pedidosMes();
    return (['delivery', 'retiro', 'en_lugar'] as Modalidad[]).map(m => {
      const de = ps.filter(p => p.modalidad === m);
      return { modalidad: m, cantidad: de.length, pct: ps.length ? (de.length / ps.length) * 100 : 0 };
    });
  });

  protected readonly topProductos = computed(() => {
    const cont = new Map<string, number>();
    for (const p of this.pedidosMes()) for (const i of p.items) cont.set(i.nombre, (cont.get(i.nombre) ?? 0) + i.cantidad);
    const lista = [...cont].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = Math.max(1, ...lista.map(x => x[1]));
    return lista.map(([nombre, cantidad]) => ({ nombre, cantidad, pct: (cantidad / max) * 100 }));
  });

  // ---------- Lotes y saldos ----------
  protected readonly busquedaLote = signal('');
  protected readonly lotesConSaldo = computed(() => {
    const q = this.busquedaLote().toLowerCase();
    return this.store.lotes()
      .filter(l => !q || l.numero.includes(q) || l.titular.toLowerCase().includes(q))
      .map(l => ({ ...l, saldo: this.store.saldoDe(l.id) }))
      .sort((a, b) => a.numero.localeCompare(b.numero));
  });

  protected nuevoLote = { numero: '', titular: '', email: '', telefono: '', montoMensual: 60000 };
  protected readonly agregando = signal(false);
  protected ajuste: { loteId: number; monto: number; detalle: string } | null = null;

  protected guardarLote() {
    if (!this.nuevoLote.numero || !this.nuevoLote.titular) return;
    this.store.agregarLote({ ...this.nuevoLote, numero: this.nuevoLote.numero.padStart(3, '0'), activo: true });
    this.aviso(`Lote ${this.nuevoLote.numero} creado`);
    this.nuevoLote = { numero: '', titular: '', email: '', telefono: '', montoMensual: 60000 };
    this.agregando.set(false);
  }

  protected aplicarAjuste() {
    if (!this.ajuste || !this.ajuste.monto) return;
    this.store.ajustarSaldo(this.ajuste.loteId, Number(this.ajuste.monto), this.ajuste.detalle || 'Ajuste de administración');
    this.aviso('Saldo ajustado');
    this.ajuste = null;
  }

  protected async importarLotes(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    try {
      const filas = await leerExcel(archivo);
      const col = (f: Record<string, unknown>, ...nombres: string[]) => {
        const k = Object.keys(f).find(k => nombres.includes(k.trim().toLowerCase()));
        return k ? String(f[k]).trim() : '';
      };
      const datos = filas
        .map(f => ({
          numero: col(f, 'lote', 'numero', 'número'),
          titular: col(f, 'titular', 'nombre'),
          email: col(f, 'email', 'mail'),
          telefono: col(f, 'telefono', 'teléfono'),
          montoMensual: Number(col(f, 'monto mensual', 'monto', 'saldo')) || 0,
        }))
        .filter(f => f.numero);
      const r = this.store.importarLotes(datos);
      this.aviso(`Importación lista: ${r.creados} lotes nuevos y ${r.actualizados} actualizados`);
    } catch {
      this.aviso('No se pudo leer el archivo. Usá la plantilla.');
    }
    input.value = '';
  }

  protected descargarPlantilla() {
    exportarExcel('plantilla-lotes.xlsx', {
      Lotes: [{ Lote: '112', Titular: 'Familia Ejemplo', Email: 'lote112@mail.com', Telefono: '11 5555-0000', 'Monto mensual': 60000 }],
    });
  }

  protected exportarLotes() {
    exportarExcel(`saldos-${this.store.periodoActual}.xlsx`, {
      Saldos: this.lotesConSaldo().map(l => ({
        Lote: l.numero, Titular: l.titular, Email: l.email, Telefono: l.telefono, Activo: l.activo ? 'Sí' : 'No',
        'Monto mensual': l.montoMensual, 'Asignado': l.saldo.asignado, 'Usado': l.saldo.usado, 'Disponible': l.saldo.disponible,
      })),
      Movimientos: this.store.movimientos()
        .filter(m => m.periodo === this.store.periodoActual)
        .map(m => ({
          Fecha: new Date(m.fecha).toLocaleString('es-AR'), Lote: this.store.loteDe(m.loteId)?.numero, Tipo: m.tipo,
          Detalle: m.detalle, Monto: m.monto,
        })),
    });
  }

  // ---------- Pedidos ----------
  protected desde = this.fechaInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  protected hasta = this.fechaInput(new Date());
  protected readonly filtroModalidad = signal<Modalidad | ''>('');
  private readonly rango = signal({ desde: this.desde, hasta: this.hasta });

  protected actualizarRango() {
    this.rango.set({ desde: this.desde, hasta: this.hasta });
  }

  protected readonly pedidosFiltrados = computed(() => {
    const { desde, hasta } = this.rango();
    const d = new Date(desde + 'T00:00:00');
    const h = new Date(hasta + 'T23:59:59');
    return this.store.pedidos().filter(p => {
      const f = new Date(p.creadoEn);
      return f >= d && f <= h && (!this.filtroModalidad() || p.modalidad === this.filtroModalidad());
    });
  });

  protected exportarPedidos() {
    const filas = (ps: Pedido[]) => ps.map(p => ({
      Pedido: p.numero, Fecha: new Date(p.creadoEn).toLocaleString('es-AR'), Lote: this.store.loteDe(p.loteId)?.numero,
      'Pidió': p.nombreSolicitante, Modalidad: MODALIDAD_LABEL[p.modalidad], Estado: ESTADO_LABEL[p.estado],
      Total: p.total, 'Pagado con saldo': p.montoSaldo, Resto: p.montoResto,
      'Medio del resto': p.medioResto ? MEDIO_LABEL[p.medioResto] : '', 'Resto cobrado': p.montoResto ? (p.restoCobrado ? 'Sí' : 'No') : '',
    }));
    const detalle = this.pedidosFiltrados().flatMap(p => p.items.map(i => ({
      Pedido: p.numero, Producto: i.nombre, Cantidad: i.cantidad, 'Precio unitario': i.precioUnitario, Subtotal: i.precioUnitario * i.cantidad, Aclaracion: i.notas ?? '',
    })));
    exportarExcel(`pedidos-${this.desde}-a-${this.hasta}.xlsx`, { Pedidos: filas(this.pedidosFiltrados()), Detalle: detalle });
  }

  protected resumenItems(p: Pedido) {
    return p.items.map(i => `${i.cantidad}× ${i.nombre}`).join(', ');
  }

  protected categoria(id: number) {
    return this.store.categorias.find(c => c.id === id)?.nombre;
  }

  private fechaInput(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private aviso(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }

  protected readonly confirmandoReinicio = signal(false);

  protected reiniciar() {
    this.store.reiniciarDemo();
    this.confirmandoReinicio.set(false);
    this.aviso('Demo reiniciada');
  }
}
