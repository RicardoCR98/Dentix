// src/lib/storage/TauriSqliteRepository.ts
import Database from "@tauri-apps/plugin-sql";
import type {
  Patient,
  Visit,
  SessionRow,
  ProcItem,
  ProcedureTemplate,
  DiagnosisOption,
} from "../types";

/** Fila completa de la tabla visits (para detalles) */
type VisitRow = {
  id: number;
  patient_id: number;
  date: string;
  reason_type: string | null;
  reason_detail: string | null;
  diagnosis: string | null;
  auto_dx_text: string | null;
  manual_dx_text: string | null;
  full_dx_text: string | null;
  tooth_dx_json: string | null;
};

/** Fila reducida para listar visitas de un paciente (histórico) */
export type VisitListRow = {
  id: number;
  date: string;
  reason_type: string | null;
  reason_detail: string | null;
  diagnosis: string | null;
  full_dx_text: string | null;
  tooth_dx_json: string | null;
};

export class TauriSqliteRepository {
  private db: Database | null = null;

  async initialize() {
    // clinic.db ya se crea y migra desde Rust (tauri-plugin-sql)
    this.db = await Database.load("sqlite:clinic.db");
    await this.db.execute("PRAGMA foreign_keys = ON;");

    // Crear tabla de versiones de migración si no existe
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Ejecutar migraciones pendientes
    await this.runMigrations();
  }

  private async hasMigration(version: number): Promise<boolean> {
    const rows = await this.db!.select<Array<{ count: number }>>(
      "SELECT COUNT(*) as count FROM schema_migrations WHERE version = ?",
      [version],
    );
    return (rows[0]?.count ?? 0) > 0;
  }

  private async markMigration(version: number): Promise<void> {
    await this.db!.execute(
      "INSERT INTO schema_migrations (version) VALUES (?)",
      [version],
    );
  }

  private async runMigrations() {
    // Migración 002: Plantillas y doctores
    if (!(await this.hasMigration(2))) {
      await this.executeMigration002();
      await this.markMigration(2);
    }
    // Migración 003: Opciones de diagnóstico
    if (!(await this.hasMigration(3))) {
      await this.executeMigration003();
      await this.markMigration(3);
    }
    // Migración 004: Índices compuestos para optimizar queries
    if (!(await this.hasMigration(4))) {
      await this.executeMigration004();
      await this.markMigration(4);
    }
  }

