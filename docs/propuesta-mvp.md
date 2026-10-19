# MES Club House: propuesta de MVP

Country: **Lagos de San Eliseo**. Repo: `SmaniaMatias20/MES-ClubHouse` (mismo formato que MES-Rent).

Stack: Angular (front) + Node.js con Express o NestJS (API) + PostgreSQL.
Estado: borrador para validar con Matias. Los puntos marcados con **(?)** dependen de las preguntas del final.

## 1. Objetivo

Reemplazar los pedidos por WhatsApp con una app web (instalable en el celular como PWA) donde los vecinos piden comida del restaurante del club house para **delivery al lote**, **retiro en el mostrador** o **consumo en el lugar**, y pueden pagar total o parcialmente con el **saldo mensual** del lote, que descuenta Recepción al cobrar.

## 2. Usuarios y roles

| Rol | Qué hace |
|---|---|
| **Vecino (cuenta del lote)** | Una sola cuenta por lote, compartida por la familia. Ve el menú, arma el pedido, elige modalidad e indica cómo piensa pagar, sigue el estado, ve su historial y su saldo (solo para consultar). |
| **Recepción** | Recibe pedidos en tiempo real, cambia estados (aceptado, en preparación, listo, en camino, entregado), puede rechazar. |
| **Administrador** | Gestiona menú, precios, horarios, lotes, vecinos y saldos mensuales; ve reportes. |
| **Repartidor** | El restaurante tiene repartidor propio. Ve los pedidos de delivery asignados (lote y nombre de quien pidió) y los marca entregados y cobrados. |

## 3. Alcance del MVP

**Incluido**
1. **Una cuenta por lote**: la administración da de alta el usuario de cada lote. Al hacer un pedido se carga el **nombre de quien pide** (y teléfono de contacto opcional); el lote se toma de la cuenta.
2. Menú por categorías con productos, precio, foto, disponibilidad y opciones simples (ej. "sin cebolla", guarnición).
3. Carrito y checkout con modalidad: delivery (al lote del vecino), retiro (con horario estimado) o en el lugar (número de mesa o nombre).
4. Pago: el vecino ve su saldo disponible e indica cómo piensa pagar (saldo del lote, Mercado Pago o tarjeta), pero **al pedir no se descuenta nada**. Cuando cobra, **Recepción o Administración registran el pago a mano**: cuánto descuentan del saldo del lote y cuánto se pagó por fuera de la app (Mercado Pago o tarjeta).
5. Panel del restaurante con cola de pedidos en vivo (WebSocket) y cambio de estados.
6. Notificaciones al vecino cuando cambia el estado del pedido (en la app; push o WhatsApp después).
7. Panel admin: ABM de menú, lotes, vecinos, horarios y carga/renovación mensual del saldo.
8. Sección **Mi cuenta** del vecino:
   - **Saldo del mes**: monto asignado, usado y disponible para descontar, con barra de progreso.
   - **Movimientos**: lista de cada descuento y reintegro (fecha, pedido, monto), filtrable por mes.
   - **Mis pedidos**: historial con fecha, modalidad, estado, detalle de ítems, cuánto se pagó con saldo y cuánto por fuera. Opción de repetir un pedido.
9. Reporte básico: ventas por día, por modalidad y consumo de saldo por lote.
10. **Excel**: exportar a .xlsx pedidos, movimientos de saldo y consumo por lote (filtrables por fechas), e importar desde Excel la lista de lotes y los saldos mensuales.

**Fuera del MVP (siguiente etapa)**
- Notificaciones push y por WhatsApp.
- Reservas de mesa, propinas, cupones y promociones.
- App nativa en las tiendas (la PWA cubre el uso inicial).
- Facturación electrónica.

## 4. Reglas de negocio a definir

- **Saldo mensual**: se asigna por **lote** (no por persona), se renueva el día 1 de cada mes y **el sobrante se pierde** (no se acumula).
- Una cuenta por lote; toda la familia comparte saldo e historial, y cada pedido registra el nombre de quien lo hizo.
- La app **no procesa pagos**: solo registra el medio elegido (Mercado Pago o tarjeta) y si el resto ya se cobró. El cobro se hace en el mostrador, en la mesa o al entregar en el lote.
- El saldo **no se descuenta al pedir**: lo descuentan Recepción o Administración al registrar el cobro. Si un pedido cobrado se rechaza o cancela, el saldo descontado vuelve al lote.
- Delivery solo dentro del barrio, **sin costo de envío**. El restaurante tiene repartidor propio.
- Pedidos solo dentro del horario del restaurante; los productos sin stock se ocultan.

## 5. Modelo de datos (PostgreSQL)

