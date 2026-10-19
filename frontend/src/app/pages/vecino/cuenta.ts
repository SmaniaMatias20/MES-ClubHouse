import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FORMAT_PIPES, estadoClase } from '../../core/format';
import { Pedido } from '../../core/models';
import { StoreService } from '../../core/store.service';

@Component({
  selector: 'app-cuenta',
  imports: [RouterLink, DatePipe, DecimalPipe, ...FORMAT_PIPES],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Mi cuenta</h1>
          <p class="muted">Lote {{ store.loteActual()?.numero }} · {{ store.loteActual()?.titular }}</p>
        </div>
      </div>

      <section class="card saldo">
        <div class="cifras">
          <div>
            <span class="small muted">Disponible para descontar</span>
            <strong class="grande num">{{ saldo().disponible | ars }}</strong>
          </div>
          <div class="mini">
            <div><span class="small muted">Asignado en {{ nombreMes(store.periodoActual) }}</span><strong class="num">{{ saldo().asignado | ars }}</strong></div>
            <div><span class="small muted">Usado</span><strong class="num">{{ saldo().usado | ars }}</strong></div>
          </div>
        </div>
        <div class="bar"><span [style.width.%]="pctUsado()"></span></div>
        <p class="small muted">Usaste el {{ pctUsado() | number: '1.0-0' }}% del saldo. Se renueva el {{ proximaRenovacion() | date: "d 'de' MMMM" }} y lo que no uses se pierde. Recepción descuenta el saldo cuando registra el pago de cada pedido.</p>
      </section>

      <div class="tabs chips">
        <button class="chip" [class.on]="tab() === 'pedidos'" (click)="tab.set('pedidos')">Mis pedidos ({{ store.misPedidos().length }})</button>
        <button class="chip" [class.on]="tab() === 'movimientos'" (click)="tab.set('movimientos')">Movimientos de saldo</button>
      </div>

      @if (tab() === 'pedidos') {
        <div class="grid">
          @for (p of store.misPedidos(); track p.id) {
            <article class="card pedido">
              <a class="cuerpo" [routerLink]="['/pedido', p.id]">
                <div class="linea1">
                  <strong>#{{ p.numero }}</strong>
                  <span class="small muted">{{ p.creadoEn | date: "d MMM, HH:mm" }}</span>
                  <span class="small">{{ p.modalidad | modalidad: true }}</span>
                  <span [class]="'badge ' + clase(p)">{{ p.estado | estado }}</span>
                </div>
                <p class="small muted items">{{ resumen(p) }}</p>
                <p class="small">Pidió <strong>{{ p.nombreSolicitante }}</strong></p>
              </a>
              <div class="montos">
                <strong class="num">{{ p.total | ars }}</strong>
                @if (p.pago; as pago) {
                  @if (pago.montoSaldo) { <span class="small verde num">Saldo {{ pago.montoSaldo | ars }}</span> }
                  @if (pago.montoOtro) { <span class="small muted num">{{ pago.medioOtro | medio }} {{ pago.montoOtro | ars }}</span> }
                } @else if (p.estado !== 'cancelado' && p.estado !== 'rechazado') {
                  <span class="badge ambar">Pago pendiente</span>
                }
                <button class="btn sec sm" (click)="repetir(p)">Repetir</button>
              </div>
            </article>
          } @empty {
            <div class="card empty">Todavía no hiciste pedidos. <a routerLink="/menu">Ver el menú</a></div>
          }
        </div>
      } @else {
        <div class="chips meses">
          @for (m of periodos(); track m) {
            <button class="chip" [class.on]="periodo() === m" (click)="periodo.set(m)">{{ nombreMes(m) }}</button>
          }
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Detalle</th><th>Tipo</th><th class="r">Monto</th></tr></thead>
            <tbody>
              @for (m of movimientos(); track m.id) {
                <tr>
                  <td>{{ m.fecha | date: 'dd/MM HH:mm' }}</td>
                  <td>
                    @if (m.pedidoId && esMio(m.pedidoId)) { <a [routerLink]="['/pedido', m.pedidoId]">{{ m.detalle }}</a> } @else { {{ m.detalle }} }
                  </td>
                  <td><span class="badge" [class.verde]="m.monto > 0">{{ tipoLabel[m.tipo] }}</span></td>
                  <td class="r num" [class.verde]="m.monto > 0">{{ m.monto > 0 ? '+' : '' }}{{ m.monto | ars }}</td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="empty">Sin movimientos en este mes.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .saldo { display: grid; gap: 12px; margin-bottom: 20px; background: linear-gradient(135deg, var(--blanco), var(--verde-claro)); }
    .cifras { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
    .cifras > div:first-child { display: grid; }
    .grande { font: 700 2.2rem var(--serif); color: var(--verde); }
    .mini { display: flex; gap: 28px; }
    .mini > div { display: grid; }
    .tabs { margin-bottom: 14px; }
    .meses { margin-bottom: 12px; }
    .pedido { display: flex; gap: 16px; justify-content: space-between; padding: 14px 16px; }
    .cuerpo { display: grid; gap: 4px; text-decoration: none; color: inherit; min-width: 0; flex: 1; }
    .linea1 { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .items { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .montos { display: grid; justify-items: end; gap: 2px; align-content: center; }
    .montos .btn { margin-top: 6px; }
    .verde { color: var(--verde); }
    @media (max-width: 560px) {
      .grande { font-size: 1.8rem; }
      .pedido { flex-direction: column; }
      .montos { justify-items: start; grid-template-columns: 1fr auto; align-items: center; }
      .montos .btn { grid-column: 2; grid-row: 1 / span 3; margin: 0; }
      .items { white-space: normal; }
    }
  `,
})
export class CuentaPage {
  protected readonly store = inject(StoreService);
  private readonly router = inject(Router);

  protected readonly tab = signal<'pedidos' | 'movimientos'>('pedidos');
  protected readonly periodo = signal(this.store.periodoActual);
  protected readonly tipoLabel = { asignacion: 'Asignación', consumo: 'Consumo', reintegro: 'Reintegro', ajuste: 'Ajuste' };

  protected readonly saldo = this.store.saldoActual;
  protected readonly pctUsado = computed(() => (this.saldo().asignado ? (this.saldo().usado / this.saldo().asignado) * 100 : 0));

  private readonly misMovimientos = computed(() => {
    const id = this.store.loteActual()?.id;
    return this.store.movimientos().filter(m => m.loteId === id);
  });

  protected readonly periodos = computed(() => [...new Set(this.misMovimientos().map(m => m.periodo))].sort().reverse());

  protected readonly movimientos = computed(() =>
    this.misMovimientos().filter(m => m.periodo === this.periodo()).sort((a, b) => b.fecha.localeCompare(a.fecha)),
  );

  protected proximaRenovacion() {
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth() + 1, 1);
  }

  protected nombreMes(periodo: string) {
    const [y, m] = periodo.split('-').map(Number);
    const txt = new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }

  protected resumen(p: Pedido) {
    return p.items.map(i => `${i.cantidad}× ${i.nombre}`).join(', ');
  }

  protected clase(p: Pedido) {
    return estadoClase(p.estado);
  }

  protected esMio(pedidoId: number) {
    return this.store.misPedidos().some(p => p.id === pedidoId);
  }

  protected repetir(p: Pedido) {
    this.store.repetir(p);
    this.router.navigateByUrl('/carrito');
  }
}
