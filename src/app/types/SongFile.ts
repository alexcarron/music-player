import { Song } from "./Song"

export class SongFile implements Song {
	private title: string;
	private artist: string | null = null;
	private album: string | null = null;

	constructor(
		title: string
	) {
		this.title = title;
	}

	setArtist(artist: string) {
		this.artist = artist;
	}
	setAlbum(album: string) {
		this.album = album;
	}
	getTitle(): string {
		return this.title;
	};
	getArtist(): string | null {
		return this.artist;
	};
	getAlbum(): string | null {
		return this.album;
	};

	static async fromAudioFile(file: File): Promise<Song> {
		const title = file.name;
		const artist = null;
		const album = null;

		const song = new SongFile(title);

		if (artist)
			song.setArtist(artist);

		if (album)
			song.setAlbum(album);

		return song;
	}
}