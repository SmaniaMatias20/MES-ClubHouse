import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { FORMAT_PIPES, estadoClase } from '../../core/format';
import { EstadoPedido } from '../../core/models';
import { StoreService } from '../../core/store.service';

@Component({
  selector: 'app-seguimiento',
  imports: [RouterLink, DatePipe, ...FORMAT_PIPES],
  template: `
    <div class="page narrow">
      @if (pedido(); as p) {
        @if (nuevo()) {
          <div class="ok card">
            <span class="big">✅</span>
            <div>
              <h2>¡Pedido enviado!</h2>
              <p class="muted small">El restaurante ya lo ve en su panel. Te avisamos acá cada vez que cambie de estado.</p>
            </div>
          </div>
        }

        <div class="page-head">
          <div>
            <h1>Pedido #{{ p.numero }}</h1>
            <p class="muted">{{ p.creadoEn | date: "EEEE d 'de' MMMM, HH:mm" }} · {{ p.modalidad | modalidad: true }}</p>
          </div>
          <span class="badge" [class]="claseEstado(p.estado)">{{ p.estado | estado }}</span>
        </div>

        <section class="card">
          <ol class="pasos">
            @for (paso of pasos(); track paso.estado) {
              <li [class.hecho]="paso.fecha" [class.actual]="paso.estado === p.estado">
                <span class="punto"></span>
                <div>
                  <strong>{{ paso.estado | estado }}</strong>
                  @if (paso.fecha) { <span class="small muted">{{ paso.fecha | date: 'HH:mm' }}</span> }
                </div>
              </li>
            }
          </ol>
          @if (p.estado === 'rechazado' || p.estado === 'cancelado') {
            <p class="small muted">El saldo usado ({{ p.montoSaldo | ars }}) volvió a tu cuenta.</p>
          }
        </section>

        <section class="card detalle">
          <h2>Detalle</h2>
          @for (i of p.items; track i.productoId) {
            <div class="fila">
              <span>{{ i.cantidad }} × {{ i.nombre }} @if (i.notas) { <em class="small muted">({{ i.notas }})</em> }</span>
              <span class="num">{{ i.precioUnitario * i.cantidad | ars }}</span>
            </div>
          }
          <div class="fila total"><span>Total</span><span class="num">{{ p.total | ars }}</span></div>
          <div class="fila verde"><span>Pagado con saldo del lote</span><span class="num">−{{ p.montoSaldo | ars }}</span></div>
          <div class="fila total">
            <span>Resto @if (p.medioResto) { · {{ p.medioResto | medio }} }</span>
            <span class="num">{{ p.montoResto | ars }}
              @if (p.montoResto > 0) {
                <span class="badge" [class.verde]="p.restoCobrado" [class.ambar]="!p.restoCobrado">{{ p.restoCobrado ? 'Cobrado' : 'A cobrar' }}</span>
              }
            </span>
          </div>
          <p class="small muted">Pidió: {{ p.nombreSolicitante }} @if (p.mesa) { · Mesa {{ p.mesa }} } @if (p.horaRetiro) { · Retira {{ p.horaRetiro }} }</p>
        </section>

        <div class="acciones">
          @if (p.estado === 'pendiente') {
            <button class="btn peligro" (click)="store.cambiarEstado(p.id, 'cancelado')">Cancelar pedido</button>
          }
          <a class="btn sec" routerLink="/cuenta">Ver mis pedidos</a>
          <a class="btn" routerLink="/menu">Volver al menú</a>
        </div>

        <p class="tip small muted">💡 Demo: cambiá a <strong>Restaurante</strong> en "Ver como" para avanzar el pedido y volvé a este lote para ver el estado actualizado.</p>
      } @else {
        <div class="card empty">No encontramos ese pedido.</div>
      }
    </div>
  `,
  styles: `
    .narrow { max-width: 760px; display: grid; gap: 16px; }
    .page-head { margin-bottom: 0; }
    .ok { display: flex; gap: 14px; align-items: center; background: var(--verde-claro); border-color: #c4dccf; }
    .big { font-size: 2rem; }
    .pasos { list-style: none; margin: 0; padding: 0; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; }
    .pasos li { display: grid; justify-items: center; text-align: center; gap: 8px; position: relative; color: var(--tinta-3); }
    .pasos li::before { content: ''; position: absolute; top: 8px; left: -50%; right: 50%; height: 3px; background: var(--arena-2); }
    .pasos li:first-child::before { display: none; }
    .pasos li.hecho::before { background: var(--verde-2); }
    .pasos li > div { display: grid; font-size: .85rem; }
    .punto { width: 18px; height: 18px; border-radius: 50%; background: var(--arena-2); position: relative; z-index: 1; border: 3px solid var(--blanco); box-shadow: 0 0 0 1px var(--borde); }
    .hecho { color: var(--tinta) !important; }
    .hecho .punto { background: var(--verde-2); box-shadow: 0 0 0 1px var(--verde-2); }
    .actual .punto { box-shadow: 0 0 0 4px color-mix(in srgb, var(--verde-2) 30%, transparent); }
    .detalle { display: grid; gap: 8px; }
    .fila { display: flex; justify-content: space-between; gap: 12px; }
    .fila .num { display: flex; gap: 8px; align-items: center; }
    .total { font-weight: 700; border-top: 1px solid var(--arena-2); padding-top: 8px; }
    .verde { color: var(--verde); }
    .acciones { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
    .tip { text-align: center; }
    @media (max-width: 560px) {
      .pasos { grid-auto-flow: row; gap: 14px; }
      .pasos li { grid-template-columns: auto 1fr; justify-items: start; text-align: left; }
      .pasos li::before { display: none; }
      .acciones .btn { flex: 1; }
    }
  `,
})
export class SeguimientoPage {
  protected readonly store = inject(StoreService);
  private readonly route = inject(ActivatedRoute);

  readonly id = toSignal(this.route.paramMap.pipe(map(p => Number(p.get('id')))), { initialValue: 0 });
  readonly nuevo = toSignal(this.route.queryParamMap.pipe(map(q => q.has('nuevo'))), { initialValue: false });

  protected readonly pedido = computed(() => this.store.misPedidos().find(p => p.id === this.id()));

  protected readonly pasos = computed(() => {
    const p = this.pedido();
    if (!p) return [];
    const flujo: EstadoPedido[] = p.modalidad === 'delivery'
      ? ['pendiente', 'aceptado', 'en_preparacion', 'listo', 'en_camino', 'entregado']
      : ['pendiente', 'aceptado', 'en_preparacion', 'listo', 'entregado'];
    if (p.estado === 'rechazado' || p.estado === 'cancelado') flujo.splice(1, flujo.length, p.estado);
    return flujo.map(estado => ({ estado, fecha: p.historial.find(h => h.estado === estado)?.fecha }));
  });

  protected claseEstado(e: EstadoPedido) {
    return 'badge ' + estadoClase(e);
  }
}
