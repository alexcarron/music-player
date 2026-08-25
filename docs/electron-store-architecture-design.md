# Persistent State Design (Electron Store)

`electron-store` handles lightweight persistent state that doesn't belong in SQLite like window position, UI preferences, playback position, and OAuth tokens. It is split clearly between what the main process owns and what the renderer reads via IPC.

# Ownership Rule

The renderer never imports `electron-store` directly. It reads and writes its keys through the `ui:get-persisted-state` and `ui:set-persisted-state` IPC channels. Main owns all store access.

# Keys

## Main Process Only

These keys are never exposed to the renderer.

### **`rootMusicFolder`** `string | null`

The absolute path to the user's configured music folder. Set once on first launch via the OS folder picker. Read by the file watcher on startup.

### **`windowBounds`** `{ x: number, y: number, width: number, height: number }`

Saved on window move and resize, restored on relaunch so the window opens where the user left it.

### **`spotifyTokens`** `{ accessToken: string, refreshToken: string, expiresAt: number }`

Encrypted at rest via Electron's `safeStorage`. Written after a successful OAuth exchange. All Spotify API calls happen in the main process, so it's never sent to the renderer.

## Renderer via IPC

These keys are written by the renderer through IPC and read back on relaunch to hydrate the UI before first render.

### **`uiState`** `{ activeView: string, selectedTrackId: number | null, sidebarWidth: number, scrollPositions: Record<string, number> }`

Saved by a debounced Zustand subscription (500ms) on every `uiStore` change. Restored via `ui:get-persisted-state` on boot.

### **`playbackState`** `{ trackId: number | null, positionSeconds: number, volume: number }`

Written by the primary Howler instance via IPC every 5 seconds during playback, and once more on app quit. Restored on relaunch so playback resumes from exactly where the user left off.
