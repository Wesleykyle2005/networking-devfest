# Guía de Contribución

¡Gracias por considerar contribuir a la app de networking de DevFest Managua! Este documento proporciona las pautas para contribuir al proyecto.

## 📜 Código de Conducta

- Sé respetuoso e inclusivo
- Proporciona retroalimentación constructiva
- Enfócate en lo que es mejor para la comunidad
- Muestra empatía hacia otros miembros de la comunidad

## 🤝 Cómo Contribuir

### 🐛 Reportar Bugs

Antes de crear un reporte de bug, por favor revisa los issues existentes. Al crear un reporte de bug, incluye:

- **Título y descripción clara**
- **Pasos para reproducir**
- **Comportamiento esperado**
- **Comportamiento actual**
- **Capturas de pantalla** (si aplica)
- **Detalles del entorno** (SO, versión de Node, etc.)

### ✨ Sugerir Mejoras

Las sugerencias de mejoras se rastrean como issues de GitHub. Al crear una sugerencia de mejora, incluye:

- **Título y descripción clara**
- **Caso de uso** - ¿por qué es útil esta mejora?
- **Posible implementación** (opcional)
- **Ejemplos** de otros proyectos (opcional)

### 🔀 Pull Requests

**Todos los PRs deben ir hacia la rama `main`** y seguir el flujo de trabajo de ramas por característica.

#### Flujo de Trabajo

1. **Haz fork del repositorio**
2. **Crea una rama desde `main`** siguiendo la convención de nombres
3. **Realiza tus cambios** con commits convencionales
4. **Prueba tus cambios** exhaustivamente
5. **Actualiza la documentación** si es necesario
6. **Push a tu fork**
7. **Abre un Pull Request** hacia `main`
8. **Espera la revisión** y atiende el feedback

#### Convención de Nombres de Ramas

Usa el formato: `<tipo>/<descripción-corta>`

```bash
# Ejemplos de nombres de ramas
feat/user-profile-page
fix/auth-redirect-loop
docs/update-readme
refactor/connection-logic
chore/update-dependencies

# Crear una rama
git checkout -b feat/qr-export-png

# ❌ Evitar
git checkout -b mi-rama
git checkout -b fix
git checkout -b branch-1
```

#### Tipos de Ramas

- `feat/` - Nueva característica
- `fix/` - Corrección de bug
- `docs/` - Documentación
- `refactor/` - Refactorización
- `test/` - Tests
- `chore/` - Mantenimiento
- `hotfix/` - Corrección urgente

## ⚙️ Configuración de Desarrollo

```bash
# Clona tu fork
git clone https://github.com/tu-usuario/networking-devfest.git
cd networking-devfest

# Instala las dependencias
npm install

# Inicia Supabase localmente (opcional)
npx supabase start

# Copia las variables de entorno
cp .env.example .env.local

# Inicia el servidor de desarrollo
npm run dev
```

## 🎨 Estilo de Código

### TypeScript

- Usa TypeScript para todos los archivos nuevos
- Evita tipos `any` cuando sea posible
- Define interfaces y tipos apropiados
- Usa nombres de variables significativos

### Componentes React

```tsx
// ✅ Bueno
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={cn('btn', `btn-${variant}`)}>
      {children}
    </button>
  );
}

// ❌ Evitar
export function Button(props: any) {
  return <button {...props} />;
}
```

### Nomenclatura de Archivos

- Componentes: `PascalCase.tsx` (ej., `Button.tsx`)
- Utilidades: `kebab-case.ts` (ej., `api-client.ts`)
- Hooks: `use-kebab-case.ts` (ej., `use-auth.ts`)

### Importaciones

```tsx
// ✅ Bueno - importaciones organizadas
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// ❌ Evitar - importaciones desordenadas
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
```

## 🧪 Pruebas

Antes de enviar un PR, asegúrate de que:

- [ ] El código compila sin errores (`npm run build`)
- [ ] El linting pasa (`npm run lint`)
- [ ] El flujo de autenticación funciona
- [ ] Las rutas protegidas están correctamente aseguradas
- [ ] No hay errores en la consola del navegador

## 💬 Conventional Commits

**Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/es/)** para mantener un historial de cambios claro y consistente.

### Formato

```
<tipo>[alcance opcional]: <descripción>

[cuerpo opcional]

[nota de pie opcional]
```

### Tipos de Commit

- **feat**: Nueva característica para el usuario
- **fix**: Corrección de un bug
- **docs**: Cambios en documentación
- **style**: Cambios de formato (espacios, comas, etc.)
- **refactor**: Refactorización de código (sin cambiar funcionalidad)
- **perf**: Mejoras de rendimiento
- **test**: Agregar o corregir tests
- **build**: Cambios en el sistema de build o dependencias
- **ci**: Cambios en configuración de CI
- **chore**: Otras tareas de mantenimiento
- **revert**: Revertir un commit anterior

### Ejemplos

