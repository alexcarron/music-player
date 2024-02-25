import { Component } from '@angular/core';
import { SongFile } from '../../types/SongFile';
import { QueueService } from '../../services/queue/queue.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'currently-playing-song',
  standalone: true,
  imports: [
		CommonModule,
	],
  templateUrl: './currently-playing-song.component.html',
  styleUrl: './currently-playing-song.component.css'
})
export class CurrentlyPlayingSongComponent {
	queue: QueueService;

	constructor(
		private _queue_service: QueueService,
	) {
		this.queue = _queue_service;
	}

	get currently_playing_song(): SongFile | null {
		return this._queue_service.currently_playing_song;
	}

	doesCurrentlyPlayingSongExist() {
		return this._queue_service.currently_playing_song !== null;
	}

	pause() {
		this._queue_service.pauseCurrentSong();
	}

	resume() {
		this._queue_service.resumeCurrentSong();
	}
}
