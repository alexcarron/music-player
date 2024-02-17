export interface Song {
	getTitle(): string;
	getArtist(): string | null;
	getAlbum(): string | null;
}