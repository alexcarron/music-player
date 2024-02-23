export abstract class Song {
	private _title: string;
	private _artist: string | null = null;
	private _album: string | null = null;

	constructor(
		title: string
	) {
		this._title = title;
	}

	get title(): string {
		return this._title;
	};
	set title(title: string) {
		this._title = title;
	};

	get artist(): string | null {
		return this._artist;
	};
	set artist(artist: string) {
		this._artist = artist;
	}

	get album(): string | null {
		return this._album;
	};
	set album(album: string | null) {
		this._album = album;
	}
}