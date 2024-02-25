import { Injectable } from '@angular/core';
import { FileManagerService } from '../file-manager/file-manager.service';
import { SongFile } from '../../types/SongFile';
import MusicLibrary from '../../types/MusicLibrary';

@Injectable({
  providedIn: 'root'
})
export class MusicLibraryService implements MusicLibrary {
	songs: SongFile[] = [];

	constructor (
		private file_manager_service: FileManagerService
	) {}

	addSong(song: SongFile): void {
		this.songs.push(song);
	};

	async addNewSong(song: SongFile): Promise<void> {
		this.addSong(song);
		await this.file_manager_service.updateMusicLibrary({ songs: this.songs });
	}

	getSongs(): SongFile[] {
		return this.songs;
	};

	async addNewSongFromFile(file: File): Promise<SongFile> {
		const audio_file = await this.file_manager_service.cloneAudioFile(file);

		const song = SongFile.fromAudioFile(audio_file);

		await this.addNewSong(song);

		return song;
	}

	async loadExistingSongs() {
		const music_library = await this.file_manager_service.getExistingMusicLibrary();

		music_library.songs.forEach(song => {
			this.addSong(song);
		});
	}
}
