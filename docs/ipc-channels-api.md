# IPC Channels API
This documents all the IPC channels including their name, purpose, direction, request, and response.
All channel name constants live in `src/shared/ipc-types.ts`. All payload types live alongside them. Neither process ever uses a raw string channel name in application code.
# Library
| Channel                          | Direction  | Description                                                                                                 | Request          | Response                   |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------- |
| `library:get-all-tracks`         | → Main     | Returns all tracks in the database                                                                          |                  | `Track[]`                  |
| `library:get-track-by-id`        | → Main     | Returns a single track by ID                                                                                | `{ id: number }` | `Track`                    |
| `library:scan-now`               | → Main     | Triggers an immediate re-scan of the root music folder                                                      |                  | `{ success: boolean }`     |
| `library:set-root-folder`        | → Main     | Opens the native OS folder picker and saves the chosen path. Called once on first launch                    |                  | `{ path: string }`         |
| `library:get-root-folder`        | → Main     | Returns the currently configured root music folder path                                                     |                  | `{ path: string \| null }` |
| `library:delete-unlinked-track`  | → Main     | Permanently removes an unlinked track record from the database. User must do this explicitly                | `{ id: number }` | `{ success: boolean }`     |
| `library:file-added` *(push)*    | → Renderer | Fired by the file watcher when a new audio file is detected. Renderer adds the track to `libraryStore`      |                  | `{ track: Track }`         |
| `library:file-unlinked` *(push)* | → Renderer | Fired when a tracked file is deleted or moved outside the root folder. Renderer marks the track as unlinked |                  | `{ trackId: number }`      |
# Tags
| Channel | Direction | Description | Request | Response |
|---|---|---|---|---|
| `tags:get-all` | → Main | Returns all tags and tag groups |  | `{ tags: Tag[], groups: TagGroup[] }` |
| `tags:create` | → Main | Creates a new tag with a name, optional group, and auto-generated color | `{ name: string, groupId: number \| null, color?: string }` | `Tag` |
| `tags:update` | → Main | Updates a tag's name, group, or color | `{ id: number, name?: string, groupId?: number \| null, color?: string }` | `{ success: boolean }` |
| `tags:delete` | → Main | Deletes a tag and removes all of its track associations | `{ id: number }` | `{ success: boolean }` |
| `tags:apply` | → Main | Applies a single tag with a weight to a single track | `{ trackId: number, tagId: number, weight: number }` | `{ success: boolean }` |
| `tags:remove` | → Main | Removes a tag from a single track | `{ trackId: number, tagId: number }` | `{ success: boolean }` |
| `tags:bulk-apply` | → Main | Applies a tag with a weight to multiple tracks simultaneously | `{ trackIds: number[], tagId: number, weight: number }` | `{ success: boolean }` |
| `tags:bulk-remove` | → Main | Removes a tag from multiple tracks simultaneously | `{ trackIds: number[], tagId: number }` | `{ success: boolean }` |
| `tags:get-for-track` | → Main | Returns all tags and their weights for a specific track | `{ trackId: number }` | `TrackTag[]` |
| `tags:get-suggestions` | → Main | Returns tag suggestions for a track based on shared artist and album patterns | `{ trackId: number }` | `TagSuggestion[]` |
| `tag-groups:create` | → Main | Creates a new tag group / category | `{ name: string }` | `TagGroup` |
| `tag-groups:update` | → Main | Renames a tag group | `{ id: number, name: string }` | `{ success: boolean }` |
| `tag-groups:delete` | → Main | Deletes a tag group. Tags in the group become ungrouped, not deleted | `{ id: number }` | `{ success: boolean }` |
# Playback
| Channel                           | Direction  | Description                                                                                                  | Request                                                        | Response                                                               |
| --------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `playback:persist-position`       | → Main     | Saves the current track ID, position, and volume to `electron-store`. Called every 5 seconds during playback | `{ trackId: number, positionSeconds: number, volume: number }` | `{ success: boolean }`                                                 |
| `playback:get-persisted-position` | → Main     | Returns the last saved playback state so playback can resume on relaunch                                     |                                                               | `{ trackId: number \| null, positionSeconds: number, volume: number }` |
| `playback:command` *(push)*       | → Renderer | Sent by main when an OS media key is pressed. Renderer translates this into a Howler.js action               |                                                               | `{ action: 'play-pause' \| 'next' \| 'previous' }`                     |
# Playlists
| Channel | Direction | Description | Request | Response |
|---|---|---|---|---|
| `playlists:get-all` | → Main | Returns all playlists and playlist folders |  | `{ playlists: Playlist[], folders: PlaylistFolder[] }` |
| `playlists:get-tracks` | → Main | Returns the ordered list of tracks in a specific playlist | `{ playlistId: number }` | `Track[]` |
| `playlists:create` | → Main | Creates a new manual playlist | `{ name: string, folderId?: number \| null }` | `Playlist` |
| `playlists:rename` | → Main | Renames a playlist | `{ id: number, name: string }` | `{ success: boolean }` |
| `playlists:delete` | → Main | Deletes a playlist. Does not delete the underlying tracks | `{ id: number }` | `{ success: boolean }` |
| `playlists:add-track` | → Main | Adds a track to a manual playlist at a specified position | `{ playlistId: number, trackId: number, position?: number }` | `{ success: boolean }` |
| `playlists:remove-track` | → Main | Removes a track from a manual playlist | `{ playlistId: number, trackId: number }` | `{ success: boolean }` |
| `playlists:reorder` | → Main | Updates track sort order after a drag-and-drop | `{ playlistId: number, orderedTrackIds: number[] }` | `{ success: boolean }` |
| `playlists:create-smart` | → Main | Creates a smart playlist with tag + weight threshold rules | `{ name: string, rules: PlaylistRule[], folderId?: number \| null }` | `Playlist` |
| `playlists:update-rules` | → Main | Updates the rules of an existing smart playlist | `{ playlistId: number, rules: PlaylistRule[] }` | `{ success: boolean }` |
| `playlists:evaluate-smart` | → Main | Runs the rule engine for a smart playlist and returns matching tracks | `{ playlistId: number }` | `Track[]` |
| `playlist-folders:create` | → Main | Creates a new playlist folder in the sidebar | `{ name: string }` | `PlaylistFolder` |
| `playlist-folders:rename` | → Main | Renames a playlist folder | `{ id: number, name: string }` | `{ success: boolean }` |
| `playlist-folders:delete` | → Main | Deletes a folder. Playlists inside become ungrouped, not deleted | `{ id: number }` | `{ success: boolean }` |
# Play Events
| Channel | Direction | Description | Request | Response |
|---|---|---|---|---|
| `play-events:record` | → Main | Records a play event. Called when a track ends or is skipped | `{ trackId: number, timestamp: number, durationListenedSeconds: number, skipped: boolean }` | `{ success: boolean }` |
| `play-events:get-stats` | → Main | Returns aggregated play statistics for one or more tracks | `{ trackIds: number[] }` | `TrackStats[]` |
# Smart Views & Filters
| Channel | Direction | Description | Request | Response |
|---|---|---|---|---|
| `smart-views:get-all` | → Main | Returns all saved Smart Views (named filter sets) |  | `SmartView[]` |
| `smart-views:create` | → Main | Saves the current active filter configuration as a named Smart View | `{ name: string, filterJson: string }` | `SmartView` |
| `smart-views:delete` | → Main | Deletes a saved Smart View | `{ id: number }` | `{ success: boolean }` |
| `library:query` | → Main | Executes a filter + sort query against the library. Used by the advanced filter panel, smart views, and needs-tagging queue | `{ filters: FilterDefinition[], sort: SortDefinition, searchQuery?: string }` | `Track[]` |
# Background Jobs
| Channel | Direction | Description | Request | Response |
|---|---|---|---|---|
| `jobs:get-active` | → Main | Returns the current state of all active and recently completed background jobs |  | `Job[]` |
| `jobs:progress` *(push)* | → Renderer | Fired during long-running operations to report incremental progress |  | `{ jobId: string, type: 'EXTRACT_METADATA' \| 'FETCH_ALBUM_ART' \| 'SPOTIFY_IMPORT' \| 'MATCH_SPOTIFY_TRACKS', current: number, total: number, status: 'running' \| 'complete' \| 'error' }` |
| `jobs:error` *(push)* | → Renderer | Fired when a background job fails |  | `{ jobId: string, error: string }` |
# Spotify
| Channel | Direction | Description | Request | Response |
|---|---|---|---|---|
| `spotify:start-auth` | → Main | Opens the Spotify OAuth URL in the system browser and starts the local redirect server. Returns once tokens are captured |  | `{ success: boolean, error?: string }` |
| `spotify:get-auth-status` | → Main | Returns whether the app has a valid stored Spotify token |  | `{ authenticated: boolean }` |
| `spotify:start-import` | → Main | Kicks off the full Spotify import job. Enqueues a background job and returns immediately. Progress arrives via `jobs:progress` |  | `{ jobId: string }` |
| `spotify:get-match-results` | → Main | Returns fuzzy-match results from the most recent import  both matched and unmatched tracks |  | `{ matched: SpotifyMatchResult[], unmatched: SpotifyTrack[] }` |
| `spotify:manual-link` | → Main | Manually links a Spotify track to a local file after a failed fuzzy match | `{ spotifyTrackId: string, localTrackId: number }` | `{ success: boolean }` |
# UI Persistence
| Channel | Direction | Description | Request | Response |
|---|---|---|---|---|
| `ui:get-persisted-state` | → Main | Returns saved UI state from `electron-store`. Called once on app boot before first render |  | `PersistedUIState` |
| `ui:set-persisted-state` | → Main | Saves current UI state to `electron-store`. Called by a debounced Zustand subscription | `PersistedUIState` | `{ success: boolean }` |
# Export & Backup
| Channel | Direction | Description | Request | Response |
|---|---|---|---|---|
| `export:backup` | → Main | Creates a full backup: zips the SQLite DB and JSON exports with a timestamp, saves to a user-chosen path |  | `{ path: string }` |
| `export:library-json` | → Main | Exports the full track library as JSON to a user-chosen path |  | `{ path: string }` |
| `export:tags-json` | → Main | Exports all tags and per-track weights as JSON |  | `{ path: string }` |
| `import:tags-json` | → Main | Imports tags from a previously exported JSON file with merge or overwrite mode | `{ mode: 'merge' \| 'overwrite' }` | `{ success: boolean, imported: number, skipped: number }` |