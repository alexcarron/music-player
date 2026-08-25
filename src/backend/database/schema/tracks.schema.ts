import {
	sqliteTable,
	integer,
	text,
	real,
	index,
} from "drizzle-orm/sqlite-core";
import {
	AUTO_INCREMENTING_INTEGER_ID,
	createAutoIncrementingIntegerPrimaryKey,
	createTimestampIntegerDefaultingToNow,
} from "./column-helpers";

export const tracks = sqliteTable(
	"tracks",
	{
		id: AUTO_INCREMENTING_INTEGER_ID,

		filePath: text("file_path").unique(),
		fileLinkingStatus: text("file_linking_status", {
			enum: ["linked", "unlinked"],
		})
			.notNull()
			.default("linked"),
		fileExtension: text("file_extension", { enum: ["mp3", "wav", "flac"] }),

		title: text("title").notNull(),
		artist: text("artist"),
		album: text("album"),
		trackNumber: integer("track_number"),
		year: integer("year"),
		genre: text("genre"),
		bpm: real("bpm"),
		musicalKeyName: text("musical_key"),
		durationSeconds: real("duration_seconds"),

		hasEmbeddedArt: integer("has_embedded_art", { mode: "boolean" })
			.notNull()
			.default(false),
		artFetchingStatus: text("art_fetching_status", {
			enum: ["not_started", "pending", "fetched", "failed"],
		})
			.notNull()
			.default("not_started"),

		playCount: integer("play_count").notNull().default(0),
		skipCount: integer("skip_count").notNull().default(0),

		spotifyTrackID: text("spotify_track_id").unique(),

		dateAdded: createTimestampIntegerDefaultingToNow("date_added"),
		updatedAt: createTimestampIntegerDefaultingToNow("updated_at"),
	},
	(track) => [
		index("tracks_status_idx").on(track.fileLinkingStatus),
		index("tracks_artist_idx").on(track.artist),
		index("tracks_album_idx").on(track.album),
		index("tracks_date_added_idx").on(track.dateAdded),
	],
);

export type Track = typeof tracks.$inferSelect;
export type NewTrack = typeof tracks.$inferInsert;

export const trackAnalysis = sqliteTable("track_analysis", {
	trackID: createAutoIncrementingIntegerPrimaryKey("track_id").references(
		() => tracks.id,
		{
			onDelete: "cascade",
		},
	),

	spotifyTrackID: text("spotify_track_id"),
	tempoInBeatsPerMinute: real("tempo"),
	energy: real("energy"),
	valence: real("valence"),
	danceability: real("danceability"),
	acousticness: real("acousticness"),
	instrumentalness: real("instrumentalness"),
	speechiness: real("speechiness"),
	liveness: real("liveness"),
	loudnessInDecibels: real("loudness"),
	spotifyPitchClassKey: integer("spotify_key"),
	isMajorMode: integer("mode", { mode: "boolean" }),
	beatsPerBarTimeSignature: integer("time_signature"),

	fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }),
});

export type TrackAnalysis = typeof trackAnalysis.$inferSelect;
export type NewTrackAnalysis = typeof trackAnalysis.$inferInsert;

export const spotifyImports = sqliteTable(
	"spotify_imports",
	{
		id: AUTO_INCREMENTING_INTEGER_ID,

		trackID: integer("track_id").references(() => tracks.id, {
			onDelete: "set null",
		}),

		spotifyTrackID: text("spotify_track_id").notNull(),
		spotifyTrackName: text("spotify_track_name"),
		spotifyArtistName: text("spotify_artist_name"),
		spotifyAlbumName: text("spotify_album_name"),

		matchDistance: real("match_distance"),
		matchStatus: text("match_status", {
			enum: ["matched", "unmatched", "rejected"],
		})
			.notNull()
			.default("unmatched"),

		importedAt: createTimestampIntegerDefaultingToNow("imported_at"),
	},
	(spotifyImport) => [
		index("spotify_imports_spotify_id_idx").on(spotifyImport.spotifyTrackID),
		index("spotify_imports_track_id_idx").on(spotifyImport.trackID),
	],
);

export type SpotifyImport = typeof spotifyImports.$inferSelect;
export type NewSpotifyImport = typeof spotifyImports.$inferInsert;
