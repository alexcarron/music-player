import { relations } from "drizzle-orm";
import { tracks, trackAnalysis, spotifyImports } from "./tracks.schema";
import { tags, tagGroups, tagGroupMemberships, songTags } from "./tags.schema";
import {
	playlistFolders,
	playlists,
	smartPlaylistRules,
	playlistTracks,
} from "./playlists.schema";
import { playEvents } from "./play-events.schema";
import { playbackState } from "./playback-state.schema";

export const tracksRelations = relations(tracks, ({ one, many }) => ({
	analysis: one(trackAnalysis, {
		fields: [tracks.id],
		references: [trackAnalysis.trackID],
	}),
	songTags: many(songTags),
	playEvents: many(playEvents),
	playlistTracks: many(playlistTracks),
	spotifyImports: many(spotifyImports),
	playbackState: one(playbackState, {
		fields: [tracks.id],
		references: [playbackState.trackID],
	}),
}));

export const trackAnalysisRelations = relations(trackAnalysis, ({ one }) => ({
	track: one(tracks, {
		fields: [trackAnalysis.trackID],
		references: [tracks.id],
	}),
}));

export const spotifyImportsRelations = relations(spotifyImports, ({ one }) => ({
	track: one(tracks, {
		fields: [spotifyImports.trackID],
		references: [tracks.id],
	}),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
	songTags: many(songTags),
	groupMemberships: many(tagGroupMemberships),
	smartPlaylistRules: many(smartPlaylistRules),
}));

export const tagGroupsRelations = relations(tagGroups, ({ many }) => ({
	tagMemberships: many(tagGroupMemberships),
}));

export const tagGroupMembershipsRelations = relations(
	tagGroupMemberships,
	({ one }) => ({
		tag: one(tags, {
			fields: [tagGroupMemberships.tagID],
			references: [tags.id],
		}),
		group: one(tagGroups, {
			fields: [tagGroupMemberships.groupID],
			references: [tagGroups.id],
		}),
	}),
);

export const songTagsRelations = relations(songTags, ({ one }) => ({
	track: one(tracks, { fields: [songTags.trackID], references: [tracks.id] }),
	tag: one(tags, { fields: [songTags.tagID], references: [tags.id] }),
}));

export const playlistFoldersRelations = relations(
	playlistFolders,
	({ one, many }) => ({
		parentFolder: one(playlistFolders, {
			fields: [playlistFolders.parentFolderID],
			references: [playlistFolders.id],
			relationName: "parentFolder",
		}),
		childFolders: many(playlistFolders, { relationName: "parentFolder" }),
		playlists: many(playlists),
	}),
);

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
	folder: one(playlistFolders, {
		fields: [playlists.folderID],
		references: [playlistFolders.id],
	}),
	tracks: many(playlistTracks),
	smartRules: many(smartPlaylistRules),
}));

export const smartPlaylistRulesRelations = relations(
	smartPlaylistRules,
	({ one }) => ({
		playlist: one(playlists, {
			fields: [smartPlaylistRules.playlistID],
			references: [playlists.id],
		}),
		tag: one(tags, {
			fields: [smartPlaylistRules.tagID],
			references: [tags.id],
		}),
	}),
);

export const playlistTracksRelations = relations(playlistTracks, ({ one }) => ({
	playlist: one(playlists, {
		fields: [playlistTracks.playlistID],
		references: [playlists.id],
	}),
	track: one(tracks, {
		fields: [playlistTracks.trackID],
		references: [tracks.id],
	}),
}));

export const playEventsRelations = relations(playEvents, ({ one }) => ({
	track: one(tracks, {
		fields: [playEvents.trackID],
		references: [tracks.id],
	}),
}));

export const playbackStateRelations = relations(playbackState, ({ one }) => ({
	track: one(tracks, {
		fields: [playbackState.trackID],
		references: [tracks.id],
	}),
}));
