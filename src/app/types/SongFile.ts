import { AudioFile } from './AudioFile';
import { Quality } from "./Quality";
import { QualityPercentage } from './QualityPercentage';
import Integer1To100 from "./simple_types";
interface QualityPercentageData {
	_quality: Quality;
	_percentage: Integer1To100;
}
interface SongData {
	_title: string;
	_album: string | null;
	_artists: string[] | null;
	_album_artist: string | null;
	_quality_percentages: QualityPercentageData[];
}
interface MusicLibraryData {
	songs: SongData[]
}

export class SongFile {
	private _title: string;
	private _album: string | null = null;
	private _artists: string[] | null = null;;
	private _album_artist: string | null = null;;
	private _quality_percentages: QualityPercentage[] = [];
	private _file_path: string;
	private _cover_art_file_path: string | null = null;

	static DEFAULT_TITLE = "Unknown Title";
	static DEFAULT_ARTIST = "Unknown Artist";
	static DEFAULT_ALBUM = "Unknown Album";

	constructor(
		file_path: string
	) {
		this._title = SongFile.DEFAULT_TITLE;
		this._file_path = file_path;
	}

	static fromJSONObject({
		_title,
		_album,
		_artists,
		_album_artist,
		_quality_percentages,
		_file_path,
		_cover_art_file_path,
	}: SongFile): SongFile {
		const song = new SongFile(_file_path);

		song._title = _title;
		song._album = _album;
		song._artists = _artists;
		song._album_artist = _album_artist;
		song._cover_art_file_path = _cover_art_file_path;
		song._quality_percentages =
			_quality_percentages.map(
				_quality_percentage =>
					QualityPercentage.fromJSONObject(_quality_percentage)
			);

		return song;
	}

	static fromAudioFile(audio_file: AudioFile): SongFile {
		const song = new SongFile(audio_file.file_path);

		song._title = audio_file.metadata.title ?? SongFile.DEFAULT_TITLE;
		song._album = audio_file.metadata.album ?? null;
		song._artists = audio_file.metadata.artists ?? null;
		song._album_artist = audio_file.metadata.albumartist ?? null;
		song._cover_art_file_path = audio_file.metadata.cover_art_file_path ?? null;

		return song;
	}

	get file_path(): string {
		return this._file_path;
	};
	set file_path(file_path: string) {
		this._file_path = file_path;
	}

	get cover_art_file_path(): string | null {
		return this._cover_art_file_path;
	};
	set cover_art_file_path(cover_art_file_path: string | null) {
		this._cover_art_file_path = cover_art_file_path;
	}



	get title(): string {
		return this._title;
	};
	set title(title: string) {
		this._title = title;
	};

	get album(): string | null {
		return this._album;
	};
	set album(album: string | null) {
		this._album = album;
	}

	get artists(): string[] | null {
		return this._artists;
	};
	set artists(artists: string[] | null ) {
		this._artists = artists;
	};

	get album_artist(): string | null {
		return this._album_artist;
	};
	set album_artist(album_artist: string | null) {
		this._album_artist = album_artist;
	}

	get quality_percentages(): QualityPercentage[] {
		return this._quality_percentages;
	};
	addQualityPercentage(quality_percentage: QualityPercentage) {
		this._quality_percentages.push(quality_percentage)
	}
	getQualityByName(quality_name: string): QualityPercentage | undefined {
		return this._quality_percentages.find(
			quality => quality.name === quality_name
		);
	}
	getQualitiesOverPercentage(percentage: Integer1To100): QualityPercentage[] | undefined {
		return this._quality_percentages.filter(
			quality => quality.percentage > percentage
		);
	}
	getQualitiesUnderPercentage(percentage: Integer1To100): QualityPercentage[] | undefined {
		return this._quality_percentages.filter(
			quality => quality.percentage < percentage
		);
	}
}