```
lote ──< usuario
lote ──< saldo_mensual ──< movimiento_saldo >── pedido
categoria ──< producto ──< producto_opcion
usuario ──< pedido ──< pedido_item ──< pedido_item_opcion
pedido ──< pago
pedido ──< pedido_estado_historial
```

| Tabla | Campos principales |
|---|---|
| `lote` | id, numero (único), direccion_referencia, activo |
| `usuario` | id, lote_id (único para rol vecino; null para staff), nombre, email, telefono, password_hash, rol (`vecino`, `recepcion`, `repartidor`, `admin`), activo, creado_en |
| `saldo_mensual` | id, lote_id, periodo (ej. `2026-11-01`), monto_asignado, monto_disponible, único (lote_id, periodo) |
| `movimiento_saldo` | id, saldo_mensual_id, pedido_id (nullable), tipo (`asignacion`, `consumo`, `reintegro`, `ajuste`), monto, usuario_id (quién lo hizo), creado_en |
| `categoria` | id, nombre, orden, activa |
| `producto` | id, categoria_id, nombre, descripcion, precio, foto_url, disponible, orden |
| `producto_opcion` | id, producto_id, nombre, precio_adicional, grupo (ej. "Guarnición"), obligatoria |
| `pedido` | id, numero_corto, usuario_id, lote_id, nombre_solicitante, telefono_contacto, modalidad (`delivery`, `retiro`, `en_lugar`), estado (`pendiente`, `aceptado`, `en_preparacion`, `listo`, `en_camino`, `entregado`, `cancelado`, `rechazado`), mesa, hora_retiro, notas, subtotal, costo_envio, total, creado_en |
| `pedido_item` | id, pedido_id, producto_id, nombre_snapshot, precio_unitario_snapshot, cantidad, notas |
| `pedido_item_opcion` | id, pedido_item_id, opcion_id, nombre_snapshot, precio_snapshot |
| `pago` | id, pedido_id, medio (`saldo`, `mercadopago`, `tarjeta`), monto, registrado_por (usuario_id), registrado_en. Lo carga Recepción o Administración al cobrar; un pedido puede tener una línea de saldo y otra de otro medio. El pedido guarda además `medio_preferido`, lo que eligió el vecino. |
| `pedido_estado_historial` | id, pedido_id, estado, usuario_id, creado_en |
| `horario` | id, dia_semana, abre, cierra, modalidades_habilitadas |

Decisiones de diseño:
- Los montos se guardan como `numeric(12,2)`; nunca `float`.
- El saldo disponible se actualiza en la misma transacción que registra el pago y su `movimiento_saldo`, con `SELECT ... FOR UPDATE` sobre el saldo del lote para evitar que dos cobros simultáneos del mismo lote lo dejen negativo.
- Los ítems guardan nombre y precio "snapshot" para que un cambio de precio no altere pedidos viejos.
- `movimiento_saldo` es el libro contable: el disponible siempre se puede reconstruir sumando movimientos.

## 6. Arquitectura propuesta

- **Front**: un solo proyecto Angular con tres áreas por rol (vecino, restaurante, admin), PWA, Angular Material o Tailwind. Diseño responsive: el panel del restaurante se piensa para PC pero tiene que funcionar bien en tablet y celular (incluido el repartidor).
- **API**: Node + NestJS (estructura modular, validación y guards por rol) con Prisma o TypeORM, autenticación JWT.
- **Tiempo real**: Socket.IO para la cola de pedidos del restaurante y el estado del pedido del vecino.
- **Excel**: librería ExcelJS en el backend para generar e importar .xlsx.
- **Infra**: Docker Compose para desarrollo; deploy en un VPS o Render/Railway con Postgres administrado.
- **Tarea programada** mensual para crear el `saldo_mensual` de cada lote.

## 7. Plan de trabajo sugerido

1. Repo, Docker Compose, esquema de base y seeds (lotes, menú de ejemplo).
2. Auth y roles; ABM admin de lotes, vecinos y menú.
3. Menú, carrito y checkout del vecino; registro de cobros con descuento de saldo.
4. Panel del restaurante en tiempo real y seguimiento del pedido.
5. Historial, reportes y renovación mensual del saldo.
6. Prueba piloto con el restaurante y algunos vecinos.

## 8. Preguntas abiertas

Respondidas: el saldo es por lote y se pierde a fin de mes; sin costo de envío; repartidor propio; panel en PC adaptable a tablet y celular; exportar e importar Excel; pagos por fuera de la app.

1. Volumen de pedidos por día: desconocido. El diseño soporta sin problema cientos de pedidos diarios, así que no bloquea.
2. Nombre: **MES Club House**, repo `MES-ClubHouse`.
