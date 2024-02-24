import { Injectable } from '@angular/core';
import { SongFile } from '../../types/SongFile';
import { Song } from '../../types/Song';

@Injectable({
  providedIn: 'root'
})
export class AudioPlayerService {
  private audio: HTMLAudioElement;
	private song_playing: Song | null;

  constructor() {
    this.audio = new Audio();
    this.audio.load();

		this.song_playing = null;
  }

  play(song_playing: SongFile): void {
    this.audio.src = song_playing.file_path; // Set the audio file path
    this.audio.play();

		this.song_playing = song_playing;
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  setVolume(volume: number): void {
    this.audio.volume = volume;
  }

	enableLooping() {
		this.audio.loop = true;
	}

	disableLooping() {
		this.audio.loop = false;
	}
}
