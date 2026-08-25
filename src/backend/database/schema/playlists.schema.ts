import {
	sqliteTable,
	integer,
	text,
	real,
	uniqueIndex,
	index,
	type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import {
	AUTO_INCREMENTING_INTEGER_ID,
	createTimestampIntegerDefaultingToNow,
} from "./column-helpers";
import { tracks } from "./tracks.schema";
import { tags } from "./tags.schema";

export const playlistFolders = sqliteTable("playlist_folders", {
	id: AUTO_INCREMENTING_INTEGER_ID,
	name: text("name").notNull(),

	parentFolderID: integer("parent_id").references(
		(): AnySQLiteColumn => playlistFolders.id,
		{
			onDelete: "set null",
		},
	),
	createdAt: createTimestampIntegerDefaultingToNow("created_at"),
});

export type PlaylistFolder = typeof playlistFolders.$inferSelect;
export type NewPlaylistFolder = typeof playlistFolders.$inferInsert;

export const playlists = sqliteTable("playlists", {
	id: AUTO_INCREMENTING_INTEGER_ID,
	name: text("name").notNull(),
	type: text("type", { enum: ["manual", "smart"] })
		.notNull()
		.default("manual"),

	folderID: integer("folder_id").references(() => playlistFolders.id, {
		onDelete: "set null",
	}),
	isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),

	createdAt: createTimestampIntegerDefaultingToNow("created_at"),
	updatedAt: createTimestampIntegerDefaultingToNow("updated_at"),
});

export type Playlist = typeof playlists.$inferSelect;
export type NewPlaylist = typeof playlists.$inferInsert;

export const smartPlaylistRuleDimensions = [
	"tag_weight",
	"date_added",
	"play_count",
	"skip_count",
	"skip_rate",
	"duration_seconds",
	"last_played_days",
	"never_played",
] as const;

export const smartPlaylistRules = sqliteTable(
	"smart_playlist_rules",
	{
		id: AUTO_INCREMENTING_INTEGER_ID,

		playlistID: integer("playlist_id")
			.notNull()
			.references(() => playlists.id, { onDelete: "cascade" }),

		combinator: text("combinator", { enum: ["and", "or"] })
			.notNull()
			.default("and"),

		dimension: text("dimension", {
			enum: smartPlaylistRuleDimensions,
		}).notNull(),

		tagID: integer("tag_id").references(() => tags.id, { onDelete: "cascade" }),

		minValue: real("min_value"),
		maxValue: real("max_value"),

		positionInRuleBuilder: integer("position").notNull().default(0),
	},
	(smartPlaylistRule) => [
		index("smart_rules_playlist_idx").on(smartPlaylistRule.playlistID),
	],
);

export type SmartPlaylistRule = typeof smartPlaylistRules.$inferSelect;
export type NewSmartPlaylistRule = typeof smartPlaylistRules.$inferInsert;

export const playlistTracks = sqliteTable(
	"playlist_tracks",
	{
		id: AUTO_INCREMENTING_INTEGER_ID,

		playlistID: integer("playlist_id")
			.notNull()
			.references(() => playlists.id, { onDelete: "cascade" }),
		trackID: integer("track_id")
			.notNull()
			.references(() => tracks.id, { onDelete: "cascade" }),

		positionForDragAndDropOrdering: integer("position").notNull(),

		addedAt: createTimestampIntegerDefaultingToNow("added_at"),
	},
	(playlistTrack) => [
		uniqueIndex("playlist_tracks_uniq").on(
			playlistTrack.playlistID,
			playlistTrack.trackID,
		),
		index("playlist_tracks_playlist_idx").on(playlistTrack.playlistID),
		index("playlist_tracks_position_idx").on(
			playlistTrack.playlistID,
			playlistTrack.positionForDragAndDropOrdering,
		),
	],
);

export type PlaylistTrack = typeof playlistTracks.$inferSelect;
export type NewPlaylistTrack = typeof playlistTracks.$inferInsert;
