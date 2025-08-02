# 🏭 CoreFoundry

**CoreFoundry** es un ERP modular construido con tecnologías modernas, diseñado para ser flexible, escalable y fácil de extender. Su núcleo permite conectar y gestionar módulos personalizados, incluso aquellos desarrollados por usuarios externos, sin necesidad de modificar el sistema base.

---

## ✨ Visión General

CoreFoundry nace como una plataforma extensible donde cada módulo (Inventario, Ventas, Producción, etc.) puede ser desarrollado de forma independiente y conectado al **módulo central**, que actúa como orquestador y coordinador de la lógica de negocio.

---

## 🧹 Tecnologías Clave

- **Next.js** – Aplicación web fullstack con API integrada.
- **Zustand** – Gestión global de estado ligera y moderna.
- **TanStack Query** – Fetching, caché y sincronización de datos.
- **MongoDB** – Almacenamiento NoSQL flexible para módulos dinámicos.
- **Autenticación básica** – Usuario y contraseña (JWT o sesiones simples).\
  *Google login planeado para el futuro.*

---

## ✨ Características Iniciales

- 📦 **Módulo Central**: núcleo encargado de gestionar usuarios, módulos y conexiones entre ellos.
- 🧱 **Modularidad Extrema**: cada módulo puede tener su propio esquema, lógica y flujo.
- 🔌 **Sistema de Conexiones**: módulos conectados al núcleo para enviar/recibir datos.
- 🔒 **Autenticación de Usuario**: simple al inicio, escalable a OAuth en el futuro.
- 🔧 **Configuración centralizada**: almacenamiento de metadatos de módulos y relaciones.

---

## 📦 Requisitos Previos

- **Node.js** ≥ 20.x
- **npm** o **Yarn**
- **MongoDB** ≥ 6.x (local o en Atlas)
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

3. Crea el archivo `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

4. Define las variables necesarias:

   ```ini
   MONGODB_URI=mongodb://localhost:27017/corefoundry
   AUTH_SECRET=una_clave_segura
   JWT_SECRET=una_clave_segura
   ```

5. Inicia la aplicación:

   ```bash
   npm run dev
   ```

6. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## ⚙️ Comandos Útiles

- **Desarrollo**: `npm run dev`
- **Build para producción**: `npm run build && npm start`
- **Lint**: `npm run lint`
- **Tests**: `npm run test`

---

## 📂 Estructura del Proyecto

```
/
├── src/
│   ├── modules/         # Lógica para manejar módulos conectados
│   ├── store/           # Estado global con Zustand
│   ├── lib/             # Utilidades generales (db, auth, etc.)
│   ├── pages/api/       # Rutas de API para módulos y conexión
│   └── pages/           # Interfaz de usuario principal
├── public/              # Assets estáticos
├── .env.example         # Variables de entorno
└── README.md
```

---

## 🔐 Autenticación

Actualmente soporta:

- Registro y login por usuario/contraseña.
- (Próximamente) Login con Google vía OAuth.

---

## 📡 API Endpoints (inicio)

- `POST /api/auth/login` – Login de usuario.
- `POST /api/auth/register` – Registro de usuario.
- `GET /api/modules` – Lista de módulos registrados.
- `POST /api/modules/register` – Registrar un nuevo módulo.
- `POST /api/modules/connect` – Conectar módulos entre sí o con el central.

> Documentación completa de la API vendrá en la carpeta `./docs/api`.

---

## 🤚 Modo de Desarrollo Modular

Cada módulo externo puede ser diseñado como:

- Un microservicio REST con su propio backend.
- Un cliente que se conecta vía API al módulo central.
- Una extensión que se registra y envía metadatos al núcleo (nombre, descripción, endpoints disponibles, etc.).

---

## 📦 Despliegue con Docker (opcional)

1. Construye la imagen:

   ```bash
   docker build -t corefoundry .
   ```

2. Ejecuta localmente:

   ```bash
   docker-compose up -d
   ```

> A futuro se podrá desplegar en Kubernetes con Helm.

---

## 🤝 Contribuciones

¡Contribuciones son bienvenidas!

1. Haz fork del repositorio.
2. Crea una nueva rama (`feature/nombre`).
3. Agrega pruebas si es posible.
4. Haz un pull request explicando tu cambio.

---

## 📜 Licencia

Licenciado bajo [MIT](LICENSE).

---

## 📅 Changelog

Consulta [CHANGELOG.md](./CHANGELOG.md) para ver cambios recientes.

