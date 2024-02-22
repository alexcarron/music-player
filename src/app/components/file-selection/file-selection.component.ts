import { Component, EventEmitter, Output } from '@angular/core';
import { Song } from '../../types/Song';
import { SongFile } from '../../types/SongFile';
import { MusicLibraryService } from '../../services/music-library.service';

@Component({
  selector: 'file-selection',
  standalone: true,
  imports: [],
  templateUrl: './file-selection.component.html',
  styleUrl: './file-selection.component.css'
})
export class FileSelectionComponent {
  files_selected: FileList | null = null;

	constructor(
		private music_library_service: MusicLibraryService
	) {}

  async onFilesSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;

    if (files && files.length > 0) {
      this.files_selected = files;
    }

		const songs: Song[] = await this.getSongsFromFiles();
		songs.forEach(song => {
			this.music_library_service.addSong(song);
		});
  }

	async getSongsFromFiles(): Promise<Song[]> {
		let songs: Song[] = [];

		if (this.files_selected !== null) {
			let file_index: number = 0;


			while (file_index < this.files_selected.length) {
				let current_file: File | null = this.files_selected.item(file_index);

				if (current_file !== null) {
					const song: Song = await SongFile.fromAudioFile(current_file);

					songs.push(song);
				}

				file_index += 1;
			}
		}

		return songs;
	}
}