  private async executeMigration002() {
    // Agregar campo discount a sessions
    try {
      await this.db!.execute(
        "ALTER TABLE sessions ADD COLUMN discount INTEGER NOT NULL DEFAULT 0",
      );
    } catch {
      // Ya existe, ignorar
    }

    // Crear tabla signers
    await this.db!.execute(`
      CREATE TABLE IF NOT EXISTS signers (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL UNIQUE,
        active     INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Crear tabla procedure_templates
    await this.db!.execute(`
      CREATE TABLE IF NOT EXISTS procedure_templates (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL UNIQUE,
        default_price INTEGER NOT NULL DEFAULT 0,
        active        INTEGER NOT NULL DEFAULT 1,
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Triggers
    await this.db!.execute(`
      CREATE TRIGGER IF NOT EXISTS trg_signers_updated_at
      AFTER UPDATE ON signers
      FOR EACH ROW
      BEGIN
        UPDATE signers SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);

    await this.db!.execute(`
      CREATE TRIGGER IF NOT EXISTS trg_procedure_templates_updated_at
      AFTER UPDATE ON procedure_templates
      FOR EACH ROW
      BEGIN
        UPDATE procedure_templates SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);

    // Datos iniciales - procedimientos predefinidos (SOLO PRIMERA VEZ)
    const defaultProcs = [
      "Curación",
      "Resinas simples",
      "Resinas compuestas",
      "Extracciones simples",
      "Extracciones complejas",
      "Correctivo inicial",
      "Control mensual",
      "Prótesis total",
      "Prótesis removible",
      "Prótesis fija",
      "Retenedor",
      "Endodoncia simple",
      "Endodoncia compleja",
      "Limpieza simple",
      "Limpieza compleja",
      "Reposición",
      "Pegada",
    ];

    for (const name of defaultProcs) {
      await this.db!.execute(
        `INSERT OR IGNORE INTO procedure_templates (name, default_price) VALUES (?, 0)`,
        [name],
      );
    }

    // Datos iniciales - doctores por defecto (SOLO PRIMERA VEZ)
    const defaultSigners = ["Dr. Ejemplo 1", "Dra. Ejemplo 2"];
    for (const name of defaultSigners) {
      await this.db!.execute(
        `INSERT OR IGNORE INTO signers (name, active) VALUES (?, 1)`,
        [name],
      );
    }

    // Índices
    await this.db!.execute(
      `CREATE INDEX IF NOT EXISTS idx_procedure_templates_active ON procedure_templates(active)`,
    );
    await this.db!.execute(
      `CREATE INDEX IF NOT EXISTS idx_signers_active ON signers(active)`,
    );
  }

  private async executeMigration003() {
    // Crear tabla diagnosis_options
    await this.db!.execute(`
      CREATE TABLE IF NOT EXISTS diagnosis_options (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        label      TEXT NOT NULL UNIQUE,
        color      TEXT NOT NULL DEFAULT 'success',
        active     INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Trigger para updated_at
    await this.db!.execute(`
      CREATE TRIGGER IF NOT EXISTS trg_diagnosis_options_updated_at
      AFTER UPDATE ON diagnosis_options
      FOR EACH ROW
      BEGIN
        UPDATE diagnosis_options SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);

    // Datos iniciales - opciones por defecto
    const defaultOptions = [
      { label: "Caries", color: "info", sort_order: 1 },
      { label: "Gingivitis", color: "info", sort_order: 2 },
      { label: "Fractura", color: "info", sort_order: 3 },
      { label: "Pérdida", color: "info", sort_order: 4 },
      { label: "Obturación", color: "info", sort_order: 5 },
      { label: "Endodoncia", color: "info", sort_order: 6 },
    ];

    for (const opt of defaultOptions) {
      await this.db!.execute(
        `INSERT OR IGNORE INTO diagnosis_options (label, color, sort_order, active)
         VALUES ($1, $2, $3, 1)`,
        [opt.label, opt.color, opt.sort_order],
      );
    }

    // Índices
    await this.db!.execute(
      `CREATE INDEX IF NOT EXISTS idx_diagnosis_options_active ON diagnosis_options(active)`,
    );
    await this.db!.execute(
      `CREATE INDEX IF NOT EXISTS idx_diagnosis_options_sort_order ON diagnosis_options(sort_order)`,
    );
  }

  private async executeMigration004() {
    // Índices compuestos para optimizar queries de ordenamiento por fecha
    // Esto mejora significativamente el performance de getSessionsByPatient y queries similares

    // Índice compuesto para sessions ordenadas por fecha/id descendente
    await this.db!.execute(
      `CREATE INDEX IF NOT EXISTS idx_sessions_date_id_desc
       ON sessions(date DESC, id DESC)`,
    );

    // Índice compuesto para visits ordenadas por fecha/id descendente
    await this.db!.execute(
      `CREATE INDEX IF NOT EXISTS idx_visits_date_id_desc
       ON visits(date DESC, id DESC)`,
    );

    // Índice compuesto para visits de un paciente ordenadas por fecha
    await this.db!.execute(
      `CREATE INDEX IF NOT EXISTS idx_visits_patient_date_desc
       ON visits(patient_id, date DESC, id DESC)`,
    );
  }

  private get conn(): Database {
    if (!this.db) throw new Error("DB no inicializada. Llama a initialize().");
    return this.db!;
  }

  // -------------------------------------------------------------------------
  // PACIENTES
  // -------------------------------------------------------------------------
  async searchPatients(q: string) {
    const like = `%${q}%`;
    return this.conn.select<Array<Patient & { id: number }>>(
      `SELECT id,
              full_name,
              doc_id,
              phone,
              age,
              anamnesis,
              allergy_detail AS allergyDetail
         FROM patients
        WHERE full_name LIKE $1
           OR doc_id    LIKE $1
           OR phone     LIKE $1
        ORDER BY full_name`,
      [like],
    );
  }

  async findPatientById(id: number) {
    const rows = await this.conn.select<Array<Patient & { id: number }>>(
      `SELECT id,
              full_name,
              doc_id,
              phone,
              age,
              anamnesis,
              allergy_detail AS allergyDetail
         FROM patients
        WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async upsertPatient(p: Patient): Promise<number> {
    // Si viene id → update directo
    if (p.id) {
      await this.conn.execute(
        `UPDATE patients
            SET full_name = $1,
                doc_id    = $2,
                phone     = $3,
                age       = $4,
                anamnesis = $5,
                allergy_detail = $6,
                updated_at = datetime('now')
          WHERE id = $7`,
        [
          p.full_name,
          p.doc_id ?? null,
          p.phone ?? null,
          p.age ?? null,
          p.anamnesis ?? null,
          p.allergyDetail ?? null,
          p.id,
        ],
      );
      return p.id;
    }

    // Si no hay id, pero hay doc_id → upsert por doc_id
    if (p.doc_id) {
      const ex = await this.conn.select<Array<{ id: number }>>(
        `SELECT id FROM patients WHERE doc_id = $1`,
        [p.doc_id],
      );
      if (ex[0]) {
        await this.conn.execute(
          `UPDATE patients
              SET full_name = $1,
                  phone     = $2,
                  age       = $3,
                  anamnesis = $4,
                  allergy_detail = $5,
                  updated_at = datetime('now')
            WHERE id = $6`,
          [
            p.full_name,
            p.phone ?? null,
            p.age ?? null,
            p.anamnesis ?? null,
            p.allergyDetail ?? null,
            ex[0].id,
          ],
        );
        return ex[0].id;
      }
    }

    // Insert nuevo
    const res = await this.conn.execute(
      `INSERT INTO patients (full_name, doc_id, phone, age, anamnesis, allergy_detail)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        p.full_name,
        p.doc_id ?? null,
        p.phone ?? null,
        p.age ?? null,
        p.anamnesis ?? null,
        p.allergyDetail ?? null,
      ],
    );
    return Number(res.lastInsertId);
  }

  // -------------------------------------------------------------------------
  // VISITAS
  // -------------------------------------------------------------------------

  /** Histórico del paciente, ordenado por fecha desc/id desc. Trae tooth_dx_json. */
  async getVisitsByPatient(patientId: number) {
    return this.conn.select<VisitListRow[]>(
      `SELECT id,
              date,
              reason_type,
              reason_detail,
              diagnosis,
              full_dx_text,
              tooth_dx_json
         FROM visits
        WHERE patient_id = $1
        ORDER BY date DESC, id DESC`,
      [patientId],
    );
  }

  /** Paginado de visitas de un paciente. */
  async getVisitsByPatientPaged(
    patientId: number,
    page = 1,
    pageSize = 10,
  ): Promise<{
    rows: VisitListRow[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const safePage = Math.max(1, Math.floor(page));
    const safeSize = Math.min(50, Math.max(5, Math.floor(pageSize)));
    const offset = (safePage - 1) * safeSize;

    const totalRows = await this.conn.select<Array<{ total: number }>>(
      `SELECT COUNT(*) AS total
         FROM visits
        WHERE patient_id = $1`,
      [patientId],
    );
    const total = Number(totalRows[0]?.total ?? 0);

    const rows = await this.conn.select<VisitListRow[]>(
      `SELECT id,
              date,
              reason_type,
              reason_detail,
              diagnosis,
              full_dx_text,
              tooth_dx_json
         FROM visits
        WHERE patient_id = $1
        ORDER BY date DESC, id DESC
        LIMIT $2 OFFSET $3`,
      [patientId, safeSize, offset],
    );

    return { rows, total, page: safePage, pageSize: safeSize };
  }

  async getVisitDetail(visitId: number) {
    const rows = await this.conn.select<VisitRow[]>(
      `SELECT id,
              patient_id,
              date,
              reason_type,
              reason_detail,
              diagnosis,
              auto_dx_text,
              manual_dx_text,
              full_dx_text,
              tooth_dx_json
         FROM visits
        WHERE id = $1`,
      [visitId],
    );
    return rows[0] ?? null;
  }

  private async insertVisit(
    patient_id: number,
    v: Visit & {
      autoDxText?: string;
      manualDxText?: string;
      fullDxText?: string;
    },
  ): Promise<number> {
    const res = await this.conn.execute(
      `INSERT INTO visits
         (patient_id, date, reason_type, reason_detail, diagnosis,
          auto_dx_text, manual_dx_text, full_dx_text, tooth_dx_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        patient_id,
        v.date!,
        v.reasonType!,
        v.reasonDetail ?? null,
        v.diagnosis ?? null,
        v.autoDxText ?? null,
        v.manualDxText ?? null,
        v.fullDxText ?? null,
        v.toothDx ? JSON.stringify(v.toothDx) : null,
      ],
    );
    return Number(res.lastInsertId);
  }

  /** Elimina una visita y todo su contenido (sesiones, items y adjuntos de esa visita). */
  async deleteVisit(visitId: number): Promise<void> {
    const db = this.conn;
    await db.execute("BEGIN");
    try {
      // 1) Items de sesiones de esa visita
      await db.execute(
        `DELETE FROM session_items
          WHERE session_id IN (SELECT id FROM sessions WHERE visit_id = $1)`,
        [visitId],
      );
      // 2) Sesiones de esa visita
      await db.execute(`DELETE FROM sessions WHERE visit_id = $1`, [visitId]);
      // 3) Adjuntos asociados a esa visita (solo metadatos; los archivos quedan en disco)
      await db.execute(`DELETE FROM attachments WHERE visit_id = $1`, [
        visitId,
      ]);
      // 4) Visita
      await db.execute(`DELETE FROM visits WHERE id = $1`, [visitId]);

      await db.execute("COMMIT");
    } catch (e) {
      await db.execute("ROLLBACK");
      throw e;
    }
  }

  // -------------------------------------------------------------------------
  // SESIONES
  // -------------------------------------------------------------------------
  private async insertSession(visitId: number, s: SessionRow): Promise<number> {
    const res = await this.conn.execute(
      `INSERT INTO sessions
         (visit_id, date, auto, budget, payment, balance, discount, signer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        visitId,
        s.date,
        s.auto ? 1 : 0,
        s.budget,
        s.payment,
        s.balance,
        s.discount ?? 0,
        s.signer ?? null,
      ],
    );
    return Number(res.lastInsertId);
  }

  private async insertSessionItems(sessionId: number, items: ProcItem[]) {
    for (const it of items) {
      // Guardar TODOS los items (incluso con qty=0) para preservar
      // la plantilla personalizada del doctor
      await this.conn.execute(
        `INSERT INTO session_items (session_id, name, unit, qty, sub)
         VALUES ($1,$2,$3,$4,$5)`,
        [sessionId, it.name, it.unit, it.qty, it.sub],
      );
    }
  }

  /** Sesiones de una visita (detalle con items).
   * OPTIMIZADO: usa 2 queries totales en lugar de N+1 */
  async getSessionsByVisit(visitId: number): Promise<SessionRow[]> {
    // Query 1: Obtener todas las sesiones
    const sessions = await this.conn.select<
      Array<{
        id: number;
        date: string;
        auto: number;
        budget: number;
        payment: number;
        balance: number;
        discount: number;
        signer: string | null;
      }>
    >(
      `SELECT id, date, auto, budget, payment, balance, discount, signer
         FROM sessions
        WHERE visit_id = $1
        ORDER BY date DESC, id DESC`,
      [visitId],
    );

    // Si no hay sesiones, retornar vacío
    if (sessions.length === 0) return [];

    // Query 2: Obtener TODOS los items de TODAS las sesiones de una vez
    const sessionIds = sessions.map((s) => s.id);
    const placeholders = sessionIds.map(() => "?").join(",");
    const allItems = await this.conn.select<
      Array<ProcItem & { session_id: number }>
    >(
      `SELECT session_id, name, unit, qty, sub
       FROM session_items
       WHERE session_id IN (${placeholders})`,
      sessionIds,
    );

    // Agrupar items por session_id
    const itemsBySessionId = new Map<number, ProcItem[]>();
    for (const item of allItems) {
      const sessionId = item.session_id;
      if (!itemsBySessionId.has(sessionId)) {
        itemsBySessionId.set(sessionId, []);
      }
      // Eliminar session_id del item antes de agregarlo
      const { session_id, ...cleanItem } = item;
      itemsBySessionId.get(sessionId)!.push(cleanItem as ProcItem);
    }

    // Construir resultado final
    const out: SessionRow[] = sessions.map((s) => ({
      id: String(s.id),
      date: s.date,
      auto: !!s.auto,
      budget: s.budget,
      payment: s.payment,
      balance: s.balance,
      discount: s.discount,
      signer: s.signer ?? "",
      items: itemsBySessionId.get(s.id) ?? [],
    }));

    return out;
  }

  /** Todas las sesiones del paciente (timeline), ordenadas desc por fecha/id.
   * OPTIMIZADO: usa 2 queries totales en lugar de N+1 */
  async getSessionsByPatient(patientId: number): Promise<SessionRow[]> {
    // Query 1: Obtener todas las sesiones
    const rows = await this.conn.select<
      Array<{
        id: number;
        visit_id: number;
        date: string;
        auto: number;
        budget: number;
        payment: number;
        balance: number;
        discount: number;
        signer: string | null;
      }>
    >(
      `SELECT s.id,
              s.visit_id,
              s.date,
              s.auto,
              s.budget,
              s.payment,
              s.balance,
              s.discount,
              s.signer
         FROM sessions s
         JOIN visits v ON v.id = s.visit_id
        WHERE v.patient_id = $1
        ORDER BY s.date DESC, s.id DESC`,
      [patientId],
    );

    // Si no hay sesiones, retornar vacío
    if (rows.length === 0) return [];

    // Query 2: Obtener TODOS los items de TODAS las sesiones de una vez
    const sessionIds = rows.map((r) => r.id);
    const placeholders = sessionIds.map(() => "?").join(",");
    const allItems = await this.conn.select<
      Array<ProcItem & { session_id: number }>
    >(
      `SELECT session_id, name, unit, qty, sub
       FROM session_items
       WHERE session_id IN (${placeholders})`,
      sessionIds,
    );

    // Agrupar items por session_id
    const itemsBySessionId = new Map<number, ProcItem[]>();
    for (const item of allItems) {
      const sessionId = item.session_id;
      if (!itemsBySessionId.has(sessionId)) {
        itemsBySessionId.set(sessionId, []);
      }
      // Eliminar session_id del item antes de agregarlo
      const { session_id, ...cleanItem } = item;
      itemsBySessionId.get(sessionId)!.push(cleanItem as ProcItem);
    }

    // Construir resultado final
    const result: SessionRow[] = rows.map((r) => ({
      id: String(r.id),
      date: r.date,
      auto: !!r.auto,
      budget: r.budget,
      payment: r.payment,
      balance: r.balance,
      discount: r.discount,
      signer: r.signer ?? "",
      items: itemsBySessionId.get(r.id) ?? [],
      visitId: r.visit_id,
    }));

    return result;
  }

  /** Guardar paciente + visita + sesiones (con items) en transacción. */
  async saveVisitWithSessions(payload: {
    patient: Patient;
    visit: Visit & {
      autoDxText?: string;
      manualDxText?: string;
      fullDxText?: string;
    };
    sessions: SessionRow[];
  }): Promise<{ patientId: number; visitId: number }> {
    const db = this.conn;
    await db.execute("BEGIN");
    try {
      const patientId = await this.upsertPatient(payload.patient);
      const visitId = await this.insertVisit(patientId, payload.visit);
      for (const s of payload.sessions) {
        const sid = await this.insertSession(visitId, s);
        await this.insertSessionItems(sid, s.items || []);
      }
      await db.execute("COMMIT");
      return { patientId, visitId };
    } catch (e) {
      await db.execute("ROLLBACK");
      throw e;
    }
  }

  // -------------------------------------------------------------------------
  // ADJUNTOS
  // -------------------------------------------------------------------------
  async getAttachmentsByVisit(visitId: number) {
    return this.conn.select<
      Array<{
        id: number;
        kind: string | null;
        filename: string;
        mime_type: string;
        bytes: number;
        storage_key: string;
        checksum: string | null;
        note: string | null;
        created_at: string;
      }>
    >(
      `SELECT id, kind, filename, mime_type, bytes, storage_key, checksum, note, created_at
         FROM attachments
        WHERE visit_id = $1
        ORDER BY created_at DESC, id DESC`,
      [visitId],
    );
  }

  async getAttachmentsByPatient(patientId: number) {
    return this.conn.select<
      Array<{
        id: number;
        kind: string | null;
        filename: string;
        mime_type: string;
        bytes: number;
        storage_key: string;
        checksum: string | null;
        note: string | null;
        created_at: string;
      }>
    >(
      `SELECT id, kind, filename, mime_type, bytes, storage_key, checksum, note, created_at
         FROM attachments
        WHERE patient_id = $1
          AND visit_id IS NULL
        ORDER BY created_at DESC, id DESC`,
      [patientId],
    );
  }

  async createAttachment(meta: {
    patient_id: number;
    visit_id?: number | null;
    kind?: string | null;
    filename: string;
    mime_type: string;
    bytes: number;
    storage_key: string;
    checksum?: string | null;
    note?: string | null;
  }): Promise<number> {
    const res = await this.conn.execute(
      `INSERT INTO attachments
         (patient_id, visit_id, kind, filename, mime_type, bytes, storage_key, checksum, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        meta.patient_id,
        meta.visit_id ?? null,
        meta.kind ?? null,
        meta.filename,
        meta.mime_type,
        meta.bytes,
        meta.storage_key,
        meta.checksum ?? null,
        meta.note ?? null,
      ],
    );
    return Number(res.lastInsertId);
  }

  async moveAttachmentToVisit(attachmentId: number, visitId: number | null) {
    await this.conn.execute(
      `UPDATE attachments SET visit_id = $2 WHERE id = $1`,
      [attachmentId, visitId],
    );
  }

  async deleteAttachment(attachmentId: number) {
    await this.conn.execute(`DELETE FROM attachments WHERE id = $1`, [
      attachmentId,
    ]);
  }

  // -------------------------------------------------------------------------
  // PROCEDURE TEMPLATES (Plantilla global de procedimientos)
  // -------------------------------------------------------------------------
  async getProcedureTemplates(): Promise<ProcedureTemplate[]> {
    return this.conn.select<ProcedureTemplate[]>(
      `SELECT id, name, default_price, active, created_at, updated_at
         FROM procedure_templates
        WHERE active = 1
        ORDER BY id ASC`,
    );
  }

  async saveProcedureTemplates(
    templates: Array<{ name: string; default_price: number }>,
  ): Promise<void> {
    // Estrategia: eliminar todos y reinsertar
    // (O podrías hacer un diff inteligente, pero esto es más simple)
    await this.conn.execute(`DELETE FROM procedure_templates`);

    for (const t of templates) {
      await this.conn.execute(
        `INSERT INTO procedure_templates (name, default_price, active)
         VALUES ($1, $2, 1)`,
        [t.name, t.default_price],
      );
    }
  }

  // -------------------------------------------------------------------------
  // SIGNERS (Doctores/Responsables)
  // -------------------------------------------------------------------------
  async getSigners(): Promise<Array<{ id: number; name: string }>> {
    return this.conn.select<Array<{ id: number; name: string }>>(
      `SELECT id, name
         FROM signers
        WHERE active = 1
        ORDER BY name ASC`,
    );
  }

  async createSigner(name: string): Promise<number> {
    const trimmed = name.trim();

    // Verificar si ya existe (activo o inactivo)
    const existing = await this.conn.select<
      Array<{ id: number; active: number }>
    >(`SELECT id, active FROM signers WHERE name = $1`, [trimmed]);

    if (existing.length > 0) {
      const signer = existing[0];
      if (signer.active === 0) {
        // Si existe pero está inactivo, reactivarlo
        await this.conn.execute(`UPDATE signers SET active = 1 WHERE id = $1`, [
          signer.id,
        ]);
        return signer.id;
      } else {
        // Si existe y está activo, lanzar error
        throw new Error("Ya existe un doctor con ese nombre");
      }
    }

    // Si no existe, crear uno nuevo
    const res = await this.conn.execute(
      `INSERT INTO signers (name, active) VALUES ($1, 1)`,
      [trimmed],
    );
    return Number(res.lastInsertId);
  }

  async updateSigner(id: number, name: string): Promise<void> {
    await this.conn.execute(`UPDATE signers SET name = $1 WHERE id = $2`, [
      name.trim(),
      id,
    ]);
  }

  async deleteSigner(id: number): Promise<void> {
    // Soft delete: marcamos como inactivo
    await this.conn.execute(`UPDATE signers SET active = 0 WHERE id = $1`, [
      id,
    ]);
  }

  // -------------------------------------------------------------------------
  // DIAGNOSIS OPTIONS (Opciones de diagnóstico del odontograma)
  // -------------------------------------------------------------------------
  async getDiagnosisOptions(): Promise<DiagnosisOption[]> {
    return this.conn.select<DiagnosisOption[]>(
      `SELECT id, label, color, active, sort_order, created_at, updated_at
         FROM diagnosis_options
        WHERE active = 1
        ORDER BY sort_order ASC, id ASC`,
    );
  }

  async createDiagnosisOption(option: {
    label: string;
    color: string;
    sort_order: number;
  }): Promise<number> {
    const trimmed = option.label.trim();

    // Verificar si ya existe (activo o inactivo)
    const existing = await this.conn.select<
      Array<{ id: number; active: number }>
    >(`SELECT id, active FROM diagnosis_options WHERE label = $1`, [trimmed]);

    if (existing.length > 0) {
      const opt = existing[0];
      if (opt.active === 0) {
        // Si existe pero está inactivo, reactivarlo
        await this.conn.execute(
          `UPDATE diagnosis_options SET active = 1, color = $2, sort_order = $3 WHERE id = $1`,
          [opt.id, option.color, option.sort_order],
        );
        return opt.id;
      } else {
        // Si existe y está activo, lanzar error
        throw new Error("Ya existe una opción con ese nombre");
      }
    }

    // Si no existe, crear una nueva
    const res = await this.conn.execute(
      `INSERT INTO diagnosis_options (label, color, sort_order, active)
       VALUES ($1, $2, $3, 1)`,
      [trimmed, option.color, option.sort_order],
    );
    return Number(res.lastInsertId);
  }

  async updateDiagnosisOption(
    id: number,
    option: { label: string; color: string; sort_order: number },
  ): Promise<void> {
    await this.conn.execute(
      `UPDATE diagnosis_options
       SET label = $1, color = $2, sort_order = $3
       WHERE id = $4`,
      [option.label.trim(), option.color, option.sort_order, id],
    );
  }

  async deleteDiagnosisOption(id: number): Promise<void> {
    // Soft delete: marcamos como inactivo
    await this.conn.execute(
      `UPDATE diagnosis_options SET active = 0 WHERE id = $1`,
      [id],
    );
  }

  async saveDiagnosisOptions(
    options: Array<{ label: string; color: string; sort_order: number }>,
  ): Promise<void> {
    // Estrategia: eliminar todos y reinsertar
    await this.conn.execute(`DELETE FROM diagnosis_options`);

    for (const opt of options) {
      await this.conn.execute(
        `INSERT INTO diagnosis_options (label, color, sort_order, active)
         VALUES ($1, $2, $3, 1)`,
        [opt.label, opt.color, opt.sort_order],
      );
    }
  }
}

// -----------------------------
// Singleton
// -----------------------------
let _repo: TauriSqliteRepository | null = null;
let _initPromise: Promise<TauriSqliteRepository> | null = null;

export async function getRepository() {
  // Si ya está inicializado, retornar inmediatamente
  if (_repo) {
    return _repo;
  }

  // Si ya hay una inicialización en progreso, esperar a que termine
  if (_initPromise) {
    return _initPromise;
  }

  // Iniciar nueva inicialización
  _initPromise = (async () => {
    const repo = new TauriSqliteRepository();
    try {
      await repo.initialize();
      _repo = repo;
      return repo;
    } catch (error) {
      // Si falla la inicialización, resetear para que se pueda reintentar
      _initPromise = null;
      console.error("Error inicializando repositorio:", error);
      throw error;
    }
  })();

  return _initPromise;
}
