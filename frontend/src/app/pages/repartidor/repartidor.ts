import { Component, computed, inject } from '@angular/core';
import { PedidoCard } from '../../components/pedido-card';
import { StoreService } from '../../core/store.service';

@Component({
  selector: 'app-repartidor',
  imports: [PedidoCard],
  template: `
    <div class="page narrow">
      <div class="page-head">
        <div>
          <h1>Reparto</h1>
          <p class="muted">Deliveries listos para salir y en camino.</p>
        </div>
      </div>

      <h2>En camino ({{ enCamino().length }})</h2>
      <div class="grid">
        @for (p of enCamino(); track p.id) { <app-pedido-card [pedido]="p" /> }
        @empty { <p class="card empty small">No tenés entregas en curso.</p> }
      </div>

      <h2>Listos para salir ({{ listos().length }})</h2>
      <div class="grid">
        @for (p of listos(); track p.id) { <app-pedido-card [pedido]="p" /> }
        @empty { <p class="card empty small">No hay pedidos esperando.</p> }
      </div>
    </div>
  `,
  styles: `
    .narrow { max-width: 640px; display: grid; gap: 12px; }
    h2 { margin-top: 8px; }
  `,
})
export class RepartidorPage {
  private readonly store = inject(StoreService);
  private readonly delivery = computed(() => this.store.pedidos().filter(p => p.modalidad === 'delivery').reverse());
  protected readonly enCamino = computed(() => this.delivery().filter(p => p.estado === 'en_camino'));
  protected readonly listos = computed(() => this.delivery().filter(p => p.estado === 'listo'));
}
