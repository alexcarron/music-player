import { Song } from "./Song";

export interface MusicLibraryInterface {
	addSong(song: Song): void;
	getSongs(): Song[];
}