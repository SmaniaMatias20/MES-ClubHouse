import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { INICIO_POR_ROL } from '../../core/roles';
import { COUNTRY } from '../../core/mock-data';
import { Rol } from '../../core/models';
import { StoreService } from '../../core/store.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="wrap">
      <section class="hero">
        <span class="logo">MES</span>
        <h1>Club House</h1>
        <p>{{ country }}</p>
        <ul>
          <li>🛵 Delivery a tu lote</li>
          <li>🛍️ Retiro en el mostrador</li>
          <li>🍽️ Pedido desde la mesa</li>
        </ul>
      </section>

      <section class="card form">
        <h2>Ingresar</h2>
        <p class="muted small">Cada lote tiene una cuenta. Usá el número de tu lote.</p>

        <form (ngSubmit)="ingresar()" class="grid">
          <label class="field">Número de lote
            <input name="lote" [(ngModel)]="lote" inputmode="numeric" placeholder="Ej. 112" autocomplete="username" required />
          </label>
          <label class="field">Contraseña
            <input name="clave" type="password" [(ngModel)]="clave" placeholder="••••••" autocomplete="current-password" />
          </label>
          @if (error()) { <p class="err">{{ error() }}</p> }
          <button class="btn block" type="submit">Ingresar</button>
        </form>

        <div class="demo">
          <p class="small muted"><strong>Demo:</strong> la contraseña no se valida. Probá con un lote o entrá como personal del club.</p>
          <div class="chips">
            <button class="chip" (click)="lote = '112'; ingresar()">Lote 112</button>
            <button class="chip" (click)="como('restaurante')">Restaurante</button>
            <button class="chip" (click)="como('repartidor')">Repartidor</button>
            <button class="chip" (click)="como('admin')">Administración</button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: `
    .wrap { min-height: 100vh; display: grid; grid-template-columns: 1.1fr 1fr; }
    .hero {
      background: linear-gradient(160deg, var(--verde) 0%, #163a2b 60%, var(--lago) 140%);
      color: #fff; padding: 48px; display: flex; flex-direction: column; justify-content: center; gap: 10px;
    }
    .hero h1 { font-size: 2.8rem; }
    .hero p { opacity: .8; font-size: 1.1rem; }
    .hero ul { list-style: none; padding: 0; margin: 24px 0 0; display: grid; gap: 10px; font-size: 1.05rem; }
    .logo { font: 700 1rem var(--serif); width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; background: var(--arena); color: var(--verde); }
    .form { align-self: center; justify-self: center; width: min(420px, calc(100% - 32px)); display: grid; gap: 14px; margin: 32px 0; }
    .err { color: var(--rojo); font-size: .88rem; }
    .demo { border-top: 1px dashed var(--borde); padding-top: 14px; display: grid; gap: 10px; }
    @media (max-width: 820px) {
      .wrap { grid-template-columns: 1fr; min-height: auto; }
      .hero { padding: 32px 20px; }
      .hero h1 { font-size: 2rem; }
      .hero ul { display: none; }
    }
  `,
})
export class LoginPage {
  private readonly store = inject(StoreService);
  private readonly router = inject(Router);
  protected readonly country = COUNTRY;
  protected lote = '';
  protected clave = '';
  protected readonly error = signal('');

  constructor() {
    const s = this.store.sesion();
    if (s) this.router.navigateByUrl(INICIO_POR_ROL[s.rol]);
  }

  ingresar() {
    if (this.store.ingresarComoLote(this.lote.trim())) this.router.navigateByUrl('/menu');
    else this.error.set('No encontramos un lote activo con ese número.');
  }

  como(rol: Exclude<Rol, 'vecino'>) {
    this.store.ingresarComo(rol);
    this.router.navigateByUrl(INICIO_POR_ROL[rol]);
  }
}
