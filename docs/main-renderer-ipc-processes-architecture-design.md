# Processes Architecture (Main, Renderer, and IPC)

**This document defines exactly what each process owns. If you are ever unsure where a piece of logic belongs, consult this document first.**

# The Golden Rule

- The renderer process never touches the filesystem, database, or OS directly.
- The main process never owns UI state or React component logic.
- Everything crosses the boundary through typed IPC handlers

# Process Responsibilities at a Glance

| Responsibility                | Main Process | Renderer Process |     |
| ----------------------------- | ------------ | ---------------- | --- |
| Filesystem read/write         | ✅ Owns      | ❌ Never         |     |
| Database (SQLite)             | ✅ Owns      | ❌ Never         |     |
| Audio playback                | ❌ Never     | ✅ Owns          |     |
| Audio preview (secondary)     | ❌ Never     | ✅ Owns          |     |
| File watching (chokidar)      | ✅ Owns      | ❌ Never         |     |
| Metadata extraction           | ✅ Owns      | ❌ Never         |     |
| Spotify API calls             | ✅ Owns      | ❌ Never         |     |
| OS media key registration     | ✅ Owns      | ❌ Never         |     |
| System tray (future)          | ✅ Owns      | ❌ Never         |     |
| Background job queue          | ✅ Owns      | ❌ Never         |     |
| IPC handler definitions       | ✅ Owns      | ❌ Never         |     |
| IPC invocations               | ❌ Never     | ✅ Owns          |     |
| React component tree          | ❌ Never     | ✅ Owns          |     |
| Zustand stores                | ❌ Never     | ✅ Owns          |     |
| UI state (selections, scroll) | ❌ Never     | ✅ Owns          |     |
| electron-store (UI prefs)     | ❌ Never     | ✅ Owns via IPC  |     |
| electron-store (tokens)       | ✅ Owns      | ❌ Never         |     |
| App window management         | ✅ Owns      | ❌ Never         |     |
| Export / backup file writing  | ✅ Owns      | ❌ Never         |     |

# 1. Main Process (`src/main/`)

The main process is a **Node.js environment**. It has full access to the OS, filesystem, and native APIs. It has no DOM and cannot render anything visual.

## 1.1 Filesystem

The main process is the **sole owner** of all filesystem operations.
**What it owns:**

- Scanning the root music folder on startup to detect new/missing files
- Watching the root folder live via `chokidar` for add/change/unlink events
- Reading audio file buffers for metadata extraction
- Writing album art back into audio files (embedding via `music-metadata` + `node-taglib3` or similar)
- Writing ZIP backup archives during the one-click export flow
- Writing JSON export files to disk at a user-chosen path
- Reading the user's chosen root music folder path from `electron-store`
- Opening the OS native file/folder picker dialog (`dialog.showOpenDialog`)

**What triggers it:**

- `chokidar` fires `add` / `unlink` / `change` → main processes the event and notifies renderer via IPC push
- Renderer invokes `library:scan-now` IPC → main re-scans root folder
- Renderer invokes `export:backup` IPC → main writes the ZIP file

**What it never does:**

- Never sends raw file Buffers to the renderer (too large, wrong layer)
- Never lets the renderer specify arbitrary file paths to read/write

## 1.2 Database (SQLite via `better-sqlite3` + Drizzle ORM)

The main process is the **sole owner** of the SQLite database connection.
There is exactly **one** `better-sqlite3` connection, opened at app start, closed at app quit.

**What it owns:**

- Opening and owning the single DB connection (stored in `AppData/Roaming/<app-name>/library.db`)
- Enabling WAL mode on startup (`PRAGMA journal_mode=WAL`)
- Running all Drizzle migrations on startup before any IPC handlers are registered
- All reads: tracks, tags, trackTags, playlists, playlistRules, playEvents, trackAnalysis
- All writes: inserting new tracks, upserting tags, recording play events, saving playlists
- All complex queries: auto-playlist rule evaluation, tag weight filtering, analytics aggregation
- Exporting DB content as JSON/CSV (runs query, serializes result, passes to filesystem layer to write)

**What it never does:**

- Never passes the DB connection object to the renderer
- Never exposes raw SQL to the renderer. All queries are encapsulated in typed repository functions

**Repository pattern (enforced):**
All database logic lives in `src/main/db/repositories/`. Each domain has its own file:

