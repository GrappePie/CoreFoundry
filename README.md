# 🏭 CoreFoundry

**CoreFoundry** es un ERP modular construido con tecnologías modernas, diseñado para ser flexible, escalable y fácil de extender. Su núcleo —el **Módulo Central**— gestiona usuarios, suscripciones, módulos y conexiones entre ellos, garantizando la seguridad y trazabilidad de los flujos de datos.

---

## ✨ Visión General

CoreFoundry nace como una plataforma extensible donde cada módulo (Inventario, Ventas, Producción, etc.) puede ser desarrollado de forma independiente y conectado al **Módulo Central**, que actúa como orquestador y coordinador de la lógica de negocio.

---

## 🧹 Tecnologías Clave

- **Next.js** – Aplicación web fullstack con App Router y API integrada.
- **Zustand** – Gestión global de estado ligera y moderna.
- **TanStack Query** – Fetching, caché y sincronización de datos.
- **MongoDB** – Almacenamiento NoSQL flexible para módulos dinámicos.
- **Auth.js (NextAuth.js v5)** – Autenticación y autorización escalable (JWT / sesiones).
- **Framer Motion** – Animaciones fluidas en UI.

---

## 🔑 Gestión de Usuarios y Subscripciones

El **Módulo Central** gestiona:

1. **Autenticación y registros**:

    - Registro y login con usuario/contraseña (JWT o sesiones).
    - (Próximamente) Login con Google u otros proveedores OAuth.

2. **Perfiles y roles**:

    - **Owner**: administra la cuenta, usuarios y suscripciones.
    - **Empleado**: roles específicos (ventas, inventario, etc.).
    - **Super Admin** (equipo interno): acceso completo.

3. **Planes y módulos habilitados**:

    - Define planes (Free, Pro, Enterprise) que habilitan cierto conjunto de módulos.
    - Controla acceso a módulos según plan y periodo de suscripción.

4. **Seguridad y auditoría**:

    - Validación de JWT en cada request.
    - Cifrado en tránsito (HTTPS/WSS).
    - Logs de auditoría para trazabilidad de flujos y acciones.

---

## ✨ Características Iniciales

- 📦 **Módulo Central**: orquestador de usuarios, módulos y conexiones.
- 🧱 **Modularidad Extrema**: cada módulo puede tener su propio esquema y lógica.
- 🔗 **Conexiones Seguras**: flujos de datos validados entre módulos.
- 🔧 **Configuración Dinámica**: registro y metadatos de módulos en base de datos.
- 📊 **Auditoría**: seguimiento de acciones y resultados.

---

## 📦 Requisitos Previos

- **Node.js** ≥ 20.x
- **npm** o **Yarn**
- **MongoDB** ≥ 6.x (local o Atlas)
- (Opcional) Docker y Docker Compose

---

## 🛠️ Instalación Local

1. Clona este repositorio:

   ```bash
   git clone https://github.com/tu-org/corefoundry.git
   cd corefoundry
   ```

2. Instala las dependencias:

   ```bash
   npm install
   # o
   yarn install
   ```

3. Crea `.env.local` a partir del ejemplo:

   ```bash
   cp .env.example .env.local
   ```

4. Define las variables:

   ```ini
   MONGODB_URI=mongodb://localhost:27017/corefoundry
   NEXTAUTH_SECRET=tu_clave_segura
   JWT_SECRET=tu_clave_segura
   ```

5. Arranca en modo desarrollo:

   ```bash
   npm run dev
   ```

6. Abre [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Comandos Útiles

- **Desarrollo**: `npm run dev`
- **Build producción**: `npm run build && npm start`
- **Lint**: `npm run lint`
- **Tests**: `npm run test`

---

## 📂 Estructura del Proyecto

```
/
├── src/
│   ├── app/               # Rutas y layouts (App Router)
│   ├── modules/           # Lógica de orquestación de módulos
│   ├── store/             # Estado global (Zustand)
│   ├── lib/               # Utilidades (db, auth, etc.)
│   ├── hooks/             # Hooks personalizados (React)
│   ├── components/        # Componentes React compartidos
│   └── styles/            # CSS / Tailwind / Globals
├── public/                # Assets estáticos
├── .env.example           # Variables de entorno de ejemplo
└── README.md
└── CHANGELOG.md
└── LICENSE
```

---

## 📡 API Endpoints (Base)

### Autenticación y Usuarios

- `POST /api/auth/register` – Registro de usuario
- `POST /api/auth/login` – Inicio de sesión
- `GET  /api/auth/session` – Información de sesión activa

### Módulos y Conexiones

- `GET  /api/modules` – Listar módulos registrados
- `POST /api/modules/register` – Registrar nuevo módulo
- `POST /api/modules/connect` – Conectar dos módulos
- `GET  /api/moduleLinks` – Listar flujos configurados

### Auditoría

- `GET  /api/auditLogs` – Consultar logs de operaciones

> Para más detalles, consulta `./docs/api`.

---

## 📦 Despliegue con Docker (opcional)

1. `docker build -t corefoundry .`
2. `docker-compose up -d`

> En el futuro, se podrá desplegar en Kubernetes con Helm.

---

## 🤝 Contribuciones

¡Contribuciones bienvenidas!

1. Haz fork del repo.
2. Crea una rama (`feature/…`).
3. Añade pruebas y documentación.
4. Abre un pull request describiendo tu cambio.

---

## 📜 Licencia

MIT © Tu Organización

---

## 📅 Changelog

Consulta [CHANGELOG.md](./CHANGELOG.md) para ver cambios recientes.

