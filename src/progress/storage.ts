import { invoke, isTauri } from '@tauri-apps/api/core';

/** Where the save game's JSON text lives. */
export interface SaveStorage {
  load(): Promise<string | null>;
  save(json: string): Promise<void>;
}

const LOCAL_STORAGE_KEY = 'typingame.spielstand';

/** Desktop: `spielstand.json` in the app data directory (see `src-tauri/src/lib.rs`). Browser: localStorage. */
export function createStorage(): SaveStorage {
  if (isTauri()) {
    return {
      load: () => invoke<string | null>('load_save'),
      save: (json) => invoke<void>('store_save', { json }),
    };
  }
  return {
    load: async () => localStorage.getItem(LOCAL_STORAGE_KEY),
    save: async (json) => localStorage.setItem(LOCAL_STORAGE_KEY, json),
  };
}
