interface Metadata {
	title: string | undefined,
	album: string | undefined,
	artists: string[] | undefined,
	albumartist: string | undefined,
	cover_art_file_path: string | undefined,
}

export interface AudioFile {
	file_path: string,
	metadata: Metadata,
}