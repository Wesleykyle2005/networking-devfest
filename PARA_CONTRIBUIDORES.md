# 🎯 Guía Rápida para Contribuidores

¡Bienvenido al proyecto de Networking de DevFest Managua 2025! Esta guía te ayudará a empezar rápidamente.

## 📚 Documentación Disponible

### Para Empezar
- **[README.md](./README.md)** - Información general del proyecto y configuración inicial
- **[GUIA.md](./GUIA.md)** - Documentación técnica completa en español
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guía detallada de contribución

### Documentación Técnica
- **[PRD.md](./PRD.md)** - Product Requirements Document (en inglés) - Define qué construir
- **[docs/implementation-plan.md](./docs/implementation-plan.md)** - Plan de implementación detallado

### Políticas
- **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)** - Código de conducta de la comunidad

## 🚀 Inicio Rápido (5 minutos)

```bash
# 1. Clona el repositorio
git clone https://github.com/tu-usuario/networking-devfest.git
cd networking-devfest

# 2. Instala dependencias
npm install

# 3. Configura variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales

# 4. Inicia el servidor
npm run dev

# 5. Abre http://localhost:3000
```

## 🎨 Áreas Donde Puedes Contribuir

### 🟢 Fácil (Good First Issues)
- Mejorar mensajes de error
- Agregar validaciones de formularios
- Mejorar estilos y UI
- Corregir typos en documentación
- Agregar traducciones faltantes

### 🟡 Intermedio
- Implementar nuevos componentes
- Mejorar performance
- Agregar tests
- Optimizar queries de base de datos

### 🔴 Avanzado
- Implementar nuevas features del PRD
- Refactorizar arquitectura
- Configurar CI/CD
- Implementar analytics

## 📋 Flujo de Trabajo

### 🎯 Proceso Completo

1. **Encuentra un issue** o crea uno nuevo
2. **Comenta en el issue** que vas a trabajar en él
3. **Haz fork** del repositorio
4. **Clona tu fork**:
   ```bash
   git clone https://github.com/tu-usuario/networking-devfest.git
   cd networking-devfest
   ```
5. **Agrega el repositorio original como upstream**:
   ```bash
   git remote add upstream https://github.com/Raandino/networking-devfest.git
   ```
6. **Crea una rama** desde `main` siguiendo la convención:
   ```bash
   git checkout -b feat/nombre-descriptivo
   ```
7. **Haz tus cambios** siguiendo las guías de estilo
8. **Haz commits** usando Conventional Commits:
   ```bash
   git commit -m "feat: agregar validación de email"
   git commit -m "fix(auth): corregir redirección después de login"
   ```
9. **Mantén tu rama actualizada** con main:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
10. **Push a tu fork**:
    ```bash
    git push origin feat/nombre-descriptivo
    ```
11. **Abre un Pull Request** hacia `main` del repositorio original
12. **Espera la revisión** y atiende el feedback

## ✅ Checklist Antes de Enviar PR

### Rama y Commits
- [ ] La rama sigue la convención `tipo/descripcion`
- [ ] Todos los commits usan Conventional Commits
- [ ] La rama está actualizada con `main`
- [ ] Los commits tienen mensajes descriptivos

### Código
- [ ] El código compila sin errores (`npm run build`)
- [ ] El linting pasa (`npm run lint`)
- [ ] No hay errores en la consola del navegador
- [ ] Probaste los cambios localmente
- [ ] El código sigue las guías de estilo

### Documentación
- [ ] Actualizaste la documentación si es necesario
- [ ] Agregaste comentarios para lógica compleja
- [ ] El PR tiene una descripción clara

### Pull Request
- [ ] El título del PR usa formato de Conventional Commit
- [ ] El PR apunta a la rama `main`
- [ ] Completaste la plantilla de PR
- [ ] Agregaste capturas de pantalla si aplica

## 🎯 Convenciones del Proyecto

### 📦 Conventional Commits (OBLIGATORIO)

