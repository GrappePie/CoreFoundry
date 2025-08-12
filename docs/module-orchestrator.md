# Module Orchestrator

El orquestador de módulos verifica periódicamente el estado de los módulos registrados.
Actualiza su estado, elimina los que permanecen inactivos demasiado tiempo y publica eventos
para notificar cambios de disponibilidad.

Si un ping falla o el endpoint es inválido y el módulo no tiene `lastHandshake`,
el orquestador lo marca como offline y registra la hora actual para permitir su
eliminación en ciclos posteriores.

## Autenticación

Cada ping incluye un encabezado `Authorization` con el valor `Bearer <integrationToken>`.
Los módulos deben validar este token antes de responder al ping.

## Opciones

- `intervalMs` – tiempo en milisegundos entre cada ciclo de verificación (por defecto 60 000 ms).
- `pruneOfflineMs` – elimina un módulo si supera este umbral de tiempo inactivo. Debe ser un número positivo.
- `maxConcurrentPings` – cantidad máxima de pings que se ejecutan en paralelo (por defecto 10).
- `pingTimeoutMs` – tiempo máximo de espera de cada ping antes de marcar al módulo como offline. Debe ser un número positivo (por defecto 5 000 ms).
- `batchSize` – tamaño de lote al paginar módulos (por defecto 100).
- `pingPath` – ruta a anexar al endpoint `rest` del módulo para realizar el ping (por defecto `ping`).

## Eventos emitidos

- `module.online` – un módulo respondió al ping y su estado cambió a `online`.
- `module.offline` – un módulo no respondió al ping o tiene un endpoint inválido.
- `module.removed` – se eliminó un módulo tras permanecer offline más allá de `pruneOfflineMs`.
