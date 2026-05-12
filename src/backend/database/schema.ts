/**
 * Drizzle ORM schema for the music player SQLite database.
 *
 * Single source of truth for all table definitions. Run `drizzle-kit generate`
 * after any change here to produce a new migration in src/backend/database/migrations/.
 *
 * Conventions: 
 *  - All primary keys are auto-incrementing integers named `id`.
 *  - Timestamps are stored as Unix milliseconds (integer, mode: 'timestamp_ms').
 *  - Boolean columns use integer mode: 'boolean' (0/1 in SQLite).
 *  - Foreign key column names mirror their target table + "_id" suffix.
 *  - Cascade deletes propagate from parent → child so orphaned rows never accumulate.
 */

import {
  sqliteTable,
  integer,
  text,
  real,
  primaryKey,
  uniqueIndex,
  index,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

const AUTO_INCREMENTING_INTEGER_ID = integer('id').primaryKey({ autoIncrement: true });
const INTEGER_PK = (idName: string) => integer(idName).primaryKey({ autoIncrement: true });
const TIMESTAMP_INTEGER_DEFAULT_NOW = (columnName: string) => integer(columnName, { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`);

/**
 * Stores metadata for each song in the library. One row per unique file path. The `tracks` table is the core of the database and is referenced by many other tables, so it should be kept as lean as possible for performance. Extra metadata (e.g. Spotify analysis) is stored in separate tables linked by foreign keys.
 */
export const tracks = sqliteTable('tracks', {
  id: AUTO_INCREMENTING_INTEGER_ID,

  filePath: text('file_path').unique(),
  fileLinkingStatus: text('file_linking_status', { enum: ['linked', 'unlinked'] }).notNull().default('linked'),
  fileExtension: text('file_extension', { enum: ['mp3', 'wav', 'flac'] }),

  title: text('title').notNull(),
  artist: text('artist'),
  album: text('album'),
  trackNumber: integer('track_number'),
  year: integer('year'),
  genre: text('genre'),
  bpm: real('bpm'),
	/** e.g. "Am", "C#", "Bb" */
  musicalKey: text('musical_key'),
  durationSeconds: real('duration_seconds'),

  hasEmbeddedArt: integer('has_embedded_art', { mode: 'boolean' }).notNull().default(false),
  artFetchingStatus: text('art_fetching_status', {
    enum: ['not_started', 'pending', 'fetched', 'failed'],
  }).notNull().default('not_started'),

	// Stored to avoid calling COUNT(*) for every render (Denormalization)
  playCount: integer('play_count').notNull().default(0),
  skipCount: integer('skip_count').notNull().default(0),

  spotifyTrackId: text('spotify_track_id').unique(),

  dateAdded: TIMESTAMP_INTEGER_DEFAULT_NOW('date_added'),
  updatedAt: TIMESTAMP_INTEGER_DEFAULT_NOW('updated_at'),
},
/** Indexes used to accelerate the most common library queries */
(track) => [
  index('tracks_status_idx').on(track.fileLinkingStatus),
  index('tracks_artist_idx').on(track.artist),
  index('tracks_album_idx').on(track.album),
  index('tracks_date_added_idx').on(track.dateAdded),
]);

export type Track = typeof tracks.$inferSelect;
export type NewTrack = typeof tracks.$inferInsert;

/**
 * Audio analysis data for each track, fetched from Spotify's API. One-to-one with `tracks` table, linked by trackId. Stored separately so the main `tracks` table can be queried without the overhead of these extra columns when analysis data isn't needed.
 */
export const trackAnalysis = sqliteTable('track_analysis', {
  trackId: INTEGER_PK('track_id').references(() => tracks.id, { onDelete: 'cascade' }),

  spotifyTrackId: text('spotify_track_id'),
	/** BPM (Spotify name: "tempo") */
  tempo: real('tempo'),
  energy: real('energy'),
  valence: real('valence'),
  danceability: real('danceability'),
  acousticness: real('acousticness'),
  instrumentalness: real('instrumentalness'),
  speechiness: real('speechiness'),
  liveness: real('liveness'),
	/** dB, typically −60–0 */
  loudness: real('loudness'),
	/** Pitch class notation 0–11 (C=0, C#=1…) */
  spotifyKey: integer('spotify_key'),
	/** 0 = minor, 1 = major */
  mode: integer('mode'),
	/** // Beats per bar (3, 4, 5, 6, 7) */
  timeSignature: integer('time_signature'), 

  fetchedAt: integer('fetched_at', { mode: 'timestamp_ms' }),
});

export type TrackAnalysis = typeof trackAnalysis.$inferSelect;
export type NewTrackAnalysis = typeof trackAnalysis.$inferInsert;

/**
 * Tracks every Spotify liked song / playlist entry that was processed during the one-time import. Stores the raw Spotify metadata and the fuse.js match confidence so mismatches can be reviewed or corrected later.
 */
export const spotifyImports = sqliteTable('spotify_imports', {
  id: AUTO_INCREMENTING_INTEGER_ID,

  trackId: integer('track_id').references(() => tracks.id, { onDelete: 'set null' }),

  spotifyTrackId: text('spotify_track_id').notNull(),
  spotifyTrackName: text('spotify_track_name'),
  spotifyArtistName: text('spotify_artist_name'),
  spotifyAlbumName: text('spotify_album_name'),
  
  matchScore: real('match_score'), // fuse.js score: 0 = perfect match, 1 = no match (inverted from intuition)
  matchStatus: text('match_status', {
    enum: ['matched', 'unmatched', 'rejected'],
  }).notNull().default('unmatched'),

  importedAt: TIMESTAMP_INTEGER_DEFAULT_NOW('imported_at'),
},
/** Indexes used during the import process to quickly find existing matches and detect duplicates */
(spotifyImport) => [
  index('spotify_imports_spotify_id_idx').on(spotifyImport.spotifyTrackId),
  index('spotify_imports_track_id_idx').on(spotifyImport.trackId),
]);

export type SpotifyImport = typeof spotifyImports.$inferSelect;
export type NewSpotifyImport = typeof spotifyImports.$inferInsert;

/**
 * User-defined labels for categorizing songs. Each tag has a name and a display color. Tags can be organized into groups (e.g. "Mood", "Genre") via the `tag_groups` and `tag_group_memberships` tables, and applied to songs with an optional weight (0–100) via the `song_tags` table.
 */
export const tags = sqliteTable('tags', {
  id: AUTO_INCREMENTING_INTEGER_ID,
  name: text('name').notNull().unique(),
	/** CSS hex string, e.g. "#FF5733" */
  color: text('color').notNull(),
  createdAt: TIMESTAMP_INTEGER_DEFAULT_NOW('created_at'),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

/**
 * Organizational groups for tags for categories and dimensions, e.g. "Mood", "Genre", "Energy"
 */
export const tagGroups = sqliteTable('tag_groups', {
  id: AUTO_INCREMENTING_INTEGER_ID,
  name: text('name').notNull().unique(),
  createdAt: TIMESTAMP_INTEGER_DEFAULT_NOW('created_at'),
});

export type TagGroup = typeof tagGroups.$inferSelect;
export type NewTagGroup = typeof tagGroups.$inferInsert;

/**
 * Junction table between `tags` and `tag_groups` for many-to-many membership. A tag can belong to multiple groups, and a group can contain multiple tags.
 */
export const tagGroupMemberships = sqliteTable('tag_group_memberships', {
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  groupId: integer('group_id').notNull().references(() => tagGroups.id, { onDelete: 'cascade' }),
},
/**
 * Indexes used during the import process to quickly find existing matches and detect duplicates
 */
(tagGroupMembership) => [
  primaryKey({ columns: [tagGroupMembership.tagId, tagGroupMembership.groupId] }),
]);

export type TagGroupMembership = typeof tagGroupMemberships.$inferSelect;
export type NewTagGroupMembership = typeof tagGroupMemberships.$inferInsert;

/**
 * Junction table between `tracks` and `tags` for tagging songs with an optional weight (0–100) to indicate intensity. A track can have multiple tags, and a tag can be applied to multiple tracks.
 */
export const songTags = sqliteTable('song_tags', {
  id: AUTO_INCREMENTING_INTEGER_ID,

  trackId: integer('track_id').notNull().references(() => tracks.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),

  /** 0 = "barely", 100 = "fully characterises this song" */
  weight: integer('weight').notNull().default(100),
  createdAt: TIMESTAMP_INTEGER_DEFAULT_NOW('created_at'),
},
/** Indexes used during the import process to quickly find existing matches and detect duplicates. A tag can only be applied once per track (weight encodes intensity) */
(songTag) => [
  uniqueIndex('song_tags_track_tag_uniq').on(songTag.trackId, songTag.tagId),
  index('song_tags_track_idx').on(songTag.trackId),
  index('song_tags_tag_idx').on(songTag.tagId),
]);

export type SongTag = typeof songTags.$inferSelect;
export type NewSongTag = typeof songTags.$inferInsert;

/**
 * Playlist folders for sidebar folder hierarchy for organizing playlists
 */
export const playlistFolders = sqliteTable('playlist_folders', {
  id: AUTO_INCREMENTING_INTEGER_ID,
  name: text('name').notNull(),

  /** Self-referencing FK for nested folders; null = top-level */
  parentId: integer('parent_id').references((): AnySQLiteColumn => playlistFolders.id, { onDelete: 'set null' }),
  createdAt: TIMESTAMP_INTEGER_DEFAULT_NOW('created_at'),
});

export type PlaylistFolder = typeof playlistFolders.$inferSelect;
export type NewPlaylistFolder = typeof playlistFolders.$inferInsert;

/**
 * User-created playlists (Both "manual" playlists with explicitly added tracks and "smart" playlists with dynamic rules).
 */
export const playlists = sqliteTable('playlists', {
  id: AUTO_INCREMENTING_INTEGER_ID,
  name: text('name').notNull(),
  type: text('type', { enum: ['manual', 'smart'] }).notNull().default('manual'),

  folderId: integer('folder_id').references(() => playlistFolders.id, { onDelete: 'set null' }),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),

  createdAt: TIMESTAMP_INTEGER_DEFAULT_NOW('created_at'),
  updatedAt: TIMESTAMP_INTEGER_DEFAULT_NOW('updated_at'),
});

export type Playlist = typeof playlists.$inferSelect;
export type NewPlaylist = typeof playlists.$inferInsert;

/**
 * Smart playlists where each row is a filter condition. A smart playlist's rows are evaluated together using each row's `combinator` ('and' | 'or') against the previous. The first rule's combinator is ignored (it's always the base condition).
 * 
 * Supported dimensions:
 * tag_weight - song_tags.weight >= min_value for tag_id
 * date_added - tracks.date_added in [min_value, max_value] (unix ms)
 * play_count - tracks.play_count in [min_value, max_value]
 * skip_count - tracks.skip_count in [min_value, max_value]
 * skip_rate - skip_count/play_count * 100 in [min_value, max_value]
 * duration_seconds - tracks.duration_seconds in [min_value, max_value]
 * last_played_days - most-recent play_event is >= min_value days ago
 * never_played - no play_events exist; min_value / max_value unused
 */
export const smartPlaylistRules = sqliteTable('smart_playlist_rules', {
  id: AUTO_INCREMENTING_INTEGER_ID,

  playlistId: integer('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),

  combinator: text('combinator', { enum: ['and', 'or'] }).notNull().default('and'),

  dimension: text('dimension', {
    enum: [
      'tag_weight',
      'date_added',
      'play_count',
      'skip_count',
      'skip_rate',
      'duration_seconds',
      'last_played_days',
      'never_played',
    ],
  }).notNull(),

  /** Only set when dimension = 'tag_weight' */
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }),

  /** Range bounds; semantics depend on dimension (see header comment) */
  minValue: real('min_value'),
  /** Range bounds; semantics depend on dimension (see header comment) */
  maxValue: real('max_value'),

  /** Visual ordering within the playlist rule builder */
  position: integer('position').notNull().default(0),
},
/** Index for querying rules by playlist */
(smartPlaylistRule) => [
  index('smart_rules_playlist_idx').on(smartPlaylistRule.playlistId),
]);

export type SmartPlaylistRule = typeof smartPlaylistRules.$inferSelect;
export type NewSmartPlaylistRule = typeof smartPlaylistRules.$inferInsert;

/**
 * Tracks that are members of a playlist. For manual playlists, each row represents an explicitly added track with a specific position. For smart playlists, this table is unused since membership is determined dynamically by the rules in `smart_playlist_rules`.
 */
export const playlistTracks = sqliteTable('playlist_tracks', {
  id: AUTO_INCREMENTING_INTEGER_ID,

  playlistId: integer('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  trackId: integer('track_id').notNull().references(() => tracks.id, { onDelete: 'cascade' }),

  /** 0-based integer position drives drag-and-drop ordering */
  position: integer('position').notNull(),

  addedAt: TIMESTAMP_INTEGER_DEFAULT_NOW('added_at'),
},
/** Indexes for querying tracks by playlist. A track can only appear at most once per playlist */
(playlistTrack) => [
  uniqueIndex('playlist_tracks_uniq').on(playlistTrack.playlistId, playlistTrack.trackId),
  index('playlist_tracks_playlist_idx').on(playlistTrack.playlistId),
  index('playlist_tracks_position_idx').on(playlistTrack.playlistId, playlistTrack.position),
]);

export type PlaylistTrack = typeof playlistTracks.$inferSelect;
export type NewPlaylistTrack = typeof playlistTracks.$inferInsert;

/**
 * Recorded events where the user started listening to a track. Each row represents a single play session, starting when the user hits "play" on a track and ending when they stop or skip it. This table is append-only; rows are never updated or deleted. It is used for analytics, smart playlist conditions (e.g. "last played > 30 days ago"), and populating play/skip counters on tracks without needing to run expensive COUNT(*) queries.
 */
export const playEvents = sqliteTable('play_events', {
  id: AUTO_INCREMENTING_INTEGER_ID,

  trackId: integer('track_id').notNull().references(() => tracks.id, { onDelete: 'cascade' }),

  playedAt: TIMESTAMP_INTEGER_DEFAULT_NOW('played_at'),

  /** How many seconds the user actually listened before stopping/skipping */
  durationListened: real('duration_listened').notNull(),

  /** True if the user skipped before the track completed (~80% threshold recommended) */
  wasSkipped: integer('was_skipped', { mode: 'boolean' }).notNull().default(false),

  /** Where the track came from; free-form string for extensibility. Convention: 'library' | 'playlist: <id>' | 'smart: <id>' | 'queue' */
  queueSource: text('queue_source'),
},
(playEvent) => [
  index('play_events_track_idx').on(playEvent.trackId),
  index('play_events_played_at_idx').on(playEvent.playedAt),
]);

export type PlayEvent = typeof playEvents.$inferSelect;
export type NewPlayEvent = typeof playEvents.$inferInsert;

/**
 * The current playback state of the app, stored as a single row with a fixed primary key (id = 1). Updated whenever the user plays, seeks, skips, or changes volume. Stores the currently playing track, position within that track, and volume level. This allows the app to restore the same state when relaunched after being closed.
 */
export const playbackState = sqliteTable('playback_state', {
  /** Hard-coded single row; INSERT OR REPLACE with id = 1 on every state change */
  id: INTEGER_PK('id').default(1),

  trackId: integer('track_id').references(() => tracks.id, { onDelete: 'set null' }),

  positionSeconds: real('position_seconds').notNull().default(0),
	/** 0.0–1.0 */
  volume: real('volume').notNull().default(1.0),

  updatedAt: TIMESTAMP_INTEGER_DEFAULT_NOW('updated_at'),
});

export type PlaybackState = typeof playbackState.$inferSelect;
export type NewPlaybackState = typeof playbackState.$inferInsert;

/**
 * Tracks and their associated data. Declares relations so the query builder can use `.with()` joins without writing raw SQL. This does not create any extra tables.
 */
export const tracksRelations = relations(tracks, ({ one, many }) => ({
  analysis: one(trackAnalysis, {
    fields: [tracks.id],
    references: [trackAnalysis.trackId],
  }),
  songTags: many(songTags),
  playEvents: many(playEvents),
  playlistTracks: many(playlistTracks),
  spotifyImports: many(spotifyImports),
  playbackState: one(playbackState, {
    fields: [tracks.id],
    references: [playbackState.trackId],
  }),
}));

/**
 * Relations for track analysis data linked to tracks. Allows fetching a track with its analysis in one query using `.with('analysis')` in the query builder.
 */
export const trackAnalysisRelations = relations(trackAnalysis, ({ one }) => ({
  track: one(tracks, {
    fields: [trackAnalysis.trackId],
    references: [tracks.id],
  }),
}));

/**
 * Relations for Spotify import records linked to tracks. Allows fetching a track with its Spotify import data in one query using `.with('spotifyImports')` in the query builder.
 */
export const spotifyImportsRelations = relations(spotifyImports, ({ one }) => ({
  track: one(tracks, {
    fields: [spotifyImports.trackId],
    references: [tracks.id],
  }),
}));

/**
 * Relations for tag data linked to tracks. Allows fetching a track with its tags in one query using `.with('songTags')` in the query builder.
 */
export const tagsRelations = relations(tags, ({ many }) => ({
  songTags: many(songTags),
  groupMemberships: many(tagGroupMemberships),
  smartPlaylistRules: many(smartPlaylistRules),
}));

/**
 * Relations for tag group data linked to tags.
 */
export const tagGroupsRelations = relations(tagGroups, ({ many }) => ({
  tagMemberships: many(tagGroupMemberships),
}));

/**
 * Relations for tag group membership data linked to tags and tag groups.
 */
export const tagGroupMembershipsRelations = relations(tagGroupMemberships, ({ one }) => ({
  tag: one(tags,      { fields: [tagGroupMemberships.tagId],   references: [tags.id] }),
  group: one(tagGroups, { fields: [tagGroupMemberships.groupId], references: [tagGroups.id] }),
}));

/**
 * Relations for song tag data linked to tracks and tags.
 */
export const songTagsRelations = relations(songTags, ({ one }) => ({
  track: one(tracks, { fields: [songTags.trackId], references: [tracks.id] }),
  tag: one(tags,   { fields: [songTags.tagId],   references: [tags.id] }),
}));

/**
 * Relations for playlist data linked to tracks.
 */
export const playlistFoldersRelations = relations(playlistFolders, ({ one, many }) => ({
  parent: one(playlistFolders, {
    fields: [playlistFolders.parentId],
    references: [playlistFolders.id],
    relationName: 'parentFolder',
  }),
  children: many(playlistFolders, { relationName: 'parentFolder' }),
  playlists: many(playlists),
}));

/**
 * Relations for playlist data linked to tracks.
 */
export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  folder: one(playlistFolders, {
    fields: [playlists.folderId],
    references: [playlistFolders.id],
  }),
  tracks: many(playlistTracks),
  smartRules: many(smartPlaylistRules),
}));

/**
 * Relations for playlist data linked to tracks.
 */
export const smartPlaylistRulesRelations = relations(smartPlaylistRules, ({ one }) => ({
  playlist: one(playlists, {
    fields: [smartPlaylistRules.playlistId],
    references: [playlists.id],
  }),
  tag: one(tags, {
    fields: [smartPlaylistRules.tagId],
    references: [tags.id],
  }),
}));

/**
 * Relations for playlist data linked to tracks.
 */
export const playlistTracksRelations = relations(playlistTracks, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistTracks.playlistId],
    references: [playlists.id],
  }),
  track: one(tracks, {
    fields: [playlistTracks.trackId],
    references: [tracks.id],
  }),
}));

/**
 * Relations for play event data linked to tracks.
 */
export const playEventsRelations = relations(playEvents, ({ one }) => ({
  track: one(tracks, {
    fields: [playEvents.trackId],
    references: [tracks.id],
  }),
}));

/**
 * Relations for playback state data linked to tracks.
 */
export const playbackStateRelations = relations(playbackState, ({ one }) => ({
  track: one(tracks, {
    fields: [playbackState.trackId],
    references: [tracks.id],
  }),
}));