Este proyecto usa **[Conventional Commits](https://www.conventionalcommits.org/es/)**. Todos los commits DEBEN seguir este formato:

```
<tipo>[alcance opcional]: <descripción>

[cuerpo opcional]

[nota de pie opcional]
```

#### Tipos de Commit

```bash
feat: agregar nueva característica
fix: corregir bug
docs: cambios en documentación
style: formato de código (sin cambios funcionales)
refactor: refactorizar código
perf: mejoras de rendimiento
test: agregar o actualizar tests
build: cambios en build o dependencias
ci: cambios en CI/CD
chore: otras tareas de mantenimiento
revert: revertir un commit
```

#### Ejemplos con Alcance

```bash
feat(qr): agregar exportación a PNG
fix(auth): resolver error de validación
docs(readme): actualizar instrucciones de instalación
refactor(connections): simplificar lógica de aprobación
```

#### Breaking Changes

```bash
feat(api)!: cambiar estructura de respuesta

BREAKING CHANGE: La API ahora retorna un objeto
en lugar de un array.
```

### 🌱 Nombres de Ramas (OBLIGATORIO)

**Formato:** `<tipo>/<descripción-con-guiones>`

```bash
# ✅ Correcto
feat/user-profile-page
fix/auth-redirect-loop
docs/update-contributing-guide
refactor/connection-logic
chore/update-dependencies
hotfix/critical-security-fix

# ❌ Incorrecto
mi-rama
fix
branch-1
feature
```

#### Tipos de Ramas

- `feat/` - Nueva característica
- `fix/` - Corrección de bug
- `docs/` - Documentación
- `refactor/` - Refactorización
- `test/` - Tests
- `chore/` - Mantenimiento
- `hotfix/` - Corrección urgente

### 📝 Nomenclatura de Archivos

- **Componentes:** `PascalCase.tsx` → `UserProfile.tsx`
- **Utilidades:** `kebab-case.ts` → `format-date.ts`
- **Hooks:** `use-kebab-case.ts` → `use-auth.ts`
- **Constantes:** `UPPER_SNAKE_CASE` → `MAX_FILE_SIZE`

### Estructura de Carpetas
```
app/
├── (protected)/     # Rutas que requieren autenticación
├── api/            # API routes
└── auth/           # Rutas de autenticación

components/
├── ui/             # Componentes de shadcn/ui
├── layout/         # Header, footer, etc.
└── [feature]/      # Componentes por característica

lib/
├── supabase/       # Cliente de Supabase
└── utils.ts        # Utilidades generales
```

## 🛠 Stack Tecnológico

- **Frontend:** Next.js 15 + TypeScript + React 19
- **Estilos:** Tailwind CSS + shadcn/ui
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Despliegue:** Vercel

## 💡 Consejos Útiles

### Para Principiantes
- Empieza con issues etiquetados como `good first issue`
- Lee el código existente para entender el estilo
- No tengas miedo de hacer preguntas
- Los PRs pequeños son más fáciles de revisar
- Practica Conventional Commits en tus proyectos personales

### Para Todos
- **Escribe código en inglés, comentarios y UI en español**
- **Usa TypeScript, evita `any`**
- **Sigue Conventional Commits SIEMPRE**
- **Nombra las ramas correctamente**
- Sigue el estilo del proyecto
- Prueba tus cambios antes de enviar PR
- Mantén tu rama actualizada con `main`
- Haz commits atómicos (un cambio lógico por commit)

### Comandos Útiles

```bash
# Ver el estado de tu rama
git status

# Ver diferencias antes de commit
git diff

# Actualizar tu rama con main
git fetch upstream
git rebase upstream/main

# Ver historial de commits
git log --oneline

# Corregir el último commit (antes de push)
git commit --amend

# Ver ramas
git branch -a
```

## 🐛 Reportar Bugs

Usa la plantilla de issue de bug e incluye:
- Descripción clara del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Capturas de pantalla si aplica
- Información del entorno

## 💬 ¿Necesitas Ayuda?

- 🐛 **Bug o Feature:** Abre un issue
- 💬 **Pregunta General:** Usa GitHub Discussions
- 📧 **Contacto Directo:** aandino186@gmail.com

## 🎓 Recursos de Aprendizaje

### Next.js
- [Documentación oficial](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### Supabase
- [Documentación oficial](https://supabase.com/docs)
- [Guías de inicio](https://supabase.com/docs/guides)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Tailwind CSS
- [Documentación oficial](https://tailwindcss.com/docs)

## 🏆 Reconocimientos

Todos los contribuidores serán reconocidos en el README del proyecto. ¡Tu contribución importa!

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Al contribuir, aceptas que tus contribuciones sean licenciadas bajo la misma licencia.

---

## 🎉 ¡Gracias por Contribuir!

Tu ayuda hace posible que DevFest Managua 2025 tenga una increíble experiencia de networking.

**¿Listo para empezar?** Revisa los [issues abiertos](../../issues) y encuentra uno que te interese.

---

**Hecho con ❤️ para la comunidad de DevFest Managua**
