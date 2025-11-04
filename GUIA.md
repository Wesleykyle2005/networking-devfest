# 📱 DevFest Managua 2025 - Guía del Proyecto

> **Aplicación de Networking para DevFest Managua 2025**  
> Construida con Next.js 15, Supabase, TypeScript y shadcn/ui

---

## 📋 Tabla de Contenidos

1. [Descripción General](#-descripción-general)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Configuración Inicial](#-configuración-inicial)
5. [Scripts Disponibles](#-scripts-disponibles)
6. [Rutas de la Aplicación](#-rutas-de-la-aplicación)
7. [Componentes Principales](#-componentes-principales)
8. [Base de Datos](#-base-de-datos)
9. [Variables de Entorno](#-variables-de-entorno)
10. [Características Principales](#-características-principales)
11. [Desarrollo](#-desarrollo)
12. [Despliegue](#-despliegue)

---

## 🎯 Descripción General

Aplicación web ligera de networking diseñada específicamente para el evento **DevFest Managua 2025**. Permite a los asistentes:

- ✅ Iniciar sesión mediante **magic link** con código de evento compartido
- 👤 Crear un **perfil público** completo (avatar, nombre, empresa, bio, redes sociales)
- 📱 **Generar y mostrar QR** que enlaza al perfil público
- 🔍 **Descubrir personas** mediante directorio con búsqueda
- 🤝 **Solicitar conexiones** escaneando QR o desde perfiles
- 👨‍💼 **Panel de administración** para métricas y moderación básica

**Nota importante:** Esta es una aplicación de evento único. La base de datos será eliminada después del evento.

---

## 🛠 Stack Tecnológico

### Frontend
- **Framework:** Next.js 15 (App Router) con Turbopack
- **Lenguaje:** TypeScript 5
- **UI Library:** React 19
- **Estilos:** Tailwind CSS 3.4
- **Componentes:** shadcn/ui (Radix UI)
- **Iconos:** Lucide React
- **Animaciones:** Motion (Framer Motion)
- **Formularios:** React Hook Form + Zod
- **Estado:** Zustand

### Backend & Servicios
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth (Magic Link + Google OAuth)
- **Storage:** Supabase Storage
- **Búsqueda:** Algolia Search
- **Email:** Resend
- **QR Codes:** qrcode
- **OG Images:** @vercel/og

### Desarrollo
- **Linting:** ESLint 9
- **Package Manager:** npm/yarn/pnpm
- **Deployment:** Vercel

---

## 📁 Estructura del Proyecto

```
networking-devfest/
├── app/                          # App Router de Next.js
│   ├── (protected)/             # Rutas protegidas (requieren auth)
│   │   ├── dashboard/           # Panel principal del usuario
│   │   ├── directorio/          # Directorio de asistentes
│   │   ├── qr/                  # Generación y visualización de QR
│   │   └── layout.tsx           # Layout para rutas protegidas
│   ├── api/                     # API Routes
│   ├── auth/                    # Rutas de autenticación
│   │   ├── callback/            # Callback de OAuth
│   │   ├── confirm/             # Confirmación de magic link
│   │   └── login/               # Página de login
│   ├── join/                    # Registro con código de evento
│   ├── perfil/                  # Perfiles públicos
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx               # Layout raíz
│   └── page.tsx                 # Página de inicio
│
├── components/                   # Componentes React
│   ├── directory/               # Componentes del directorio
│   ├── layout/                  # Componentes de layout
│   │   └── app-header.tsx       # Header de la aplicación
│   ├── qr/                      # Componentes de QR
│   ├── ui/                      # Componentes de shadcn/ui
│   ├── login-form.tsx           # Formulario de login
│   └── logout-button.tsx        # Botón de cerrar sesión
│
├── lib/                         # Utilidades y configuración
│   ├── supabase/                # Cliente de Supabase
│   │   ├── client.ts            # Cliente para componentes
│   │   ├── server.ts            # Cliente para Server Components
│   │   └── middleware.ts        # Cliente para middleware
│   ├── validators/              # Schemas de validación (Zod)
│   ├── env-config.ts            # Configuración de variables de entorno
│   ├── formatters.ts            # Funciones de formateo
│   └── utils.ts                 # Utilidades generales (cn, etc.)
│
├── public/                      # Archivos estáticos
│   └── assets/                  # Recursos (logos, imágenes)
│       └── devfest-logo.svg     # Logo de DevFest
│
├── supabase/                    # Configuración de Supabase local
│   ├── config.toml              # Configuración del CLI
│   └── migrations/              # Migraciones de base de datos
│
├── docs/                        # Documentación adicional
├── .env.example                 # Ejemplo de variables de entorno
├── .env.local                   # Variables de entorno locales (no commiteado)
├── .gitignore                   # Archivos ignorados por Git
├── components.json              # Configuración de shadcn/ui
├── middleware.ts                # Middleware de Next.js (auth)
├── next.config.ts               # Configuración de Next.js
├── package.json                 # Dependencias del proyecto
├── tailwind.config.ts           # Configuración de Tailwind
├── tsconfig.json                # Configuración de TypeScript
├── PRD.md                       # Product Requirements Document
└── GUIA.md                      # Esta guía
```

---

## ⚙️ Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Raandino/networking-devfest.git
cd networking-devfest
```

### 2. Instalar Dependencias

```bash
npm install
# o
yarn install
# o
pnpm install
```

### 3. Configurar Variables de Entorno

```bash
npm run setup
```

Esto copiará `.env.example` a `.env.local`. Luego edita `.env.local` con tus credenciales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Evento
NEXT_PUBLIC_EVENT_NAME="DevFest Managua 2025"
NEXT_PUBLIC_EVENT_ID=uuid_del_evento
NEXT_PUBLIC_EVENT_CODE=DEVFEST2025
ADMIN_EMAILS=admin@example.com

# Resend (Email)
RESEND_API_KEY=tu_api_key_de_resend
RESEND_FROM_EMAIL=noreply@tudominio.com
```

### 4. Iniciar Supabase Local (Opcional)

```bash
npx supabase init
npx supabase start
```

Esto iniciará una instancia local de Supabase en:
- **API URL:** http://127.0.0.1:54321
- **Studio URL:** http://127.0.0.1:54323
- **Database URL:** postgresql://postgres:postgres@127.0.0.1:54322/postgres

### 5. Ejecutar Migraciones

```bash
npx supabase db push
```

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo con Turbopack
npm run dev:dev          # Usa .env.dev y inicia desarrollo
npm run dev:prod         # Usa .env.prod y inicia desarrollo

# Producción
npm run build            # Construye la aplicación para producción
npm run start            # Inicia servidor de producción

# Calidad de Código
npm run lint             # Ejecuta ESLint

# Configuración
npm run setup            # Copia .env.example a .env.local
```

---

## 🗺 Rutas de la Aplicación

### Rutas Públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Página de inicio / Landing |
| `/auth/login` | Página de inicio de sesión (Magic Link) |
| `/auth/callback` | Callback de OAuth (Google) |
| `/auth/confirm` | Confirmación de magic link |
| `/join` | Registro con código de evento |
| `/perfil/[id]` | Perfil público de usuario |

### Rutas Protegidas (Requieren Autenticación)

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Panel principal del usuario |
| `/directorio` | Directorio de asistentes con búsqueda |
| `/qr` | Generación y visualización de código QR |

### API Routes

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/connections` | POST | Crear solicitud de conexión |
| `/api/profile` | GET/PUT | Obtener/actualizar perfil |
| `/api/qr` | GET | Generar código QR |

---

## 🧩 Componentes Principales

### Layout Components

#### `app-header.tsx`
Header principal de la aplicación con:
- Logo de DevFest
- Menú de usuario con avatar
- Dropdown con opciones de perfil y logout

### Form Components

#### `login-form.tsx`
Formulario de inicio de sesión con:
- Input de email
- Botón de magic link
- Integración con Supabase Auth

### UI Components (shadcn/ui)

Componentes reutilizables basados en Radix UI:
- `button` - Botones con variantes
- `input` - Campos de entrada
- `dialog` - Modales
- `dropdown-menu` - Menús desplegables
- `label` - Etiquetas de formulario
- `separator` - Separadores
- `switch` - Interruptores
- `tabs` - Pestañas
- `checkbox` - Casillas de verificación

---

## 🗄 Base de Datos

### Tablas Principales

#### `profiles`
Información de perfil de usuarios
```sql
- id (uuid, PK, FK a auth.users)
- email (text)
- name (text)
- avatar_url (text)
- headline (text)
- company (text)
- bio (text)
- location (text)
- linkedin_url (text)
- twitter_url (text)
- github_url (text)
- website_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `connections`
Conexiones entre usuarios
```sql
- id (uuid, PK)
- requester_id (uuid, FK a profiles)
- receiver_id (uuid, FK a profiles)
- status (enum: pending, approved, rejected)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `events`
Información del evento
```sql
- id (uuid, PK)
- name (text)
- code (text, unique)
- start_date (date)
- end_date (date)
- created_at (timestamp)
```

### Políticas de Seguridad (RLS)

- Los perfiles son **públicos** para lectura
- Solo el propietario puede **actualizar** su perfil
- Las conexiones son visibles para ambas partes
- Solo usuarios autenticados pueden crear conexiones

---

## 🔐 Variables de Entorno

### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=          # URL de tu proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Clave anónima pública
SUPABASE_SERVICE_ROLE_KEY=         # Clave de servicio (privada)
```

### Configuración del Evento
```env
NEXT_PUBLIC_EVENT_NAME=            # Nombre del evento
NEXT_PUBLIC_EVENT_ID=              # UUID del evento
NEXT_PUBLIC_EVENT_CODE=            # Código de acceso
ADMIN_EMAILS=                      # Emails de administradores (separados por coma)
```

### Feature Flags
```env
CONNECTIONS_REQUIRE_APPROVAL=      # true/false - Requiere aprobación de conexiones
```

### OAuth (Opcional)
```env
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=     # Client ID de Google
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET= # Client Secret de Google
```

### Resend (Email)
```env
RESEND_API_KEY=                    # API Key de Resend
RESEND_FROM_EMAIL=                 # Email remitente
```

---

## ✨ Características Principales

### 1. Autenticación
- **Magic Link:** Inicio de sesión sin contraseña vía email
- **Google OAuth:** Opción de login con Google
- **Código de Evento:** Validación de acceso mediante código compartido

### 2. Perfil de Usuario
- Avatar personalizado (1:1)
- Información profesional (nombre, empresa, cargo)
- Biografía y ubicación
- Enlaces a redes sociales (LinkedIn, Twitter, GitHub, Website)
- Perfil público accesible vía URL única

### 3. Código QR
- Generación automática de QR personal
- Enlace directo al perfil público
- Exportable para lock-screen
- Escaneo rápido en el evento

### 4. Directorio
- Búsqueda de asistentes por nombre, empresa o cargo
- Filtros avanzados
- Vista de tarjetas con información resumida
- Integración con Algolia para búsqueda rápida

### 5. Conexiones
- Solicitud de conexión desde perfil o QR
- Sistema de aprobación (configurable)
- Lista de "Mis Conexiones"
- Visibilidad de información de contacto solo entre conexiones

### 6. Panel de Administración
- Métricas del evento (total de usuarios, conexiones)
- Porcentaje de perfiles completos
- Moderación básica
- Acceso restringido por whitelist de emails

---

## 💻 Desarrollo

### Convenciones de Código

- **Componentes:** PascalCase (`UserProfile.tsx`)
- **Utilidades:** camelCase (`formatDate.ts`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Tipos:** PascalCase con prefijo `T` o sufijo `Type` (`TUser`, `ProfileType`)

### Estructura de Componentes

```tsx
// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. Types/Interfaces
interface ComponentProps {
  title: string
}

// 3. Component
export function Component({ title }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState()

  // 5. Handlers
  const handleClick = () => {}

  // 6. Render
  return <div>{title}</div>
}
```

### Mejores Prácticas

1. **Server Components por defecto:** Usa `"use client"` solo cuando sea necesario
2. **Validación con Zod:** Siempre valida inputs de usuario
3. **Tipos estrictos:** Evita `any`, usa tipos específicos
4. **Componentes pequeños:** Divide componentes grandes en más pequeños
5. **Accesibilidad:** Usa etiquetas semánticas y ARIA cuando sea necesario

---

## 🚢 Despliegue

### Vercel (Recomendado)

1. **Conectar repositorio:**
   - Importa el proyecto en Vercel
   - Conecta con GitHub

2. **Configurar variables de entorno:**
   - Agrega todas las variables de `.env.example`
   - Usa valores de producción

3. **Configurar Supabase:**
   - Crea un proyecto en Supabase
   - Ejecuta migraciones en producción
   - Configura políticas RLS

4. **Deploy:**
   ```bash
   git push origin main
   ```
   Vercel desplegará automáticamente

### Variables de Entorno en Vercel

Asegúrate de configurar todas las variables en:
**Project Settings → Environment Variables**

---

## 📚 Recursos Adicionales

### Documentación
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Archivos del Proyecto
- `PRD.md` - Product Requirements Document completo
- `CONTRIBUTING.md` - Guía de contribución
- `docs/implementation-plan.md` - Plan de implementación

---

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Notas Importantes

- ⚠️ **Aplicación de evento único:** La base de datos será eliminada después del evento
- 🔒 **Datos sensibles:** Nunca commitees `.env.local` o archivos con credenciales
- 🎨 **Diseño:** Usa los componentes de shadcn/ui para mantener consistencia
- 📱 **Responsive:** Asegúrate de que todo funcione en móvil
- ♿ **Accesibilidad:** Mantén la aplicación accesible para todos

---

## 📧 Contacto

**Rodolfo Andino**  
Email: aandino186@gmail.com  
GitHub: [@Raandino](https://github.com/Raandino)

---

## 📄 Licencia

Este proyecto está bajo la licencia especificada en el archivo `LICENSE`.

---

**¡Feliz Coding! 🚀**
