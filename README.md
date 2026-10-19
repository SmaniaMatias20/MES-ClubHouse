# MES Club House

App del Club House de Lagos de San Eliseo: pedidos al restaurante (delivery, retiro y consumo en el lugar), saldo mensual por lote y administración.

Stack: Angular + Node.js + PostgreSQL. La propuesta de alcance y el modelo de datos están en [docs/propuesta-mvp.md](docs/propuesta-mvp.md).

## Estado actual

Primera etapa: **demo del frontend con datos de ejemplo**, sin backend ni base de datos. El estado vive en memoria y se guarda en el `localStorage` del navegador, así que cada persona ve su propia copia de la demo.

## Correr la demo

Requiere Node 20.19+ o 22.12+.

```bash
cd frontend
npm install
npm start          # http://localhost:4200
```

Build de producción: `npm run build` (sale en `frontend/dist/frontend/browser`). Usa rutas con `#`, así que se puede subir a cualquier hosting estático.

## Qué se puede probar

En la barra superior, **Ver como** cambia entre un lote, el restaurante, el repartidor y la administración.

- **Vecino (cuenta por lote):** menú por categorías, carrito con aclaraciones, modalidad delivery / retiro / en el lugar, nombre de quien pide, descuento del saldo del lote y el resto a pagar por fuera de la app (Mercado Pago o tarjeta). Seguimiento del pedido y **Mi cuenta** con saldo del mes, movimientos y pedidos (con "Repetir").
- **Restaurante:** tablero con pedidos nuevos, en cocina, listos y en camino; aceptar, rechazar (devuelve el saldo), avanzar estados y marcar el resto como cobrado. Botón para simular un pedido entrante.
- **Repartidor:** deliveries listos y en camino.
- **Administración:** resumen del mes, lotes y saldos (alta, monto mensual, ajustes, activar/desactivar), menú (precio y stock), listado de pedidos con filtros y exportación a Excel. Importación de lotes desde Excel con plantilla.

## Estructura

```
frontend/src/app/
  core/          modelos, datos de ejemplo, estado (StoreService), formatos y Excel
  components/    tarjeta de pedido compartida
  pages/         login, vecino, restaurante, repartidor, admin
docs/            propuesta de MVP y modelo de datos
```

`StoreService` concentra todas las acciones (crear pedido, cambiar estado, ajustar saldo, etc.). Cuando exista la API, cada método pasa a ser una llamada HTTP sin tocar las pantallas.

## Próximos pasos

1. Backend Node (NestJS) con PostgreSQL según el modelo de `docs/propuesta-mvp.md`.
2. Login real y alta de lotes por la administración.
3. Pedidos en tiempo real para el restaurante (WebSocket).
4. Renovación automática del saldo el día 1 de cada mes.
