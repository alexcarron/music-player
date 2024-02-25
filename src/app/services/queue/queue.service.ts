import { Injectable } from '@angular/core';
import { SongFile } from '../../types/SongFile';
import { AudioPlayerService } from '../audio-player/audio-player.service';

@Injectable({
  providedIn: 'root',
})
export class QueueService {
	isPlayingSong: boolean = false;
	private songs_in_queue: SongFile[] = [];

  constructor(
		private audio_player_service: AudioPlayerService
	) {}

	private async playCurrentSong() {
		if (this.currently_playing_song !== null) {
			this.isPlayingSong = true;
			await this.audio_player_service.play(this.currently_playing_song);
			await this.onSongOver();
		}
	}

	private async onSongOver() {
		this.songs_in_queue.shift();

		if (this.currently_playing_song)
			await this.playCurrentSong();
		else
			this.isPlayingSong = false;
	}

	set currently_playing_song(song: SongFile) {
		this.songs_in_queue.unshift(song);

		this.playCurrentSong();
	}

	get currently_playing_song(): SongFile | null {
		if (this.songs_in_queue.length < 1)
			return null;

		return this.songs_in_queue[0];
	}

	pauseCurrentSong() {
		if (this.isPlayingSong) {
			this.isPlayingSong = false;
			this.audio_player_service.pause();
		}
	}

	resumeCurrentSong() {
		if (
			this.currently_playing_song !== null &&
			!this.isPlayingSong
		) {
			this.isPlayingSong = true;
			this.audio_player_service.resume();
		}
	}
}
