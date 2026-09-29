// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  // WebKitGTK on Wayland with the proprietary NVIDIA driver aborts with
  // "Error 71 (Protocol error) dispatching to Wayland display" unless explicit
  // sync is disabled. The variable is only read by the NVIDIA driver.
  #[cfg(target_os = "linux")]
  if std::env::var_os("__NV_DISABLE_EXPLICIT_SYNC").is_none() {
    // SAFETY: runs before any other thread is spawned.
    unsafe { std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1") };
  }

  typingame_lib::run();
}
