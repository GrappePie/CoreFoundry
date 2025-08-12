# Module Orchestrator

El orquestador de módulos verifica periódicamente el estado de los módulos registrados.
Actualiza su estado, elimina los que permanecen inactivos demasiado tiempo y publica eventos
para notificar cambios de disponibilidad.

## Opciones

- `intervalMs` – tiempo en milisegundos entre cada ciclo de verificación (por defecto 60 000 ms).
- `pruneOfflineMs` – elimina un módulo si supera este umbral de tiempo inactivo.
- `maxConcurrentPings` – cantidad máxima de pings que se ejecutan en paralelo (por defecto 10).
- `pingTimeoutMs` – tiempo máximo de espera de cada ping antes de marcar al módulo como offline (por defecto 5 000 ms).

## Eventos emitidos

- `module.online` – un módulo respondió al ping y su estado cambió a `online`.
- `module.offline` – un módulo no respondió al ping o tiene un endpoint inválido.
- `module.removed` – se eliminó un módulo tras permanecer offline más allá de `pruneOfflineMs`.
