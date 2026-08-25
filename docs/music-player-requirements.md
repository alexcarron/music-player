# Music Player Requirements

Personal project · Windows Desktop · Electron + React + TypeScript + SQLite
Estimated timeline: 6–12 months at 1–3 hrs/week

# 1. Library & File Management

1.  The app shall support exactly one root music folder configured by the user on first launch
2.  The app shall watch the root folder live (via chokidar) and automatically detect added, removed, or moved files without requiring a manual rescan.
3.  When a new audio file is detected in the root folder, it shall be automatically added to the library and queued for metadata extraction.
4.  When a file is deleted or moved outside the root folder, the song record shall remain in the database with all tags, history, and metadata intact, but be marked as **Unlinked**. The user must explicitly delete unlinked songs from within the app.
5.  The app shall read embedded metadata (ID3 tags) from MP3, WAV, and FLAC files on import using `music-metadata`, extracting: title, artist, album, track number, year, genre, BPM, key, duration, and embedded album art.
6.  If album art is missing from a file's embedded metadata, the app shall attempt to automatically fetch it from an online source (e.g. MusicBrainz Cover Art Archive or Last.fm) and embed it directly into the audio file.
7.  Album art shall be stored embedded in the audio file itself, not as a separate sidecar image file.
8.  The app shall support MP3, WAV, and FLAC audio formats.

# 2. Playback

1. The app shall support standard playback controls: Play, Pause, Next Song, Previous Song, Seek (scrub), Volume Up, Volume Down.
2. The app shall maintain a **playback queue** with the following operations:
   1. Add song to play next (top of remaining queue)
   2. Add song to end of queue
   3. Remove a song from the queue
   4. Clear the entire queue
3. On app relaunch, playback shall resume from the exact song and timestamp where the user left off.
4. The app shall register OS-level **media keys** (play/pause, next, previous) so they function system-wide regardless of app focus.
5. The app shall support **hover-to-preview**: when no song is currently playing, hovering over a song's album art or title for a brief delay (e.g. 800ms) starts a short audio snippet preview using a secondary independent audio instance. This does not interrupt any active queue.
6. The app shall provide a dedicated **preview button** per song row that triggers the same snippet preview as hover behavior.
7. A **preview keybind** shall trigger an instant preview of the currently highlighted/selected song without interrupting active playback.

# 3. Tagging System

1. Users shall be able to create custom **tags** (e.g. "EDM", "Chill", "Dark") with a name, a group/category, and an assigned color.
2. Tags can be organized into **tag groups / categories** (e.g. "Genre", "Mood", "Energy", "Instruments"). A tag can belong to zero to many groups
3. Each tag applied to a song shall carry an optional weight (0–100%), representing how much of that tag characterizes the song (e.g. "EDM: 50%"). Weight defaults to 100% if not specified.
4. Each tag shall be assigned a **color**, auto-generated on creation but manually overridable by the user at any time.
5. Users shall be able to apply tags to a song via a **side panel** that opens when a single song is clicked/selected.
6. Users shall be able to **multi-select songs** and apply or remove a tag (with a weight) to all selected songs simultaneously.
7. Users shall be able to apply or remove a set of tags to multiple selected songs at once
8. The app shall suggest tags for a song based on artist. If songs by the same artist have common tags, those are surfaced as suggestions.
9. The app shall suggest tags for a song based on album. if other songs in the same album share tags, those are surfaced as suggestions.
10. When Spotify data is available for a song, the app shall use Spotify's genre tags, energy, valence, and danceability scores to generate initial tag suggestions for the user to confirm or reject.
11. The app shall maintain a "Needs Tagging" queue: a persistent smart list of all songs that have zero confirmed tags, surfaced in the sidebar for easy access.
12. The tagging workspace shall include a dedicated Tagging View, a focused, distraction-free UI mode separate from the main library/player, optimized for processing songs in the "Needs Tagging" queue efficiently.
13. All tagging actions (apply, remove, weight change, bulk apply) shall support **undo/redo** (managed via `zundo` Zustand middleware).

# 4. Playlists

1. Users shall be able to create **manual playlists**, add songs via drag-and-drop from the library, and reorder songs within the playlist via drag-and-drop.
2. The app shall support smart playlists (with tag rules): playlists defined by one or more tag+weight threshold conditions combined with AND logic (e.g. "EDM > 60% AND Dark > 40%"). Songs matching the rules are dynamically included.
3. The app shall support **smart playlists based on play history conditions** (e.g. "Most played this month", "Added in the last 30 days").
4. The app shall support **smart playlists based on listen analytics conditions** (e.g. "Never skipped", "Skip rate < 10%", "Not listened to in 60+ days").
5. Playlists shall be organizable into **playlist folders** in the sidebar.
6. Auto and smart playlists shall **re-evaluate dynamically**, their contents update automatically when relevant data changes (new tags, new play events).

# 5. Search & Filtering

1. A **global search bar** shall search across song title, artist, and album simultaneously with real-time results as the user types.
2. The app shall support **advanced filtering** with the following filter dimensions which should also apply to smart playlists:
   1. Tag + minimum weight threshold (e.g. EDM ≥ 60%)
   2. Date added range
   3. Play count range
   4. Skip count range
   5. Duration range (min/max seconds)
3. Multiple filters shall be **combinable with AND or OR logic** simultaneously (e.g. tag filter + date filter + duration filter all active at once)
4. The song list shall be **sortable by any column** (title, artist, album, BPM, date added, play count, duration, etc.).

# 6. Analytics & Statistics

1. The app shall record a **play event** every time a song is played, storing: song ID, timestamp, duration listened, and whether the song was skipped before completing.

# 7. UI Layout & Navigation

1. The app shall have a **persistent left sidebar** containing:
   1. All Songs
   2. Playlists section (with folders and pinned playlists)
   3. Tags section
   4. "Needs Tagging" queue
   5. Settings
2. The main content area shall default to a song list view with sortable columns: title, artist, album, duration, BPM, date added, play count, tags.
3. A persistent now-playing bar shall be anchored at the bottom of the window, always visible, showing: album art, song title, artist, progress bar, playback controls, and volume.
4. A **dedicated Tagging Workspace** shall be accessible as a separate full-view mode, optimized for efficiently tagging songs in bulk.
5. Songs shall be draggable from the library list and file system directly into a playlist in the sidebar.

# 8. Spotify Integration

1. The app shall support a **one-time Spotify import** flow: the user authenticates via Spotify OAuth, imports data, and the connection is then optional to maintain.
2. The import shall pull the user's **Spotify liked songs** and attempt to fuzzy-match each to a local file by title + artist using `fuse.js`.
3. The import shall pull the user's **Spotify playlists** and create corresponding manual playlists locally, with songs linked to matched local files.
4. For each successfully matched song, the app shall fetch and store Spotify **audio features**: BPM (tempo), energy, valence, danceability, acousticness, instrumentalness, key, loudness, and mode. These are persisted in the `track_analysis` table and queryable.
5. Spotify's **genre tags** associated with each track's artist(s) shall be used to generate initial tag suggestions the user can confirm.

# 9. Keyboard & Power-User Features

1. The song list shall support **arrow-key navigation**: up/down arrows move the selection highlight, and Enter plays the highlighted song.
2. A **global hotkey** (works even when app is minimized, registered at OS level) shall trigger play/pause, media keys.
3. A **hotkey** shall instantly add the currently playing song to a playlist (opens a quick-select playlist picker).
4. A **hotkey** shall open the tag panel for the currently playing or highlighted song without navigating away from the current view.
5. A **hotkey** shall trigger an instant preview of the highlighted song (see requirement 2.7)