```
src/main/db/
  schema.ts              ← Drizzle schema definitions (single source of truth)
  migrations/            ← Drizzle migration files (never hand-edit)
  repositories/
    tracks.repo.ts       ← All track CRUD
    tags.repo.ts         ← All tag CRUD + weight operations
    playlists.repo.ts    ← Manual + auto + smart playlist logic
    playEvents.repo.ts   ← Play history recording + analytics queries
    analysis.repo.ts     ← Audio analysis read/write
    library.repo.ts      ← Library-wide queries (tag distribution, unlinked songs, etc.)
```

IPC handlers call repository functions. IPC handlers never construct SQL directly.

## 1.3 Background Job Queue

Long-running operations (metadata extraction for 3,000 songs, Spotify import, album art fetching) must never block the IPC thread or the UI.

**What it owns:**

- A simple FIFO job queue implemented in `src/main/jobs/queue.ts`
- Job types: `EXTRACT_METADATA`, `FETCH_ALBUM_ART`, `SPOTIFY_IMPORT`, `MATCH_SPOTIFY_TRACKS`
- Processing jobs one at a time (or in small batches of 5–10 for metadata)
- Emitting progress events to the renderer via IPC push: `jobs:progress` `{ jobId, type, current, total, status }`
- Emitting completion or error events: `jobs:complete` / `jobs:error`

**What it never does:**

- Never blocks the main IPC event loop. Everything is async and awaited properly
- Never processes more jobs than the concurrency limit (1 for Spotify, 10 for metadata)

## 1.4 Spotify API

All Spotify HTTP calls happen in the main process. The renderer never calls the Spotify API directly.

**What it owns:**

- Initiating the OAuth flow by opening the Spotify auth URL in the system browser
- Starting a local HTTP server temporarily on a fixed port to catch the OAuth redirect
- Exchanging the auth code for an access token
- Storing the access token and refresh token via `electron-store` with `safeStorage` encryption
- All Spotify Web API calls: `GET /me/tracks`, `GET /me/playlists`, `GET /audio-features`
- Token refresh logic (if token expires mid-import)
- Fuzzy matching Spotify tracks to local files (using `fuse.js` in the main process)
- Persisting matched Spotify audio features into `track_analysis` via the repository

**What it never does:**

- Never exposes the access token to the renderer
- Never lets the renderer make Spotify API calls directly

## 1.5 OS Integration

**What it owns:**

- Registering global media key shortcuts via Electron's `globalShortcut` API:
  - `MediaPlayPause` → calls internal playback command dispatcher → pushes `playback:command` to renderer
  - `MediaNextTrack` → pushes `playback:command { action: 'next' }` to renderer
  - `MediaPreviousTrack` → pushes `playback:command { action: 'previous' }` to renderer
- Deregistering all shortcuts cleanly on app quit
- Managing the `BrowserWindow` (size, title, min/max dimensions)
- Persisting and restoring window bounds on relaunch via `electron-store`

**Critical note on media keys:**
The main process receives the OS media key event, but it **does not control audio**. It translates the event into an IPC push to the renderer, which owns Howler.js and executes the actual playback command. Main is a relay. Renderer is the executor.

# 2. Renderer Process (`src/renderer/`)

The renderer process is a **Chromium browser environment** running React. It has access to the DOM, Web Audio API, and all browser APIs. It has no direct filesystem or OS access.

## 2.1 Audio Playback

The renderer owns all audio entirely. The main process never touches audio.

**What it owns:**

- Two independent `Howler.js` instances:
  - **Primary instance** (`src/renderer/audio/player.ts`): main playback queue
  - **Preview instance** (`src/renderer/audio/preview.ts`): hover/button/keybind previews
- All playback state: current track, position, duration, playing/paused, volume
- Queue management: the ordered array of track IDs to play, current position in queue
- Gapless playback: pre-loading the next track before current track ends (`Howl` `onend` event)
- Seeking, volume, mute
- Persisting playback position to `electron-store` every 5 seconds (via IPC) so it survives relaunch

**Preview instance rules:**

- The preview instance runs completely independently of the primary instance
- It plays a 15-second snippet starting from the 30-second mark of a track (configurable)
- It auto-stops after the snippet duration or when the user navigates away
- It is destroyed and recreated on each new preview. It is never reused across songs

