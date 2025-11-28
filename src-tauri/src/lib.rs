// Módulo de comandos Tauri
pub mod commands;

use sqlx::sqlite::SqlitePool;
use std::sync::Arc;
use tokio::sync::Mutex;

// Estado compartido para el pool de base de datos
pub struct DbPool(pub Arc<Mutex<SqlitePool>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
