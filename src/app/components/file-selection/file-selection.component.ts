import { Component, EventEmitter, Output } from '@angular/core';
import { Song } from '../../types/Song';
import { SongFile } from '../../types/SongFile';
import { MusicLibraryService } from '../../services/music-library/music-library.service';
import { FileManagerService } from '../../services/file-manager/file-manager.service';

@Component({
  selector: 'file-selection',
  standalone: true,
  imports: [],
  templateUrl: './file-selection.component.html',
  styleUrl: './file-selection.component.css'
})
export class FileSelectionComponent {
	constructor(
		private music_library_service: MusicLibraryService,
	) {}

  async onFilesSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;

		let songs: SongFile[] = [];

		if (files !== null) {
			let file_index: number = 0;

			while (file_index < files.length) {
				let current_file: File | null = files.item(file_index);

				if (current_file !== null) {
					const song: SongFile =
						await this.music_library_service.createSongFromFile(current_file);

					songs.push(song);
				}

				file_index += 1;
			}
		}

		songs.forEach(song => {
			this.music_library_service.addSong(song);
		});

  }
}
