import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FORMAT_PIPES } from '../../core/format';
import { MedioPago, Modalidad } from '../../core/models';
import { StoreService } from '../../core/store.service';

@Component({
  selector: 'app-carrito',
  imports: [FormsModule, RouterLink, ...FORMAT_PIPES],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Tu pedido</h1>
          <p class="muted">Lote {{ store.loteActual()?.numero }}</p>
        </div>
        <a class="btn sec" routerLink="/menu">← Seguir agregando</a>
      </div>

      @if (store.carrito().length === 0) {
        <div class="card empty">
          <p>Todavía no agregaste nada.</p>
          <a class="btn" routerLink="/menu" style="margin-top:12px">Ver el menú</a>
        </div>
      } @else {
        <div class="layout">
          <div class="grid">
            <section class="card">
              <h2>Productos</h2>
              @for (i of store.carrito(); track i.producto.id) {
                <div class="item">
                  <span class="emoji">{{ i.producto.emoji }}</span>
                  <div class="desc">
                    <strong>{{ i.producto.nombre }}</strong>
                    <input class="nota" placeholder="Aclaración (ej. sin cebolla)" [ngModel]="i.notas" (ngModelChange)="store.notaItem(i.producto.id, $event)" />
                  </div>
                  <div class="qty">
                    <button class="btn sec sm" (click)="store.quitar(i.producto.id)">−</button>
                    <span class="num">{{ i.cantidad }}</span>
                    <button class="btn sm" (click)="store.agregar(i.producto)">+</button>
                  </div>
                  <strong class="num precio">{{ i.producto.precio * i.cantidad | ars }}</strong>
                </div>
              }
            </section>

            <section class="card grid">
              <h2>¿Cómo lo querés?</h2>
              <div class="modos">
                @for (m of modos; track m.valor) {
                  <button class="modo" [class.on]="modalidad() === m.valor" (click)="modalidad.set(m.valor)">
                    <span class="ico">{{ m.icono }}</span>
                    <strong>{{ m.label }}</strong>
                    <span class="small muted">{{ m.ayuda }}</span>
                  </button>
                }
              </div>

              <div class="campos">
                <label class="field">¿Quién hace el pedido? *
                  <input [(ngModel)]="nombre" placeholder="Tu nombre" />
                </label>
                <label class="field">Teléfono de contacto
                  <input [(ngModel)]="telefono" inputmode="tel" [placeholder]="store.loteActual()?.telefono ?? ''" />
                </label>
                @if (modalidad() === 'en_lugar') {
                  <label class="field">Número de mesa
                    <input [(ngModel)]="mesa" inputmode="numeric" placeholder="Ej. 5" />
                  </label>
                }
                @if (modalidad() === 'retiro') {
                  <label class="field">¿A qué hora pasás?
                    <select [(ngModel)]="horaRetiro">
                      @for (h of horarios; track h) { <option [value]="h">{{ h }}</option> }
                    </select>
                  </label>
                }
                @if (modalidad() === 'delivery') {
                  <p class="small muted envio">🛵 Lo llevamos al lote {{ store.loteActual()?.numero }}. Sin costo de envío.</p>
                }
                <label class="field full">Comentarios para el restaurante
                  <textarea [(ngModel)]="notas" placeholder="Opcional"></textarea>
                </label>
              </div>
            </section>
          </div>

          <aside class="card resumen">
            <h2>Resumen</h2>
            <div class="fila"><span>Subtotal</span><span class="num">{{ store.totalCarrito() | ars }}</span></div>
            <div class="fila"><span>Envío</span><span class="num">{{ 0 | ars }}</span></div>
            <div class="fila total"><span>Total</span><span class="num">{{ store.totalCarrito() | ars }}</span></div>

            <label class="saldo">
              <input type="checkbox" [ngModel]="usarSaldo()" (ngModelChange)="usarSaldo.set($event)" />
              <span>
                <strong>Usar saldo del lote</strong>
                <span class="small muted">Disponible: {{ store.saldoActual().disponible | ars }}</span>
              </span>
              <strong class="num verde">−{{ montoSaldo() | ars }}</strong>
            </label>

            <div class="fila total resto"><span>A pagar</span><span class="num">{{ resto() | ars }}</span></div>

            @if (resto() > 0) {
              <div class="grid medio">
                <span class="small muted">¿Cómo pagás el resto? Se cobra {{ cuandoSeCobra() }}.</span>
                <div class="chips">
                  <button class="chip" [class.on]="medio() === 'mercadopago'" (click)="medio.set('mercadopago')">Mercado Pago</button>
                  <button class="chip" [class.on]="medio() === 'tarjeta'" (click)="medio.set('tarjeta')">Tarjeta</button>
                </div>
              </div>
            } @else {
              <p class="small verde">✓ Tu saldo cubre todo el pedido.</p>
            }

            @if (error()) { <p class="err small">{{ error() }}</p> }
            <button class="btn block" (click)="confirmar()">Confirmar pedido</button>
          </aside>
        </div>
      }
    </div>
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 1fr 360px; gap: 16px; align-items: start; }
    .item { display: grid; grid-template-columns: 44px 1fr auto 100px; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--arena-2); }
    .item:last-child { border-bottom: 0; }
    .emoji { font-size: 1.6rem; text-align: center; }
    .desc { display: grid; gap: 6px; min-width: 0; }
    .nota { padding: 6px 10px; font-size: .85rem; }
    .qty { display: flex; align-items: center; gap: 8px; font-weight: 700; }
    .qty .btn { width: 30px; padding: 5px 0; }
    .precio { text-align: right; }
    .modos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .modo {
      display: grid; gap: 2px; justify-items: start; text-align: left; cursor: pointer;
      padding: 12px; border-radius: 12px; border: 1.5px solid var(--borde); background: #fff; font: inherit; color: inherit;
      &.on { border-color: var(--verde); background: var(--verde-claro); }
    }
    .modo .ico { font-size: 1.4rem; }
    .campos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .campos .full, .envio { grid-column: 1 / -1; }
    .resumen { position: sticky; top: 76px; display: grid; gap: 10px; }
    .fila { display: flex; justify-content: space-between; }
    .total { font-weight: 700; font-size: 1.05rem; border-top: 1px solid var(--arena-2); padding-top: 10px; }
    .resto { font-size: 1.2rem; }
    .saldo { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; padding: 12px; border-radius: 12px; background: var(--verde-claro); cursor: pointer; }
    .saldo input { width: 18px; height: 18px; accent-color: var(--verde); }
    .saldo > span { display: grid; }
    .verde { color: var(--verde); }
    .err { color: var(--rojo); }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .resumen { position: static; }
    }
    @media (max-width: 560px) {
      .item { grid-template-columns: 36px 1fr auto; }
      .precio { grid-column: 2 / -1; }
      .modos { grid-template-columns: 1fr; }
      .modo { grid-template-columns: auto 1fr; column-gap: 10px; }
      .modo .ico { grid-row: span 2; }
      .campos { grid-template-columns: 1fr; }
    }
  `,
})
export class CarritoPage {
  protected readonly store = inject(StoreService);
  private readonly router = inject(Router);

  protected readonly modos: { valor: Modalidad; label: string; icono: string; ayuda: string }[] = [
    { valor: 'delivery', label: 'Delivery', icono: '🛵', ayuda: 'A tu lote' },
    { valor: 'retiro', label: 'Retiro', icono: '🛍️', ayuda: 'En el mostrador' },
    { valor: 'en_lugar', label: 'En el lugar', icono: '🍽️', ayuda: 'Desde tu mesa' },
  ];
  protected readonly horarios = ['Lo antes posible', '12:30', '13:00', '13:30', '20:00', '20:30', '21:00', '21:30', '22:00'];

  protected readonly modalidad = signal<Modalidad>('delivery');
  protected readonly medio = signal<MedioPago>('mercadopago');
  protected readonly error = signal('');
  protected nombre = '';
  protected telefono = '';
  protected mesa = '';
  protected horaRetiro = this.horarios[0];
  protected notas = '';
  protected readonly usarSaldo = signal(true);

  protected readonly montoSaldo = computed(() => (this.usarSaldo() ? Math.min(this.store.saldoActual().disponible, this.store.totalCarrito()) : 0));
  protected readonly resto = computed(() => this.store.totalCarrito() - this.montoSaldo());

  protected cuandoSeCobra() {
    return { delivery: 'al entregar en tu lote', retiro: 'cuando lo retirás', en_lugar: 'en la mesa' }[this.modalidad()];
  }

  confirmar() {
    if (!this.nombre.trim()) {
      this.error.set('Decinos quién hace el pedido.');
      return;
    }
    if (this.modalidad() === 'en_lugar' && !this.mesa.trim()) {
      this.error.set('Indicá el número de mesa.');
      return;
    }
    const pedido = this.store.confirmarPedido({
      nombreSolicitante: this.nombre,
      telefonoContacto: this.telefono,
      modalidad: this.modalidad(),
      mesa: this.mesa,
      horaRetiro: this.horaRetiro,
      notas: this.notas,
      usarSaldo: this.usarSaldo(),
      medioResto: this.medio(),
    });
    if (pedido) this.router.navigate(['/pedido', pedido.id], { queryParams: { nuevo: 1 } });
  }
}
