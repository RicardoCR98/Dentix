// src-tauri/src/commands.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;
use sqlx::Row;
use crate::DbPool;

// =========================
// STRUCTS (Match TypeScript types and DB schema)
// =========================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Patient {
    pub id: Option<i64>,
    pub full_name: String,
    pub doc_id: String,
    pub email: Option<String>,
    pub phone: String,
    pub emergency_phone: Option<String>,
    pub date_of_birth: String,
    pub anamnesis: Option<String>,
    pub allergy_detail: Option<String>,
    pub status: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

// Session (antes Visit)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Session {
    pub id: Option<i64>,
    pub patient_id: Option<i64>,
    pub date: String,

    // Reason (per session)
    pub reason_type: Option<String>,
    pub reason_detail: Option<String>,

    // Clinical
    pub diagnosis_text: Option<String>,
    pub auto_dx_text: Option<String>,
    pub full_dx_text: Option<String>,
    pub tooth_dx_json: Option<String>,
    pub clinical_notes: Option<String>,  // RENAMED: from observations
    pub signer: Option<String>,

    // Financial
    pub budget: f64,
    pub discount: f64,
    pub payment: f64,
    pub balance: f64,
    pub cumulative_balance: f64,
    pub payment_method_id: Option<i64>,   // NEW: FK to payment_methods
    pub payment_notes: Option<String>,     // NEW: Payment-specific notes

    // Metadata
    pub is_saved: Option<bool>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

// SessionItem (antes VisitProcedure)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SessionItem {
    pub id: Option<i64>,
    pub session_id: Option<i64>,
    pub name: String,
    pub unit_price: f64,
    pub quantity: i64,
    pub subtotal: f64,
    pub is_active: Option<bool>,
    pub tooth_number: Option<String>,       // NEW: Which tooth
    pub procedure_notes: Option<String>,    // NEW: Procedure-specific notes
    pub procedure_template_id: Option<i64>,
    pub sort_order: Option<i64>,
    pub created_at: Option<String>,
}

