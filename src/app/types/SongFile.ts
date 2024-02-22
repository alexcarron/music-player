import { Song } from "./Song"

export class SongFile extends Song {
	static async fromAudioFile(file: File): Promise<Song> {
		const title = file.name;
		const artist = null;
		const album = null;

		const song = new SongFile(title);

		if (artist)
			song.artist = artist;

		if (album)
			song.album = album;

		return song;
	}
}