import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FORMAT_PIPES } from '../../core/format';
import { StoreService } from '../../core/store.service';

@Component({
  selector: 'app-menu',
  imports: [RouterLink, ...FORMAT_PIPES],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>¿Qué pedimos hoy?</h1>
          <p class="muted">Lote {{ store.loteActual()?.numero }} · {{ store.loteActual()?.titular }}</p>
        </div>
        <a class="saldo card" routerLink="/cuenta">
          <span class="small muted">Saldo disponible del mes</span>
          <strong class="num">{{ store.saldoActual().disponible | ars }}</strong>
          <div class="bar"><span [style.width.%]="pct()"></span></div>
        </a>
      </div>

      <div class="cats">
        <div class="chips">
          <button class="chip" [class.on]="cat() === 0" (click)="cat.set(0)">Todo</button>
          @for (c of store.categorias; track c.id) {
            <button class="chip" [class.on]="cat() === c.id" (click)="cat.set(c.id)">{{ c.nombre }}</button>
          }
        </div>
      </div>

      @for (grupo of grupos(); track grupo.id) {
        <section class="grupo">
          <h2>{{ grupo.nombre }}</h2>
          <div class="productos">
            @for (p of grupo.productos; track p.id) {
              <article class="card prod" [class.off]="!p.disponible">
                <div class="emoji">{{ p.emoji }}</div>
                <div class="info">
                  <h3>{{ p.nombre }}</h3>
                  <p class="muted small">{{ p.descripcion }}</p>
                  <div class="pie">
                    <strong class="num">{{ p.precio | ars }}</strong>
                    @if (!p.disponible) {
                      <span class="badge">Sin stock</span>
                    } @else if (store.cantidadEnCarrito(p.id); as n) {
                      <div class="qty">
                        <button class="btn sec sm" (click)="store.quitar(p.id)" aria-label="Quitar">−</button>
                        <span class="num">{{ n }}</span>
                        <button class="btn sm" (click)="store.agregar(p)" aria-label="Agregar">+</button>
                      </div>
                    } @else {
                      <button class="btn sm" (click)="store.agregar(p)">Agregar</button>
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        </section>
      }
    </div>

    @if (store.cantidadCarrito() > 0) {
      <a class="cart-bar" routerLink="/carrito">
        <span>🛒 {{ store.cantidadCarrito() }} {{ store.cantidadCarrito() === 1 ? 'producto' : 'productos' }}</span>
        <strong>Ver pedido · {{ store.totalCarrito() | ars }}</strong>
      </a>
    }
  `,
  styles: `
    .saldo { display: grid; gap: 4px; min-width: 240px; text-decoration: none; color: inherit; padding: 14px 16px; }
    .saldo strong { font: 700 1.5rem var(--serif); color: var(--verde); }
    .cats { position: sticky; top: 60px; z-index: 5; background: var(--arena); padding: 8px 0 12px; margin-bottom: 8px; overflow-x: auto; }
    .cats .chips { flex-wrap: nowrap; }
    .grupo { margin-bottom: 28px; }
    .grupo h2 { margin-bottom: 12px; }
    .productos { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
    .prod { display: flex; gap: 14px; padding: 14px; }
    .prod.off { opacity: .55; }
    .emoji { font-size: 2.2rem; width: 64px; height: 64px; flex: none; display: grid; place-items: center; background: var(--arena); border-radius: 12px; }
    .info { flex: 1; display: grid; gap: 4px; min-width: 0; }
    .pie { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; gap: 8px; }
    .qty { display: flex; align-items: center; gap: 10px; font-weight: 700; }
    .qty .btn { width: 32px; padding: 6px 0; }
    .cart-bar {
      position: fixed; z-index: 15; left: 50%; transform: translateX(-50%); bottom: 24px;
      width: min(560px, calc(100% - 32px));
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      background: var(--verde); color: #fff; text-decoration: none;
      padding: 14px 18px; border-radius: 14px; box-shadow: 0 8px 24px rgba(31,77,58,.35);
    }
    @media (max-width: 720px) {
      .saldo { width: 100%; }
      .cats { top: 56px; margin: 0 -16px 8px; padding: 8px 16px 12px; }
      .productos { grid-template-columns: 1fr; }
      .cart-bar { bottom: 76px; }
    }
  `,
})
export class MenuPage {
  protected readonly store = inject(StoreService);
  protected readonly cat = signal(0);

  protected readonly pct = computed(() => {
    const s = this.store.saldoActual();
    return s.asignado ? (s.disponible / s.asignado) * 100 : 0;
  });

  protected readonly grupos = computed(() =>
    this.store.categorias
      .filter(c => this.cat() === 0 || c.id === this.cat())
      .map(c => ({ ...c, productos: this.store.productos().filter(p => p.categoriaId === c.id) }))
      .filter(g => g.productos.length > 0),
  );
}
