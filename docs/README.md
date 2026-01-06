# 📚 Oklus - Documentación

> **Sistema de gestión dental profesional**: Todo lo que necesitas saber para desarrollar, mantener y extender Oklus.

---

## 🚀 Empieza Aquí

**¿Nuevo en el proyecto?** Lee estos documentos en orden:

1. [**ARCHITECTURE.md**](ARCHITECTURE.md) - Entiende cómo funciona el sistema
2. [**CODEBASE_GUIDE.md**](CODEBASE_GUIDE.md) - Navega el código como un pro
3. [**CODING_STANDARDS.md**](CODING_STANDARDS.md) - Escribe código consistente

**¿Listo para desarrollar?** Usa estos como referencia:

- [**STATE_MANAGEMENT.md**](STATE_MANAGEMENT.md) - Cómo manejamos el estado
- [**CUSTOM_HOOKS_GUIDE.md**](CUSTOM_HOOKS_GUIDE.md) - Hooks que ya existen
- [**ERD.md**](ERD.md) - Modelo de datos completo

---

## 📖 Documentación por Categoría

### 🏗️ Arquitectura
Todo sobre cómo está construido Oklus.

| Documento | ¿Qué encontrarás? |
|-----------|-------------------|
| [**ARCHITECTURE.md**](ARCHITECTURE.md) | Diagramas C4, decisiones técnicas, flujos de datos |
| [**STATE_MANAGEMENT.md**](STATE_MANAGEMENT.md) | Zustand + Custom Hooks: cómo funcionan juntos |
| [**ERD.md**](ERD.md) | Todas las tablas SQLite y sus relaciones |
| [**DATABASE_LOCKS.md**](DATABASE_LOCKS.md) | Por qué usamos WAL mode y cómo evitar locks |

### 💻 Desarrollo
Guías prácticas para escribir código.

| Documento | ¿Qué encontrarás? |
|-----------|-------------------|
| [**CODEBASE_GUIDE.md**](CODEBASE_GUIDE.md) | Dónde está cada cosa + patrones comunes |
| [**CODING_STANDARDS.md**](CODING_STANDARDS.md) | Convenciones de código + buenas prácticas |
| [**CUSTOM_HOOKS_GUIDE.md**](CUSTOM_HOOKS_GUIDE.md) | Hooks personalizados: cuándo y cómo usarlos |

### 🎨 Diseño & UX
Especificaciones de diseño y refactorización.

| Documento | ¿Qué encontrarás? |
|-----------|-------------------|
| [**FAB_DESIGN.md**](FAB_DESIGN.md) | Diseño del botón flotante de guardado |
| [**FINANCES_REFACTOR.md**](FINANCES_REFACTOR.md) | Arquitectura del módulo de finanzas |

### 🧪 Testing & Calidad
Cómo asegurar que todo funcione.

| Documento | ¿Qué encontrarás? |
|-----------|-------------------|
| [**TESTING_CHECKLIST.md**](TESTING_CHECKLIST.md) | Qué probar antes de hacer commit |
| [**TELEMETRY_TESTING.md**](TELEMETRY_TESTING.md) | Cómo verificar que la telemetría funcione |

---

## 🛠️ Guías Especiales

### Para Mantenimiento
- [**AUTO_UPDATE_GUIDE.md**](../AUTO_UPDATE_GUIDE.md) - Configura actualizaciones automáticas

### Para AI/Claude
- [**CLAUDE.md**](../CLAUDE.md) - Instrucciones para Claude Code (este archivo guía a la IA)

---

## 💡 Tips Rápidos

**¿Buscas algo específico?**
- 🔍 **Modelo de datos** → `ERD.md`
- 🎨 **Cómo se ve el código** → `CODING_STANDARDS.md`
- 🧩 **Dónde está X componente** → `CODEBASE_GUIDE.md`
- 🏛️ **Por qué decidimos Y** → `ARCHITECTURE.md`
- ⚡ **Hooks existentes** → `CUSTOM_HOOKS_GUIDE.md`

**¿Vas a agregar algo nuevo?**
1. Lee `ARCHITECTURE.md` para entender dónde encaja
2. Revisa `CODING_STANDARDS.md` para seguir las convenciones
3. Consulta `CUSTOM_HOOKS_GUIDE.md` para reutilizar lógica existente

---

## 🎯 Estructura en 30 Segundos

```
docs/
├── 🏗️  Arquitectura        → ARCHITECTURE.md, STATE_MANAGEMENT.md, ERD.md
├── 💻  Desarrollo          → CODEBASE_GUIDE.md, CODING_STANDARDS.md
├── 🎨  Diseño              → FAB_DESIGN.md, FINANCES_REFACTOR.md
├── 🧪  Testing             → TESTING_CHECKLIST.md
└── 📸  img/ screenshots/   → Diagramas y capturas
```

---

<div align="center">

**¿Tienes dudas?** Abre un issue en GitHub
**¿Encontraste un error?** Envía un PR con la corrección

Última actualización: **2026-01-07**

</div>
