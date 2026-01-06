<div align="center">

# 🦷 Oklus

**Sistema de gestión dental profesional, rápido y 100% offline**

[![Tauri](https://img.shields.io/badge/Tauri-2.8-24C8DB?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

[Características](#-características-destacadas) • [Capturas](#-capturas) • [Instalación](#-instalación-rápida) • [Documentación](#-documentación)

</div>

---

## 🎯 ¿Por qué Oklus?

Oklus es una aplicación **nativa de escritorio** diseñada para clínicas dentales que necesitan:

- ✅ **Trabajar sin internet** - 100% offline, sin depender de la nube
- ⚡ **Rendimiento nativo** - Respuesta instantánea, sin lag
- 🔒 **Datos locales** - Tu información nunca sale de tu computadora
- 🪶 **Instalación ligera** - Solo ~4MB vs 100MB+ de otras soluciones
- 🎨 **Interfaz moderna** - Diseño limpio y fácil de usar

---

## 🌟 Características Destacadas

### 📋 Gestión de Pacientes
- Ficha completa: datos personales, alergias, anamnesis
- Búsqueda instantánea por nombre o documento
- Historial médico completo con timeline
- Adjuntos: radiografías, fotos, documentos

### 🦷 Odontograma Interactivo
- Dentición permanente (11-48) y decidua (51-85)
- Selección visual de dientes
- Diagnósticos automatizados por pieza
- Exportación a PDF

### 💰 Control Financiero
- Presupuestos y cotizaciones
- Seguimiento de pagos y saldos pendientes
- Múltiples métodos de pago
- Historial de transacciones

### 📅 Citas y Recordatorios
- Calendario integrado
- Detección de conflictos de horarios
- Recordatorios automáticos por WhatsApp (semi-automático)

### 🔐 Consentimientos Informados
- Plantillas predefinidas (extracción, endodoncia, cirugía, etc.)
- Firma digital en canvas
- Almacenamiento seguro en PDF

---

## 🚀 Instalación Rápida

### Requisitos Previos
- **Node.js** 18+ y **pnpm** 8+
- **Rust** 1.77+ ([rustup](https://rustup.rs/))
- Dependencias de Tauri según tu SO:
  - **Windows**: Visual Studio C++ Build Tools + WebView2
  - **macOS**: `xcode-select --install`
  - **Linux**: WebKit2GTK, GTK3, libssl

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/RicardoCR98/oklus.git
cd oklus

# 2. Instalar dependencias
pnpm install

# 3. Ejecutar en modo desarrollo
pnpm tauri:dev
```

### Build de Producción

```bash
pnpm tauri:build
```

Los instaladores se generan en `src-tauri/target/release/bundle/`:
- **Windows**: `Oklus_x.x.x_x64-setup.exe` (MSI/NSIS)
- **macOS**: `Oklus_x.x.x_x64.dmg`
- **Linux**: `oklus_x.x.x_amd64.deb` o AppImage

---

## 📸 Capturas

<details>
<summary>👁️ Ver capturas de pantalla</summary>

### Registro Clínico
![Dashboard](docs/screenshots/dashboard.png)

### Odontograma Interactivo
![Odontograma](docs/screenshots/odontogram.png)

### Gestión de Finanzas
![Finanzas](docs/screenshots/finances.png)

</details>

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** + **TypeScript 5.9** - UI moderna y type-safe
- **Tailwind CSS 4** - Estilos utility-first
- **Radix UI** - Componentes accesibles
- **Zustand** - State management minimalista
- **TanStack Virtual** - Listas virtualizadas

### Desktop/Backend
- **Tauri 2.8** - Shell nativa (no Electron)
- **Rust 1.77+** - Backend seguro y rápido
- **SQLite + WAL** - Base de datos local con concurrencia
- **SQLx** - Driver async de SQL

### Tamaño Final
- **Instalador**: ~4-5 MB (vs 100+ MB con Electron)
- **RAM en uso**: ~80-120 MB (vs 300-500 MB con Electron)

---

## 📚 Documentación

### Para Desarrolladores
- [**Arquitectura**](docs/ARCHITECTURE.md) - C4 model, decisiones técnicas
- [**Guía del Codebase**](docs/CODEBASE_GUIDE.md) - Navegación del código
- [**State Management**](docs/STATE_MANAGEMENT.md) - Zustand + Custom Hooks
- [**Estándares de Código**](docs/CODING_STANDARDS.md) - Convenciones

### Para Usuarios
- [**Guía de Auto-Actualización**](AUTO_UPDATE_GUIDE.md) - Configurar updates automáticos

📖 [Ver toda la documentación →](docs/README.md)

---

## 🗺️ Roadmap

### ✅ Versión Actual (v0.1.x)
- [x] Gestión de pacientes
- [x] Odontograma interactivo
- [x] Control financiero
- [x] Citas y recordatorios
- [x] Consentimientos informados
- [x] Auto-actualización

### 🔜 Próximas Versiones

**v0.2.0** - Testing & Calidad
- [ ] Suite de tests (Vitest + React Testing Library)
- [ ] Validación de formularios con Zod
- [ ] Migración progresiva a TypeScript estricto

**v0.3.0** - Reportes & Analytics
- [ ] Dashboard de estadísticas
- [ ] Exportación de reportes a PDF/Excel
- [ ] Gráficos de ingresos y procedimientos

**v1.0.0** - Estabilidad
- [ ] Backup automático
- [ ] Multi-usuario (opcional)
- [ ] Sincronización en la nube (opcional)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/mi-mejora`
3. Commit con prefijos: `add:`, `fix:`, `update:`
4. Ejecuta `pnpm lint` antes de hacer push
5. Abre un Pull Request con descripción clara

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Gary Ricardo Campaña Ramírez**

- 📧 Email: garycardo98@gmail.com
- 🐙 GitHub: [@RicardoCR98](https://github.com/RicardoCR98)

---

<div align="center">

**¿Te gusta Oklus?** Dale una ⭐ en GitHub

Hecho con ❤️ para la comunidad dental

</div>
