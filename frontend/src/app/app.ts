import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { COUNTRY } from './core/mock-data';
import { Rol } from './core/models';
import { StoreService } from './core/store.service';
import { INICIO_POR_ROL } from './core/roles';

interface NavItem { ruta: string; label: string; icono: string; badge?: () => number; }

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly store = inject(StoreService);
  private readonly router = inject(Router);
  protected readonly country = COUNTRY;

  protected readonly nav = computed<NavItem[]>(() => {
    switch (this.store.sesion()?.rol) {
      case 'vecino': return [
        { ruta: '/menu', label: 'Menú', icono: '🍽️' },
        { ruta: '/carrito', label: 'Carrito', icono: '🛒', badge: () => this.store.cantidadCarrito() },
        { ruta: '/cuenta', label: 'Mi cuenta', icono: '👤' },
      ];
      case 'restaurante': return [
        { ruta: '/restaurante', label: 'Pedidos', icono: '📋', badge: () => this.store.pedidos().filter(p => p.estado === 'pendiente').length },
        { ruta: '/repartidor', label: 'Reparto', icono: '🛵' },
      ];
      case 'repartidor': return [{ ruta: '/repartidor', label: 'Reparto', icono: '🛵' }];
      case 'admin': return [
        { ruta: '/admin', label: 'Administración', icono: '⚙️' },
        { ruta: '/restaurante', label: 'Pedidos', icono: '📋' },
        { ruta: '/repartidor', label: 'Reparto', icono: '🛵' },
      ];
      default: return [];
    }
  });

  protected readonly quien = computed(() => {
    const s = this.store.sesion();
    if (!s) return '';
    if (s.rol === 'vecino') return `Lote ${this.store.loteActual()?.numero}`;
    return { restaurante: 'Restaurante', repartidor: 'Repartidor', admin: 'Administración' }[s.rol];
  });

  protected cambiarRol(valor: string) {
    if (valor.startsWith('lote:')) this.store.ingresarComoLote(valor.slice(5));
    else this.store.ingresarComo(valor as Exclude<Rol, 'vecino'>);
    this.router.navigateByUrl(INICIO_POR_ROL[this.store.sesion()!.rol]);
  }

  protected valorRol() {
    const s = this.store.sesion();
    return s?.rol === 'vecino' ? `lote:${this.store.loteActual()?.numero}` : s?.rol ?? '';
  }

  protected salir() {
    this.store.salir();
    this.router.navigateByUrl('/ingresar');
  }
}
