<div align="center">

# 🦷 Dentix

### Sistema de Gestión Dental Profesional

*Solución completa para la administración de clínicas odontológicas*

[![Tauri](https://img.shields.io/badge/Tauri-2.8.0-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Características](#-características-principales) • [Instalación](#-instalación) • [Uso](#-uso) • [Documentación](#-documentación)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características Principales](#-características-principales)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Base de Datos](#-base-de-datos)
- [Temas Personalizados](#-temas-personalizados)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

---

## 🎯 Descripción

**Dentix** es una aplicación de escritorio multiplataforma diseñada específicamente para la gestión integral de clínicas dentales. Desarrollada con tecnologías modernas como React, TypeScript y Tauri, ofrece una experiencia de usuario fluida y profesional.

### ¿Por qué Dentix?

- **🚀 Rendimiento Nativo**: Construido con Tauri, más ligero y rápido que Electron
- **🔒 Seguridad**: Datos almacenados localmente en SQLite con WAL mode
- **💾 Sin Dependencia de Internet**: Funciona 100% offline
- **🎨 Interfaz Moderna**: UI/UX profesional con Tailwind CSS y Radix UI
- **📊 Base de Datos Robusta**: Sistema de migraciones y relaciones bien definidas
- **🌈 Personalizable**: Múltiples temas y opciones de fuentes

---

## ✨ Características Principales

### 👥 Gestión de Pacientes
- ✅ Registro completo de datos demográficos
- ✅ Sistema de búsqueda rápida (Ctrl+K)
- ✅ Historial médico y alergias con alertas visuales
- ✅ Gestión de adjuntos (radiografías, fotos, documentos)

### 🦷 Odontograma Interactivo
- ✅ Soporte para dentición permanente (11-48) y decidua (51-85)
- ✅ Selección visual de dientes
- ✅ Diagnósticos personalizables por diente
- ✅ Generación automática de texto de diagnóstico

### 📅 Control de Visitas
- ✅ Registro de consultas con motivo categorizado
- ✅ Diagnóstico manual y automatizado combinado
- ✅ Historial completo de visitas por paciente
- ✅ Navegación temporal intuitiva

### 💰 Gestión Financiera
- ✅ Sesiones de tratamiento con presupuestos
- ✅ Cálculo automático de totales y saldos
- ✅ Sistema de descuentos
- ✅ Control de pagos pendientes
- ✅ Paginación para grandes volúmenes de datos

### 📎 Archivos Adjuntos
- ✅ Almacenamiento organizado por paciente/año/mes
- ✅ Soporte para múltiples formatos
- ✅ Apertura nativa de archivos desde la app
- ✅ Metadata en base de datos para búsquedas rápidas

### 👨‍⚕️ Múltiples Doctores
- ✅ Sistema de firmantes configurables
- ✅ Asignación de doctor por sesión
- ✅ Plantillas de procedimientos reutilizables

### 🎨 Personalización
- ✅ **3 Temas**: Light, Dark, Green Apple
- ✅ **4 Fuentes**: Inter, Poppins, Roboto, System
- ✅ **Tamaño de Fuente**: Ajustable (14-24px)
- ✅ Configuración persistente en localStorage

---

## 📸 Capturas de Pantalla

> **Nota**: Agrega capturas de pantalla de tu aplicación en la carpeta `docs/screenshots/` y actualiza los enlaces a continuación.

<details>
<summary>Ver capturas de pantalla</summary>

### Dashboard Principal
![Dashboard](docs/screenshots/dashboard.png)

### Odontograma
![Odontograma](docs/screenshots/odontogram.png)

### Gestión de Pacientes
![Pacientes](docs/screenshots/patients.png)

### Temas Disponibles
![Temas](docs/screenshots/themes.png)

</details>

---

## 🛠️ Tecnologías

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 19.1.1 | Framework UI |
| **TypeScript** | 5.9.3 | Type safety |
| **Vite** | 7.1.7 | Build tool |
| **Tailwind CSS** | 4.1.14 | Styling |
| **Radix UI** | Latest | Componentes accesibles |
| **Lucide React** | 0.545.0 | Iconos |
| **TanStack Virtual** | 3.13.12 | Virtual scrolling |

### Backend/Desktop
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Tauri** | 2.8.0 | Framework de escritorio |
| **Rust** | 1.77.2+ | Backend nativo |
| **SQLite** | Latest | Base de datos |
| **tauri-plugin-sql** | 2.3.0 | Integración SQLite |
| **tauri-plugin-fs** | 2.4.2 | Sistema de archivos |

### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **pnpm** - Gestor de paquetes rápido
- **TypeScript ESLint** - Reglas de linting para TS

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.0.0 ([Descargar](https://nodejs.org/))
- **pnpm** >= 8.0.0 (o npm/yarn)
- **Rust** >= 1.77.2 ([Instalar rustup](https://rustup.rs/))
- **Dependencias de Tauri** según tu sistema operativo:

### Linux
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### macOS
```bash
xcode-select --install
```

### Windows
- Instalar [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Instalar [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) (generalmente ya está instalado)

---

## 🚀 Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/dentix.git
cd dentix
```

### 2. Instalar Dependencias de Node
```bash
pnpm install
# o con npm
npm install
# o con yarn
yarn install
```

### 3. Instalar Dependencias de Rust
```bash
cd src-tauri
cargo build
cd ..
```

### 4. Configurar Base de Datos
La base de datos SQLite se crea automáticamente al ejecutar la aplicación por primera vez. Las migraciones se ejecutan automáticamente.

---

## 💻 Uso

### Modo Desarrollo

**Opción 1: Frontend + Backend**
```bash
pnpm tauri:dev
```

**Opción 2: Solo Frontend (para desarrollo de UI)**
```bash
pnpm dev
```

La aplicación se abrirá automáticamente en modo desarrollo con hot-reload habilitado.

### Compilar para Producción

```bash
pnpm tauri:build
```

Los ejecutables se generarán en:
- **Windows**: `src-tauri/target/release/bundle/msi/`
- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Linux**: `src-tauri/target/release/bundle/deb/` o `appimage/`

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia servidor de desarrollo Vite |
| `pnpm build` | Compila el frontend para producción |
| `pnpm lint` | Ejecuta ESLint en el código |
| `pnpm preview` | Previsualiza el build de producción |
| `pnpm tauri:dev` | Inicia la app Tauri en modo desarrollo |
| `pnpm tauri:build` | Compila la aplicación completa |

---

## 📁 Estructura del Proyecto

```
dentix/
├── src/                          # Código fuente del frontend
│   ├── components/               # Componentes React
│   │   ├── ui/                  # Componentes UI reutilizables (Radix)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── App.tsx              # Componente principal
│   │   ├── PatientForm.tsx      # Formulario de pacientes
│   │   ├── Odontogram.tsx       # Odontograma interactivo
│   │   ├── SessionsTable.tsx    # Tabla de sesiones
│   │   └── ...
│   ├── lib/                     # Lógica de negocio
│   │   ├── storage/             # Capa de persistencia
│   │   │   └── TauriSqliteRepository.ts
│   │   ├── files/               # Manejo de archivos
│   │   ├── os/                  # Operaciones del SO
│   │   └── types.ts             # Definiciones TypeScript
│   ├── theme/                   # Sistema de temas
│   │   └── theme.ts
│   ├── assets/                  # Recursos estáticos
│   └── main.tsx                 # Punto de entrada
├── src-tauri/                   # Backend Rust
│   ├── src/
│   │   ├── lib.rs              # Código Rust
│   │   └── main.rs
│   ├── migrations/              # Migraciones SQL
│   │   ├── 001_initial.sql
│   │   ├── 002_add_fields.sql
│   │   └── ...
│   ├── Cargo.toml              # Dependencias Rust
│   └── tauri.conf.json         # Configuración Tauri
├── public/                      # Archivos públicos
├── docs/                        # Documentación
├── package.json                 # Dependencias Node
├── tsconfig.json               # Configuración TypeScript
├── tailwind.config.ts          # Configuración Tailwind
├── vite.config.ts              # Configuración Vite
└── README.md
```

---

## 🗄️ Base de Datos

Dentix utiliza **SQLite** con modo **WAL (Write-Ahead Logging)** para mejor concurrencia.

### Esquema Principal

```
patients (pacientes)
  ├── visits (visitas)
  │     ├── sessions (sesiones de tratamiento)
  │     │     └── session_items (items de sesión)
  │     └── tooth_dx (diagnósticos dentales)
  └── attachments (archivos adjuntos)

procedure_templates (plantillas de procedimientos)
signers (doctores/firmantes)
diagnosis_options (opciones de diagnóstico)
```

### Migraciones

Las migraciones se encuentran en `src-tauri/migrations/` y se ejecutan automáticamente al iniciar la aplicación:

1. `001_initial.sql` - Schema inicial
2. `002_add_fields.sql` - Campos adicionales
3. `003_attachments.sql` - Sistema de adjuntos
4. `004_indexes.sql` - Optimización de índices

---

## 🎨 Temas Personalizados

Dentix incluye un sistema de temas CSS variables que permite personalización completa:

### Temas Incluidos

1. **Light** - Tema claro profesional
2. **Dark** - Tema oscuro para reducir fatiga visual
3. **Green Apple** - Tema personalizado con verde menta

### Personalizar Temas

Edita `src/theme/theme.ts` para agregar nuevos temas:

```typescript
export const themes = {
  myTheme: {
    light: {
      '--background': '0 0% 100%',
      '--foreground': '222.2 84% 4.9%',
      // ... más variables
    }
  }
}
```

### Variables CSS Disponibles

```css
--background
--foreground
--primary
--secondary
--accent
--destructive
--muted
--border
--input
--ring
```

---

## 🗺️ Roadmap

### ✅ Completado (v0.1.0)
- [x] Gestión básica de pacientes
- [x] Odontograma interactivo
- [x] Sistema de visitas y sesiones
- [x] Adjuntos de archivos
- [x] Temas personalizables
- [x] Base de datos con migraciones

### 🚧 En Desarrollo (v0.2.0)
- [ ] **Sistema de Tests** (Vitest + React Testing Library)
- [ ] **Refactorización de componentes grandes**
- [ ] **Error Boundaries**
- [ ] **Validación de formularios** (Zod)
- [ ] **Estados de carga** consistentes
- [ ] **Documentación JSDoc**

### 📋 Planificado (v0.3.0)
- [ ] Reportes y estadísticas
- [ ] Exportación a PDF
- [ ] Recordatorios de citas
- [ ] Backup automático de base de datos
- [ ] Multi-idioma (i18n)
- [ ] Calendario de citas
- [ ] Gráficos de ingresos

### 🔮 Futuro (v1.0.0)
- [ ] Integración con equipos de diagnóstico
- [ ] API REST para integración externa
- [ ] Sincronización en la nube (opcional)
- [ ] App móvil complementaria
- [ ] Sistema de permisos/roles
- [ ] Firma digital de documentos

---

## 🤝 Contribuir

Las contribuciones son bienvenidas y apreciadas. Para contribuir:

### 1. Fork el Proyecto
```bash
git clone https://github.com/tu-usuario/dentix.git
cd dentix
```

### 2. Crea una Rama de Feature
```bash
git checkout -b feature/nueva-funcionalidad
```

### 3. Realiza tus Cambios
```bash
git add .
git commit -m "feat: agregar nueva funcionalidad"
```

### 4. Push a tu Fork
```bash
git push origin feature/nueva-funcionalidad
```

### 5. Abre un Pull Request

### Guías de Contribución

- Sigue las convenciones de código existentes
- Escribe mensajes de commit descriptivos ([Conventional Commits](https://www.conventionalcommits.org/))
- Agrega tests para nuevas funcionalidades
- Actualiza la documentación si es necesario
- Asegúrate de que `pnpm lint` pase sin errores

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2025 [Tu Nombre/Empresa]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 📞 Contacto

**Desarrollador Principal**: [Tu Nombre]

- 🌐 Website: [tu-sitio.com](https://tu-sitio.com)
- 📧 Email: [tu-email@ejemplo.com](mailto:tu-email@ejemplo.com)
- 💼 LinkedIn: [tu-perfil](https://linkedin.com/in/tu-perfil)
- 🐙 GitHub: [@tu-usuario](https://github.com/tu-usuario)

**Repositorio del Proyecto**: [https://github.com/tu-usuario/dentix](https://github.com/tu-usuario/dentix)

---

## 🙏 Agradecimientos

- [Tauri](https://tauri.app/) - Framework de aplicaciones de escritorio
- [React](https://react.dev/) - Biblioteca UI
- [Radix UI](https://www.radix-ui.com/) - Componentes accesibles
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Lucide](https://lucide.dev/) - Iconos hermosos
- [shadcn/ui](https://ui.shadcn.com/) - Inspiración para componentes

---

<div align="center">

**⭐ Si este proyecto te resulta útil, considera darle una estrella en GitHub ⭐**

Hecho con ❤️ para la comunidad odontológica

</div>
