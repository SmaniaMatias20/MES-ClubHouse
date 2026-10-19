import { Component, computed, inject, signal } from '@angular/core';
import { PedidoCard } from '../../components/pedido-card';
import { FORMAT_PIPES } from '../../core/format';
import { EstadoPedido, Modalidad } from '../../core/models';
import { StoreService } from '../../core/store.service';

interface Columna { titulo: string; estados: EstadoPedido[]; vacio: string; }

@Component({
  selector: 'app-panel',
  imports: [PedidoCard, ...FORMAT_PIPES],
  template: `
    <div class="page wide">
      <div class="page-head">
        <div>
          <h1>Pedidos de hoy</h1>
          <p class="muted">{{ activos().length }} en curso · {{ entregadosHoy().length }} entregados · {{ ventasHoy() | ars }} vendidos</p>
        </div>
        <div class="acciones">
          <div class="chips">
            <button class="chip" [class.on]="filtro() === null" (click)="filtro.set(null)">Todos</button>
            <button class="chip" [class.on]="filtro() === 'delivery'" (click)="filtro.set('delivery')">🛵 Delivery</button>
            <button class="chip" [class.on]="filtro() === 'retiro'" (click)="filtro.set('retiro')">🛍️ Retiro</button>
            <button class="chip" [class.on]="filtro() === 'en_lugar'" (click)="filtro.set('en_lugar')">🍽️ En el lugar</button>
          </div>
          <button class="btn sec sm" (click)="store.simularPedido()" title="Solo para la demo">+ Simular pedido entrante</button>
        </div>
      </div>

      <div class="tablero">
        @for (col of columnas; track col.titulo) {
          @let lista = deColumna(col);
          <section class="col">
            <h2>{{ col.titulo }} <span class="cnt">{{ lista.length }}</span></h2>
            <div class="grid">
              @for (p of lista; track p.id) {
                <app-pedido-card [pedido]="p" />
              } @empty {
                <p class="empty small">{{ col.vacio }}</p>
              }
            </div>
          </section>
        }
      </div>

      @if (entregadosHoy().length) {
        <details class="card hechos">
          <summary><strong>Entregados hoy ({{ entregadosHoy().length }})</strong></summary>
          <div class="grid hechos-grid">
            @for (p of entregadosHoy(); track p.id) { <app-pedido-card [pedido]="p" /> }
          </div>
        </details>
      }
    </div>
  `,
  styles: `
    .wide { max-width: 1480px; }
    .acciones { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .tablero { display: grid; grid-template-columns: repeat(4, minmax(260px, 1fr)); gap: 16px; align-items: start; }
    .col { background: var(--arena-2); border-radius: var(--radio); padding: 12px; min-height: 200px; }
    .col h2 { font-size: 1rem; margin: 2px 4px 12px; display: flex; align-items: center; gap: 8px; }
    .cnt { font: 600 .75rem var(--sans); background: var(--blanco); border-radius: 999px; padding: 2px 8px; }
    .grid { gap: 12px; }
    .hechos { margin-top: 20px; }
    .hechos summary { cursor: pointer; }
    .hechos-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); margin-top: 14px; }
    @media (max-width: 1100px) { .tablero { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .tablero { grid-template-columns: 1fr; } }
  `,
})
export class PanelPage {
  protected readonly store = inject(StoreService);
  protected readonly filtro = signal<Modalidad | null>(null);

  protected readonly columnas: Columna[] = [
    { titulo: 'Nuevos', estados: ['pendiente'], vacio: 'No hay pedidos nuevos.' },
    { titulo: 'En cocina', estados: ['aceptado', 'en_preparacion'], vacio: 'Nada en preparación.' },
    { titulo: 'Listos', estados: ['listo'], vacio: 'Nada para entregar.' },
    { titulo: 'En camino', estados: ['en_camino'], vacio: 'Ningún delivery en viaje.' },
  ];

  private readonly filtrados = computed(() => this.store.pedidos().filter(p => !this.filtro() || p.modalidad === this.filtro()));

  private readonly hoy = computed(() => {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    return this.filtrados().filter(p => new Date(p.creadoEn) >= inicio);
  });

  // Los pedidos en curso se muestran siempre, aunque hayan entrado antes de medianoche.
  protected readonly activos = computed(() => this.filtrados().filter(p => !['entregado', 'cancelado', 'rechazado'].includes(p.estado)));
  protected readonly entregadosHoy = computed(() => this.hoy().filter(p => p.estado === 'entregado'));
  protected readonly ventasHoy = computed(() => this.hoy().filter(p => p.estado !== 'rechazado' && p.estado !== 'cancelado').reduce((a, p) => a + p.total, 0));

  protected deColumna(col: Columna) {
    // Los más viejos primero: es el orden en que hay que atenderlos.
    return this.activos().filter(p => col.estados.includes(p.estado)).reverse();
  }
}
