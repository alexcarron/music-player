import { Component } from '@angular/core';
import { MusicLibraryService } from '../../services/music-library/music-library.service';
import { SongComponent } from '../song/song.component';
import { CommonModule } from '@angular/common';
import { SongFile } from '../../types/SongFile';

@Component({
  selector: 'library',
  standalone: true,
  imports: [
		SongComponent,
		CommonModule,
	],
  templateUrl: './library.component.html',
  styleUrl: './library.component.css'
})
export class LibraryComponent {
	songs: SongFile[] = [];

	constructor(
		private music_library: MusicLibraryService
	) {}

	async ngOnInit() {
		await this.music_library.loadExistingSongs();
		this.songs = this.music_library.getSongs();
	}
}
