import { Injectable } from '@angular/core';
import { Song } from '../../types/Song';
import { MusicLibraryInterface } from '../../types/MusicLibraryInterface';
import { Subject } from 'rxjs';
import { FileManagerService } from '../file-manager/file-manager.service';
import { SongFile } from '../../types/SongFile';
import { AudioFile } from '../../types/AudioFile';

@Injectable({
  providedIn: 'root'
})
export class MusicLibraryService implements MusicLibraryInterface {
	private songs: SongFile[] = [];
	songsUpdatedObserver = new Subject<SongFile[]>();

	constructor (
		private file_manager_service: FileManagerService
	) {}

	addSong(song: SongFile): void {
		this.songs.push(song);
		this.songsUpdatedObserver.next([...this.songs]);
	};

	getSongs(): SongFile[] {
		return this.songs;
	};

	async createSongFromFile(file: File): Promise<SongFile> {
		const title = file.name;
		const artist = null;
		const album = null;

		const file_path = await this.file_manager_service.cloneAudioFile(file);

		const song = new SongFile(title, file_path);

		if (artist)
			song.artist = artist;

		if (album)
			song.album = album;

		return song;
	}

	async getSongFromAudioFile(audio_file: AudioFile) {
		let title = audio_file.metadata.title;
		let artist = audio_file.metadata.artist;
		let album = audio_file.metadata.album;

		if (title === undefined)
			title = "Unknown Artist";

		const song = new SongFile(title, audio_file.file_path);

		if (artist)
			song.artist = artist;

		if (album)
			song.album = album;

		return song;
	}

	async loadExistingSongs() {
		const audio_files = await this.file_manager_service.getClonedAudioFiles();
		({audio_files})

		audio_files.forEach(async audio_file => {
			const song: SongFile = await this.getSongFromAudioFile(audio_file);

			this.addSong(song);
		})
	}
}
