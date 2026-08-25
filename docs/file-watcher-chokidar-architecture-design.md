# File Watcher Event Flow (chokidar)

The file watcher runs entirely in the main process.

# The Stack

`chokidar` watches the root music folder recursively. It is initialized after the DB connection is open and IPC handlers are registered. It only watches `.mp3`, `.wav`, and `.flac` files, and all other file types are ignored at the filter level before any processing happens.

# Event Flow

## File Added

1. `chokidar` fires `add` for a new audio file path
2. Main inserts a minimal track record into SQLite (file path, filename as provisional title, `linked: true`)
3. Main pushes `library:file-added` to the renderer with the minimal record, so the track appears in the UI immediately
4. Main enqueues an `EXTRACT_METADATA` job for the file
5. Job completes, and main updates the track row with full metadata
6. Main pushes a second `library:file-added` event with the complete track data
7. Renderer's `ipcRenderer.on('library:file-added')` listener calls `libraryStore.upsertTrack(track)`, so Zustand updates and React re-renders

## File Removed or Moved

1. `chokidar` fires `unlink` for a file path
2. Main looks up the track by file path and sets `linked: false` on the DB record. The record is never deleted automatically
3. Main pushes `library:file-unlinked` with the track ID
4. Renderer calls `libraryStore.markUnlinked(trackId)`, so Zustand updates and the track renders with its unlinked visual state
5. The user must explicitly delete unlinked tracks from within the app

## File Changed

1. `chokidar` fires `change` for a modified file (e.g. tags edited externally)
2. Main re-enqueues an `EXTRACT_METADATA` job for the file
3. On completion, the track row is updated and `library:file-added` is pushed again with fresh metadata

# Watcher Initialization

```
app ready
  → DB connection open
  → Drizzle migrations run
  → IPC handlers registered
  → chokidar.watch(rootFolder, { ignoreInitial: false })
```

`ignoreInitial: false` means chokidar fires `add` for every existing file on startup. This is intentional. It lets the app detect any files added while it was closed, without needing a separate "scan on launch" step. The job queue batches the resulting `EXTRACT_METADATA` jobs so startup stays responsive.

# Guardrails

- The watcher is only started if a root folder is configured. On first launch before the user picks a folder, no watcher runs.
- If the root folder is changed in settings, the existing watcher is closed and a new one is started on the new path.
- All `chokidar` callbacks are synchronous entry points only. Any async work (DB writes, job enqueuing) is kicked off and awaited properly, never blocking the event loop.
