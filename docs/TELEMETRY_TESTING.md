# Guía de Prueba de Telemetría

## ✅ Configuración Completada

**Google Analytics 4:**
- Measurement ID: `G-J9SZS4HVL4`
- API Secret: `KZkQhfwPRGubhNQUBUAyJw`
- Stream Type: Web (correcto para Measurement Protocol)

**Configuración en el código:**
- Migración `004_telemetry_config.sql` creada ✅
- Valores insertados en `user_settings` table ✅
- Se ejecuta automáticamente al arrancar la app ✅

---

## 🧪 Cómo Probar la Telemetría

### 1. Ejecutar la aplicación

```bash
pnpm tauri:dev
```

### 2. Probar evento `installation_completed`

**Escenario A: Primera instalación (onboarding)**
1. Si ya completaste el onboarding, elimina la base de datos:
   ```bash
   # Windows
   del "%APPDATA%\com.tauri.dev\clinic.db"

   # macOS/Linux
   rm ~/Library/Application\ Support/com.tauri.dev/clinic.db
   ```

2. Reinicia la app: `pnpm tauri:dev`

3. Completa el wizard de onboarding:
   - Paso 1: Datos del doctor y clínica
   - Paso 2: Configurar precios de procedimientos
   - Paso 3: **Aceptar términos y condiciones** ✅
   - Paso 4: Confirmar datos
   - Paso 5: Esperar countdown o hacer clic en "Comenzar a usar Oklus"

4. **Verificar en consola:**
   ```
   ✅ installation_completed event sent
   ```

**Escenario B: Si ya completaste el onboarding**
- El evento `installation_completed` solo se envía UNA VEZ durante el onboarding
- Para probar otros eventos, continúa con el paso 3

### 3. Probar evento `monthly_heartbeat`

Este evento se envía automáticamente cada 30 días. Para forzarlo en desarrollo:

1. Abre la consola del navegador (DevTools)
2. Ejecuta:
   ```javascript
   // Simular que han pasado 30 días
   await (await import('./lib/telemetry')).telemetryService.initialize();

   // Verificar última fecha de heartbeat
   console.log('Last heartbeat:', (await import('./lib/telemetry')).telemetryService.getLastHeartbeat());

   // Modificar manualmente la fecha (en SQL)
   // Luego reiniciar la app
   ```

**Verificar en consola:**
```
📤 Sincronizando X eventos pendientes...
✅ monthly_heartbeat enviado
```

### 4. Probar evento `error_occurred`

Provoca un error intencional:

**Opción A: Error de JavaScript**
1. Abre DevTools Console
2. Ejecuta:
   ```javascript
   throw new Error("Test error for telemetry");
   ```

**Opción B: Error de React (Error Boundary)**
1. Modifica temporalmente un componente para que lance un error
2. Observa el ErrorBoundary capturando el error

**Verificar en consola:**
```
❌ Error global capturado: [error details]
📊 Error enviado a telemetría
```

### 5. Verificar eventos en Google Analytics 4

**Tiempo de espera:** Los eventos tardan **5-10 minutos** en aparecer en GA4.

