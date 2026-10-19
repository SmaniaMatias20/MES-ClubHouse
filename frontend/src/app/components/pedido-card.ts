import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FORMAT_PIPES } from '../core/format';
import { MedioPago, Pedido } from '../core/models';
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
  imports: [DatePipe, FormsModule, ...FORMAT_PIPES],
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
        @if (p.pago; as pago) {
          <span class="badge verde">Cobrado</span>
          @if (pago.montoSaldo) { <span class="verde">Saldo <span class="num">{{ pago.montoSaldo | ars }}</span></span> }
          @if (pago.montoOtro) { <span>{{ pago.medioOtro | medio }} <span class="num">{{ pago.montoOtro | ars }}</span></span> }
        } @else {
          <span class="badge ambar">Sin cobrar</span>
          <span class="muted">Paga con {{ p.medioPreferido | medio }}</span>
        }
      </div>

      @if (cobrando()) {
        <form class="cobro" (ngSubmit)="confirmarCobro()">
          <p class="small">Saldo disponible del lote {{ lote()?.numero }}: <strong class="num">{{ disponible() | ars }}</strong></p>
          <label class="field">Descontar del saldo
            <input name="saldo" type="number" min="0" step="100" [max]="maxSaldo()" [ngModel]="montoSaldo()" (ngModelChange)="montoSaldo.set(+$event)" />
          </label>
          @if (resto() > 0) {
            <div class="grid resto">
              <span class="small">Resto <strong class="num">{{ resto() | ars }}</strong> pagado con:</span>
              <div class="chips">
                <button type="button" class="chip" [class.on]="medioOtro() === 'mercadopago'" (click)="medioOtro.set('mercadopago')">Mercado Pago</button>
                <button type="button" class="chip" [class.on]="medioOtro() === 'tarjeta'" (click)="medioOtro.set('tarjeta')">Tarjeta</button>
              </div>
            </div>
          }
          @if (errorCobro()) { <p class="small err">{{ errorCobro() }}</p> }
          <div class="fin">
            <button type="button" class="btn ghost sm" (click)="cobrando.set(false)">Cancelar</button>
            <button class="btn sm" type="submit">Confirmar cobro</button>
          </div>
        </form>
      }

      <footer>
        @if (p.estado === 'pendiente') {
          <button class="btn peligro sm" (click)="store.cambiarEstado(p.id, 'rechazado')">Rechazar</button>
        }
        @if (puedeCobrar() && !cobrando()) {
          <button class="btn sec sm" (click)="abrirCobro()">Registrar cobro</button>
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
    .cobro { display: grid; gap: 10px; padding: 12px; border-radius: 10px; border: 1px dashed var(--borde); background: var(--blanco); }
    .cobro .fin { display: flex; gap: 8px; justify-content: flex-end; }
    .resto { gap: 6px; }
    .err { color: var(--rojo); }
    .muted { color: var(--tinta-2); }
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

  // Solo Recepción y Administración registran cobros y descuentan saldo.
  protected readonly puedeCobrar = computed(() => {
    const p = this.pedido();
    const rol = this.store.sesion()?.rol;
    return !p.pago && (rol === 'recepcion' || rol === 'admin') && p.estado !== 'rechazado' && p.estado !== 'cancelado';
  });

  protected readonly cobrando = signal(false);
  protected readonly montoSaldo = signal(0);
  protected readonly medioOtro = signal<MedioPago>('mercadopago');
  protected readonly errorCobro = signal('');
  protected readonly disponible = computed(() => Math.max(0, this.store.saldoDe(this.pedido().loteId).disponible));
  protected readonly maxSaldo = computed(() => Math.min(this.disponible(), this.pedido().total));
  protected readonly resto = computed(() => Math.max(0, this.pedido().total - (this.montoSaldo() || 0)));

  protected abrirCobro() {
    const p = this.pedido();
    this.montoSaldo.set(p.medioPreferido === 'saldo' ? this.maxSaldo() : 0);
    this.medioOtro.set(p.medioPreferido === 'tarjeta' ? 'tarjeta' : 'mercadopago');
    this.errorCobro.set('');
    this.cobrando.set(true);
  }

  protected confirmarCobro() {
    const error = this.store.registrarCobro(this.pedido().id, this.montoSaldo(), this.medioOtro());
    if (error) this.errorCobro.set(error);
    else this.cobrando.set(false);
  }

  protected hace() {
    const min = Math.max(0, Math.round((Date.now() - new Date(this.pedido().creadoEn).getTime()) / 60000));
    if (min < 60) return `hace ${min} min`;
    if (min < 60 * 24) return `hace ${Math.floor(min / 60)} h`;
    return new Date(this.pedido().creadoEn).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }
}
