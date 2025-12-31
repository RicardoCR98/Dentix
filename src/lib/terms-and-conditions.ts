// src/lib/terms-and-conditions.ts

export interface TermsSection {
  id: string;
  title: string;
  content: string;
}

export interface TermsAndConditions {
  version: string;
  lastUpdated: string;
  effectiveDate: string;
  sections: TermsSection[];
}

export const TERMS_AND_CONDITIONS: TermsAndConditions = {
  version: "1.0.0",
  lastUpdated: "enero de 2026",
  effectiveDate: "enero de 2026",
  sections: [
    {
      id: "introduction",
      title: "INTRODUCCIÓN",
      content: `Bienvenido a Oklus, un software de gestión de clínicas dentales desarrollado para profesionales de la salud dental en Ecuador.

Estos Términos y Condiciones de Uso (en adelante, "Términos") constituyen un acuerdo legal vinculante entre usted (el "Usuario" o "Doctor") y el proveedor del software Oklus (en adelante, el "Proveedor").

Al instalar, acceder o utilizar Oklus, usted acepta cumplir con estos Términos en su totalidad. Si no está de acuerdo con alguna parte de estos Términos, NO debe instalar ni utilizar el Software.`,
    },
    {
      id: "definitions",
      title: "1. DEFINICIONES",
      content: `Para los efectos de estos Términos, se entenderá por:

Software: La aplicación de escritorio Oklus, incluyendo todas sus funcionalidades, actualizaciones, documentación y materiales relacionados.

Usuario o Doctor: Profesional de la salud dental legalmente autorizado en Ecuador para ejercer la odontología, que utiliza el Software para la gestión de su clínica o consultorio.

Datos Médicos: Información personal de pacientes, incluyendo pero no limitado a: nombres, números de identificación, diagnósticos, historias clínicas, radiografías, fotografías, datos financieros de tratamientos, y cualquier otro dato relacionado con la atención odontológica.

Datos de Telemetría: Información técnica y estadística sobre el uso del Software, que NO incluye Datos Médicos, según se detalla en la Sección 6 de estos Términos.

Instalación: Copia única del Software instalada en un equipo computador específico.`,
    },
    {
      id: "license",
      title: "2. LICENCIA DE USO",
      content: `2.1. Concesión de Licencia

El Proveedor le concede una licencia no exclusiva, no transferible y revocable para instalar y utilizar el Software en un (1) equipo computador para fines profesionales relacionados con la gestión de su clínica dental.

2.2. Restricciones

Usted NO puede:
- Modificar, descompilar, realizar ingeniería inversa o desensamblar el Software
- Distribuir, sublicenciar, alquilar, arrendar o prestar el Software a terceros
- Utilizar el Software para fines ilegales o no autorizados
- Remover, alterar u ocultar avisos de derechos de autor o marcas registradas
- Instalar el Software en más de un equipo sin autorización expresa del Proveedor
- Utilizar el Software para tratar pacientes fuera del territorio ecuatoriano sin autorización

2.3. Propiedad Intelectual

El Software, su código fuente, diseño, estructura, documentación y todos los derechos de propiedad intelectual asociados son y permanecerán como propiedad exclusiva del Proveedor. Esta licencia NO constituye una venta del Software.`,
    },
    {
      id: "functionality",
      title: "3. FUNCIONALIDAD DEL SOFTWARE",
      content: `3.1. Descripción General

Oklus es un software de gestión clínica dental que proporciona las siguientes funcionalidades principales:
- Registro y gestión de pacientes
- Creación de historias clínicas odontológicas
- Odontograma interactivo (carta dental)
- Registro de diagnósticos y planes de tratamiento
- Gestión financiera (presupuestos, pagos, balances)
- Almacenamiento de archivos adjuntos (radiografías, fotografías)
- Generación de reportes y documentos
- Plantillas de texto para agilizar la documentación

3.2. Software Offline-First

Oklus está diseñado para funcionar COMPLETAMENTE SIN CONEXIÓN A INTERNET. Todas las funcionalidades principales están disponibles sin requerir conectividad. La conexión a internet se utiliza únicamente para:
- Envío de datos de telemetría (opcional y configurable)
- Actualizaciones del Software (cuando estén disponibles)

3.3. Actualizaciones

El Proveedor puede, a su discreción, proporcionar actualizaciones, mejoras o correcciones del Software. Dichas actualizaciones pueden modificar, agregar o eliminar funcionalidades. El Usuario acepta que el Proveedor no está obligado a mantener compatibilidad con versiones anteriores.`,
    },
    {
      id: "user-responsibilities",
      title: "4. RESPONSABILIDADES DEL USUARIO",
      content: `4.1. Requisitos Profesionales

Al utilizar Oklus, usted declara y garantiza que:
- Es un profesional de la salud dental legalmente autorizado en Ecuador
- Posee título profesional vigente y cédula profesional válida
- Cumple con todos los requisitos legales y deontológicos para ejercer la odontología
- Utilizará el Software exclusivamente para fines profesionales legítimos

4.2. Seguridad del Equipo

Usted es responsable de:
- Mantener su equipo computador seguro mediante contraseñas robustas
- Instalar y mantener actualizado software antivirus y antimalware
- Proteger el acceso físico al equipo donde está instalado Oklus
- Realizar copias de seguridad (backups) periódicas de sus datos
- Notificar inmediatamente al Proveedor en caso de robo o pérdida del equipo

4.3. Uso Ético y Legal

Usted se compromete a:
- Utilizar el Software conforme a las leyes ecuatorianas vigentes
- Obtener el consentimiento informado de sus pacientes
- Mantener la confidencialidad de los datos de sus pacientes
- No utilizar el Software para fines fraudulentos o engañosos
- Cumplir con la normativa del Ministerio de Salud Pública del Ecuador

4.4. Capacitación

Es responsabilidad del Usuario familiarizarse con el funcionamiento del Software. El Proveedor puede ofrecer documentación, tutoriales o soporte técnico, pero no garantiza capacitación personalizada.`,
    },
    {
      id: "data-protection",
      title: "5. PROTECCIÓN DE DATOS PERSONALES",
      content: `5.1. Marco Legal

El tratamiento de datos personales está sujeto a:
- Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP)
- Ley Orgánica de Salud del Ecuador
- Reglamento General de la Ley Orgánica de Salud
- Código de Ética Profesional Odontológico

5.2. Responsable del Tratamiento

USTED, como Usuario del Software, es el ÚNICO RESPONSABLE del tratamiento de los Datos Médicos de sus pacientes. El Proveedor NO tiene acceso, control, ni responsabilidad alguna sobre dichos datos.

5.3. Almacenamiento Local

TODOS los Datos Médicos se almacenan EXCLUSIVAMENTE en su equipo computador local, en una base de datos SQLite cifrada. El Proveedor:
- NO almacena Datos Médicos en servidores externos
- NO sincroniza Datos Médicos con la nube
- NO transmite Datos Médicos a través de internet
- NO tiene acceso remoto a su base de datos

5.4. Obligaciones del Usuario como Responsable de Datos

Usted se compromete a:
- Informar a sus pacientes sobre el tratamiento de sus datos personales
- Obtener el consentimiento expreso y documentado de sus pacientes
- Implementar medidas de seguridad adecuadas (contraseñas, cifrado, backups)
- Garantizar los derechos ARCO de sus pacientes (Acceso, Rectificación, Cancelación, Oposición)
- Mantener registro de actividades de tratamiento de datos
- Notificar a la autoridad competente cualquier brecha de seguridad

5.5. Derechos de los Pacientes

Los pacientes tienen derecho a:
- Conocer qué datos personales se recopilan
- Acceder a sus datos y obtener copia
- Rectificar datos inexactos o incompletos
- Solicitar la cancelación de sus datos
- Oponerse al tratamiento de sus datos

Usted, como Usuario, es responsable de garantizar estos derechos.`,
    },
    {
      id: "telemetry",
      title: "6. RECOPILACIÓN DE DATOS DE USO Y TELEMETRÍA",
      content: `6.1. Datos que se Recopilan

Al utilizar Oklus, aceptas que el Software recopile y envíe de forma automática los siguientes datos de uso (en adelante, "Telemetría"):

a) Datos de Instalación:
- Identificador único de instalación (UUID generado aleatoriamente, NO vinculado a su identidad)
- Versión de la aplicación
- Sistema operativo y versión (Windows, macOS, Linux)
- Fecha y hora de instalación
- País de instalación (detectado por dirección IP o configuración regional)

b) Datos de Uso Mensual:
- Número total de pacientes registrados (cifra agregada, sin nombres ni identificadores)
- Número total de visitas/citas realizadas
- Número total de sesiones financieras creadas
- Días activos en el mes (cantidad de días en que se utilizó el Software)
- Funcionalidades utilizadas (por ejemplo: uso de odontograma, plantillas, exportación de PDF)

c) Datos de Errores Técnicos:
- Mensajes de error del sistema
- Trazas de código (stack traces) para diagnóstico técnico
- Versión del Software donde ocurrió el error
- Hora y fecha del error
- Contexto técnico (acción que estaba realizando cuando ocurrió el error)

6.2. Datos que NO se Recopilan

Oklus NO recopila, almacena ni transmite:
- ❌ Nombres, cédulas o información personal de pacientes
- ❌ Diagnósticos médicos o historias clínicas
- ❌ Datos financieros específicos (montos de cobros, deudas, precios)
- ❌ Información personal del doctor (más allá de datos técnicos de instalación)
- ❌ Radiografías, fotografías o archivos adjuntos
- ❌ Contenido de notas clínicas o plantillas de texto
- ❌ Conversaciones o mensajes generados por el Usuario

6.3. Propósito de la Recopilación

Los datos de telemetría se utilizan EXCLUSIVAMENTE para:
- Medir adopción: Conocer cuántos profesionales utilizan Oklus activamente
- Identificar y corregir errores: Detectar fallos técnicos para mejorar la estabilidad del Software
- Mejorar funcionalidad: Entender qué características son más utilizadas para priorizar desarrollo
- Decisiones de producto: Determinar qué nuevas funcionalidades implementar
- Estadísticas agregadas: Generar reportes anónimos sobre el uso general del Software

6.4. Transmisión y Almacenamiento

Los datos de telemetría se transmiten mediante:
- Protocolo HTTPS (conexión cifrada y segura)
- Servicio de Google Analytics 4 (cumple con estándares internacionales de seguridad)
- Almacenamiento en servidores protegidos con medidas de seguridad físicas y lógicas

La transmisión ocurre:
- Al completar la instalación inicial
- Una vez al mes (heartbeat mensual)
- Cuando ocurre un error crítico

Si NO hay conexión a internet, los eventos se almacenan localmente en una cola y se envían cuando se restablece la conexión.

6.5. Privacidad y Anonimización

El identificador único de instalación (UUID) es un código aleatorio generado en su equipo que:
- NO está vinculado a su nombre, correo electrónico o cédula
- NO permite identificar su identidad personal
- Sirve únicamente para contar instalaciones únicas y medir retención

Los datos son agregados y anonimizados antes de generar reportes. Por ejemplo: "150 clínicas en Ecuador utilizan Oklus" sin revelar identidades individuales.

6.6. Base Legal (LOPDP Ecuador)

La recopilación de estos datos se fundamenta en:
- Consentimiento explícito: Al aceptar estos Términos, usted otorga su consentimiento informado
- Minimización de datos: Solo se recopila información estrictamente necesaria
- Finalidad legítima: Mejora del Software y soporte técnico
- Seguridad: Medidas técnicas y organizativas para proteger la información

6.7. Tus Derechos sobre la Telemetría

Conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador, tienes derecho a:
- Acceder a los datos de telemetría asociados a tu instalación
- Solicitar la eliminación de tus datos de telemetría del sistema
- Revocar tu consentimiento (lo cual implica dejar de utilizar el Software)
- Presentar quejas ante la Superintendencia de Protección de Datos Personales

Para ejercer estos derechos, contacta a: soporte@oklus.com

6.8. Consentimiento Obligatorio

El uso de Oklus REQUIERE la aceptación de esta recopilación de telemetría. Si NO estás de acuerdo con el envío de estos datos, NO puedes utilizar el Software.

La telemetría es esencial para:
- Brindar soporte técnico efectivo
- Identificar y corregir errores críticos
- Planificar actualizaciones y mejoras
- Medir el impacto y alcance del Software`,
    },
    {
      id: "medical-data",
      title: "7. PROCESAMIENTO DE DATOS MÉDICOS LOCALES",
      content: `7.1. Almacenamiento Local Exclusivo

TODOS los Datos Médicos de sus pacientes se almacenan EXCLUSIVAMENTE en su equipo computador local mediante:
- Base de datos SQLite local
- Archivo de base de datos: clinic.db (ubicado en el directorio de la aplicación)
- Sin sincronización en la nube
- Sin transmisión a servidores externos

7.2. Sin Acceso del Proveedor

El Proveedor del Software:
- NO tiene acceso a su base de datos local
- NO puede ver, leer, modificar ni eliminar Datos Médicos
- NO almacena copias de Datos Médicos en servidores
- NO ofrece servicios de backup en la nube (es responsabilidad del Usuario)

7.3. Responsabilidad Exclusiva del Usuario

Como Usuario del Software, usted es el ÚNICO RESPONSABLE de:
- Custodia y seguridad: Proteger el acceso a su equipo y base de datos
- Backups (copias de seguridad): Realizar respaldos periódicos de la base de datos
- Cumplimiento normativo: Acatar leyes de protección de datos y normativa sanitaria
- Consentimiento de pacientes: Obtener autorización documentada de sus pacientes
- Confidencialidad: Mantener la privacidad de la información médica
- Control de acceso: Evitar que personas no autorizadas accedan al Software

7.4. Pérdida de Datos

El Proveedor NO es responsable por:
- Pérdida de datos por fallas de hardware (disco duro dañado, etc.)
- Borrado accidental de la base de datos
- Corrupción de archivos por virus o malware
- Robo o extravío del equipo computador
- Incendios, inundaciones u otros desastres naturales
- Falta de backups o respaldos

Recomendación: Realice copias de seguridad semanales de la carpeta de datos de Oklus.

7.5. Declaraciones del Usuario

Al aceptar estos Términos, usted declara que:
- Es profesional de la salud debidamente autorizado
- Cumplirá con la normativa de protección de datos médicos vigente
- Implementará medidas de seguridad razonables en su equipo
- Obtendrá el consentimiento informado de sus pacientes conforme a la ley
- Utilizará el Software de manera ética y profesional

7.6. Normativa Aplicable

El tratamiento de Datos Médicos está sujeto a:
- Ley Orgánica de Protección de Datos Personales (Ecuador)
- Ley Orgánica de Salud (Ecuador)
- Reglamento General de la Ley Orgánica de Salud
- Código de Ética del Colegio de Odontólogos del Ecuador
- Resoluciones del Ministerio de Salud Pública

7.7. Consentimiento Informado de Pacientes

Usted debe informar a sus pacientes que:
- Sus datos se almacenan en un sistema informático local
- Los datos se utilizan exclusivamente para su atención odontológica
- Tienen derechos de acceso, rectificación, cancelación y oposición
- Pueden solicitar copia de su historia clínica en cualquier momento

Modelo sugerido de consentimiento:
"Autorizo al Dr./Dra. [NOMBRE] a almacenar mi información personal y médica en el sistema informático Oklus para fines de mi atención odontológica. Entiendo que mis datos se almacenan de forma segura y confidencial en el equipo del consultorio."`,
    },
    {
      id: "liability",
      title: "8. LIMITACIÓN DE RESPONSABILIDAD",
      content: `8.1. Software "AS IS" (Tal Como Está)

El Software se proporciona "TAL COMO ESTÁ" y "SEGÚN DISPONIBILIDAD", sin garantías de ningún tipo, ya sean expresas o implícitas, incluyendo pero no limitado a:
- Garantías de comerciabilidad
- Adecuación para un propósito particular
- No violación de derechos de terceros
- Funcionamiento ininterrumpido o libre de errores

8.2. Versión Beta

El Software se encuentra en fase BETA (versión de prueba). Esto significa que:
- Puede contener errores, fallos o comportamientos inesperados
- Las funcionalidades pueden cambiar sin previo aviso
- No se garantiza estabilidad completa del sistema
- Se recomienda prudencia y supervisión al utilizarlo en entornos de producción

8.3. Exclusión de Garantías Médicas

Oklus es una herramienta de GESTIÓN ADMINISTRATIVA y NO:
- Proporciona asesoramiento médico u odontológico
- Diagnostica enfermedades o condiciones de salud
- Prescribe tratamientos o medicamentos
- Reemplaza el juicio profesional del odontólogo

El Usuario es el ÚNICO responsable de las decisiones clínicas y diagnósticos médicos.

8.4. Limitación de Daños

En ningún caso el Proveedor será responsable por:
- Daños directos, indirectos, incidentales, especiales, consecuentes o punitivos
- Pérdida de beneficios, ingresos, datos o uso del Software
- Interrupciones del negocio o práctica profesional
- Daños causados por errores, omisiones o inexactitudes del Software
- Daños resultantes del uso o imposibilidad de uso del Software

La responsabilidad máxima del Proveedor, en caso de ser declarada, se limitará al monto pagado por el Usuario por la licencia del Software (si aplica).

8.5. Excepciones

Esta limitación de responsabilidad NO aplica en casos de:
- Dolo o mala fe intencional del Proveedor
- Violación de derechos fundamentales
- Daños causados por negligencia grave comprobada

8.6. Indemnización

El Usuario acuerda indemnizar y eximir de responsabilidad al Proveedor por cualquier reclamación, demanda, pérdida, daño o gasto (incluyendo honorarios legales) derivados de:
- Violación de estos Términos por parte del Usuario
- Uso indebido o negligente del Software
- Violación de leyes o derechos de terceros
- Incumplimiento de obligaciones profesionales u éticas`,
    },
    {
      id: "support",
      title: "9. SOPORTE TÉCNICO Y ACTUALIZACIONES",
      content: `9.1. Soporte Técnico

El Proveedor puede ofrecer soporte técnico básico mediante:
- Correo electrónico: soporte@oklus.com
- Documentación en línea (cuando esté disponible)
- Tutoriales en video (opcionales)

El soporte técnico NO incluye:
- Capacitación personalizada en odontología o prácticas clínicas
- Recuperación de datos perdidos por falta de backups
- Solución de problemas de hardware del Usuario
- Asistencia para configuraciones no estándar del sistema operativo

9.2. Tiempo de Respuesta

El Proveedor se esforzará por responder consultas en un plazo razonable (generalmente 48-72 horas hábiles), pero NO garantiza tiempos de respuesta específicos.

9.3. Actualizaciones del Software

El Proveedor puede, a su discreción:
- Lanzar actualizaciones, parches o nuevas versiones del Software
- Modificar, agregar o eliminar funcionalidades
- Descontinuar soporte para versiones antiguas

Las actualizaciones pueden ser:
- Obligatorias (correcciones de seguridad críticas)
- Opcionales (nuevas funcionalidades o mejoras)

9.4. Instalación de Actualizaciones

El Usuario es responsable de:
- Realizar backup antes de actualizar
- Verificar compatibilidad con su sistema operativo
- Instalar actualizaciones en tiempo oportuno
- Aceptar cambios en funcionalidades

9.5. Descontinuación del Software

El Proveedor se reserva el derecho de descontinuar el desarrollo, soporte o distribución del Software con un aviso previo razonable (mínimo 90 días).`,
    },
    {
      id: "termination",
      title: "10. TERMINACIÓN DE LA LICENCIA",
      content: `10.1. Terminación por el Usuario

Usted puede terminar esta licencia en cualquier momento mediante:
- Desinstalación completa del Software de su equipo
- Eliminación de todos los archivos y bases de datos asociados
- Notificación al Proveedor (opcional pero recomendada)

10.2. Terminación por el Proveedor

El Proveedor puede terminar esta licencia inmediatamente si:
- Usted viola cualquier término de este acuerdo
- Utiliza el Software para actividades ilegales
- Realiza ingeniería inversa o modifica el Software sin autorización
- No cumple con requisitos legales para ejercer la odontología

10.3. Efectos de la Terminación

Al terminar la licencia:
- Debe cesar inmediatamente el uso del Software
- Debe desinstalar el Software de su equipo
- Los datos locales (base de datos clinic.db) permanecen en su poder
- Pierde acceso a actualizaciones y soporte técnico

10.4. Datos Posteriores a la Terminación

El Proveedor:
- NO eliminará datos de telemetría ya recopilados (conservados según políticas de retención)
- NO tiene acceso ni responsabilidad sobre sus Datos Médicos locales
- Puede retener información necesaria para cumplir obligaciones legales`,
    },
    {
      id: "modifications",
      title: "11. MODIFICACIONES A LOS TÉRMINOS",
      content: `11.1. Derecho a Modificar

El Proveedor se reserva el derecho de modificar estos Términos en cualquier momento. Las modificaciones pueden incluir:
- Actualización de políticas de telemetría
- Cambios en funcionalidades del Software
- Ajustes por cambios legales o regulatorios
- Mejoras en la descripción de responsabilidades

11.2. Notificación de Cambios

Los cambios serán notificados mediante:
- Notificación dentro del Software al iniciar sesión
- Correo electrónico (si se proporcionó durante el registro)
- Publicación en el sitio web oficial (cuando esté disponible)

11.3. Aceptación de Cambios

El uso continuado del Software después de la notificación de cambios constituye su aceptación de los Términos modificados. Si NO acepta los cambios, debe descontinuar el uso del Software.

11.4. Versiones de los Términos

Cada versión de los Términos estará identificada con:
- Número de versión (ejemplo: 1.0.0, 1.1.0, 2.0.0)
- Fecha de última actualización
- Fecha de entrada en vigor`,
    },
    {
      id: "general",
      title: "12. DISPOSICIONES GENERALES",
      content: `12.1. Ley Aplicable y Jurisdicción

Estos Términos se regirán e interpretarán conforme a las leyes de la República del Ecuador. Cualquier controversia derivada de estos Términos será resuelta por los tribunales competentes de Ecuador.

12.2. Idioma

Estos Términos están redactados en español. Cualquier traducción a otros idiomas es únicamente para conveniencia. En caso de conflicto, prevalecerá la versión en español.

12.3. Divisibilidad

Si cualquier disposición de estos Términos es declarada inválida o inaplicable por un tribunal competente, las demás disposiciones permanecerán en pleno vigor y efecto.

12.4. Renuncia

La falta de ejercicio o aplicación por parte del Proveedor de cualquier derecho o disposición de estos Términos NO constituirá una renuncia a dicho derecho o disposición.

12.5. Acuerdo Completo

Estos Términos constituyen el acuerdo completo entre el Usuario y el Proveedor con respecto al uso del Software, y reemplazan todos los acuerdos previos, escritos u orales.

12.6. Cesión

El Usuario NO puede ceder, transferir o sublicenciar sus derechos u obligaciones bajo estos Términos sin el consentimiento previo y por escrito del Proveedor.

12.7. Fuerza Mayor

El Proveedor no será responsable por incumplimientos causados por circunstancias fuera de su control razonable, incluyendo desastres naturales, guerras, disturbios, pandemias, fallas de internet o interrupciones de servicios de terceros.

12.8. Notificaciones

Todas las notificaciones relacionadas con estos Términos deben enviarse a:

Proveedor:
Correo electrónico: soporte@oklus.com

Usuario:
A la dirección de correo electrónico proporcionada durante la instalación (si aplica)

12.9. Supervivencia

Las disposiciones que por su naturaleza deban sobrevivir a la terminación de estos Términos (incluyendo limitaciones de responsabilidad, indemnizaciones, y disposiciones sobre datos) continuarán en vigor después de la terminación.`,
    },
    {
      id: "contact",
      title: "13. INFORMACIÓN DE CONTACTO",
      content: `Para preguntas, comentarios o ejercicio de derechos relacionados con estos Términos o el Software, puede contactar al Proveedor:

Soporte Técnico:
Correo electrónico: soporte@oklus.com

Protección de Datos:
Correo electrónico: privacidad@oklus.com

Información General:
Sitio web: www.oklus.com (cuando esté disponible)

---

DECLARACIÓN DE ACEPTACIÓN

Al hacer clic en "Acepto" o al utilizar el Software, usted reconoce que:
- Ha leído estos Términos en su totalidad
- Comprende las obligaciones y restricciones establecidas
- Acepta estar legalmente vinculado por estos Términos
- Cumple con los requisitos profesionales para utilizar el Software
- Acepta la recopilación de datos de telemetría según la Sección 6
- Acepta su responsabilidad exclusiva sobre los Datos Médicos según la Sección 7

Si NO acepta estos Términos, NO utilice el Software.

---
`,
    },
  ],
};
