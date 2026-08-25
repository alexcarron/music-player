import { sqliteTable, integer, real } from "drizzle-orm/sqlite-core";
import {
	createAutoIncrementingIntegerPrimaryKey,
	createTimestampIntegerDefaultingToNow,
} from "./column-helpers";
import { tracks } from "./tracks.schema";

export const playbackState = sqliteTable("playback_state", {
	id: createAutoIncrementingIntegerPrimaryKey("id").default(1),

	trackID: integer("track_id").references(() => tracks.id, {
		onDelete: "set null",
	}),

	positionSeconds: real("position_seconds").notNull().default(0),
	volumeFromZeroToOne: real("volume").notNull().default(1.0),

	updatedAt: createTimestampIntegerDefaultingToNow("updated_at"),
});

export type PlaybackState = typeof playbackState.$inferSelect;
export type NewPlaybackState = typeof playbackState.$inferInsert;
