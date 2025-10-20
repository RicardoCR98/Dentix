// src/lib/storage/TauriSqliteRepository.ts
import Database from "@tauri-apps/plugin-sql";
import type { Patient, Visit, SessionRow, ProcItem } from "../types";

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
      [like]
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
      [id]
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
        ]
      );
      return p.id;
    }

    // Si no hay id, pero hay doc_id → upsert por doc_id
    if (p.doc_id) {
      const ex = await this.conn.select<Array<{ id: number }>>(
        `SELECT id FROM patients WHERE doc_id = $1`,
        [p.doc_id]
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
          ]
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
      ]
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
      [patientId]
    );
  }

  /** Paginado de visitas de un paciente. */
  async getVisitsByPatientPaged(patientId: number, page = 1, pageSize = 10): Promise<{
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
      [patientId]
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
      [patientId, safeSize, offset]
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
      [visitId]
    );
    return rows[0] ?? null;
  }

  private async insertVisit(
    patient_id: number,
    v: Visit & { autoDxText?: string; manualDxText?: string; fullDxText?: string }
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
      ]
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
        [visitId]
      );
      // 2) Sesiones de esa visita
      await db.execute(`DELETE FROM sessions WHERE visit_id = $1`, [visitId]);
      // 3) Adjuntos asociados a esa visita (solo metadatos; los archivos quedan en disco)
      await db.execute(`DELETE FROM attachments WHERE visit_id = $1`, [visitId]);
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
         (visit_id, date, auto, budget, payment, balance, signer)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [visitId, s.date, s.auto ? 1 : 0, s.budget, s.payment, s.balance, s.signer ?? null]
    );
    return Number(res.lastInsertId);
  }

  private async insertSessionItems(sessionId: number, items: ProcItem[]) {
    for (const it of items) {
      if ((it.qty ?? 0) <= 0) continue;
      await this.conn.execute(
        `INSERT INTO session_items (session_id, name, unit, qty, sub)
         VALUES ($1,$2,$3,$4,$5)`,
        [sessionId, it.name, it.unit, it.qty, it.sub]
      );
    }
  }

  /** Sesiones de una visita (detalle con items). */
  async getSessionsByVisit(visitId: number): Promise<SessionRow[]> {
    const sessions = await this.conn.select<
      Array<{
        id: number;
        date: string;
        auto: number;
        budget: number;
        payment: number;
        balance: number;
        signer: string | null;
      }>
    >(
      `SELECT id, date, auto, budget, payment, balance, signer
         FROM sessions
        WHERE visit_id = $1
        ORDER BY date DESC, id DESC`,
      [visitId]
    );

    const out: SessionRow[] = [];
    for (const s of sessions) {
      const items = await this.conn.select<ProcItem[]>(
        `SELECT name, unit, qty, sub
           FROM session_items
          WHERE session_id = $1`,
        [s.id]
      );
      out.push({
        id: String(s.id),
        date: s.date,
        auto: !!s.auto,
        budget: s.budget,
        payment: s.payment,
        balance: s.balance,
        signer: s.signer ?? "",
        items,
      });
    }
    return out;
  }

  /** Todas las sesiones del paciente (timeline), ordenadas desc por fecha/id. */
  async getSessionsByPatient(patientId: number): Promise<SessionRow[]> {
    const rows = await this.conn.select<
      Array<{
        id: number;
        visit_id: number;
        date: string;
        auto: number;
        budget: number;
        payment: number;
        balance: number;
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
              s.signer
         FROM sessions s
         JOIN visits v ON v.id = s.visit_id
        WHERE v.patient_id = $1
        ORDER BY s.date DESC, s.id DESC`,
      [patientId]
    );

    const result: SessionRow[] = [];
    for (const r of rows) {
      const items = await this.conn.select<ProcItem[]>(
        `SELECT name, unit, qty, sub FROM session_items WHERE session_id = $1`,
        [r.id]
      );
      result.push({
        id: String(r.id),
        date: r.date,
        auto: !!r.auto,
        budget: r.budget,
        payment: r.payment,
        balance: r.balance,
        signer: r.signer ?? "",
        items,
        visitId: r.visit_id,
      });
    }
    return result;
  }

  /** Guardar paciente + visita + sesiones (con items) en transacción. */
  async saveVisitWithSessions(payload: {
    patient: Patient;
    visit: Visit & { autoDxText?: string; manualDxText?: string; fullDxText?: string };
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
      [visitId]
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
      [patientId]
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
      ]
    );
    return Number(res.lastInsertId);
  }

  async moveAttachmentToVisit(attachmentId: number, visitId: number | null) {
    await this.conn.execute(
      `UPDATE attachments SET visit_id = $2 WHERE id = $1`,
      [attachmentId, visitId]
    );
  }

  async deleteAttachment(attachmentId: number) {
    await this.conn.execute(`DELETE FROM attachments WHERE id = $1`, [attachmentId]);
  }
}

// -----------------------------
// Singleton
// -----------------------------
let _repo: TauriSqliteRepository | null = null;
export async function getRepository() {
  if (!_repo) {
    _repo = new TauriSqliteRepository();
    await _repo.initialize();
  }
  return _repo;
}
