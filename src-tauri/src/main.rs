// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sqlx::sqlite::SqlitePoolOptions;
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

// Importar el módulo lib que contiene DbPool y commands
use app_lib::{commands::*, DbPool};

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Obtener el path del app data directory
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            // Crear el directorio si no existe
            std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data directory");

            // Crear la ruta completa de la base de datos
            let db_path = app_data_dir.join("clinic.db");
            // Normalizar path con forward slashes (funciona en todas las plataformas)
            let path_str = db_path.to_string_lossy().replace("\\", "/");
            // sqlite: sin doble slash es el formato correcto para sqlx en todas las plataformas
            // ?mode=rwc permite crear el archivo si no existe (read-write-create)
            let database_url = format!("sqlite:{}?mode=rwc", path_str);

            println!("Database URL: {}", database_url);

            // Obtener el handle de la app para usarlo en el spawn
            let app_handle = app.handle().clone();

            // Inicializar el pool de base de datos de forma asíncrona
            tauri::async_runtime::spawn(async move {
                let pool = SqlitePoolOptions::new()
                    .max_connections(1) // Una sola conexión para evitar locks
                    .connect(&database_url)
                    .await
                    .expect("Failed to create database pool");

                // Ejecutar migraciones
                let migration_sql = include_str!("../migrations/001_dentix_schema_final.sql");
                sqlx::raw_sql(migration_sql)
                    .execute(&pool)
                    .await
                    .expect("Failed to run migrations");

                // Configurar WAL mode y otros pragmas para mejor concurrencia
                sqlx::query("PRAGMA journal_mode = WAL")
                    .execute(&pool)
                    .await
                    .expect("Failed to set WAL mode");

                sqlx::query("PRAGMA busy_timeout = 10000")
                    .execute(&pool)
                    .await
                    .expect("Failed to set busy timeout");

                // Crear el DbPool y agregarlo al state de Tauri
                let db_pool = DbPool(Arc::new(Mutex::new(pool)));
                app_handle.manage(db_pool);

                println!("Database initialized successfully");
            });

            Ok(())
        })
        // Registrar TODOS los comandos Tauri
        .invoke_handler(tauri::generate_handler![
            // Patient commands
            search_patients,
            find_patient_by_id,
            upsert_patient,
            // Visit commands
            get_visits_by_patient,
            delete_visit,
            // Session commands
            get_sessions_by_visit,
            get_sessions_by_patient,
            // Procedure Template commands
            get_procedure_templates,
            save_procedure_templates,
            // Diagnosis Options commands
            get_diagnosis_options,
            save_diagnosis_options,
            // Signers commands
            get_signers,
            create_signer,
            // Reason Types commands
            get_reason_types,
            create_reason_type,
            // Settings commands
            get_all_settings,
            save_setting,
            // Complex command
            save_visit_with_sessions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
