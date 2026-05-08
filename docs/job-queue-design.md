# Job Queue Design
The job queue lives entirely in the main process. Its job is to handle long-running operations like metadata extraction, album art fetching, and Spotify import without ever blocking the IPC thread or freezing the UI.
The queue is a simple async FIFO. Jobs are added to the tail and processed in order. The queue runs one job type at a time for Spotify operations, and processes metadata in batches of up to 10 files concurrently.
# Job Types
- `EXTRACT_METADATA` — reads ID3 tags from a new audio file via `music-metadata` and writes the result to the `tracks` table
- `FETCH_ALBUM_ART` — attempts to fetch missing album art from MusicBrainz or Last.fm and embeds it directly into the audio file
- `SPOTIFY_IMPORT` — fetches liked songs, playlists, and audio features from the Spotify API
- `MATCH_SPOTIFY_TRACKS` — runs `fuse.js` fuzzy matching between imported Spotify tracks and local files
# How a File Gets Processed
When `chokidar` fires an `add` event for a new audio file, the main process does two things immediately: it pushes a `library:file-added` IPC event to the renderer so the track appears in the UI right away (with whatever data is available), and it enqueues an `EXTRACT_METADATA` job for that file. The queue picks it up, extracts the full metadata, updates the `tracks` row, and pushes a second `library:file-added` event with the complete data.
If the extracted metadata has no album art, a `FETCH_ALBUM_ART` job is automatically enqueued for that track as a follow-up.
# Progress Reporting
As the queue processes jobs it pushes `jobs:progress` events to the renderer:
```
{ jobId, type, current, total, status: 'running' | 'complete' | 'error' }
```
On error, it pushes `jobs:error` with the job ID and error message. The renderer's `jobStore` listens for these and drives any progress UI. The queue never throws across the IPC boundary.
# Concurrency Limits
| Job Type | Concurrency |
|---|---|
| `EXTRACT_METADATA` | 10 (batch) |
| `FETCH_ALBUM_ART` | 5 (batch) |
| `SPOTIFY_IMPORT` | 1 |
| `MATCH_SPOTIFY_TRACKS` | 1 |