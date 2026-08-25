# Audio Library Architecture Design (Dual Howler.js Instance)

All audio lives in the renderer process. Howler.js uses the Web Audio API, which only exists in Chromium.
There are exactly two Howler instances. They are completely independent and never share state.

# Primary Instance

The primary instance owns the playback queue. It is long-lived and persists for the entire app session.

It is responsible for:

- Playing, pausing, seeking, and volume control
- Advancing through the queue when a track ends (`Howl.onend`)
- Gapless playback by pre-loading the next track before the current one finishes
- Reporting position back to `playbackStore` on a regular interval so the progress bar stays in sync
- Persisting track ID and position to `electron-store` via IPC every 5 seconds

Howler is given a `file://` URI constructed from the track's `filePath` stored in the DB. Chromium resolves this via its own file protocol handler. Howler never reads from disk directly.

# Preview Instance

The preview instance handles hover previews, the per-row preview button, and the preview keybind. It is short-lived and is created fresh for each preview and destroyed when the preview ends.

Rules:

- Plays a 15-second snippet starting at the 30-second mark (both values are constants in `src/shared/constants.ts`)
- Runs at a lower volume than the primary instance by default
- Auto-stops after the snippet duration via a `setTimeout` tied to the instance
- Is immediately destroyed and recreated if a new preview is triggered before the current one finishes
- **Never affects `playbackStore` in any way.** Queue state, current track, and play/pause status are completely untouched

# Why Two Instances

A single Howler instance cannot play two independent audio streams simultaneously without them interfering with each other's state. If preview were built on the primary instance, triggering a preview would mutate `currentTrack`, disrupt the queue position, and break resume-on-relaunch. Keeping them separate means the preview is a completely disposable side effect with no footprint on playback state.

# Trigger Sources for Preview

All three preview triggers call the same `startPreview(trackId)` function in `preview.ts`:

- **Hover:** 800ms delay on song row hover, cancelled immediately on mouse leave
- **Preview button:** per-row button, fires instantly with no delay
- **Keybind:** fires instantly on the currently highlighted song in the list
