import * as mm from 'music-metadata';

interface Metadata {
	title: string,
	artist: string,
	album: string,
	artists: string[],
	albumartist: string,
	picture: mm.IPicture,
}

export interface AudioFile {
	file_path: string,
	metadata: Metadata,
}