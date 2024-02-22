import { Component, Input } from '@angular/core';
import { Song } from '../../types/Song';
import { SongFile } from '../../types/SongFile';
import { NgIf } from '@angular/common';

@Component({
  selector: 'song',
  standalone: true,
  imports: [
		NgIf,
	],
  templateUrl: './song.component.html',
  styleUrl: './song.component.css'
})
export class SongComponent {
	@Input() song!: Song;

	ngOnInit() {
		console.log(this.song);
	}
}
