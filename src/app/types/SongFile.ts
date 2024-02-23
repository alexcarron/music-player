import { Song } from "./Song"

export class SongFile extends Song {
	private _file_path: string;

	constructor(
		title: string,
		file_path: string,
	) {
		super(title);
		this._file_path = file_path;
	}

	get file_path(): string {
		return this._file_path;
	};
	set file_path(file_path: string) {
		this._file_path = file_path;
	}
}