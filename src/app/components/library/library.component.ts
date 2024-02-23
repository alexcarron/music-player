import { Component } from '@angular/core';
import { MusicLibraryService } from '../../services/music-library/music-library.service';
import { Song } from '../../types/Song';
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

	ngOnInit() {
		this.songs = this.music_library.getSongs();
	}

	onClick() {
		console.log(this.songs);
	}
}
