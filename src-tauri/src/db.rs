// src-tauri/src/db.rs
use serde::{Deserialize, Serialize};
use tauri::State;
use tauri_plugin_sql::{Builder, Migration, MigrationKind};

#[derive(Debug, Serialize, Deserialize)]
pub struct Patient {
    pub id: Option<i64>,
    pub full_name: String,
    pub doc_id: Option<String>,
    pub phone: Option<String>,
    pub age: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Visit {
    pub id: Option<i64>,
    pub patient_id: i64,
    pub date: String,
    pub reason_type: String,
    pub reason_detail: Option<String>,
    pub diagnosis: Option<String>,
    pub tooth_dx_json: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Session {
    pub id: Option<i64>,
    pub visit_id: i64,
    pub date: String,
    pub auto: bool,
    pub budget: i64,
    pub payment: i64,
    pub balance: i64,
    pub signer: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionItem {
    pub id: Option<i64>,
    pub session_id: i64,
    pub name: String,
    pub unit: i64,
    pub qty: i64,
    pub sub: i64,
}