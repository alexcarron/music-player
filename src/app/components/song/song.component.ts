import { Component, Input } from '@angular/core';
import { Song } from '../../types/Song';
import { SongFile } from '../../types/SongFile';
import { NgIf } from '@angular/common';
import { AudioPlayerService } from '../../services/audio-player/audio-player.service';

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
	@Input() song!: SongFile;

	constructor(
		private audio_player_service: AudioPlayerService
	) {}

	play() {
		this.audio_player_service.play(this.song);
	}
}
