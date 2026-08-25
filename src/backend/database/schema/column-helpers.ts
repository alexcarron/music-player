import { integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const AUTO_INCREMENTING_INTEGER_ID = integer("id").primaryKey({
	autoIncrement: true,
});

export const createAutoIncrementingIntegerPrimaryKey = (columnName: string) =>
	integer(columnName).primaryKey({ autoIncrement: true });

export const createTimestampIntegerDefaultingToNow = (columnName: string) =>
	integer(columnName, { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`);