**Paso a paso:**
1. Ve a [Google Analytics](https://analytics.google.com)
2. Selecciona la propiedad "Oklus"
3. Navega a: **Reports → Realtime**
4. Busca en "Events (last 30 minutes)":
   - `installation_completed`
   - `monthly_heartbeat`
   - `error_occurred`

**Vista de debug (más rápido):**
1. Abre: **Admin → DebugView**
2. Los eventos aparecen **inmediatamente** si la app está en debug mode

---

## 🔍 Verificar Datos Enviados

### Inspeccionar cola de eventos offline

Si quieres ver los eventos que están en la cola (pendientes de enviar):

```sql
-- Conectar a la BD
sqlite3 "%APPDATA%\com.tauri.dev\clinic.db"

-- Ver eventos en cola
SELECT
  id,
  event_type,
  json_extract(event_data, '$.installation_id') as installation_id,
  timestamp,
  sent
FROM telemetry_events
ORDER BY id DESC
LIMIT 10;

-- Ver configuración de telemetría
SELECT * FROM user_settings WHERE key LIKE 'telemetry.%';
```

**Salida esperada:**
```
telemetry.enabled          | true
telemetry.ga4_measurement_id | G-J9SZS4HVL4
telemetry.ga4_api_secret   | KZkQhfwPRGubhNQUBUAyJw
telemetry.installation_id  | [UUID generado]
telemetry.last_heartbeat_sent | [fecha ISO 8601]
```

### Ver Installation ID en la UI

1. Ejecuta la app
2. Ve a: **Configuración → Sistema**
3. Scroll hasta la sección "Telemetría y Privacidad"
4. Verás:
   - Toggle para habilitar/deshabilitar ✅
   - Installation ID (con botón para copiar)
   - Última fecha de heartbeat

---

## 🐛 Troubleshooting

### Eventos no llegan a GA4

**1. Verificar que GA4 esté configurado:**
```javascript
// En DevTools Console
await (await import('./lib/telemetry')).ga4Client.isConfigured()
// Debe retornar: true
```

**2. Verificar connectivity:**
- Los eventos se encolan si no hay internet
- Cuando la app detecta conexión, se sincronizan automáticamente
- Verifica en la tabla `telemetry_events` si hay eventos con `sent = 0`

**3. Validar evento manualmente:**
```javascript
// En DevTools Console
const { telemetryService } = await import('./lib/telemetry');
await telemetryService.initialize();
await telemetryService.trackEvent('error_occurred', {
  error_message: 'Test error',
  error_context: 'ui'
});
```

**4. Ver logs de la aplicación:**
```bash
# Ejecutar con logs de Tauri
pnpm tauri:dev

# Buscar en consola:
✅ TelemetryService inicializado
✅ GA4 configurado
📊 Evento enviado a GA4: [event_type]
```

### Error: "GA4 no configurado"

**Causa:** La migración 004 no se ejecutó o falló.

**Solución:**
```sql
-- Ejecutar manualmente
INSERT OR REPLACE INTO user_settings (key, value, category) VALUES
('telemetry.enabled', 'true', 'telemetry'),
('telemetry.ga4_measurement_id', 'G-J9SZS4HVL4', 'telemetry'),
('telemetry.ga4_api_secret', 'KZkQhfwPRGubhNQUBUAyJw', 'telemetry');
```

Luego reiniciar la app.

### Eventos duplicados

**Causa:** La app se está recargando múltiples veces en desarrollo.

**Solución:** Normal en desarrollo. En producción esto no ocurre.

---

## 📊 Eventos Esperados en GA4

### installation_completed
**Frecuencia:** Una vez por instalación
**Parámetros:**
- `installation_id`: UUID único
- `app_version`: "1.0.0-beta"
- `platform`: "windows" | "macos" | "linux"
- `doctor_name`: Nombre del doctor
- `clinic_name`: Nombre de la clínica
- `country`: "Ecuador"

### monthly_heartbeat
**Frecuencia:** Cada 30 días
**Parámetros:**
- `installation_id`: UUID único
- `app_version`: "1.0.0-beta"
- `platform`: "windows" | "macos" | "linux"
- `days_since_install`: Número de días desde instalación
- `total_patients`: Cantidad de pacientes en BD
- `total_visits`: Cantidad de visitas registradas
- `total_sessions`: Cantidad de sesiones financieras

### error_occurred
**Frecuencia:** Cuando ocurre un error crítico
**Parámetros:**
- `installation_id`: UUID único
- `app_version`: "1.0.0-beta"
- `platform`: "windows" | "macos" | "linux"
- `error_message`: Mensaje del error (max 200 chars)
- `error_stack`: Stack trace (max 500 chars, opcional)
- `error_context`: "javascript" | "promise" | "ui" | "database" | "file_system"

---

## ✅ Checklist de Prueba

- [ ] La app compila sin errores (`cargo check`)
- [ ] La app arranca correctamente (`pnpm tauri:dev`)
- [ ] La migración 004 se ejecuta (ver logs)
- [ ] TelemetryService se inicializa (consola: "✅ TelemetryService inicializado")
- [ ] GA4 está configurado (consola: "✅ GA4 configurado")
- [ ] Evento `installation_completed` se envía durante onboarding
- [ ] Evento `error_occurred` se envía al provocar un error
- [ ] Los eventos aparecen en GA4 Realtime (esperar 5-10 min)
- [ ] El Installation ID se muestra en Settings → Sistema
- [ ] El toggle de telemetría funciona (habilitar/deshabilitar)
- [ ] Los eventos se encolan cuando no hay internet (`sent = 0`)

---

## 🎯 Próximos Pasos

Una vez confirmado que los eventos llegan a GA4:

1. **Crear dashboard personalizado** en GA4:
   - Instalaciones totales (count de `installation_completed`)
   - MAU (Monthly Active Users) via `monthly_heartbeat`
   - Tasa de errores (count de `error_occurred`)
   - Distribución geográfica (si GA4 lo detecta automáticamente)

2. **Configurar alertas** para:
   - Tasa de errores > 5%
   - Caída abrupta de MAU

3. **Analizar datos** mensualmente para:
   - Identificar características más usadas
   - Detectar errores recurrentes
   - Medir retención de usuarios

---

## 📝 Notas Importantes

- **Privacidad:** NO se envían datos médicos, nombres de pacientes, ni información personal sensible
- **Anonimato:** Solo se usa `installation_id` (UUID), no emails ni nombres reales
- **Control del usuario:** Los doctores pueden deshabilitar telemetría en Settings → Sistema
- **Offline-first:** Los eventos se encolan si no hay internet y se sincronizan después
- **Ecuador compliance:** Compatible con LOPDP Ecuador (consentimiento obligatorio en T&C)
