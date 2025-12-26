<div align="center">

# Oklus

Sistema de gestion dental profesional

Solucion de escritorio para la administracion de clinicas odontologicas.

[![Tauri](https://img.shields.io/badge/Tauri-2.8.0-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Descripcion](#descripcion) | [Caracteristicas](#caracteristicas) | [Instalacion](#instalacion) | [Uso](#uso) | [Documentacion](#documentacion)

</div>

---

## Descripcion

**Oklus** es una aplicacion de escritorio multiplataforma para la gestion integral de clinicas dentales. Construida con React, TypeScript y Tauri, ofrece una experiencia rapida y estable, pensada para operar sin conexion.

**Por que Oklus?**
- Rendimiento nativo con Tauri.
- Datos locales en SQLite con migraciones y WAL.
- Funcionamiento 100% offline.
- UI moderna con Tailwind CSS y Radix UI.
- Configuracion y temas personalizables.

---

## Caracteristicas

### Gestion de pacientes
- Registro de datos demograficos y contacto.
- Busqueda rapida y filtros.
- Historial medico, alergias y alertas.
- Adjuntos (radiografias, fotos, documentos).

### Odontograma interactivo
- Denticion permanente (11-48) y decidua (51-85).
- Seleccion visual de dientes.
- Diagnosticos por diente con texto automatico.

### Visitas y sesiones
- Registro de consultas con motivo y diagnostico.
- Historial completo por paciente.
- Plantillas de procedimientos reutilizables.

### Finanzas
- Presupuestos, descuentos y saldos.
- Control de pagos pendientes.
- Paginacion para grandes volumenes.

### Configuracion y personalizacion
- Temas y tipografias configurables.
- Tamano de fuente ajustable.
- Preferencias persistentes.

---

## Capturas de pantalla

Agrega capturas en `docs/screenshots/` y actualiza los enlaces.

<details>
<summary>Ver capturas</summary>

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Odontograma
![Odontograma](docs/screenshots/odontogram.png)

### Pacientes
![Pacientes](docs/screenshots/patients.png)

### Temas
![Temas](docs/screenshots/themes.png)

</details>

---

## Tecnologias

### Frontend
| Tecnologia | Version | Uso |
|------------|---------|-----|
| React | 19.1.1 | UI |
| TypeScript | 5.9 | Tipado |
| Vite | 7.1 | Build |
| Tailwind CSS | 4.1 | Estilos |
| Radix UI | Latest | Componentes accesibles |
| Zustand | 5.0 | Estado global |
| TanStack Virtual | 3.13 | Virtualizacion |
| Lucide React | 0.545 | Iconos |

### Desktop/Backend
| Tecnologia | Version | Uso |
|------------|---------|-----|
| Tauri | 2.8 | Desktop shell |
| Rust | 1.77+ | Backend nativo |
| SQLite | Latest | Base de datos |
| tauri-plugin-sql | 2.3 | Acceso a SQLite |
| tauri-plugin-fs | 2.4 | Sistema de archivos |
| tauri-plugin-opener | 2.5 | Apertura de archivos |

---

## Requisitos previos

- Node.js >= 18
- pnpm >= 8
- Rust >= 1.77 (via rustup)
- Dependencias de Tauri segun tu sistema operativo:

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
- Instala Microsoft Visual Studio C++ Build Tools.
- Instala WebView2 si no esta presente.

---

## Instalacion

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/oklus.git
cd oklus
```

### 2. Instalar dependencias
```bash
pnpm install
```

### 3. Compilar dependencias de Rust (opcional la primera vez)
```bash
cd src-tauri
cargo build
cd ..
```

La base de datos SQLite se crea automaticamente al ejecutar la app por primera vez.

---

## Uso

### Desarrollo
```bash
pnpm tauri:dev
```

### Solo frontend (UI)
```bash
pnpm dev
```

### Build de produccion
```bash
pnpm tauri:build
```

Los ejecutables se generan en `src-tauri/target/release/bundle/`.

---

## Scripts disponibles

| Comando | Descripcion |
|---------|-------------|
| `pnpm dev` | Inicia Vite en modo desarrollo |
| `pnpm build` | Compila el frontend |
| `pnpm lint` | Ejecuta ESLint |
| `pnpm preview` | Previsualiza el build |
| `pnpm tauri:dev` | Ejecuta la app Tauri en desarrollo |
| `pnpm tauri:build` | Compila la app completa |

---

## Estructura del proyecto

```
oklus/
  src/
    components/         # UI (Radix/Tailwind)
    pages/              # Rutas
    hooks/
    stores/             # Zustand
    theme/              # Tokens y temas
    assets/
    main.tsx
  src-tauri/
    migrations/
    src/
    tauri.conf.json
  public/
  docs/
  package.json
```

---

## Base de datos

Oklus usa SQLite en modo WAL con migraciones en `src-tauri/migrations/`.

Esquema principal:
```
patients
  visits
    sessions
      session_items
    tooth_dx
  attachments

procedure_templates
signers
diagnosis_options
```

---

## Temas personalizados

Edita `src/theme/theme.ts` para agregar o ajustar temas:

```ts
export const themes = {
  myTheme: {
    light: {
      "--background": "0 0% 100%",
      "--foreground": "222.2 84% 4.9%"
    }
  }
};
```

---

## Documentacion

- Guias y runbooks en `docs/`.
- Contexto adicional en los `*.md` de la raiz.

---

## Roadmap

### En desarrollo
- Sistema de tests (Vitest + React Testing Library).
- Refactor de componentes grandes.
- Validacion de formularios (Zod).

### Planificado
- Reportes y estadisticas.
- Exportacion a PDF.
- Recordatorios de citas.
- Backup automatico.

---

## Contribuir

1. Haz un fork del proyecto.
2. Crea una rama: `git checkout -b feature/mi-cambio`.
3. Commit con prefijos `add:`, `fix:` o `update:`.
4. Ejecuta `pnpm lint`.
5. Abre un Pull Request con proposito, resumen y notas de prueba manual.

---

## Licencia

MIT. Ver `LICENSE`.

---

## Contacto

Desarrollador principal: [Tu Nombre]

- Website: https://tu-sitio.com
- Email: tu-email@ejemplo.com
- GitHub: https://github.com/tu-usuario

---

## Agradecimientos

- Tauri
- React
- Radix UI
- Tailwind CSS
- Lucide
