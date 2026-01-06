# 🔄 Guía de Auto-Actualización de Oklus

Esta guía explica cómo funciona el sistema de auto-actualización y cómo publicar nuevas versiones.

## 📋 Requisitos Previos

1. ✅ Repositorio de GitHub (público o privado)
2. ✅ Tauri CLI instalado
3. ✅ Llaves de firma generadas

---

## 🔑 PASO 1: Generar Llaves de Firma (Solo una vez)

Las llaves de firma aseguran que las actualizaciones provienen de ti y no han sido modificadas.

### Generar las llaves:

```bash
# En la raíz del proyecto
pnpm tauri signer generate -w ~/.tauri/oklus.key
```

Este comando genera:
- `oklus.key` - **PRIVADA** (nunca compartir, usar para firmar)
- `oklus.key.pub` - **PÚBLICA** (incluir en la app)

### Configurar la clave pública:

1. **Copia el contenido de la clave pública:**
   ```bash
   cat ~/.tauri/oklus.key.pub
   ```

2. **Pega el contenido en `src-tauri/tauri.conf.json`:**
   ```json
   {
     "plugins": {
       "updater": {
         "active": true,
         "endpoints": [
           "https://github.com/YOUR_USERNAME/oklus/releases/latest/download/latest.json"
         ],
         "dialog": true,
         "pubkey": "PEGA_AQUI_EL_CONTENIDO_DE_LA_CLAVE_PUBLICA"
       }
     }
   }
   ```

3. **Actualiza el endpoint con tu usuario de GitHub:**
   - Reemplaza `YOUR_USERNAME` con tu usuario real de GitHub

---

## 📦 PASO 2: Compilar una Nueva Versión

### 1. Incrementa la versión en `src-tauri/tauri.conf.json`:

```json
{
  "version": "0.2.0"  // ← Incrementa esto (era 0.1.0)
}
```

### 2. Compila la aplicación:

```bash
pnpm tauri build
```

Esto genera:
- **Windows:** `src-tauri/target/release/bundle/nsis/Oklus_0.2.0_x64-setup.exe`
- **Archivos de actualización:** `*.nsis.zip`, `*.nsis.zip.sig`

---

## 🚀 PASO 3: Publicar en GitHub Releases

### 1. Crear un nuevo Release en GitHub:

```bash
# Opción A: Desde la web de GitHub
# - Ve a tu repositorio → Releases → New Release
# - Tag: v0.2.0
# - Title: Oklus v0.2.0
# - Description: Changelog de esta versión

# Opción B: Con GitHub CLI
gh release create v0.2.0 \
  --title "Oklus v0.2.0" \
  --notes "## Cambios en esta versión
  - ✨ Nueva funcionalidad X
  - 🐛 Corrección de bug Y
  - 🔧 Mejoras de rendimiento"
```

### 2. Subir los archivos de actualización:

```bash
# Navega a la carpeta de archivos compilados
cd src-tauri/target/release/bundle/nsis

# Sube TODOS estos archivos al Release:
gh release upload v0.2.0 \
  Oklus_0.2.0_x64-setup.nsis.zip \
  Oklus_0.2.0_x64-setup.nsis.zip.sig

# También sube el instalador completo (opcional pero recomendado):
gh release upload v0.2.0 \
  Oklus_0.2.0_x64-setup.exe
```

### 3. Generar el archivo `latest.json`:

Tauri genera automáticamente este archivo, pero debes subirlo:

```bash
# El archivo se genera en:
cd src-tauri/target/release/

# Subir latest.json
gh release upload v0.2.0 latest.json
```

---

## ✅ PASO 4: Verificar que Funciona

### Desde la aplicación:

1. Abre Oklus
2. Ve a **Configuración → Sistema**
3. Haz clic en **"Buscar actualizaciones"**
4. Deberías ver: "Nueva versión disponible: v0.2.0"
5. La app descargará e instalará automáticamente
6. Se reiniciará con la nueva versión

---

## 🔐 Seguridad de las Llaves

### ⚠️ MUY IMPORTANTE:

1. **NUNCA** subas `oklus.key` (clave privada) a GitHub
2. Agrega a `.gitignore`:
   ```
   *.key
   ```
3. Guarda `oklus.key` en un lugar seguro (ej: gestor de contraseñas)
4. Si pierdes la clave privada, necesitarás generar un nuevo par de llaves

---

## 🔄 Flujo Completo de Actualización

```
┌─────────────────────────────────────────────────┐
│  1. DESARROLLADOR                               │
├─────────────────────────────────────────────────┤
│  • Hacer cambios en el código                   │
│  • Incrementar versión: 0.1.0 → 0.2.0           │
│  • pnpm tauri build                             │
│  • Subir archivos a GitHub Release v0.2.0      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  2. GITHUB RELEASES                             │
├─────────────────────────────────────────────────┤
│  • Almacena: .nsis.zip, .nsis.zip.sig, .exe    │
│  • latest.json con metadata de la versión      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  3. USUARIO                                     │
├─────────────────────────────────────────────────┤
│  • Abre Oklus v0.1.0                           │
│  • Click "Buscar actualizaciones"              │
│  • App consulta GitHub: ¿nueva versión?       │
│  • Descarga automática de .nsis.zip           │
│  • Verifica firma (.sig)                       │
│  • Instala y reinicia                          │
│  • Ahora tiene v0.2.0 ✓                        │
└─────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### "Error al verificar actualizaciones"
- Verifica que el endpoint en `tauri.conf.json` sea correcto
- Asegúrate de que el Release esté publicado
- Revisa que `latest.json` esté en el Release

### "Firma inválida"
- La clave pública en `tauri.conf.json` no coincide con la privada usada para firmar
- Regenera las llaves y re-compila

### "No encuentra archivos de actualización"
- Verifica que subiste `.nsis.zip` y `.nsis.zip.sig` al Release
- El tag del Release debe coincidir con la versión

---

## 📝 Checklist de Publicación

- [ ] Incrementar versión en `tauri.conf.json`
- [ ] Compilar: `pnpm tauri build`
- [ ] Crear Release en GitHub con tag correcto
- [ ] Subir `.nsis.zip`
- [ ] Subir `.nsis.zip.sig`
- [ ] Subir `latest.json`
- [ ] Subir `.exe` (instalador completo)
- [ ] Probar actualización desde versión anterior

---

## 🎯 Mejores Prácticas

1. **Versionado Semántico:** Usa `MAJOR.MINOR.PATCH` (ej: 1.2.3)
   - MAJOR: Cambios incompatibles
   - MINOR: Nuevas funcionalidades compatibles
   - PATCH: Correcciones de bugs

2. **Changelog claro:** En la descripción del Release, explica qué cambió

3. **Testing:** Prueba la actualización antes de publicarla

4. **Migraciones de DB:** Si cambias el esquema de SQLite, incluye migraciones

---

## 🔗 Referencias

- [Tauri Updater Docs](https://v2.tauri.app/plugin/updater/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
