# AGENTS

Este archivo contiene instrucciones para contribuciones en el repositorio **CoreFoundry**.

## Estilo y organización
- El proyecto usa **TypeScript** con módulos ESM y el framework **Next.js**.
- Mantén la estructura existente: componentes en `src/components`, hooks en `src/hooks`, servicios en `src/services`, etc.
- Cuando añadas módulos, incluye un `module.manifest.json` y documentos relevantes.

## Flujo de trabajo
1. Instala dependencias si es necesario: `npm install`.
2. Verifica el estilo: `npm run lint`.
3. Ejecuta las pruebas: `npm test`.
4. Documenta cambios en `docs/` y actualiza `README.md` si aplica.

## Convenciones
- Usa mensajes de commit en modo imperativo y concisos.
- Acompaña nuevas funcionalidades con pruebas y documentación.
- Revisa los lineamientos de seguridad en `docs/security.md` para cambios relacionados a permisos.

## Recursos útiles
- Arquitectura general: `README.md`.
- CLI de módulos: `docs/module-cli.md`.
- Mensajería y eventos: `docs/messaging.md`.
- Dashboards y vistas: `docs/dashboard.md`.

