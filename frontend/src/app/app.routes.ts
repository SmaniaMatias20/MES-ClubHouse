import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Rol } from './core/models';
import { StoreService } from './core/store.service';

const soloRol = (...roles: Rol[]): CanActivateFn => () => {
  const rol = inject(StoreService).sesion()?.rol;
  return (rol && roles.includes(rol)) || inject(Router).parseUrl('/ingresar');
};

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ingresar' },
  { path: 'ingresar', loadComponent: () => import('./pages/login/login').then(m => m.LoginPage) },
  {
    path: '',
    canActivate: [soloRol('vecino')],
    children: [
      { path: 'menu', loadComponent: () => import('./pages/vecino/menu').then(m => m.MenuPage) },
      { path: 'carrito', loadComponent: () => import('./pages/vecino/carrito').then(m => m.CarritoPage) },
      { path: 'pedido/:id', loadComponent: () => import('./pages/vecino/seguimiento').then(m => m.SeguimientoPage) },
      { path: 'cuenta', loadComponent: () => import('./pages/vecino/cuenta').then(m => m.CuentaPage) },
    ],
  },
  { path: 'recepcion', canActivate: [soloRol('recepcion', 'admin')], loadComponent: () => import('./pages/recepcion/panel').then(m => m.PanelPage) },
  { path: 'repartidor', canActivate: [soloRol('repartidor', 'recepcion', 'admin')], loadComponent: () => import('./pages/repartidor/repartidor').then(m => m.RepartidorPage) },
  { path: 'admin', canActivate: [soloRol('admin')], loadComponent: () => import('./pages/admin/admin').then(m => m.AdminPage) },
  { path: '**', redirectTo: 'ingresar' },
];
