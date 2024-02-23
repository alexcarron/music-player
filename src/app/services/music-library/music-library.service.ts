import { Injectable } from '@angular/core';
import { Song } from '../../types/Song';
import { MusicLibraryInterface } from '../../types/MusicLibraryInterface';
import { Subject } from 'rxjs';
import { FileManagerService } from '../file-manager/file-manager.service';
import { SongFile } from '../../types/SongFile';

@Injectable({
  providedIn: 'root'
})
export class MusicLibraryService implements MusicLibraryInterface {
	private songs: SongFile[] = [];

	constructor (
		private file_manager_service: FileManagerService
	) {}

	songsUpdatedObserver = new Subject<SongFile[]>();

	addSong(song: SongFile): void {
		this.songs.push(song);
		this.songsUpdatedObserver.next([...this.songs]);

		console.log(this.songs);
	};

	getSongs(): SongFile[] {
		return this.songs;
	};

	async createSongFromFile(file: File): Promise<SongFile> {
		const title = file.name;
		const artist = null;
		const album = null;

		const file_path = await this.file_manager_service.copyFileInElectron(file);

		const song = new SongFile(title, file_path);

		if (artist)
			song.artist = artist;

		if (album)
			song.album = album;

		return song;
	}

}
