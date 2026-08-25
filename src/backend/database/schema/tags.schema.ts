import {
	sqliteTable,
	integer,
	text,
	primaryKey,
	uniqueIndex,
	index,
} from "drizzle-orm/sqlite-core";
import {
	AUTO_INCREMENTING_INTEGER_ID,
	createTimestampIntegerDefaultingToNow,
} from "./column-helpers";
import { tracks } from "./tracks.schema";

export const tags = sqliteTable("tags", {
	id: AUTO_INCREMENTING_INTEGER_ID,
	name: text("name").notNull().unique(),
	colorHexCode: text("color").notNull(),
	createdAt: createTimestampIntegerDefaultingToNow("created_at"),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export const tagGroups = sqliteTable("tag_groups", {
	id: AUTO_INCREMENTING_INTEGER_ID,
	name: text("name").notNull().unique(),
	createdAt: createTimestampIntegerDefaultingToNow("created_at"),
});

export type TagGroup = typeof tagGroups.$inferSelect;
export type NewTagGroup = typeof tagGroups.$inferInsert;

export const tagGroupMemberships = sqliteTable(
	"tag_group_memberships",
	{
		tagID: integer("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
		groupID: integer("group_id")
			.notNull()
			.references(() => tagGroups.id, { onDelete: "cascade" }),
	},
	(tagGroupMembership) => [
		primaryKey({
			columns: [tagGroupMembership.tagID, tagGroupMembership.groupID],
		}),
	],
);

export type TagGroupMembership = typeof tagGroupMemberships.$inferSelect;
export type NewTagGroupMembership = typeof tagGroupMemberships.$inferInsert;

export const songTags = sqliteTable(
	"song_tags",
	{
		id: AUTO_INCREMENTING_INTEGER_ID,

		trackID: integer("track_id")
			.notNull()
			.references(() => tracks.id, { onDelete: "cascade" }),
		tagID: integer("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),

		weightOutOfOneHundred: integer("weight").notNull().default(100),
		createdAt: createTimestampIntegerDefaultingToNow("created_at"),
	},
	(songTag) => [
		uniqueIndex("song_tags_track_tag_uniq").on(songTag.trackID, songTag.tagID),
		index("song_tags_track_idx").on(songTag.trackID),
		index("song_tags_tag_idx").on(songTag.tagID),
	],
);

export type SongTag = typeof songTags.$inferSelect;
export type NewSongTag = typeof songTags.$inferInsert;