// SessionRow: Session with its items
// Frontend compatibility: still uses "visit" key for backwards compatibility
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SessionRow {
    pub visit: Session,  // Keep "visit" for frontend compatibility
    pub items: Vec<SessionItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcedureTemplate {
    pub id: Option<i64>,
    pub name: String,
    pub default_price: f64,
    pub active: Option<bool>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiagnosisOption {
    pub id: Option<i64>,
    pub label: String,
    pub color: String,
    pub active: Option<bool>,
    pub sort_order: Option<i64>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Signer {
    pub id: Option<i64>,
    pub name: String,
    pub active: Option<bool>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReasonType {
    pub id: Option<i64>,
    pub name: String,
    pub active: Option<bool>,
    pub sort_order: Option<i64>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

// NEW: PaymentMethod struct
#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentMethod {
    pub id: Option<i64>,
    pub name: String,
    pub active: Option<bool>,
    pub sort_order: Option<i64>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DoctorProfile {
    pub id: Option<i64>,
    pub doctor_id: String,
    pub name: String,
    pub email: Option<String>,
    pub clinic_name: Option<String>,
    pub clinic_hours: Option<String>,
    pub clinic_slogan: Option<String>,
    pub phone: Option<String>,
    pub location: Option<String>,
    pub app_version: Option<String>,
    pub agreed_to_terms: Option<bool>,
    pub last_sync: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Attachment {
    pub id: Option<i64>,
    pub patient_id: i64,
    pub session_id: Option<i64>,  // RENAMED: from visit_id
    pub kind: String,
    pub filename: String,
    pub mime_type: Option<String>,
    pub size_bytes: Option<i64>,
    pub storage_key: String,
    pub note: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserSetting {
    pub id: Option<i64>,
    pub key: String,
    pub value: Option<String>,
    pub category: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatientDebtSummary {
    pub patient_id: i64,
    pub full_name: String,
    pub phone: Option<String>,
    pub doc_id: String,

    // Financial
    pub current_balance: f64,

    // TRIADA (from patients)
    pub debt_opened_at: Option<String>,
    pub debt_archived: i64,
    pub last_contact_at: Option<String>,
    pub last_contact_type: Option<String>,

    // Calculated
    pub days_overdue: i64,
    pub contact_status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatientListItem {
    pub id: i64,
    pub full_name: String,
    pub doc_id: String,
    pub phone: String,
    pub allergy_detail: Option<String>,
    pub status: Option<String>,
    pub last_visit_date: Option<String>,
    pub pending_balance: f64,
    // Next appointment information
    pub next_appointment_id: Option<i64>,
    pub next_appointment_starts_at: Option<String>,
    pub next_appointment_procedure: Option<String>,
    pub next_appointment_status: Option<String>,
    pub appointments_count: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payment {
    pub id: Option<i64>,
    pub patient_id: i64,
    pub date: String,
    pub amount: f64,
    pub payment_method: Option<String>,
    pub notes: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TelemetryEvent {
    pub id: Option<i64>,
    pub doctor_id: String,
    pub event_type: String,
    pub event_data: Option<String>,
    pub timestamp: Option<String>,
    pub sent: Option<bool>,
    pub sent_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorLog {
    pub id: Option<i64>,
    pub doctor_id: Option<String>,
    pub error_type: String,
    pub error_message: Option<String>,
    pub stack_trace: Option<String>,
    pub context: Option<String>,
    pub timestamp: Option<String>,
    pub sent: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncQueueItem {
    pub id: Option<i64>,
    pub table_name: String,
    pub record_id: i64,
    pub operation: String,
    pub payload: Option<String>,
    pub created_at: Option<String>,
    pub synced: Option<bool>,
    pub synced_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveVisitPayload {
    pub patient: Patient,
    pub visit: Session,
    pub sessions: Vec<SessionRow>,
}

// =========================
// PATIENT COMMANDS
// =========================

#[tauri::command]
pub async fn get_all_patients_list(
    db_pool: State<'_, DbPool>,
) -> Result<Vec<PatientListItem>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT
            p.id,
            p.full_name,
            p.doc_id,
            p.phone,
            p.allergy_detail,
            p.status,
            MAX(s.date) as last_visit_date,
            COALESCE(CAST(SUM(CASE WHEN s.is_saved = 1 THEN s.balance ELSE 0 END) AS REAL), 0.0) as pending_balance,
            (
                SELECT id
                FROM appointments
                WHERE patient_id = p.id
                  AND starts_at >= datetime('now')
                  AND status IN ('scheduled', 'confirmed')
                ORDER BY starts_at ASC
                LIMIT 1
            ) as next_appointment_id,
            (
                SELECT starts_at
                FROM appointments
                WHERE patient_id = p.id
                  AND starts_at >= datetime('now')
                  AND status IN ('scheduled', 'confirmed')
                ORDER BY starts_at ASC
                LIMIT 1
            ) as next_appointment_starts_at,
            (
                SELECT procedure
                FROM appointments
                WHERE patient_id = p.id
                  AND starts_at >= datetime('now')
                  AND status IN ('scheduled', 'confirmed')
                ORDER BY starts_at ASC
                LIMIT 1
            ) as next_appointment_procedure,
            (
                SELECT status
                FROM appointments
                WHERE patient_id = p.id
                  AND starts_at >= datetime('now')
                  AND status IN ('scheduled', 'confirmed')
                ORDER BY starts_at ASC
                LIMIT 1
            ) as next_appointment_status,
            (
                SELECT COALESCE(COUNT(*), 0)
                FROM appointments
                WHERE patient_id = p.id
                  AND starts_at >= datetime('now')
                  AND status IN ('scheduled', 'confirmed')
            ) as appointments_count
         FROM patients p
         LEFT JOIN sessions s ON s.patient_id = p.id
         WHERE p.status = 'active'
         GROUP BY p.id, p.full_name, p.doc_id, p.phone, p.allergy_detail, p.status
         ORDER BY p.full_name ASC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let patients = rows
        .into_iter()
        .map(|row| PatientListItem {
            id: row.get("id"),
            full_name: row.get("full_name"),
            doc_id: row.get("doc_id"),
            phone: row.get("phone"),
            allergy_detail: row.get("allergy_detail"),
            status: row.get("status"),
            last_visit_date: row.get("last_visit_date"),
            pending_balance: row.get("pending_balance"),
            next_appointment_id: row.get("next_appointment_id"),
            next_appointment_starts_at: row.get("next_appointment_starts_at"),
            next_appointment_procedure: row.get("next_appointment_procedure"),
            next_appointment_status: row.get("next_appointment_status"),
            appointments_count: row.get("appointments_count"),
        })
        .collect();

    Ok(patients)
}

#[tauri::command]
pub async fn search_patients(
    db_pool: State<'_, DbPool>,
    query: String,
) -> Result<Vec<Patient>, String> {
    let pool = db_pool.0.lock().await;
    let search_term = format!("%{}%", query);

    let rows = sqlx::query(
        "SELECT id, full_name, doc_id, email, phone, emergency_phone, date_of_birth, anamnesis, allergy_detail, status, created_at, updated_at
         FROM patients
         WHERE full_name LIKE ?1 OR doc_id LIKE ?2
         ORDER BY full_name ASC
         LIMIT 50"
    )
    .bind(&search_term)
    .bind(&search_term)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let patients = rows
        .into_iter()
        .map(|row| Patient {
            id: row.get("id"),
            full_name: row.get("full_name"),
            doc_id: row.get("doc_id"),
            email: row.get("email"),
            phone: row.get("phone"),
            emergency_phone: row.get("emergency_phone"),
            date_of_birth: row.get("date_of_birth"),
            anamnesis: row.get("anamnesis"),
            allergy_detail: row.get("allergy_detail"),
            status: row.get("status"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(patients)
}

#[tauri::command]
pub async fn find_patient_by_id(
    db_pool: State<'_, DbPool>,
    id: i64,
) -> Result<Option<Patient>, String> {
    let pool = db_pool.0.lock().await;

    let row = sqlx::query(
        "SELECT id, full_name, doc_id, email, phone, emergency_phone, date_of_birth, anamnesis, allergy_detail, status, created_at, updated_at
         FROM patients
         WHERE id = ?1"
    )
    .bind(id)
    .fetch_optional(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row.map(|row| Patient {
        id: row.get("id"),
        full_name: row.get("full_name"),
        doc_id: row.get("doc_id"),
        email: row.get("email"),
        phone: row.get("phone"),
        emergency_phone: row.get("emergency_phone"),
        date_of_birth: row.get("date_of_birth"),
        anamnesis: row.get("anamnesis"),
        allergy_detail: row.get("allergy_detail"),
        status: row.get("status"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }))
}

#[tauri::command]
pub async fn upsert_patient(
    db_pool: State<'_, DbPool>,
    patient: Patient,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    if let Some(id) = patient.id {
        sqlx::query(
            "UPDATE patients
             SET full_name = ?1, doc_id = ?2, email = ?3, phone = ?4, emergency_phone = ?5,
                 date_of_birth = ?6, anamnesis = ?7, allergy_detail = ?8, status = ?9
             WHERE id = ?10"
        )
        .bind(&patient.full_name)
        .bind(&patient.doc_id)
        .bind(&patient.email)
        .bind(&patient.phone)
        .bind(&patient.emergency_phone)
        .bind(&patient.date_of_birth)
        .bind(&patient.anamnesis)
        .bind(&patient.allergy_detail)
        .bind(patient.status.as_deref().unwrap_or("active"))
        .bind(id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(id)
    } else {
        let result = sqlx::query(
            "INSERT INTO patients (full_name, doc_id, email, phone, emergency_phone, date_of_birth, anamnesis, allergy_detail, status)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
        )
        .bind(&patient.full_name)
        .bind(&patient.doc_id)
        .bind(&patient.email)
        .bind(&patient.phone)
        .bind(&patient.emergency_phone)
        .bind(&patient.date_of_birth)
        .bind(&patient.anamnesis)
        .bind(&patient.allergy_detail)
        .bind(patient.status.as_deref().unwrap_or("active"))
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(result.last_insert_rowid())
    }
}

// =========================
// SESSION COMMANDS (antes VISIT)
// =========================

#[tauri::command]
pub async fn get_visits_by_patient(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
) -> Result<Vec<Session>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, patient_id, date, reason_type, reason_detail,
                diagnosis_text, auto_dx_text, full_dx_text, tooth_dx_json,
                budget, discount, payment, balance, cumulative_balance,
                payment_method_id, payment_notes,
                signer, clinical_notes, is_saved, created_at, updated_at
         FROM sessions
         WHERE patient_id = ?1
         ORDER BY date DESC, id DESC"
    )
    .bind(patient_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let sessions = rows
        .into_iter()
        .map(|row| Session {
            id: row.get("id"),
            patient_id: row.get("patient_id"),
            date: row.get("date"),
            reason_type: row.get("reason_type"),
            reason_detail: row.get("reason_detail"),
            diagnosis_text: row.get("diagnosis_text"),
            auto_dx_text: row.get("auto_dx_text"),
            full_dx_text: row.get("full_dx_text"),
            tooth_dx_json: row.get("tooth_dx_json"),
            budget: row.get("budget"),
            discount: row.get("discount"),
            payment: row.get("payment"),
            balance: row.get("balance"),
            cumulative_balance: row.get("cumulative_balance"),
            payment_method_id: row.get("payment_method_id"),
            payment_notes: row.get("payment_notes"),
            signer: row.get("signer"),
            clinical_notes: row.get("clinical_notes"),
            is_saved: Some(row.get::<i64, _>("is_saved") != 0),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(sessions)
}

#[tauri::command]
pub async fn delete_visit(
    db_pool: State<'_, DbPool>,
    visit_id: i64,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    let row = sqlx::query("SELECT is_saved FROM sessions WHERE id = ?1")
        .bind(visit_id)
        .fetch_optional(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(row) = row {
        let is_saved: i64 = row.get("is_saved");
        if is_saved != 0 {
            return Err("Cannot delete a saved session".to_string());
        }
    }

    sqlx::query("DELETE FROM sessions WHERE id = ?1")
        .bind(visit_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// =========================
// SESSION ITEMS COMMANDS (antes VISIT PROCEDURES)
// =========================

#[tauri::command]
pub async fn get_procedures_by_visit(
    db_pool: State<'_, DbPool>,
    visit_id: i64,
) -> Result<Vec<SessionItem>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, session_id, name, unit_price, quantity, subtotal, is_active,
                tooth_number, procedure_notes, procedure_template_id, sort_order, created_at
         FROM session_items
         WHERE session_id = ?1
         ORDER BY sort_order ASC, id ASC"
    )
    .bind(visit_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let items = rows
        .into_iter()
        .map(|row| SessionItem {
            id: row.get("id"),
            session_id: row.get("session_id"),
            name: row.get("name"),
            unit_price: row.get("unit_price"),
            quantity: row.get("quantity"),
            subtotal: row.get("subtotal"),
            is_active: Some(row.get::<i64, _>("is_active") != 0),
            tooth_number: row.get("tooth_number"),
            procedure_notes: row.get("procedure_notes"),
            procedure_template_id: row.get("procedure_template_id"),
            sort_order: row.get("sort_order"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(items)
}

#[tauri::command]
pub async fn get_sessions_by_patient(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
) -> Result<Vec<SessionRow>, String> {
    let pool = db_pool.0.lock().await;

    let session_rows = sqlx::query(
        "SELECT id, patient_id, date, reason_type, reason_detail,
                diagnosis_text, auto_dx_text, full_dx_text, tooth_dx_json,
                budget, discount, payment, balance, cumulative_balance,
                payment_method_id, payment_notes,
                signer, clinical_notes, is_saved, created_at, updated_at
         FROM sessions
         WHERE patient_id = ?1
         ORDER BY date DESC, id DESC"
    )
    .bind(patient_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let mut sessions = Vec::new();

    for sess_row in session_rows {
        let session_id: i64 = sess_row.get("id");

        let session = Session {
            id: Some(session_id),
            patient_id: sess_row.get("patient_id"),
            date: sess_row.get("date"),
            reason_type: sess_row.get("reason_type"),
            reason_detail: sess_row.get("reason_detail"),
            diagnosis_text: sess_row.get("diagnosis_text"),
            auto_dx_text: sess_row.get("auto_dx_text"),
            full_dx_text: sess_row.get("full_dx_text"),
            tooth_dx_json: sess_row.get("tooth_dx_json"),
            budget: sess_row.get("budget"),
            discount: sess_row.get("discount"),
            payment: sess_row.get("payment"),
            balance: sess_row.get("balance"),
            cumulative_balance: sess_row.get("cumulative_balance"),
            payment_method_id: sess_row.get("payment_method_id"),
            payment_notes: sess_row.get("payment_notes"),
            signer: sess_row.get("signer"),
            clinical_notes: sess_row.get("clinical_notes"),
            is_saved: Some(sess_row.get::<i64, _>("is_saved") != 0),
            created_at: sess_row.get("created_at"),
            updated_at: sess_row.get("updated_at"),
        };

        let item_rows = sqlx::query(
            "SELECT id, session_id, name, unit_price, quantity, subtotal, is_active,
                    tooth_number, procedure_notes, procedure_template_id, sort_order, created_at
             FROM session_items
             WHERE session_id = ?1
             ORDER BY sort_order ASC, id ASC"
        )
        .bind(session_id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?;

        let items: Vec<SessionItem> = item_rows
            .into_iter()
            .map(|row| SessionItem {
                id: row.get("id"),
                session_id: row.get("session_id"),
                name: row.get("name"),
                unit_price: row.get("unit_price"),
                quantity: row.get("quantity"),
                subtotal: row.get("subtotal"),
                is_active: Some(row.get::<i64, _>("is_active") != 0),
                tooth_number: row.get("tooth_number"),
                procedure_notes: row.get("procedure_notes"),
                procedure_template_id: row.get("procedure_template_id"),
                sort_order: row.get("sort_order"),
                created_at: row.get("created_at"),
            })
            .collect();

        sessions.push(SessionRow { visit: session, items });
    }

    Ok(sessions)
}

#[tauri::command]
pub async fn get_sessions_by_visit(
    db_pool: State<'_, DbPool>,
    visit_id: i64,
) -> Result<Vec<SessionRow>, String> {
    let pool = db_pool.0.lock().await;

    let sess_row = sqlx::query(
        "SELECT id, patient_id, date, reason_type, reason_detail,
                diagnosis_text, auto_dx_text, full_dx_text, tooth_dx_json,
                budget, discount, payment, balance, cumulative_balance,
                payment_method_id, payment_notes,
                signer, clinical_notes, is_saved, created_at, updated_at
         FROM sessions
         WHERE id = ?1"
    )
    .bind(visit_id)
    .fetch_optional(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(row) = sess_row {
        let session = Session {
            id: row.get("id"),
            patient_id: row.get("patient_id"),
            date: row.get("date"),
            reason_type: row.get("reason_type"),
            reason_detail: row.get("reason_detail"),
            diagnosis_text: row.get("diagnosis_text"),
            auto_dx_text: row.get("auto_dx_text"),
            full_dx_text: row.get("full_dx_text"),
            tooth_dx_json: row.get("tooth_dx_json"),
            budget: row.get("budget"),
            discount: row.get("discount"),
            payment: row.get("payment"),
            balance: row.get("balance"),
            cumulative_balance: row.get("cumulative_balance"),
            payment_method_id: row.get("payment_method_id"),
            payment_notes: row.get("payment_notes"),
            signer: row.get("signer"),
            clinical_notes: row.get("clinical_notes"),
            is_saved: Some(row.get::<i64, _>("is_saved") != 0),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };

        let item_rows = sqlx::query(
            "SELECT id, session_id, name, unit_price, quantity, subtotal, is_active,
                    tooth_number, procedure_notes, procedure_template_id, sort_order, created_at
             FROM session_items
             WHERE session_id = ?1
             ORDER BY sort_order ASC, id ASC"
        )
        .bind(visit_id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?;

        let items: Vec<SessionItem> = item_rows
            .into_iter()
            .map(|row| SessionItem {
                id: row.get("id"),
                session_id: row.get("session_id"),
                name: row.get("name"),
                unit_price: row.get("unit_price"),
                quantity: row.get("quantity"),
                subtotal: row.get("subtotal"),
                is_active: Some(row.get::<i64, _>("is_active") != 0),
                tooth_number: row.get("tooth_number"),
                procedure_notes: row.get("procedure_notes"),
                procedure_template_id: row.get("procedure_template_id"),
                sort_order: row.get("sort_order"),
                created_at: row.get("created_at"),
            })
            .collect();

        Ok(vec![SessionRow { visit: session, items }])
    } else {
        Ok(vec![])
    }
}

// =========================
// COMPLEX COMMAND: Save Visit with Sessions
// =========================

#[tauri::command]
pub async fn save_visit_with_sessions(
    db_pool: State<'_, DbPool>,
    patient: Patient,
    visit: Session,
    sessions: Vec<SessionRow>,
) -> Result<HashMap<String, i64>, String> {
    println!("🦀 Rust received:");
    println!("   Patient: {}", patient.full_name);
    println!("   Visit date: {}", visit.date);
    println!("   Sessions count: {}", sessions.len());

    let pool = db_pool.0.lock().await;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // 1. Upsert patient
    let patient_id = if let Some(id) = patient.id {
        sqlx::query(
            "UPDATE patients
             SET full_name = ?1, doc_id = ?2, email = ?3, phone = ?4, emergency_phone = ?5,
                 date_of_birth = ?6, anamnesis = ?7, allergy_detail = ?8, status = ?9,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?10"
        )
        .bind(&patient.full_name)
        .bind(&patient.doc_id)
        .bind(&patient.email)
        .bind(&patient.phone)
        .bind(&patient.emergency_phone)
        .bind(&patient.date_of_birth)
        .bind(&patient.anamnesis)
        .bind(&patient.allergy_detail)
        .bind(patient.status.as_deref().unwrap_or("active"))
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
        id
    } else {
        let result = sqlx::query(
            "INSERT INTO patients (full_name, doc_id, email, phone, emergency_phone, date_of_birth, anamnesis, allergy_detail, status)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
        )
        .bind(&patient.full_name)
        .bind(&patient.doc_id)
        .bind(&patient.email)
        .bind(&patient.phone)
        .bind(&patient.emergency_phone)
        .bind(&patient.date_of_birth)
        .bind(&patient.anamnesis)
        .bind(&patient.allergy_detail)
        .bind(patient.status.as_deref().unwrap_or("active"))
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
        result.last_insert_rowid()
    };

    // 2. Save each session
    let mut last_session_id = 0i64;

    for session in sessions {
        // Calculate budget from active items (backend is source of truth)
        let calculated_budget: f64 = session.items
            .iter()
            .filter(|item| item.is_active.unwrap_or(item.quantity > 0))
            .map(|item| item.subtotal)
            .sum();

        let calculated_balance = calculated_budget
            - session.visit.discount
            - session.visit.payment;

        if (calculated_budget - session.visit.budget).abs() > 0.01 {
            eprintln!(
                "⚠️ Budget mismatch for session: frontend={}, backend={}",
                session.visit.budget,
                calculated_budget
            );
        }

        // Calculate cumulative balance
        let previous_cumulative = if let Some(session_id) = session.visit.id.filter(|&i| i > 0) {
            sqlx::query_scalar::<_, f64>(
                "SELECT COALESCE(SUM(balance), 0.0) FROM sessions
                 WHERE patient_id = ?1 AND id < ?2 AND is_saved = 1"
            )
            .bind(patient_id)
            .bind(session_id)
            .fetch_one(&mut *tx)
            .await
            .unwrap_or(0.0)
        } else {
            sqlx::query_scalar::<_, f64>(
                "SELECT COALESCE(SUM(balance), 0.0) FROM sessions
                 WHERE patient_id = ?1 AND is_saved = 1"
            )
            .bind(patient_id)
            .fetch_one(&mut *tx)
            .await
            .unwrap_or(0.0)
        };

        let cumulative_balance = previous_cumulative + calculated_balance;

        // Upsert session
        let session_id = if let Some(id) = session.visit.id.filter(|&i| i > 0) {
            sqlx::query(
                "UPDATE sessions
                 SET patient_id = ?1, date = ?2, reason_type = ?3, reason_detail = ?4,
                     diagnosis_text = ?5, auto_dx_text = ?6, full_dx_text = ?7, tooth_dx_json = ?8,
                     clinical_notes = ?9, signer = ?10,
                     budget = ?11, discount = ?12, payment = ?13, balance = ?14, cumulative_balance = ?15,
                     payment_method_id = ?16, payment_notes = ?17,
                     is_saved = ?18, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?19"
            )
            .bind(patient_id)
            .bind(&session.visit.date)
            .bind(&session.visit.reason_type)
            .bind(&session.visit.reason_detail)
            .bind(&visit.diagnosis_text)
            .bind(&visit.auto_dx_text)
            .bind(&visit.full_dx_text)
            .bind(&visit.tooth_dx_json)
            .bind(&session.visit.clinical_notes)
            .bind(&session.visit.signer)
            .bind(calculated_budget)
            .bind(session.visit.discount)
            .bind(session.visit.payment)
            .bind(calculated_balance)
            .bind(cumulative_balance)
            .bind(session.visit.payment_method_id)
            .bind(&session.visit.payment_notes)
            .bind(1_i64)  // is_saved = 1
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
            id
        } else {
            let result = sqlx::query(
                "INSERT INTO sessions (patient_id, date, reason_type, reason_detail,
                                      diagnosis_text, auto_dx_text, full_dx_text, tooth_dx_json,
                                      clinical_notes, signer,
                                      budget, discount, payment, balance, cumulative_balance,
                                      payment_method_id, payment_notes, is_saved)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)"
            )
            .bind(patient_id)
            .bind(&session.visit.date)
            .bind(&session.visit.reason_type)
            .bind(&session.visit.reason_detail)
            .bind(&visit.diagnosis_text)
            .bind(&visit.auto_dx_text)
            .bind(&visit.full_dx_text)
            .bind(&visit.tooth_dx_json)
            .bind(&session.visit.clinical_notes)
            .bind(&session.visit.signer)
            .bind(calculated_budget)
            .bind(session.visit.discount)
            .bind(session.visit.payment)
            .bind(calculated_balance)
            .bind(cumulative_balance)
            .bind(session.visit.payment_method_id)
            .bind(&session.visit.payment_notes)
            .bind(1_i64)  // is_saved = 1
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
            result.last_insert_rowid()
        };

        last_session_id = session_id;

        // Delete existing items for this session
        sqlx::query("DELETE FROM session_items WHERE session_id = ?1")
            .bind(session_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        // Insert session items
        for (index, item) in session.items.iter().enumerate() {
            if item.quantity > 0 || !item.name.trim().is_empty() {
                let is_active = item.is_active.unwrap_or(item.quantity > 0) as i64;

                sqlx::query(
                    "INSERT INTO session_items (session_id, name, unit_price, quantity, subtotal, is_active,
                                               tooth_number, procedure_notes, procedure_template_id, sort_order)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
                )
                .bind(session_id)
                .bind(&item.name)
                .bind(item.unit_price)
                .bind(item.quantity)
                .bind(item.subtotal)
                .bind(is_active)
                .bind(&item.tooth_number)
                .bind(&item.procedure_notes)
                .bind(item.procedure_template_id)
                .bind(index as i64)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
            }
        }
    }

    // ============================================================================
    // TRIADA: Apply debt opening/closing logic
    // ============================================================================

    // Get previous cumulative balance (before this save)
    let previous_cumulative: f64 = sqlx::query_scalar(
        "SELECT COALESCE(cumulative_balance, 0.0)
         FROM sessions
         WHERE patient_id = ?1 AND is_saved = 1 AND id < ?2
         ORDER BY date DESC, id DESC
         LIMIT 1"
    )
    .bind(patient_id)
    .bind(last_session_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| e.to_string())?
    .unwrap_or(0.0);

    // Get new cumulative balance (from the last saved session)
    let new_cumulative: f64 = sqlx::query_scalar(
        "SELECT COALESCE(cumulative_balance, 0.0)
         FROM sessions
         WHERE patient_id = ?1 AND is_saved = 1
         ORDER BY date DESC, id DESC
         LIMIT 1"
    )
    .bind(patient_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| e.to_string())?
    .unwrap_or(0.0);

    println!("🔄 TRIADA check: previous_balance={}, new_balance={}", previous_cumulative, new_cumulative);

    // Get current debt state
    let (debt_opened_at, debt_archived): (Option<String>, i64) = sqlx::query_as(
        "SELECT debt_opened_at, debt_archived FROM patients WHERE id = ?1"
    )
    .bind(patient_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    // Apply TRIADA logic
    if previous_cumulative <= 0.0 && new_cumulative > 0.0 {
        // OPEN DEBT: Balance went from <=0 to >0
        println!("📈 Opening debt for patient {}", patient_id);
        sqlx::query(
            "UPDATE patients
             SET debt_opened_at = (SELECT date FROM sessions WHERE id = ?1),
                 debt_archived = 0,
                 debt_archived_at = NULL
             WHERE id = ?2"
        )
        .bind(last_session_id)
        .bind(patient_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    } else if previous_cumulative > 0.0 && new_cumulative <= 0.0 {
        // CLOSE DEBT: Balance went from >0 to <=0
        println!("📉 Closing debt for patient {}", patient_id);
        sqlx::query(
            "UPDATE patients
             SET debt_opened_at = NULL,
                 debt_archived = 0,
                 debt_archived_at = NULL
             WHERE id = ?1"
        )
        .bind(patient_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    } else if new_cumulative > 0.0 && debt_archived == 1 {
        // UNARCHIVE: If debt is archived but balance is positive, unarchive it
        println!("📂 Unarchiving debt for patient {}", patient_id);
        sqlx::query(
            "UPDATE patients
             SET debt_archived = 0,
                 debt_archived_at = NULL
             WHERE id = ?1"
        )
        .bind(patient_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    } else if new_cumulative > 0.0 && debt_opened_at.is_none() {
        // EDGE CASE: Debt exists but debt_opened_at is NULL (data inconsistency fix)
        println!("🔧 Fixing debt_opened_at for patient {}", patient_id);
        sqlx::query(
            "UPDATE patients
             SET debt_opened_at = (SELECT date FROM sessions WHERE id = ?1),
                 debt_archived = 0
             WHERE id = ?2"
        )
        .bind(last_session_id)
        .bind(patient_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    let mut result = HashMap::new();
    result.insert("patient_id".to_string(), patient_id);
    result.insert("visit_id".to_string(), last_session_id);

    Ok(result)
}

// =========================
// PROCEDURE TEMPLATES COMMANDS
// =========================

#[tauri::command]
pub async fn get_procedure_templates(
    db_pool: State<'_, DbPool>,
) -> Result<Vec<ProcedureTemplate>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, name, default_price, active, created_at, updated_at
         FROM procedure_templates
         WHERE active = 1
         ORDER BY name ASC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let templates = rows
        .into_iter()
        .map(|row| ProcedureTemplate {
            id: row.get("id"),
            name: row.get("name"),
            default_price: row.get("default_price"),
            active: Some(row.get::<i64, _>("active") != 0),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(templates)
}

#[tauri::command]
pub async fn save_procedure_templates(
    db_pool: State<'_, DbPool>,
    templates: Vec<ProcedureTemplate>,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query("UPDATE procedure_templates SET active = 0")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    for template in templates {
        if let Some(id) = template.id {
            sqlx::query(
                "INSERT INTO procedure_templates (id, name, default_price, active)
                 VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(id) DO UPDATE SET
                   name = excluded.name,
                   default_price = excluded.default_price,
                   active = excluded.active,
                   updated_at = CURRENT_TIMESTAMP"
            )
            .bind(id)
            .bind(&template.name)
            .bind(template.default_price)
            .bind(template.active.unwrap_or(true) as i64)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        } else {
            let existing: Option<i64> = sqlx::query_scalar(
                "SELECT id FROM procedure_templates WHERE name = ?1"
            )
            .bind(&template.name)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

            if let Some(existing_id) = existing {
                sqlx::query(
                    "UPDATE procedure_templates
                     SET default_price = ?1, active = ?2, updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?3"
                )
                .bind(template.default_price)
                .bind(template.active.unwrap_or(true) as i64)
                .bind(existing_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
            } else {
                sqlx::query(
                    "INSERT INTO procedure_templates (name, default_price, active)
                     VALUES (?1, ?2, ?3)"
                )
                .bind(&template.name)
                .bind(template.default_price)
                .bind(template.active.unwrap_or(true) as i64)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
            }
        }
    }

    sqlx::query(
        "DELETE FROM procedure_templates
         WHERE active = 0
         AND id NOT IN (SELECT DISTINCT procedure_template_id FROM session_items WHERE procedure_template_id IS NOT NULL)"
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

// =========================
// DIAGNOSIS OPTIONS COMMANDS
// =========================

#[tauri::command]
pub async fn get_diagnosis_options(
    db_pool: State<'_, DbPool>,
) -> Result<Vec<DiagnosisOption>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, label, color, active, sort_order, created_at, updated_at
         FROM diagnosis_options
         WHERE active = 1
         ORDER BY sort_order ASC, label ASC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let options = rows
        .into_iter()
        .map(|row| DiagnosisOption {
            id: row.get("id"),
            label: row.get("label"),
            color: row.get("color"),
            active: Some(row.get::<i64, _>("active") != 0),
            sort_order: row.get("sort_order"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(options)
}

#[tauri::command]
pub async fn save_diagnosis_options(
    db_pool: State<'_, DbPool>,
    options: Vec<DiagnosisOption>,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    // Obtener IDs actuales en la base de datos
    let current_ids: Vec<i64> = sqlx::query_scalar("SELECT id FROM diagnosis_options")
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    // Obtener IDs que queremos mantener
    let keep_ids: Vec<i64> = options
        .iter()
        .filter_map(|opt| opt.id.map(|id| id as i64))
        .collect();

    // Eliminar opciones que ya no están en la lista
    for id in current_ids {
        if !keep_ids.contains(&id) {
            sqlx::query("DELETE FROM diagnosis_options WHERE id = ?1")
                .bind(id)
                .execute(&*pool)
                .await
                .map_err(|e| e.to_string())?;
        }
    }

    // Actualizar o insertar las opciones restantes
    for option in options {
        if let Some(id) = option.id {
            sqlx::query(
                "UPDATE diagnosis_options
                 SET label = ?1, color = ?2, active = ?3, sort_order = ?4
                 WHERE id = ?5"
            )
            .bind(&option.label)
            .bind(&option.color)
            .bind(option.active.unwrap_or(true) as i64)
            .bind(option.sort_order.unwrap_or(0))
            .bind(id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        } else {
            sqlx::query(
                "INSERT INTO diagnosis_options (label, color, active, sort_order)
                 VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(label) DO UPDATE SET
                   color = excluded.color,
                   active = excluded.active,
                   sort_order = excluded.sort_order"
            )
            .bind(&option.label)
            .bind(&option.color)
            .bind(option.active.unwrap_or(true) as i64)
            .bind(option.sort_order.unwrap_or(0))
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

// =========================
// SIGNERS COMMANDS
// =========================

#[tauri::command]
pub async fn get_signers(
    db_pool: State<'_, DbPool>,
) -> Result<Vec<Signer>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, name, active, created_at, updated_at
         FROM signers
         WHERE active = 1
         ORDER BY name ASC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let signers = rows
        .into_iter()
        .map(|row| Signer {
            id: row.get("id"),
            name: row.get("name"),
            active: Some(row.get::<i64, _>("active") != 0),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(signers)
}

#[tauri::command]
pub async fn create_signer(
    db_pool: State<'_, DbPool>,
    name: String,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    let result = sqlx::query(
        "INSERT INTO signers (name, active) VALUES (?1, 1)"
    )
    .bind(&name)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(result.last_insert_rowid())
}

#[tauri::command]
pub async fn delete_signer(
    db_pool: State<'_, DbPool>,
    id: i64,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    sqlx::query("UPDATE signers SET active = 0 WHERE id = ?1")
        .bind(id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// =========================
// REASON TYPES COMMANDS
// =========================

#[tauri::command]
pub async fn get_reason_types(
    db_pool: State<'_, DbPool>,
) -> Result<Vec<ReasonType>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, name, active, sort_order, created_at, updated_at
         FROM reason_types
         WHERE active = 1
         ORDER BY sort_order ASC, name ASC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let reason_types = rows
        .into_iter()
        .map(|row| ReasonType {
            id: row.get("id"),
            name: row.get("name"),
            active: Some(row.get::<i64, _>("active") != 0),
            sort_order: row.get("sort_order"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(reason_types)
}

#[tauri::command]
pub async fn create_reason_type(
    db_pool: State<'_, DbPool>,
    name: String,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    let result = sqlx::query(
        "INSERT INTO reason_types (name, active) VALUES (?1, 1)"
    )
    .bind(&name)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(result.last_insert_rowid())
}

#[tauri::command]
pub async fn delete_reason_type(
    db_pool: State<'_, DbPool>,
    id: i64,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    sqlx::query("DELETE FROM reason_types WHERE id = ?1")
        .bind(id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// =========================
// PAYMENT METHODS COMMANDS (NEW)
// =========================

#[tauri::command]
pub async fn get_payment_methods(
    db_pool: State<'_, DbPool>,
) -> Result<Vec<PaymentMethod>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, name, active, sort_order, created_at, updated_at
         FROM payment_methods
         WHERE active = 1
         ORDER BY sort_order ASC, name ASC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let methods = rows
        .into_iter()
        .map(|row| PaymentMethod {
            id: row.get("id"),
            name: row.get("name"),
            active: Some(row.get::<i64, _>("active") != 0),
            sort_order: row.get("sort_order"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(methods)
}

#[tauri::command]
pub async fn create_payment_method(
    db_pool: State<'_, DbPool>,
    name: String,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    let result = sqlx::query(
        "INSERT INTO payment_methods (name, active) VALUES (?1, 1)"
    )
    .bind(&name)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(result.last_insert_rowid())
}

// =========================
// DOCTOR PROFILE COMMANDS
// =========================

#[tauri::command]
pub async fn get_doctor_profile(
    db_pool: State<'_, DbPool>,
) -> Result<Option<DoctorProfile>, String> {
    let pool = db_pool.0.lock().await;

    let row = sqlx::query(
        "SELECT id, doctor_id, name, email, clinic_name, clinic_hours, clinic_slogan,
                phone, location, app_version, agreed_to_terms, last_sync, created_at, updated_at
         FROM doctor_profile
         ORDER BY id DESC
         LIMIT 1"
    )
    .fetch_optional(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(row.map(|row| DoctorProfile {
        id: row.get("id"),
        doctor_id: row.get("doctor_id"),
        name: row.get("name"),
        email: row.get("email"),
        clinic_name: row.get("clinic_name"),
        clinic_hours: row.get("clinic_hours"),
        clinic_slogan: row.get("clinic_slogan"),
        phone: row.get("phone"),
        location: row.get("location"),
        app_version: row.get("app_version"),
        agreed_to_terms: row.get::<Option<i64>, _>("agreed_to_terms").map(|v| v != 0),
        last_sync: row.get("last_sync"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }))
}

#[tauri::command]
pub async fn upsert_doctor_profile(
    db_pool: State<'_, DbPool>,
    profile: DoctorProfile,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    // Check if profile exists
    let existing: Option<i64> = sqlx::query_scalar("SELECT id FROM doctor_profile LIMIT 1")
        .fetch_optional(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(id) = existing {
        // Update existing profile
        sqlx::query(
            "UPDATE doctor_profile
             SET name = ?1, email = ?2, clinic_name = ?3, clinic_hours = ?4,
                 clinic_slogan = ?5, phone = ?6, location = ?7,
                 agreed_to_terms = ?8, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?9"
        )
        .bind(&profile.name)
        .bind(&profile.email)
        .bind(&profile.clinic_name)
        .bind(&profile.clinic_hours)
        .bind(&profile.clinic_slogan)
        .bind(&profile.phone)
        .bind(&profile.location)
        .bind(profile.agreed_to_terms.unwrap_or(false) as i64)
        .bind(id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(id)
    } else {
        // Insert new profile
        let result = sqlx::query(
            "INSERT INTO doctor_profile (doctor_id, name, email, clinic_name, clinic_hours,
                                        clinic_slogan, phone, location, agreed_to_terms, app_version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
        )
        .bind(&profile.doctor_id)
        .bind(&profile.name)
        .bind(&profile.email)
        .bind(&profile.clinic_name)
        .bind(&profile.clinic_hours)
        .bind(&profile.clinic_slogan)
        .bind(&profile.phone)
        .bind(&profile.location)
        .bind(profile.agreed_to_terms.unwrap_or(false) as i64)
        .bind(profile.app_version.as_deref().unwrap_or("1.0.0"))
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(result.last_insert_rowid())
    }
}

// =========================
// SETTINGS COMMANDS
// =========================

#[tauri::command]
pub async fn get_all_settings(
    db_pool: State<'_, DbPool>,
) -> Result<HashMap<String, String>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT key, value FROM user_settings"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let mut settings = HashMap::new();
    for row in rows {
        let key: String = row.get("key");
        let value: String = row.get("value");
        settings.insert(key, value);
    }

    Ok(settings)
}

#[tauri::command]
pub async fn save_setting(
    db_pool: State<'_, DbPool>,
    key: String,
    value: String,
    category: String,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    sqlx::query(
        "INSERT INTO user_settings (key, value, category)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE SET value = ?2, category = ?3"
    )
    .bind(&key)
    .bind(&value)
    .bind(&category)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn reset_all_settings(
    db_pool: State<'_, DbPool>,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM user_settings")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO user_settings (key, value, category) VALUES
            ('theme', 'dark', 'appearance'),
            ('brandHsl', '172 49% 56%', 'appearance'),
            ('font', 'Inter', 'appearance'),
            ('size', '16', 'appearance'),
            ('layoutMode', 'vertical', 'appearance')"
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}

// =========================
// PENDING PAYMENTS SUMMARY
// =========================

#[tauri::command]
pub async fn get_pending_payments_summary(
    db_pool: State<'_, DbPool>,
) -> Result<Vec<PatientDebtSummary>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "WITH latest_balance AS (
            SELECT
                patient_id,
                cumulative_balance,
                ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY date DESC, id DESC) as rn
            FROM sessions
            WHERE is_saved = 1
        )
        SELECT
            p.id as patient_id,
            p.full_name,
            p.phone,
            p.doc_id,
            COALESCE(lb.cumulative_balance, 0) as current_balance,
            p.debt_opened_at,
            p.debt_archived,
            p.last_contact_at,
            p.last_contact_type,
            CASE
                WHEN p.debt_opened_at IS NULL THEN 0
                ELSE CAST((JULIANDAY('now') - JULIANDAY(p.debt_opened_at)) AS INTEGER)
            END as days_overdue,
            CASE
                WHEN p.last_contact_at IS NULL THEN 0
                ELSE CAST((JULIANDAY('now') - JULIANDAY(p.last_contact_at)) AS INTEGER)
            END as days_since_contact
        FROM patients p
        LEFT JOIN latest_balance lb ON p.id = lb.patient_id AND lb.rn = 1
        WHERE p.status = 'active'
          AND p.debt_archived = 0
          AND p.debt_opened_at IS NOT NULL
          AND COALESCE(lb.cumulative_balance, 0) > 0
        ORDER BY days_overdue DESC, current_balance DESC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let summaries = rows
        .into_iter()
        .map(|row| {
            let last_contact_at: Option<String> = row.get("last_contact_at");
            let days_since_contact: i64 = row.get("days_since_contact");

            // Calculate contact_status based on days_since_contact
            let contact_status = if last_contact_at.is_none() {
                "not_contacted".to_string()
            } else if days_since_contact <= 7 {
                "recently_contacted".to_string()
            } else {
                "long_ago".to_string()
            };

            PatientDebtSummary {
                patient_id: row.get("patient_id"),
                full_name: row.get("full_name"),
                phone: row.get("phone"),
                doc_id: row.get("doc_id"),
                current_balance: row.get("current_balance"),
                debt_opened_at: row.get("debt_opened_at"),
                debt_archived: row.get("debt_archived"),
                last_contact_at: row.get("last_contact_at"),
                last_contact_type: row.get("last_contact_type"),
                days_overdue: row.get("days_overdue"),
                contact_status,
            }
        })
        .collect();

    Ok(summaries)
}

// =========================
// ARCHIVE DEBT
// =========================

#[tauri::command]
pub async fn archive_debt(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    // Archive debt at patient level (TRIADA)
    sqlx::query("UPDATE patients SET debt_archived = 1, debt_archived_at = datetime('now') WHERE id = ?")
        .bind(patient_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn unarchive_debt(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    // Unarchive debt at patient level (TRIADA)
    sqlx::query("UPDATE patients SET debt_archived = 0, debt_archived_at = NULL WHERE id = ?")
        .bind(patient_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// =========================
// REPAIR DEBT DATA (One-time fix)
// =========================

#[tauri::command]
pub async fn repair_debt_opened_dates(
    db_pool: State<'_, DbPool>,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    println!("🔧 Starting debt repair...");

    // Find patients with positive balance but no debt_opened_at
    let patients_to_fix = sqlx::query(
        "WITH latest_balance AS (
            SELECT
                patient_id,
                cumulative_balance,
                date,
                ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY date DESC, id DESC) as rn
            FROM sessions
            WHERE is_saved = 1
        )
        SELECT
            p.id as patient_id,
            lb.cumulative_balance,
            lb.date as first_debt_date
        FROM patients p
        INNER JOIN latest_balance lb ON p.id = lb.patient_id AND lb.rn = 1
        WHERE p.status = 'active'
          AND lb.cumulative_balance > 0
          AND p.debt_opened_at IS NULL"
    )
    .fetch_all(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    let count = patients_to_fix.len() as i64;
    println!("📋 Found {} patients to fix", count);

    for row in patients_to_fix {
        let patient_id: i64 = row.get("patient_id");
        let first_debt_date: String = row.get("first_debt_date");

        println!("  → Fixing patient {} with debt date {}", patient_id, first_debt_date);

        sqlx::query(
            "UPDATE patients
             SET debt_opened_at = ?,
                 debt_archived = 0,
                 debt_archived_at = NULL
             WHERE id = ?"
        )
        .bind(&first_debt_date)
        .bind(patient_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    println!("✅ Debt repair completed: {} patients fixed", count);

    Ok(count)
}

#[tauri::command]
pub async fn mark_patient_contacted(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
    contact_type: String,  // 'whatsapp' | 'call' | 'email' | 'in_person'
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    sqlx::query(
        "UPDATE patients
         SET last_contact_at = datetime('now'),
             last_contact_type = ?
         WHERE id = ?"
    )
    .bind(contact_type)
    .bind(patient_id)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

// =========================
// PAYMENTS COMMANDS
// =========================

#[tauri::command]
pub async fn get_payments_by_patient(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
) -> Result<Vec<Payment>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, patient_id, date, amount, payment_method, notes, created_at, updated_at
         FROM payments
         WHERE patient_id = ?1
         ORDER BY date DESC, id DESC"
    )
    .bind(patient_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let payments = rows
        .into_iter()
        .map(|row| Payment {
            id: row.get("id"),
            patient_id: row.get("patient_id"),
            date: row.get("date"),
            amount: row.get("amount"),
            payment_method: row.get("payment_method"),
            notes: row.get("notes"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(payments)
}

#[tauri::command]
pub async fn create_payment(
    db_pool: State<'_, DbPool>,
    payment: Payment,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    let result = sqlx::query(
        "INSERT INTO payments (patient_id, date, amount, payment_method, notes)
         VALUES (?1, ?2, ?3, ?4, ?5)"
    )
    .bind(payment.patient_id)
    .bind(&payment.date)
    .bind(payment.amount)
    .bind(&payment.payment_method)
    .bind(&payment.notes)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(result.last_insert_rowid())
}

#[tauri::command]
pub async fn update_payment(
    db_pool: State<'_, DbPool>,
    payment: Payment,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    if let Some(id) = payment.id {
        sqlx::query(
            "UPDATE payments
             SET date = ?1, amount = ?2, payment_method = ?3, notes = ?4, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?5"
        )
        .bind(&payment.date)
        .bind(payment.amount)
        .bind(&payment.payment_method)
        .bind(&payment.notes)
        .bind(id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

        Ok(())
    } else {
        Err("Payment ID is required for update".to_string())
    }
}

#[tauri::command]
pub async fn delete_payment(
    db_pool: State<'_, DbPool>,
    payment_id: i64,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    sqlx::query("DELETE FROM payments WHERE id = ?1")
        .bind(payment_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// =========================
// ATTACHMENTS COMMANDS
// =========================

#[derive(Debug, Serialize, Deserialize)]
pub struct AttachmentMeta {
    pub filename: String,
    pub mime_type: String,
    pub bytes: i64,
    pub storage_key: String,
}

#[tauri::command]
pub async fn get_attachments_by_patient(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
) -> Result<Vec<Attachment>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, patient_id, session_id, kind, filename, mime_type, size_bytes, storage_key, note, created_at
         FROM attachments
         WHERE patient_id = ?1
         ORDER BY created_at DESC"
    )
    .bind(patient_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let attachments = rows
        .into_iter()
        .map(|row| Attachment {
            id: row.get("id"),
            patient_id: row.get("patient_id"),
            session_id: row.get("session_id"),
            kind: row.get("kind"),
            filename: row.get("filename"),
            mime_type: row.get("mime_type"),
            size_bytes: row.get("size_bytes"),
            storage_key: row.get("storage_key"),
            note: row.get("note"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(attachments)
}

#[tauri::command]
pub async fn create_attachment(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
    session_id: Option<i64>,
    filename: String,
    mime_type: String,
    bytes: i64,
    storage_key: String,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    let result = sqlx::query(
        "INSERT INTO attachments (patient_id, session_id, kind, filename, mime_type, size_bytes, storage_key)
         VALUES (?1, ?2, 'file', ?3, ?4, ?5, ?6)"
    )
    .bind(patient_id)
    .bind(session_id)
    .bind(&filename)
    .bind(&mime_type)
    .bind(bytes)
    .bind(&storage_key)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(result.last_insert_rowid())
}

#[tauri::command]
pub async fn delete_attachment(
    db_pool: State<'_, DbPool>,
    attachment_id: i64,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    sqlx::query("DELETE FROM attachments WHERE id = ?1")
        .bind(attachment_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// =========================
// NEW: GRANULAR SAVE COMMANDS
// =========================

/// Updates ONLY patient demographic data (no sessions created)
#[tauri::command]
pub async fn update_patient_only(
    db_pool: State<'_, DbPool>,
    patient: Patient,
) -> Result<(), String> {
    if patient.id.is_none() {
        return Err("Patient ID is required for update".to_string());
    }

    let pool = db_pool.0.lock().await;

    sqlx::query(
        "UPDATE patients
         SET full_name = ?1, doc_id = ?2, email = ?3, phone = ?4,
             emergency_phone = ?5, date_of_birth = ?6, anamnesis = ?7,
             allergy_detail = ?8, status = ?9, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?10"
    )
    .bind(&patient.full_name)
    .bind(&patient.doc_id)
    .bind(&patient.email)
    .bind(&patient.phone)
    .bind(&patient.emergency_phone)
    .bind(&patient.date_of_birth)
    .bind(&patient.anamnesis)
    .bind(&patient.allergy_detail)
    .bind(patient.status.as_deref().unwrap_or("active"))
    .bind(patient.id.unwrap())
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to update patient: {}", e))?;

    Ok(())
}

/// Saves attachments WITHOUT creating a session (session_id = NULL)
#[tauri::command]
pub async fn save_attachments_without_session(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
    attachments: Vec<AttachmentMeta>,
) -> Result<Vec<i64>, String> {
    let pool = db_pool.0.lock().await;
    let mut attachment_ids = Vec::new();

    for att in attachments {
        let result = sqlx::query(
            "INSERT INTO attachments (patient_id, session_id, kind, filename, mime_type, size_bytes, storage_key)
             VALUES (?1, NULL, 'file', ?2, ?3, ?4, ?5)"
        )
        .bind(patient_id)
        .bind(&att.filename)
        .bind(&att.mime_type)
        .bind(att.bytes)
        .bind(&att.storage_key)
        .execute(&*pool)
        .await
        .map_err(|e| format!("Failed to save attachment: {}", e))?;

        attachment_ids.push(result.last_insert_rowid());
    }

    Ok(attachment_ids)
}

#[derive(Debug, Serialize)]
pub struct CreateDiagnosticUpdateSessionResponse {
    pub session_id: i64,
}

/// Creates a "Diagnostic Update" session for odontogram changes WITHOUT financial data
/// This preserves snapshots by creating a new session instead of modifying existing ones
#[tauri::command]
pub async fn create_diagnostic_update_session(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
    tooth_dx_json: Option<String>,
    auto_dx_text: Option<String>,
    full_dx_text: Option<String>,
) -> Result<CreateDiagnosticUpdateSessionResponse, String> {
    let pool = db_pool.0.lock().await;

    // Get today's date in ISO format
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    // Create new session for odontogram-only updates
    let result = sqlx::query(
        "INSERT INTO sessions (patient_id, date, reason_type, reason_detail,
                              tooth_dx_json, auto_dx_text, full_dx_text,
                              budget, discount, payment, balance, cumulative_balance, is_saved)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, 0, 0, 0, 0, 1)"
    )
    .bind(patient_id)
    .bind(&today)
    .bind("Otro")
    .bind("Sistema: Odontograma")
    .bind(&tooth_dx_json)
    .bind(&auto_dx_text)
    .bind(&full_dx_text)
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to create diagnostic update session: {}", e))?;

    Ok(CreateDiagnosticUpdateSessionResponse {
        session_id: result.last_insert_rowid(),
    })
}

// =========================
// PDF GENERATION COMMAND
// =========================

use headless_chrome::{Browser, types::PrintToPdfOptions};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratePdfResponse {
    pub file_path: String,
}

/// Generate PDF from HTML content with "Save As" dialog
///
/// This command:
/// 1. Shows a native "Save As" dialog for user to choose location
/// 2. Uses headless Chrome to render HTML to PDF (respects @media print)
/// 3. Saves the PDF to the chosen location
/// 4. Returns the file path
#[tauri::command]
pub async fn generate_pdf_with_dialog(
    app_handle: tauri::AppHandle,
    html_content: String,
    default_filename: String,
) -> Result<GeneratePdfResponse, String> {
    use tauri_plugin_dialog::DialogExt;

    // Show "Save As" dialog
    let file_path = app_handle
        .dialog()
        .file()
        .add_filter("PDF", &["pdf"])
        .set_file_name(&default_filename)
        .blocking_save_file();

    // User cancelled the dialog
    let Some(file_path) = file_path else {
        return Err("User cancelled save dialog".to_string());
    };

    // Convert FilePath to PathBuf
    let file_path_str = file_path.to_string();
    let mut file_path = PathBuf::from(file_path_str);

    // Ensure .pdf extension
    if !file_path.to_string_lossy().ends_with(".pdf") {
        file_path = file_path.with_extension("pdf");
    }

    // Generate PDF using headless Chrome
    let browser = Browser::default()
        .map_err(|e| format!("Failed to launch browser: {}", e))?;

    let tab = browser.new_tab()
        .map_err(|e| format!("Failed to create tab: {}", e))?;

    // Navigate to data URL with HTML content
    let data_url = format!("data:text/html;charset=utf-8,{}", urlencoding::encode(&html_content));
    tab.navigate_to(&data_url)
        .map_err(|e| format!("Failed to navigate: {}", e))?;

    // Wait for page to load
    tab.wait_until_navigated()
        .map_err(|e| format!("Failed to wait for navigation: {}", e))?;

    // Generate PDF with print media emulation
    let pdf_options = PrintToPdfOptions {
        landscape: Some(false),
        display_header_footer: Some(false),
        print_background: Some(true),
        scale: Some(1.0),
        paper_width: Some(8.27),  // A4 width in inches
        paper_height: Some(11.69), // A4 height in inches
        margin_top: Some(0.59),    // 15mm top margin
        margin_bottom: Some(0.47), // 12mm bottom margin
        margin_left: Some(0.59),   // 15mm left margin
        margin_right: Some(0.59),  // 15mm right margin
        page_ranges: None,
        ignore_invalid_page_ranges: Some(false),
        header_template: None,
        footer_template: None,
        prefer_css_page_size: Some(true),
        transfer_mode: None,
        generate_document_outline: Some(false),
        generate_tagged_pdf: Some(false),
    };

    let pdf_data = tab.print_to_pdf(Some(pdf_options))
        .map_err(|e| format!("Failed to generate PDF: {}", e))?;

    // Write PDF to file
    fs::write(&file_path, pdf_data)
        .map_err(|e| format!("Failed to write PDF: {}", e))?;

    Ok(GeneratePdfResponse {
        file_path: file_path.to_string_lossy().to_string(),
    })
}

// ============================================================================
// TEXT TEMPLATES
// ============================================================================

#[derive(serde::Serialize)]
pub struct TextTemplate {
    pub id: i64,
    pub kind: String,
    pub title: String,
    pub body: String,
    pub tags: Option<String>,
    pub source: String,
    pub is_favorite: i64,
    pub active: i64,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub async fn get_text_templates_by_kind(
    db_pool: State<'_, DbPool>,
    kind: String,
) -> Result<Vec<TextTemplate>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, kind, title, body, tags, source, is_favorite, active, sort_order, created_at, updated_at
         FROM text_templates
         WHERE kind = ? AND active = 1
         ORDER BY sort_order ASC"
    )
    .bind(&kind)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    let templates: Vec<TextTemplate> = rows
        .iter()
        .map(|row| TextTemplate {
            id: row.get("id"),
            kind: row.get("kind"),
            title: row.get("title"),
            body: row.get("body"),
            tags: row.get("tags"),
            source: row.get("source"),
            is_favorite: row.get("is_favorite"),
            active: row.get("active"),
            sort_order: row.get("sort_order"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(templates)
}

#[tauri::command]
pub async fn update_text_template(
    db_pool: State<'_, DbPool>,
    id: i64,
    body: String,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    sqlx::query(
        "UPDATE text_templates
         SET body = ?
         WHERE id = ?"
    )
    .bind(&body)
    .bind(id)
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to update template: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn clean_duplicate_templates(
    db_pool: State<'_, DbPool>,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    // Delete duplicates, keeping only the one with the lowest ID for each (kind, title) pair
    let result = sqlx::query(
        "DELETE FROM text_templates
         WHERE id NOT IN (
             SELECT MIN(id)
             FROM text_templates
             GROUP BY kind, title
         )"
    )
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to clean duplicates: {}", e))?;

    Ok(result.rows_affected() as i64)
}

#[tauri::command]
pub async fn create_text_template(
    db_pool: State<'_, DbPool>,
    kind: String,
    title: String,
    body: String,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    let result = sqlx::query(
        "INSERT INTO text_templates (kind, title, body, source, active)
         VALUES (?, ?, ?, 'user', 1)"
    )
    .bind(&kind)
    .bind(&title)
    .bind(&body)
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to create template: {}", e))?;

    Ok(result.last_insert_rowid())
}

#[tauri::command]
pub async fn delete_text_template(
    db_pool: State<'_, DbPool>,
    id: i64,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    sqlx::query(
        "DELETE FROM text_templates
         WHERE id = ?"
    )
    .bind(id)
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to delete template: {}", e))?;

    Ok(())
}

// ============================================================================
// APPOINTMENTS MODULE
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Appointment {
    pub id: Option<i64>,
    pub patient_id: i64,
    pub starts_at: String,  // ISO 8601 datetime
    pub ends_at: String,    // ISO 8601 datetime
    pub procedure: String,
    pub notes: Option<String>,
    pub status: String,     // 'scheduled' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
    pub confirmed_at: Option<String>,
    pub reminder_1d_sent_at: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageQueueItem {
    pub id: Option<i64>,
    pub patient_id: i64,
    pub appointment_id: Option<i64>,
    pub r#type: String,      // 'reminder_1d' | 'availability' | 'custom'
    pub message_text: String,
    pub status: String,       // 'pending' | 'sent' | 'skipped'
    pub sent_at: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AvailableSlot {
    pub starts_at: String,
    pub ends_at: String,
}

// =========================
// APPOINTMENT CRUD COMMANDS
// =========================

#[tauri::command]
pub async fn create_appointment(
    db_pool: State<'_, DbPool>,
    appointment: Appointment,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    // Validate: status must be valid
    if !matches!(
        appointment.status.as_str(),
        "scheduled" | "confirmed" | "cancelled" | "no_show" | "completed"
    ) {
        return Err(format!("Invalid status: {}", appointment.status));
    }

    // Validate: starts_at must be before ends_at
    if appointment.starts_at >= appointment.ends_at {
        return Err("starts_at must be before ends_at".to_string());
    }

    // Check for overlaps (exclude cancelled appointments)
    let overlap_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)
         FROM appointments
         WHERE status NOT IN ('cancelled', 'no_show', 'completed')
           AND (
             (starts_at < ?2 AND ends_at > ?1)  -- Overlap condition
           )"
    )
    .bind(&appointment.starts_at)
    .bind(&appointment.ends_at)
    .fetch_one(&*pool)
    .await
    .map_err(|e| format!("Failed to check overlap: {}", e))?;

    if overlap_count > 0 {
        return Err("Appointment overlaps with an existing appointment".to_string());
    }

    // Insert appointment
    let result = sqlx::query(
        "INSERT INTO appointments (patient_id, starts_at, ends_at, procedure, notes, status, confirmed_at, reminder_1d_sent_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
    )
    .bind(appointment.patient_id)
    .bind(&appointment.starts_at)
    .bind(&appointment.ends_at)
    .bind(&appointment.procedure)
    .bind(&appointment.notes)
    .bind(&appointment.status)
    .bind(&appointment.confirmed_at)
    .bind(&appointment.reminder_1d_sent_at)
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to create appointment: {}", e))?;

    Ok(result.last_insert_rowid())
}

#[tauri::command]
pub async fn update_appointment(
    db_pool: State<'_, DbPool>,
    id: i64,
    appointment: Appointment,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    // Validate: status must be valid
    if !matches!(
        appointment.status.as_str(),
        "scheduled" | "confirmed" | "cancelled" | "no_show" | "completed"
    ) {
        return Err(format!("Invalid status: {}", appointment.status));
    }

    // Validate: starts_at must be before ends_at
    if appointment.starts_at >= appointment.ends_at {
        return Err("starts_at must be before ends_at".to_string());
    }

    // Check for overlaps (exclude self and cancelled appointments)
    let overlap_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)
         FROM appointments
         WHERE id != ?1
           AND status NOT IN ('cancelled', 'no_show', 'completed')
           AND (
             (starts_at < ?3 AND ends_at > ?2)  -- Overlap condition
           )"
    )
    .bind(id)
    .bind(&appointment.starts_at)
    .bind(&appointment.ends_at)
    .fetch_one(&*pool)
    .await
    .map_err(|e| format!("Failed to check overlap: {}", e))?;

    if overlap_count > 0 {
        return Err("Appointment overlaps with an existing appointment".to_string());
    }

    // Update appointment
    sqlx::query(
        "UPDATE appointments
         SET patient_id = ?1, starts_at = ?2, ends_at = ?3, procedure = ?4,
             notes = ?5, status = ?6, confirmed_at = ?7, reminder_1d_sent_at = ?8
         WHERE id = ?9"
    )
    .bind(appointment.patient_id)
    .bind(&appointment.starts_at)
    .bind(&appointment.ends_at)
    .bind(&appointment.procedure)
    .bind(&appointment.notes)
    .bind(&appointment.status)
    .bind(&appointment.confirmed_at)
    .bind(&appointment.reminder_1d_sent_at)
    .bind(id)
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to update appointment: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn delete_appointment(
    db_pool: State<'_, DbPool>,
    id: i64,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    sqlx::query("DELETE FROM appointments WHERE id = ?1")
        .bind(id)
        .execute(&*pool)
        .await
        .map_err(|e| format!("Failed to delete appointment: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn list_appointments(
    db_pool: State<'_, DbPool>,
    range_start: String,
    range_end: String,
) -> Result<Vec<Appointment>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, patient_id, starts_at, ends_at, procedure, notes, status,
                confirmed_at, reminder_1d_sent_at, created_at, updated_at
         FROM appointments
         WHERE starts_at < ?2 AND ends_at > ?1
         ORDER BY starts_at ASC"
    )
    .bind(&range_start)
    .bind(&range_end)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Failed to list appointments: {}", e))?;

    let appointments = rows
        .into_iter()
        .map(|row| Appointment {
            id: row.get("id"),
            patient_id: row.get("patient_id"),
            starts_at: row.get("starts_at"),
            ends_at: row.get("ends_at"),
            procedure: row.get("procedure"),
            notes: row.get("notes"),
            status: row.get("status"),
            confirmed_at: row.get("confirmed_at"),
            reminder_1d_sent_at: row.get("reminder_1d_sent_at"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(appointments)
}

#[tauri::command]
pub async fn list_upcoming_appointments(
    db_pool: State<'_, DbPool>,
    days: i64,
) -> Result<Vec<Appointment>, String> {
    let pool = db_pool.0.lock().await;

    // Calculate date range for next N days
    let rows = sqlx::query(
        "SELECT id, patient_id, starts_at, ends_at, procedure, notes, status,
                confirmed_at, reminder_1d_sent_at, created_at, updated_at
         FROM appointments
         WHERE starts_at >= datetime('now')
           AND starts_at < datetime('now', '+' || ?1 || ' days')
           AND status NOT IN ('cancelled', 'completed')
         ORDER BY starts_at ASC"
    )
    .bind(days)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Failed to list upcoming appointments: {}", e))?;

    let appointments = rows
        .into_iter()
        .map(|row| Appointment {
            id: row.get("id"),
            patient_id: row.get("patient_id"),
            starts_at: row.get("starts_at"),
            ends_at: row.get("ends_at"),
            procedure: row.get("procedure"),
            notes: row.get("notes"),
            status: row.get("status"),
            confirmed_at: row.get("confirmed_at"),
            reminder_1d_sent_at: row.get("reminder_1d_sent_at"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(appointments)
}

// =========================
// AVAILABLE SLOTS GENERATION
// =========================

#[tauri::command]
pub async fn generate_available_slots(
    db_pool: State<'_, DbPool>,
    days: i64,
    slot_minutes: i64,
    work_start_hour: i64,  // e.g. 9 for 9am
    work_end_hour: i64,    // e.g. 18 for 6pm
) -> Result<Vec<AvailableSlot>, String> {
    let pool = db_pool.0.lock().await;

    // Validate parameters
    if days < 1 || days > 14 {
        return Err("days must be between 1 and 14".to_string());
    }
    if slot_minutes < 15 || slot_minutes > 240 {
        return Err("slot_minutes must be between 15 and 240".to_string());
    }
    if work_start_hour < 0 || work_start_hour > 23 || work_end_hour < 0 || work_end_hour > 23 {
        return Err("work hours must be between 0 and 23".to_string());
    }
    if work_start_hour >= work_end_hour {
        return Err("work_start_hour must be before work_end_hour".to_string());
    }

    // Get all appointments in range
    let rows = sqlx::query(
        "SELECT starts_at, ends_at
         FROM appointments
         WHERE starts_at >= datetime('now')
           AND starts_at < datetime('now', '+' || ?1 || ' days')
           AND status NOT IN ('cancelled', 'completed', 'no_show')
         ORDER BY starts_at ASC"
    )
    .bind(days)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Failed to fetch appointments: {}", e))?;

    let booked_appointments: Vec<(String, String)> = rows
        .into_iter()
        .map(|row| {
            let start: String = row.get("starts_at");
            let end: String = row.get("ends_at");
            (start, end)
        })
        .collect();

    // Generate candidate slots
    let mut available_slots = Vec::new();

    use chrono::{Local, Duration, Timelike};

    for day_offset in 0..days {
        let mut current_date = Local::now() + Duration::days(day_offset);

        // Set to work start hour
        current_date = current_date
            .with_hour(work_start_hour as u32)
            .unwrap()
            .with_minute(0)
            .unwrap()
            .with_second(0)
            .unwrap()
            .with_nanosecond(0)
            .unwrap();

        let end_of_day = current_date
            .with_hour(work_end_hour as u32)
            .unwrap();

        while current_date < end_of_day {
            let slot_end = current_date + Duration::minutes(slot_minutes);

            if slot_end > end_of_day {
                break;
            }

            // Check if slot overlaps with any booked appointment
            let slot_start_str = current_date.to_rfc3339();
            let slot_end_str = slot_end.to_rfc3339();

            let is_available = !booked_appointments.iter().any(|(booked_start, booked_end)| {
                // Check overlap: (start1 < end2) AND (end1 > start2)
                slot_start_str < *booked_end && slot_end_str > *booked_start
            });

            if is_available {
                available_slots.push(AvailableSlot {
                    starts_at: slot_start_str,
                    ends_at: slot_end_str,
                });
            }

            // Move to next slot
            current_date = current_date + Duration::minutes(slot_minutes);
        }
    }

    // Limit to first 8 slots
    available_slots.truncate(8);

    Ok(available_slots)
}

// =========================
// MESSAGE QUEUE COMMANDS
// =========================

#[tauri::command]
pub async fn list_pending_messages(
    db_pool: State<'_, DbPool>,
) -> Result<Vec<MessageQueueItem>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, patient_id, appointment_id, type, message_text, status, sent_at, created_at
         FROM message_queue
         WHERE status = 'pending'
         ORDER BY created_at ASC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Failed to list pending messages: {}", e))?;

    let messages = rows
        .into_iter()
        .map(|row| MessageQueueItem {
            id: row.get("id"),
            patient_id: row.get("patient_id"),
            appointment_id: row.get("appointment_id"),
            r#type: row.get("type"),
            message_text: row.get("message_text"),
            status: row.get("status"),
            sent_at: row.get("sent_at"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(messages)
}

#[tauri::command]
pub async fn mark_message_as_sent(
    db_pool: State<'_, DbPool>,
    message_id: i64,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    sqlx::query(
        "UPDATE message_queue
         SET status = 'sent', sent_at = datetime('now')
         WHERE id = ?1"
    )
    .bind(message_id)
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to mark message as sent: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn create_message(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
    appointment_id: Option<i64>,
    r#type: String,
    message_text: String,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    let result = sqlx::query(
        "INSERT INTO message_queue (patient_id, appointment_id, type, message_text, status)
         VALUES (?1, ?2, ?3, ?4, 'pending')"
    )
    .bind(patient_id)
    .bind(appointment_id)
    .bind(&r#type)
    .bind(&message_text)
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to create message: {}", e))?;

    Ok(result.last_insert_rowid())
}

// =========================
// REMINDER SCHEDULER
// =========================

/// Scans for appointments 24-48h from now that haven't received a reminder yet.
/// Creates pending messages in message_queue and marks reminder_1d_sent_at.
#[tauri::command]
pub async fn generate_1d_reminders(
    db_pool: State<'_, DbPool>,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    // Find appointments tomorrow (24-48h window) without reminder
    let rows = sqlx::query(
        "SELECT a.id as appointment_id, a.patient_id, a.starts_at, a.procedure, p.full_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         WHERE a.starts_at >= datetime('now', '+24 hours')
           AND a.starts_at < datetime('now', '+48 hours')
           AND a.status IN ('scheduled', 'confirmed')
           AND a.reminder_1d_sent_at IS NULL"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Failed to fetch appointments for reminders: {}", e))?;

    let mut count = 0i64;

    for row in rows {
        let appointment_id: i64 = row.get("appointment_id");
        let patient_id: i64 = row.get("patient_id");
        let starts_at: String = row.get("starts_at");
        let procedure: String = row.get("procedure");
        let full_name: String = row.get("full_name");

        // Parse datetime for display
        let formatted_time = starts_at.split('T').nth(1)
            .map(|t| t.split(':').take(2).collect::<Vec<_>>().join(":"))
            .unwrap_or_else(|| "hora programada".to_string());

        // Generate message
        let message_text = format!(
            "Hola {}. Te recuerdo que tienes tu cita de {} mañana a las {}. ¡Te esperamos!",
            full_name, procedure, formatted_time
        );

        // Create message in queue
        sqlx::query(
            "INSERT INTO message_queue (patient_id, appointment_id, type, message_text, status)
             VALUES (?1, ?2, 'reminder_1d', ?3, 'pending')"
        )
        .bind(patient_id)
        .bind(appointment_id)
        .bind(&message_text)
        .execute(&*pool)
        .await
        .map_err(|e| format!("Failed to create reminder message: {}", e))?;

        // Mark reminder as sent
        sqlx::query(
            "UPDATE appointments
             SET reminder_1d_sent_at = datetime('now')
             WHERE id = ?1"
        )
        .bind(appointment_id)
        .execute(&*pool)
        .await
        .map_err(|e| format!("Failed to update reminder timestamp: {}", e))?;

        count += 1;
    }

    println!("✅ Generated {} reminder messages", count);

    Ok(count)
}

// ============================================================================
// UTILITY COMMANDS
// ============================================================================

/// Opens a URL or deep link (e.g. whatsapp://) using the system default application
#[tauri::command]
pub async fn open_url(
    app_handle: tauri::AppHandle,
    url: String,
) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;

    app_handle
        .opener()
        .open_url(url, None::<&str>)
        .map_err(|e| format!("Failed to open URL: {}", e))?;

    Ok(())
}


// ============================================================================
// TELEMETRY COMMANDS
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct TelemetryStats {
    pub total_patients: i64,
    pub total_visits: i64,
    pub total_sessions: i64,
}

/// Queue a telemetry event for later sending
#[tauri::command]
pub async fn queue_telemetry_event(
    db_pool: State<'_, DbPool>,
    doctor_id: String,
    event_type: String,
    event_data: String,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    let result = sqlx::query(
        "INSERT INTO telemetry_events (doctor_id, event_type, event_data, timestamp, sent)
         VALUES (?1, ?2, ?3, datetime('now'), 0)"
    )
    .bind(&doctor_id)
    .bind(&event_type)
    .bind(&event_data)
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to queue telemetry event: {}", e))?;

    Ok(result.last_insert_rowid())
}

/// Get pending telemetry events (not sent yet)
#[tauri::command]
pub async fn get_pending_telemetry_events(
    db_pool: State<'_, DbPool>,
) -> Result<Vec<TelemetryEvent>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query_as::<_, (i64, String, String, String, String, i64, Option<String>)>(
        "SELECT id, doctor_id, event_type, event_data, timestamp, sent, sent_at
         FROM telemetry_events
         WHERE sent = 0
         ORDER BY id ASC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Failed to get pending telemetry events: {}", e))?;

    let events = rows.into_iter().map(|(id, doctor_id, event_type, event_data, timestamp, sent, sent_at)| {
        TelemetryEvent {
            id: Some(id),
            doctor_id,
            event_type,
            event_data: Some(event_data),
            timestamp: Some(timestamp),
            sent: Some(sent != 0),
            sent_at,
        }
    }).collect();

    Ok(events)
}

/// Mark a telemetry event as sent
#[tauri::command]
pub async fn mark_telemetry_event_sent(
    db_pool: State<'_, DbPool>,
    event_id: i64,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    sqlx::query(
        "UPDATE telemetry_events
         SET sent = 1, sent_at = datetime('now')
         WHERE id = ?1"
    )
    .bind(event_id)
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to mark telemetry event as sent: {}", e))?;

    Ok(())
}

/// Get telemetry statistics (patient, visit, session counts)
#[tauri::command]
pub async fn get_telemetry_stats(
    db_pool: State<'_, DbPool>,
) -> Result<TelemetryStats, String> {
    let pool = db_pool.0.lock().await;

    let total_patients: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM patients")
        .fetch_one(&*pool)
        .await
        .map_err(|e| format!("Failed to count patients: {}", e))?;

    let total_visits: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM visits")
        .fetch_one(&*pool)
        .await
        .map_err(|e| format!("Failed to count visits: {}", e))?;

    let total_sessions: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sessions")
        .fetch_one(&*pool)
        .await
        .map_err(|e| format!("Failed to count sessions: {}", e))?;

    Ok(TelemetryStats {
        total_patients,
        total_visits,
        total_sessions,
    })
}


// ============================================================================
// INFORMED CONSENTS COMMANDS
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConsentTemplate {
    pub id: Option<i64>,
    pub name: String,
    pub procedure_type: String,
    pub title: String,
    pub content: String,
    pub is_active: Option<bool>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InformedConsent {
    pub id: Option<i64>,
    pub patient_id: i64,
    pub visit_id: Option<i64>,
    pub procedure_type: String,
    pub procedure_name: Option<String>,
    pub consent_template: String,
    pub consent_text: String,
    pub signature_data: String,        // Base64 canvas image
    pub signed_by: String,
    pub signed_at: String,             // ISO 8601
    pub witness_name: Option<String>,
    pub witness_signature: Option<String>,
    pub doctor_name: Option<String>,
    pub notes: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

/// Get all active consent templates
#[tauri::command]
pub async fn get_consent_templates(
    db_pool: State<'_, DbPool>,
) -> Result<Vec<ConsentTemplate>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query_as::<_, (i64, String, String, String, String, i64, String, String)>(
        "SELECT id, name, procedure_type, title, content, is_active, created_at, updated_at
         FROM consent_templates
         WHERE is_active = 1
         ORDER BY name ASC"
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Failed to get consent templates: {}", e))?;

    let templates = rows.into_iter().map(|(id, name, procedure_type, title, content, is_active, created_at, updated_at)| {
        ConsentTemplate {
            id: Some(id),
            name,
            procedure_type,
            title,
            content,
            is_active: Some(is_active != 0),
            created_at: Some(created_at),
            updated_at: Some(updated_at),
        }
    }).collect();

    Ok(templates)
}

/// Get all informed consents for a patient
#[tauri::command]
pub async fn get_consents_by_patient(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
) -> Result<Vec<InformedConsent>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, patient_id, visit_id, procedure_type, procedure_name, consent_template,
                consent_text, signature_data, signed_by, signed_at, witness_name, witness_signature,
                doctor_name, notes, created_at, updated_at
         FROM informed_consents
         WHERE patient_id = ?1
         ORDER BY signed_at DESC"
    )
    .bind(patient_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| format!("Failed to get informed consents: {}", e))?;

    let consents = rows.into_iter().map(|row| {
        InformedConsent {
            id: row.get("id"),
            patient_id: row.get("patient_id"),
            visit_id: row.get("visit_id"),
            procedure_type: row.get("procedure_type"),
            procedure_name: row.get("procedure_name"),
            consent_template: row.get("consent_template"),
            consent_text: row.get("consent_text"),
            signature_data: row.get("signature_data"),
            signed_by: row.get("signed_by"),
            signed_at: row.get("signed_at"),
            witness_name: row.get("witness_name"),
            witness_signature: row.get("witness_signature"),
            doctor_name: row.get("doctor_name"),
            notes: row.get("notes"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    }).collect();

    Ok(consents)
}

/// Create a new informed consent
#[tauri::command]
pub async fn create_informed_consent(
    db_pool: State<'_, DbPool>,
    consent: InformedConsent,
) -> Result<i64, String> {
    let pool = db_pool.0.lock().await;

    let result = sqlx::query(
        "INSERT INTO informed_consents
         (patient_id, visit_id, procedure_type, procedure_name, consent_template, consent_text,
          signature_data, signed_by, signed_at, witness_name, witness_signature, doctor_name, notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)"
    )
    .bind(consent.patient_id)
    .bind(consent.visit_id)
    .bind(&consent.procedure_type)
    .bind(&consent.procedure_name)
    .bind(&consent.consent_template)
    .bind(&consent.consent_text)
    .bind(&consent.signature_data)
    .bind(&consent.signed_by)
    .bind(&consent.signed_at)
    .bind(&consent.witness_name)
    .bind(&consent.witness_signature)
    .bind(&consent.doctor_name)
    .bind(&consent.notes)
    .execute(&*pool)
    .await
    .map_err(|e| format!("Failed to create informed consent: {}", e))?;

    Ok(result.last_insert_rowid())
}

/// Get a specific informed consent by ID
#[tauri::command]
pub async fn get_consent_by_id(
    db_pool: State<'_, DbPool>,
    consent_id: i64,
) -> Result<InformedConsent, String> {
    let pool = db_pool.0.lock().await;

    let row = sqlx::query(
        "SELECT id, patient_id, visit_id, procedure_type, procedure_name, consent_template,
                consent_text, signature_data, signed_by, signed_at, witness_name, witness_signature,
                doctor_name, notes, created_at, updated_at
         FROM informed_consents
         WHERE id = ?1"
    )
    .bind(consent_id)
    .fetch_one(&*pool)
    .await
    .map_err(|e| format!("Failed to get informed consent: {}", e))?;

    Ok(InformedConsent {
        id: row.get("id"),
        patient_id: row.get("patient_id"),
        visit_id: row.get("visit_id"),
        procedure_type: row.get("procedure_type"),
        procedure_name: row.get("procedure_name"),
        consent_template: row.get("consent_template"),
        consent_text: row.get("consent_text"),
        signature_data: row.get("signature_data"),
        signed_by: row.get("signed_by"),
        signed_at: row.get("signed_at"),
        witness_name: row.get("witness_name"),
        witness_signature: row.get("witness_signature"),
        doctor_name: row.get("doctor_name"),
        notes: row.get("notes"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
}