```bash
# ✅ Bueno - Commits convencionales
git commit -m "feat: agregar página de perfil de usuario"
git commit -m "fix: resolver bucle de redirección en autenticación"
git commit -m "docs: actualizar instrucciones de configuración"
git commit -m "feat(qr): implementar exportación de QR a PNG"
git commit -m "fix(auth): corregir validación de código de evento"

# Con cuerpo y breaking change
git commit -m "feat(api): cambiar estructura de respuesta de conexiones

La API ahora retorna un objeto con metadata adicional
incluyendo paginación y conteo total.

BREAKING CHANGE: El formato de respuesta ha cambiado de array
a objeto con propiedad 'data'."

# ❌ Evitar - No convencionales
git commit -m "actualización"
git commit -m "arreglar bug"
git commit -m "cambios"
git commit -m "wip"
```

### Alcances Comunes

- `auth` - Autenticación
- `profile` - Perfiles de usuario
- `qr` - Códigos QR
- `directory` - Directorio de asistentes
- `connections` - Sistema de conexiones
- `admin` - Panel de administración
- `ui` - Componentes de interfaz
- `db` - Base de datos

## 📚 Documentación

Al agregar nuevas características:

1. Actualiza `README.md` si afecta la configuración o uso
2. Documenta cambios de configuración en las notas del PR
3. Agrega comentarios JSDoc para funciones complejas
4. Incluye ejemplos de código cuando sea útil

## 🔄 Proceso de Pull Request

### Antes de Abrir el PR

1. **Asegúrate de que tu rama esté actualizada con `main`**
   ```bash
   git checkout main
   git pull upstream main
   git checkout tu-rama
   git rebase main
   ```

2. **Verifica que todo funcione**
   ```bash
   npm run build    # Debe compilar sin errores
   npm run lint     # Debe pasar sin errores
   ```

3. **Revisa tus commits**
   - Todos deben seguir Conventional Commits
   - Considera hacer squash de commits WIP

### Al Abrir el PR

1. **Título del PR**: Usa formato de Conventional Commit
   ```
   feat: agregar exportación de QR a PNG
   fix: resolver error en validación de perfil
   docs: actualizar guía de contribución
   ```

2. **Descripción**: Usa la plantilla proporcionada
   - Describe qué cambios hiciste
   - Explica por qué son necesarios
   - Menciona el issue relacionado
   - Agrega capturas de pantalla si aplica

3. **Target**: Siempre hacia `main`

4. **Labels**: Agrega labels apropiados

### Durante la Revisión

1. **Responde al feedback** de manera constructiva
2. **Haz los cambios solicitados** en nuevos commits
3. **No hagas force push** después de la primera revisión
4. **Mantén la conversación profesional** y respetuosa

### Después de la Aprobación

- Los mantenedores harán merge de tu PR
- Tu rama será eliminada automáticamente
- ¡Celebra tu contribución! 🎉

### ✅ Checklist de PR

**Antes de enviar:**
- [ ] La rama sigue la convención de nombres (`tipo/descripcion`)
- [ ] Todos los commits siguen Conventional Commits
- [ ] La rama está actualizada con `main`
- [ ] El código compila sin errores (`npm run build`)
- [ ] El linting pasa (`npm run lint`)
- [ ] El código sigue las guías de estilo del proyecto
- [ ] Auto-revisión del código completada
- [ ] Comentarios agregados para lógica compleja
- [ ] Documentación actualizada si es necesario
- [ ] Sin nuevas advertencias o errores en consola
- [ ] Probado localmente
- [ ] El título del PR usa formato de Conventional Commit
- [ ] La descripción del PR está completa

## 📁 Guías de Estructura del Proyecto

### Agregar Nuevos Componentes

```
components/
├── ui/              # Solo componentes de shadcn/ui
├── layout/          # Componentes de layout (header, footer, etc.)
└── [feature]/       # Componentes específicos de características
```

### Agregar Nuevas Páginas

```
app/
├── (protected)/     # Rutas protegidas (requieren autenticación)
│   └── [feature]/   # Páginas de características
└── [public]/        # Rutas públicas
```

### Agregar Nuevas Utilidades

```
lib/
├── supabase/        # Utilidades relacionadas con Supabase
├── [feature].ts     # Utilidades específicas de características
└── utils.ts         # Utilidades generales
```

## ❓ ¿Preguntas?

Siéntete libre de abrir un issue con la etiqueta `question` si necesitas ayuda o aclaraciones.

## 💡 Consejos para Contribuidores

- **Empieza pequeño:** Si es tu primera contribución, busca issues etiquetados como `good first issue`
- **Pregunta antes de trabajar:** Si planeas trabajar en algo grande, abre un issue primero para discutirlo
- **Mantén los PRs enfocados:** Un PR por característica o corrección
- **Escribe en español:** Todos los comentarios, documentación y mensajes de la UI deben estar en español
- **Prueba localmente:** Asegúrate de que todo funcione antes de enviar el PR

## 📞 Comunicación

- **Issues:** Para reportar bugs o sugerir características
- **Pull Requests:** Para contribuir código
- **Discussions:** Para preguntas generales o ideas

## 📄 Licencia

Al contribuir, aceptas que tus contribuciones serán licenciadas bajo la misma licencia del proyecto (Licencia MIT).

---

¡Gracias por contribuir! 🎉

**Hecho con ❤️ para la comunidad de DevFest Managua**
