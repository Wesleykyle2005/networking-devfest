# DevFest Managua 2025 — App de Networking

> 🚀 Aplicación de networking para conectar a los asistentes de DevFest Managua 2025

Aplicación web construida con Next.js + Supabase que permite a los asistentes crear perfiles públicos, compartir códigos QR, solicitar conexiones y brinda al equipo organizador un panel de administración ligero.

## 📊 Estado del Proyecto

Este repositorio contiene la aplicación en desarrollo activo. Las características principales (autenticación, edición de perfil, directorio, conexiones, panel de administración) están siendo implementadas según el [PRD](./PRD.md) (en inglés).

## 🛠 Stack Tecnológico

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Base de Datos:** Supabase (PostgreSQL, Auth, Storage) con Row Level Security
- **Estilos:** Tailwind CSS + shadcn/ui
- **Despliegue:** Vercel

## 🔐 Autenticación

- **Magic Link:** Enlace mágico por correo (Supabase Auth)
- **Google OAuth:** Acceso con Google (habilita el proveedor en tu proyecto de Supabase)

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ instalado
- Cuenta de Supabase (gratuita)
- Git

### Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/networking-devfest.git
   cd networking-devfest
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   Edita `.env.local` con tus credenciales de Supabase y configuración del evento.

4. **(Opcional) Inicia Supabase localmente**
   ```bash
   npx supabase start
   ```

5. **Ejecuta el servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Abre tu navegador**
   
   Visita [http://localhost:3000](http://localhost:3000)

## ⚙️ Variables de Entorno

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (necesaria para migraciones) |
| `NEXT_PUBLIC_EVENT_NAME` | Nombre del evento mostrado en la app |
| `NEXT_PUBLIC_EVENT_ID` | UUID del evento único |
| `NEXT_PUBLIC_EVENT_CODE` | Código de acceso al evento |
| `ADMIN_EMAILS` | Emails de administradores separados por coma |
| `CONNECTIONS_REQUIRE_APPROVAL` | `true` para aprobación manual, `false` para auto-conexión |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | (Opcional) Client ID para Google OAuth |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` | (Opcional) Client Secret para Google OAuth |

## 🗺 Roadmap

La implementación sigue los hitos definidos en el [PRD](./PRD.md):

- ✅ **M0 - Fundamentos** – Schema de Supabase, autenticación magic-link, código de evento, CRUD de perfil, perfiles públicos
- ✅ **M1 - QR y Directorio** – Modo badge, exportación PNG, directorio con búsqueda y paginación
- ✅ **M2 - Conexiones** – Flujo de solicitud y aprobación, notas/etiquetas, privacidad
- 🚧 **M3 - Admin y Analytics** – Panel de administración, métricas, exportación CSV, tracking de escaneos

Ver [`docs/implementation-plan.md`](./docs/implementation-plan.md) para el desglose detallado de tareas.

## 📜 Scripts Disponibles

```bash
npm run dev          # Inicia el servidor de desarrollo con Turbopack
npm run build        # Construye la aplicación para producción
npm run start        # Ejecuta el servidor de producción
npm run lint         # Ejecuta el linter
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Este proyecto usa **Conventional Commits** y un flujo de trabajo basado en ramas por característica.

### 📦 Conventional Commits

Todos los commits deben seguir el formato:

```bash
<tipo>[alcance]: <descripción>

# Ejemplos
feat: agregar exportación de QR
fix(auth): corregir validación de código
docs: actualizar README
```

### 🌱 Nombres de Ramas

Todas las ramas deben seguir el formato `tipo/descripcion`:

```bash
feat/user-profile-page
fix/auth-redirect-loop
docs/update-readme
```

### 🔄 Flujo de Trabajo

1. Fork el repositorio
2. Crea una rama: `git checkout -b feat/mi-feature`
3. Haz commits con Conventional Commits
4. Push a tu fork: `git push origin feat/mi-feature`
5. Abre un Pull Request hacia `main`

### 📚 Guías Completas

- 📖 [GUIA.md](./GUIA.md) - Documentación completa del proyecto en español
- 🚀 [PARA_CONTRIBUIDORES.md](./PARA_CONTRIBUIDORES.md) - Guía rápida para contribuir
- 🔧 [CONTRIBUTING.md](./CONTRIBUTING.md) - Guía detallada de contribución
- 📋 [PRD.md](./PRD.md) - Product Requirements Document (en inglés)

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](./LICENSE).

## 📧 Contacto

**Rodolfo Andino**  
Email: aandino186@gmail.com  
GitHub: [@Raandino](https://github.com/Raandino)

---

**Hecho con ❤️ para DevFest Managua 2025**
