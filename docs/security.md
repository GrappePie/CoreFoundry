# Seguridad y Permisos de Módulos

Los módulos registrados en **CoreFoundry** ahora incluyen un campo `permissions` que define los scopes disponibles para cada módulo.
Los scopes representan acciones autorizadas (por ejemplo, `auth:login`, `inventory:read`).

## Encabezados requeridos

Toda petición a rutas bajo `/api` debe incluir los siguientes encabezados:

- `X-Module-Id`: Identificador del módulo que realiza la solicitud.
- `X-Module-Scopes`: Lista separada por comas con los scopes necesarios para la operación.

El middleware verifica que el módulo exista y que todos los scopes solicitados estén permitidos. Si falta alguno de los encabezados
obligatorios o si el módulo no posee los permisos requeridos, la solicitud se rechaza con los códigos `401` o `403` según corresponda.

## Ejemplo

```http
POST /api/auth/login
X-Module-Id: 64fae1...
X-Module-Scopes: auth:login
```

Si el módulo `64fae1...` incluye `auth:login` en su arreglo de `permissions`, la solicitud será procesada normalmente.
De lo contrario, el middleware responderá con un mensaje de error e impedirá la ejecución del handler.

## Autenticación de registro de módulos

El endpoint `POST /api/modules/register` requiere un encabezado `Authorization` con un token JWT válido.
El `ownerId` enviado en el cuerpo debe coincidir con el `userId` contenido en el token; de lo contrario la solicitud se rechaza
con `401` (token inválido) o `403` (propietario distinto).
