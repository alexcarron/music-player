import { Component, Input, ViewChild } from '@angular/core';
import { SongFile } from '../../types/SongFile';
import { NgIf } from '@angular/common';
import { QueueService } from '../../services/queue/queue.service';
import { QualitySelectorComponent } from '../quality-selector copy/quality-selector.component';

@Component({
  selector: 'song',
  standalone: true,
  imports: [
		NgIf,
		QualitySelectorComponent,
	],
  templateUrl: './song.component.html',
  styleUrl: './song.component.css'
})
export class SongComponent {
	@Input() song!: SongFile;

	constructor(
		private queue_service: QueueService,
	) {}

	play() {
		console.log("play()");
		this.queue_service.currently_playing_song = this.song;
	}

	toggleQualitiesSelector() {}
}
