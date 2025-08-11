# Dashboard

La ruta `/dashboard` sirve como punto de entrada para todos los paneles.
El middleware obtiene el rol desde la sesión (por ejemplo, cookie `user-role`)
y redirige automáticamente al panel correspondiente:

- `owner` → `/dashboard/owner`
- `admin` → `/dashboard/admin`
- `employee` → `/dashboard/employee`

Cada panel utiliza un layout compartido ubicado en `src/app/dashboard/layout.tsx`
que centraliza el diseño común antes de cargar la vista específica del rol.

Los usuarios pueden acceder a su panel desde el menú de usuario (AuthMenu)
mediante la opción **Dashboard**, disponible después de iniciar sesión.
