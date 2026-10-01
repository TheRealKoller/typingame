import { defineConfig } from 'vitest/config';

// Set by `tauri dev` when targeting a remote device; unset for local development.
const tauriDevHost = process.env.TAURI_DEV_HOST;

export default defineConfig({
  // Keep Rust compiler output visible when running under `tauri dev`.
  clearScreen: false,
  server: {
    // Tauri expects a fixed port and fails if it is taken.
    port: 1420,
    strictPort: true,
    // Always a concrete IPv4 address. With `false` (Vite's default) Node resolves `localhost`
    // to whatever comes first – on Fedora that is `::1` – while the WebView's `localhost`
    // can end up on `127.0.0.1`. Then nothing answers and the window stays empty.
    host: tauriDevHost || '127.0.0.1',
    hmr: tauriDevHost ? { protocol: 'ws', host: tauriDevHost, port: 1421 } : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    // Phaser alone exceeds Vite's default 500 kB warning threshold.
    chunkSizeWarningLimit: 2000,
  },
  test: {
    // Game logic is tested without Phaser, so plain Node is enough.
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Keeps `npm test` green until the first logic module ships its tests.
    passWithNoTests: true,
  },
});
