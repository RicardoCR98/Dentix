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
    pub doc_id: String,  // NOT NULL now
    pub email: Option<String>,
    pub phone: String,  // NOT NULL now
    pub emergency_phone: Option<String>,
    pub date_of_birth: String,  // ISO date string, NOT NULL
    pub anamnesis: Option<String>,
    pub allergy_detail: Option<String>,
    pub status: Option<String>,  // "active" or "inactive"
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Visit {
    pub id: Option<i64>,
    pub patient_id: Option<i64>,
    pub date: String,

    // Reason
    pub reason_type: Option<String>,
    pub reason_detail: Option<String>,

    // Diagnosis
    pub diagnosis_text: Option<String>,
    pub auto_dx_text: Option<String>,
    pub full_dx_text: Option<String>,
    pub tooth_dx_json: Option<String>,

    // Financial - REAL/f64 now (supports decimals)
    pub budget: f64,
    pub discount: f64,
    pub payment: f64,
    pub balance: f64,
    pub cumulative_balance: f64,

    // Administrative
    pub signer: Option<String>,
    pub observations: Option<String>,
    pub is_saved: Option<bool>,

    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VisitProcedure {
    pub id: Option<i64>,
    pub visit_id: Option<i64>,
    pub name: String,
    pub unit_price: f64,  // REAL now
    pub quantity: i64,
    pub subtotal: f64,  // REAL now
    pub procedure_template_id: Option<i64>,
    pub sort_order: Option<i64>,
    pub created_at: Option<String>,
}

// Legacy compatibility - SessionRow is now just a Visit with procedures
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SessionRow {
    #[serde(flatten)]
    pub visit: Visit,
    pub items: Vec<VisitProcedure>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcedureTemplate {
    pub id: Option<i64>,
    pub name: String,
    pub default_price: f64,  // REAL now
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

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveVisitPayload {
    pub patient: Patient,
    pub visit: Visit,
    pub sessions: Vec<SessionRow>,
}

// =========================
// PATIENT COMMANDS
// =========================

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
        // UPDATE
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
        // INSERT
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
// VISIT COMMANDS
// =========================

#[tauri::command]
pub async fn get_visits_by_patient(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
) -> Result<Vec<Visit>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, patient_id, date, reason_type, reason_detail,
                diagnosis_text, auto_dx_text, full_dx_text, tooth_dx_json,
                budget, discount, payment, balance, cumulative_balance,
                signer, observations, is_saved, created_at, updated_at
         FROM visits
         WHERE patient_id = ?1
         ORDER BY date DESC, id DESC"
    )
    .bind(patient_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let visits = rows
        .into_iter()
        .map(|row| Visit {
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
            signer: row.get("signer"),
            observations: row.get("observations"),
            is_saved: Some(row.get::<i64, _>("is_saved") != 0),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(visits)
}

#[tauri::command]
pub async fn delete_visit(
    db_pool: State<'_, DbPool>,
    visit_id: i64,
) -> Result<(), String> {
    let pool = db_pool.0.lock().await;

    // Check if visit is saved (cannot delete saved visits)
    let row = sqlx::query("SELECT is_saved FROM visits WHERE id = ?1")
        .bind(visit_id)
        .fetch_optional(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(row) = row {
        let is_saved: i64 = row.get("is_saved");
        if is_saved != 0 {
            return Err("Cannot delete a saved visit".to_string());
        }
    }

    // Delete visit (cascade will delete procedures)
    sqlx::query("DELETE FROM visits WHERE id = ?1")
        .bind(visit_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// =========================
// VISIT PROCEDURES COMMANDS
// =========================

#[tauri::command]
pub async fn get_procedures_by_visit(
    db_pool: State<'_, DbPool>,
    visit_id: i64,
) -> Result<Vec<VisitProcedure>, String> {
    let pool = db_pool.0.lock().await;

    let rows = sqlx::query(
        "SELECT id, visit_id, name, unit_price, quantity, subtotal, procedure_template_id, sort_order, created_at
         FROM visit_procedures
         WHERE visit_id = ?1
         ORDER BY sort_order ASC, id ASC"
    )
    .bind(visit_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let procedures = rows
        .into_iter()
        .map(|row| VisitProcedure {
            id: row.get("id"),
            visit_id: row.get("visit_id"),
            name: row.get("name"),
            unit_price: row.get("unit_price"),
            quantity: row.get("quantity"),
            subtotal: row.get("subtotal"),
            procedure_template_id: row.get("procedure_template_id"),
            sort_order: row.get("sort_order"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(procedures)
}

// Obtener todas las sesiones (visitas) de un paciente
#[tauri::command]
pub async fn get_sessions_by_patient(
    db_pool: State<'_, DbPool>,
    patient_id: i64,
) -> Result<Vec<SessionRow>, String> {
    let pool = db_pool.0.lock().await;

    // Get all visits for this patient
    let visit_rows = sqlx::query(
        "SELECT id, patient_id, date, reason_type, reason_detail,
                diagnosis_text, auto_dx_text, full_dx_text, tooth_dx_json,
                budget, discount, payment, balance, cumulative_balance,
                signer, observations, is_saved, created_at, updated_at
         FROM visits
         WHERE patient_id = ?1
         ORDER BY date DESC, id DESC"
    )
    .bind(patient_id)
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    let mut sessions = Vec::new();

    for visit_row in visit_rows {
        let visit_id: i64 = visit_row.get("id");

        let visit = Visit {
            id: Some(visit_id),
            patient_id: visit_row.get("patient_id"),
            date: visit_row.get("date"),
            reason_type: visit_row.get("reason_type"),
            reason_detail: visit_row.get("reason_detail"),
            diagnosis_text: visit_row.get("diagnosis_text"),
            auto_dx_text: visit_row.get("auto_dx_text"),
            full_dx_text: visit_row.get("full_dx_text"),
            tooth_dx_json: visit_row.get("tooth_dx_json"),
            budget: visit_row.get("budget"),
            discount: visit_row.get("discount"),
            payment: visit_row.get("payment"),
            balance: visit_row.get("balance"),
            cumulative_balance: visit_row.get("cumulative_balance"),
            signer: visit_row.get("signer"),
            observations: visit_row.get("observations"),
            is_saved: Some(visit_row.get::<i64, _>("is_saved") != 0),
            created_at: visit_row.get("created_at"),
            updated_at: visit_row.get("updated_at"),
        };

        // Get procedures for this visit
        let proc_rows = sqlx::query(
            "SELECT id, visit_id, name, unit_price, quantity, subtotal, procedure_template_id, sort_order, created_at
             FROM visit_procedures
             WHERE visit_id = ?1
             ORDER BY sort_order ASC, id ASC"
        )
        .bind(visit_id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?;

        let procedures: Vec<VisitProcedure> = proc_rows
            .into_iter()
            .map(|row| VisitProcedure {
                id: row.get("id"),
                visit_id: row.get("visit_id"),
                name: row.get("name"),
                unit_price: row.get("unit_price"),
                quantity: row.get("quantity"),
                subtotal: row.get("subtotal"),
                procedure_template_id: row.get("procedure_template_id"),
                sort_order: row.get("sort_order"),
                created_at: row.get("created_at"),
            })
            .collect();

        sessions.push(SessionRow { visit, items: procedures });
    }

    Ok(sessions)
}

// Legacy compatibility - get_sessions_by_visit now returns visits with procedures
#[tauri::command]
pub async fn get_sessions_by_visit(
    db_pool: State<'_, DbPool>,
    visit_id: i64,
) -> Result<Vec<SessionRow>, String> {
    let pool = db_pool.0.lock().await;

    // Get the visit
    let visit_row = sqlx::query(
        "SELECT id, patient_id, date, reason_type, reason_detail,
                diagnosis_text, auto_dx_text, full_dx_text, tooth_dx_json,
                budget, discount, payment, balance, cumulative_balance,
                signer, observations, is_saved, created_at, updated_at
         FROM visits
         WHERE id = ?1"
    )
    .bind(visit_id)
    .fetch_optional(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(row) = visit_row {
        let visit = Visit {
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
            signer: row.get("signer"),
            observations: row.get("observations"),
            is_saved: Some(row.get::<i64, _>("is_saved") != 0),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };

        // Get procedures for this visit (inline to avoid ownership issues)
        let proc_rows = sqlx::query(
            "SELECT id, visit_id, name, unit_price, quantity, subtotal, procedure_template_id, sort_order, created_at
             FROM visit_procedures
             WHERE visit_id = ?1
             ORDER BY sort_order ASC, id ASC"
        )
        .bind(visit_id)
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())?;

        let procedures: Vec<VisitProcedure> = proc_rows
            .into_iter()
            .map(|row| VisitProcedure {
                id: row.get("id"),
                visit_id: row.get("visit_id"),
                name: row.get("name"),
                unit_price: row.get("unit_price"),
                quantity: row.get("quantity"),
                subtotal: row.get("subtotal"),
                procedure_template_id: row.get("procedure_template_id"),
                sort_order: row.get("sort_order"),
                created_at: row.get("created_at"),
            })
            .collect();

        Ok(vec![SessionRow { visit, items: procedures }])
    } else {
        Ok(vec![])
    }
}

// =========================
// COMPLEX COMMAND: Save Visit with Sessions
// =========================
// ARQUITECTURA: Cada "sesión" del frontend es una "visita" en la BD
// Este comando guarda múltiples visitas (una por cada sesión)

#[tauri::command]
pub async fn save_visit_with_sessions(
    db_pool: State<'_, DbPool>,
    payload: SaveVisitPayload,
) -> Result<HashMap<String, i64>, String> {
    let pool = db_pool.0.lock().await;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // 1. Upsert patient
    let patient_id = if let Some(id) = payload.patient.id {
        sqlx::query(
            "UPDATE patients
             SET full_name = ?1, doc_id = ?2, email = ?3, phone = ?4, emergency_phone = ?5,
                 date_of_birth = ?6, anamnesis = ?7, allergy_detail = ?8, status = ?9,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?10"
        )
        .bind(&payload.patient.full_name)
        .bind(&payload.patient.doc_id)
        .bind(&payload.patient.email)
        .bind(&payload.patient.phone)
        .bind(&payload.patient.emergency_phone)
        .bind(&payload.patient.date_of_birth)
        .bind(&payload.patient.anamnesis)
        .bind(&payload.patient.allergy_detail)
        .bind(payload.patient.status.as_deref().unwrap_or("active"))
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
        .bind(&payload.patient.full_name)
        .bind(&payload.patient.doc_id)
        .bind(&payload.patient.email)
        .bind(&payload.patient.phone)
        .bind(&payload.patient.emergency_phone)
        .bind(&payload.patient.date_of_birth)
        .bind(&payload.patient.anamnesis)
        .bind(&payload.patient.allergy_detail)
        .bind(payload.patient.status.as_deref().unwrap_or("active"))
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
        result.last_insert_rowid()
    };

    // 2. Iterar sobre cada sesión y guardarla como una visita separada
    let mut last_visit_id = 0i64;

    for session in payload.sessions {
        // Calcular balance acumulativo hasta esta sesión
        let previous_cumulative = if let Some(session_id) = session.visit.id {
            // Si es una sesión existente, sumar balance de sesiones anteriores (excluyendo esta)
            sqlx::query_scalar::<_, f64>(
                "SELECT COALESCE(SUM(balance), 0.0) FROM visits
                 WHERE patient_id = ?1 AND id < ?2 AND is_saved = 1"
            )
            .bind(patient_id)
            .bind(session_id)
            .fetch_one(&mut *tx)
            .await
            .unwrap_or(0.0)
        } else {
            // Si es una sesión nueva, sumar balance de todas las sesiones guardadas
            sqlx::query_scalar::<_, f64>(
                "SELECT COALESCE(SUM(balance), 0.0) FROM visits
                 WHERE patient_id = ?1 AND is_saved = 1"
            )
            .bind(patient_id)
            .fetch_one(&mut *tx)
            .await
            .unwrap_or(0.0)
        };

        let cumulative_balance = previous_cumulative + session.visit.balance;

        // Upsert la visita (sesión)
        let visit_id = if let Some(id) = session.visit.id {
            // Actualizar sesión existente
            sqlx::query(
                "UPDATE visits
                 SET patient_id = ?1, date = ?2, reason_type = ?3, reason_detail = ?4,
                     diagnosis_text = ?5, auto_dx_text = ?6, full_dx_text = ?7, tooth_dx_json = ?8,
                     budget = ?9, discount = ?10, payment = ?11, balance = ?12, cumulative_balance = ?13,
                     signer = ?14, observations = ?15, is_saved = ?16, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?17"
            )
            .bind(patient_id)
            .bind(&session.visit.date)
            .bind(&payload.visit.reason_type)  // Usar metadata de la visita principal
            .bind(&payload.visit.reason_detail)
            .bind(&payload.visit.diagnosis_text)
            .bind(&payload.visit.auto_dx_text)
            .bind(&payload.visit.full_dx_text)
            .bind(&payload.visit.tooth_dx_json)
            .bind(session.visit.budget)
            .bind(session.visit.discount)
            .bind(session.visit.payment)
            .bind(session.visit.balance)
            .bind(cumulative_balance)
            .bind(&session.visit.signer)
            .bind(&session.visit.observations)
            .bind(session.visit.is_saved.unwrap_or(true) as i64)  // Marcar como guardada
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
            id
        } else {
            // Insertar nueva sesión
            let result = sqlx::query(
                "INSERT INTO visits (patient_id, date, reason_type, reason_detail,
                                    diagnosis_text, auto_dx_text, full_dx_text, tooth_dx_json,
                                    budget, discount, payment, balance, cumulative_balance,
                                    signer, observations, is_saved)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)"
            )
            .bind(patient_id)
            .bind(&session.visit.date)
            .bind(&payload.visit.reason_type)  // Usar metadata de la visita principal
            .bind(&payload.visit.reason_detail)
            .bind(&payload.visit.diagnosis_text)
            .bind(&payload.visit.auto_dx_text)
            .bind(&payload.visit.full_dx_text)
            .bind(&payload.visit.tooth_dx_json)
            .bind(session.visit.budget)
            .bind(session.visit.discount)
            .bind(session.visit.payment)
            .bind(session.visit.balance)
            .bind(cumulative_balance)
            .bind(&session.visit.signer)
            .bind(&session.visit.observations)
            .bind(session.visit.is_saved.unwrap_or(true) as i64)  // Marcar como guardada
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
            result.last_insert_rowid()
        };

        last_visit_id = visit_id;

        // Eliminar procedimientos existentes de esta visita
        sqlx::query("DELETE FROM visit_procedures WHERE visit_id = ?1")
            .bind(visit_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        // Insertar procedimientos de esta sesión
        for (index, proc) in session.items.iter().enumerate() {
            // Solo insertar procedimientos con cantidad > 0 o con nombre no vacío
            if proc.quantity > 0 || !proc.name.trim().is_empty() {
                sqlx::query(
                    "INSERT INTO visit_procedures (visit_id, name, unit_price, quantity, subtotal, procedure_template_id, sort_order)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
                )
                .bind(visit_id)
                .bind(&proc.name)
                .bind(proc.unit_price)
                .bind(proc.quantity)
                .bind(proc.subtotal)
                .bind(proc.procedure_template_id)
                .bind(index as i64)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
            }
        }
    }

    // Commit transaction
    tx.commit().await.map_err(|e| e.to_string())?;

    let mut result = HashMap::new();
    result.insert("patient_id".to_string(), patient_id);
    result.insert("visit_id".to_string(), last_visit_id);  // Retornar ID de la última sesión

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

    // Primero, desactivar todas las plantillas existentes
    sqlx::query("UPDATE procedure_templates SET active = 0")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    // Ahora hacer UPSERT de cada plantilla (preservando IDs existentes)
    for template in templates {
        if let Some(id) = template.id {
            // UPDATE o INSERT con ID específico usando UPSERT
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
            // Verificar si ya existe una plantilla con el mismo nombre
            let existing: Option<i64> = sqlx::query_scalar(
                "SELECT id FROM procedure_templates WHERE name = ?1"
            )
            .bind(&template.name)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

            if let Some(existing_id) = existing {
                // Actualizar la plantilla existente
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
                // Insertar nueva plantilla
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

    // Eliminar plantillas que quedaron inactivas y no están en uso
    // (solo si no están referenciadas en visit_procedures)
    sqlx::query(
        "DELETE FROM procedure_templates
         WHERE active = 0
         AND id NOT IN (SELECT DISTINCT procedure_template_id FROM visit_procedures WHERE procedure_template_id IS NOT NULL)"
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

    for option in options {
        if let Some(id) = option.id {
            // UPDATE usando ID
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
            // INSERT or UPDATE basado en label (UPSERT)
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
