use std::{fs, io, path::PathBuf};

use tauri::{AppHandle, Manager};

/// Save game file in the app data directory, e.g. `~/.local/share/de.therealkoller.typingame/` on Linux.
const SAVE_FILE: &str = "spielstand.json";

fn save_path(app: &AppHandle) -> Result<PathBuf, String> {
  let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
  Ok(dir.join(SAVE_FILE))
}

/// Returns the saved game as JSON text, or `None` if nothing was saved yet.
#[tauri::command]
async fn load_save(app: AppHandle) -> Result<Option<String>, String> {
  match fs::read_to_string(save_path(&app)?) {
    Ok(json) => Ok(Some(json)),
    Err(e) if e.kind() == io::ErrorKind::NotFound => Ok(None),
    Err(e) => Err(e.to_string()),
  }
}

/// Writes the game as JSON text. Writes to a temporary file first so a crash never leaves half a save.
#[tauri::command]
async fn store_save(app: AppHandle, json: String) -> Result<(), String> {
  let path = save_path(&app)?;
  if let Some(dir) = path.parent() {
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
  }
  let tmp = path.with_extension("json.tmp");
  fs::write(&tmp, json).map_err(|e| e.to_string())?;
  fs::rename(&tmp, &path).map_err(|e| e.to_string())
}

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
    .invoke_handler(tauri::generate_handler![load_save, store_save])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