**What triggers audio actions:**

- User clicks play/pause in the UI → Zustand `playbackStore` action → calls `player.ts` method
- Main process pushes `playback:command` (from media keys) → renderer's IPC listener → same Zustand action
- `Howl.onend` fires → player calls `playNext()` internally, updates Zustand store

**What audio never does:**

- Never reads files from disk directly. Howler.js is given a `file://` URI (constructed from the track's `filePath` stored in the DB, passed via IPC) which Chromium resolves via its own file protocol handler
- Never writes anything

## 2.2 UI State (Zustand Stores)

The renderer owns all UI and application state. Zustand is the single source of truth for everything the UI needs to render.

**Store breakdown, one store per domain:**

```
src/renderer/stores/
  playbackStore.ts    ← currentTrack, queue, isPlaying, volume, position, shuffle
  libraryStore.ts     ← allTracks[], activeFilters, sortColumn, sortDirection, searchQuery
  taggingStore.ts     ← selectedTracks[], pendingSuggestions[], undoStack (via zundo)
  playlistStore.ts    ← playlists[], activePlaylist, dragState
  uiStore.ts          ← sidebarWidth, activeView, selectedSongId, scrollPositions{}
  jobStore.ts         ← activeJobs[], completedJobs[], erroredJobs[]
  spotifyStore.ts     ← importStatus, matchResults[], unmatchedTracks[]
```

**Rules for stores:**

- Stores hold **derived/cached** copies of DB data for rendering. The DB is the system of record.
  If there is ever a conflict, the DB wins.
- When a user action mutates data (tag a song, create a playlist), the renderer:
  1. Calls the relevant IPC invoke (e.g. `tags:apply`)
  2. On success, updates the Zustand store optimistically (or re-fetches from DB via IPC)
  3. On error, rolls back the optimistic update
- `uiStore` state (scroll positions, active view, selected song) is persisted to `electron-store`
  via a Zustand middleware subscription that saves on every change, debounced 500ms.
  On relaunch, the renderer fetches this state via `ui:get-persisted-state` IPC and hydrates
  the store before first render.
- `taggingStore` uses `zundo` middleware for undo/redo. Only tagging mutations are tracked.
  Playback and navigation actions are never pushed onto the undo stack.

## 2.3 React Component Tree

The renderer owns all React components. No JSX exists in the main process.

**Top-level layout structure:**

```
<App>
  <Sidebar />              ← Library sections, playlists, tags, smart views
  <MainContent>
    <LibraryView />        ← Default: sortable song list
    <TaggingWorkspace />   ← Dedicated full-view tagging mode
    <ArtistView />
    <AlbumView />
    <PlaylistView />
    <AnalyticsView />
    <SettingsView />
  </MainContent>
  <NowPlayingBar />        ← Always visible, anchored bottom
  <JobProgressBar />       ← Shown only during active background jobs
</App>
```

**Rules for components:**

- Components never call `ipcRenderer` directly. They call Zustand store actions.
- Zustand store actions call a thin **IPC service layer** (`src/renderer/ipc/`) that wraps all `ipcRenderer.invoke` calls with proper TypeScript types.
- Components are never async themselves. They read from Zustand synchronously and trigger actions that are async under the hood.

# 3. IPC Layer: The Contract Between Processes

All communication between main and renderer goes through typed IPC channels. This is the most important architectural layer to get right early.

## 3.1 Channel Naming Convention

```
domain:action-name

Examples:
  library:get-all-tracks
  library:get-track-by-id
  tags:get-all
  tags:apply
  tags:bulk-apply
  tags:remove
  playlists:create
  playlists:get-tracks
  playback:persist-position
  spotify:start-import
  jobs:get-active
  export:backup
  ui:get-persisted-state
  ui:set-persisted-state
```

## 3.2 Two IPC Patterns

**Pattern A: Request / Response (renderer asks, main answers)**
Used for all data fetching and mutations initiated by the user.

```typescript
// Renderer side (ipc service layer)
const tracks = await ipcRenderer.invoke("library:get-all-tracks");

// Main side (ipc handler)
ipcMain.handle("library:get-all-tracks", async () => {
	return tracksRepo.getAll(); // returns Track[]
});
```

**Pattern B: Push (main notifies renderer unprompted)**
Used for events the main process generates autonomously: file watcher events, job progress updates, media key commands.

```typescript
// Main side, pushes to renderer
mainWindow.webContents.send("library:file-added", { track: newTrack });
mainWindow.webContents.send("jobs:progress", { jobId, current, total });
mainWindow.webContents.send("playback:command", { action: "play-pause" });

// Renderer side, listens in a useEffect or Zustand store init
ipcRenderer.on("library:file-added", (_, { track }) => {
	libraryStore.getState().addTrack(track);
});
```

## 3.3 Shared Type Contract

A single shared file defines all IPC payload types. Both main and renderer import from it. This is non-negotiable. It is what prevents runtime type errors across the process boundary.

```
src/shared/
  ipc-types.ts      ← All IPC channel names as const + all payload/response types
  db-types.ts       ← All DB entity types (Track, Tag, Playlist, etc.) used by both processes
  constants.ts      ← App-wide constants (snippet duration, debounce timings, etc.)
```

**Example `ipc-types.ts`:**

```typescript
export const IPC = {
	LIBRARY_GET_ALL_TRACKS: "library:get-all-tracks",
	TAGS_APPLY: "tags:apply",
	TAGS_BULK_APPLY: "tags:bulk-apply",
	PLAYBACK_PERSIST: "playback:persist-position",
	JOBS_PROGRESS: "jobs:progress", // push channel
	LIBRARY_FILE_ADDED: "library:file-added", // push channel
	PLAYBACK_COMMAND: "playback:command", // push channel
} as const;

export type TagsApplyPayload = {
	trackId: number;
	tagId: number;
	weight: number;
};
export type TagsApplyResponse = { success: boolean };
export type PlaybackCommand = { action: "play-pause" | "next" | "previous" };
export type JobProgressPayload = {
	jobId: string;
	type: string;
	current: number;
	total: number;
};
```

## 3.4 IPC Rules (Enforced)

- All IPC handlers are defined in `src/main/ipc/`, one file per domain, mirroring the repository structure
- The renderer never accesses `ipcRenderer` directly in components. It only goes through `src/renderer/ipc/` service wrappers
- IPC payloads are plain serializable objects only (no class instances, no functions, no Buffers for large data)
- Every IPC handler wraps its body in try/catch and returns `{ success: false, error: string }` on failure. It never throws across the process boundary
- Push channels (main → renderer) are only sent after checking `mainWindow && !mainWindow.isDestroyed()`

# 4. electron-store Split

`electron-store` is used in two distinct ways, owned by different processes:

| Store Key         | Owner             | Contains                                                       |
| ----------------- | ----------------- | -------------------------------------------------------------- |
| `spotifyTokens`   | Main process only | OAuth access + refresh tokens (encrypted via `safeStorage`)    |
| `rootMusicFolder` | Main process only | Path to the user's music folder                                |
| `windowBounds`    | Main process only | Window x, y, width, height for restore                         |
| `uiState`         | Renderer via IPC  | Active view, selected song ID, scroll positions, sidebar width |
| `playbackState`   | Renderer via IPC  | Last track ID, position in seconds, volume                     |

The renderer never imports `electron-store` directly. It reads/writes its keys through `ui:get-persisted-state` and `ui:set-persisted-state` IPC channels.

# 6. Decision Log: Why These Splits Were Made

| Decision                                    | Rationale                                                                                                                                    |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Audio in renderer, not main                 | Howler.js uses the Web Audio API which only exists in Chromium. Main process has no audio context.                                           |
| DB only in main                             | `better-sqlite3` is a native Node module. It cannot run in the renderer's sandboxed Chromium environment.                                    |
| Spotify API in main                         | Requires storing a secret OAuth token. Token must never be exposed to the renderer (it could be leaked via DevTools).                        |
| File watcher in main                        | `chokidar` is a Node.js module. Renderer has no filesystem access.                                                                           |
| Media keys in main, executed in renderer    | `globalShortcut` is a main-process-only Electron API. But audio control lives in the renderer. Main is a relay.                              |
| electron-store UI state via IPC, not direct | Renderer cannot safely import `electron-store` in all Electron configurations. Routing through IPC keeps the boundary clean and testable.    |
| Two Howler instances                        | A single Howler instance cannot play two independent audio streams simultaneously without interference. Preview must not affect queue state. |
