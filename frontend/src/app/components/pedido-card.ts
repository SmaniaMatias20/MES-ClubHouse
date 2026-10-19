import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FORMAT_PIPES } from '../core/format';
import { Pedido } from '../core/models';
import { StoreService, siguienteEstado } from '../core/store.service';

const ACCION: Record<string, string> = {
  aceptado: 'Aceptar',
  en_preparacion: 'Empezar a preparar',
  listo: 'Marcar listo',
  en_camino: 'Salió a entregar',
  entregado: 'Entregado',
};

/** Tarjeta de pedido para el panel del restaurante y el repartidor. */
@Component({
  selector: 'app-pedido-card',
  imports: [DatePipe, ...FORMAT_PIPES],
  template: `
    @let p = pedido();
    <article class="card pc" [class.nuevo]="p.estado === 'pendiente'">
      <header>
        <strong class="nro">#{{ p.numero }}</strong>
        <span class="badge" [class.azul]="p.modalidad === 'delivery'" [class.ambar]="p.modalidad === 'retiro'" [class.verde]="p.modalidad === 'en_lugar'">{{ p.modalidad | modalidad: true }}</span>
        <span class="small muted hora" [title]="p.creadoEn | date: 'dd/MM HH:mm'">{{ hace() }}</span>
      </header>

      <div class="quien">
        <strong>Lote {{ lote()?.numero }}</strong> · {{ p.nombreSolicitante }}
        @if (p.mesa) { · <strong>Mesa {{ p.mesa }}</strong> }
        @if (p.horaRetiro) { · Retira {{ p.horaRetiro }} }
        @if (p.telefonoContacto || lote()?.telefono; as tel) { <div class="small muted">📞 {{ tel }}</div> }
      </div>

      <ul class="items">
        @for (i of p.items; track i.productoId) {
          <li><strong>{{ i.cantidad }}×</strong> {{ i.nombre }} @if (i.notas) { <em>— {{ i.notas }}</em> }</li>
        }
      </ul>
      @if (p.notas) { <p class="nota small">📝 {{ p.notas }}</p> }

      <div class="pago small">
        <span>Total <strong class="num">{{ p.total | ars }}</strong></span>
        <span class="verde">Saldo <span class="num">{{ p.montoSaldo | ars }}</span></span>
        @if (p.montoResto > 0) {
          <span>
            Cobrar <strong class="num">{{ p.montoResto | ars }}</strong> {{ p.medioResto | medio }}
            <span class="badge" [class.verde]="p.restoCobrado" [class.ambar]="!p.restoCobrado">{{ p.restoCobrado ? 'Cobrado' : 'Pendiente' }}</span>
          </span>
        }
      </div>

      <footer>
        @if (p.estado === 'pendiente') {
          <button class="btn peligro sm" (click)="store.cambiarEstado(p.id, 'rechazado')">Rechazar</button>
        }
        @if (p.montoResto > 0 && !p.restoCobrado && cobrable()) {
          <button class="btn sec sm" (click)="store.marcarCobrado(p.id)">Marcar cobrado</button>
        }
        @if (accion(); as a) {
          <button class="btn sm" (click)="store.avanzar(p.id)">{{ a }}</button>
        }
      </footer>
    </article>
  `,
  styles: `
    .pc { display: grid; gap: 10px; padding: 14px; }
    .pc.nuevo { border-color: var(--ambar); box-shadow: 0 0 0 3px var(--ambar-claro), var(--sombra); }
    header { display: flex; align-items: center; gap: 8px; }
    .nro { font: 700 1.1rem var(--serif); }
    .hora { margin-left: auto; }
    .items { margin: 0; padding: 10px 12px; list-style: none; background: var(--arena); border-radius: 10px; display: grid; gap: 3px; font-size: .9rem; }
    .items em { color: var(--ambar); font-style: normal; font-weight: 600; }
    .nota { background: var(--ambar-claro); padding: 6px 10px; border-radius: 8px; }
    .pago { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; }
    .verde { color: var(--verde); }
    footer { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
  `,
})
export class PedidoCard {
  protected readonly store = inject(StoreService);
  readonly pedido = input.required<Pedido>();

  protected readonly lote = computed(() => this.store.loteDe(this.pedido().loteId));

  protected readonly accion = computed(() => {
    const sig = siguienteEstado(this.pedido());
    if (!sig) return null;
    if (sig === 'entregado') return this.pedido().modalidad === 'retiro' ? 'Retirado' : 'Entregado';
    return ACCION[sig];
  });

  protected readonly cobrable = computed(() => ['listo', 'en_camino', 'entregado'].includes(this.pedido().estado));

  protected hace() {
    const min = Math.max(0, Math.round((Date.now() - new Date(this.pedido().creadoEn).getTime()) / 60000));
    if (min < 60) return `hace ${min} min`;
    if (min < 60 * 24) return `hace ${Math.floor(min / 60)} h`;
    return new Date(this.pedido().creadoEn).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }
}
