import {
	sqliteTable,
	integer,
	text,
	real,
	index,
} from "drizzle-orm/sqlite-core";
import {
	AUTO_INCREMENTING_INTEGER_ID,
	createTimestampIntegerDefaultingToNow,
} from "./column-helpers";
import { tracks } from "./tracks.schema";

export const playEvents = sqliteTable(
	"play_events",
	{
		id: AUTO_INCREMENTING_INTEGER_ID,

		trackID: integer("track_id")
			.notNull()
			.references(() => tracks.id, { onDelete: "cascade" }),

		playedAt: createTimestampIntegerDefaultingToNow("played_at"),

		secondsListenedBeforeStoppingOrSkipping:
			real("duration_listened").notNull(),

		wasSkipped: integer("was_skipped", { mode: "boolean" })
			.notNull()
			.default(false),

		queueSource: text("queue_source"),
	},
	(playEvent) => [
		index("play_events_track_idx").on(playEvent.trackID),
		index("play_events_played_at_idx").on(playEvent.playedAt),
	],
);

export type PlayEvent = typeof playEvents.$inferSelect;
export type NewPlayEvent = typeof playEvents.$inferInsert;
