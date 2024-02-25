import { Injectable } from '@angular/core';
import { SongFile } from '../../types/SongFile';

@Injectable({
  providedIn: 'root'
})
export class AudioPlayerService {
  private audio: HTMLAudioElement;
	private song_playing: SongFile | null;

  constructor() {
    this.audio = new Audio();
    this.audio.load();

		this.song_playing = null;
  }

	/**
	 * Plays audio file from song using HTMLAudioElement and resolves when audio ended
	 * @param song_playing
	 * @returns
	 */
  play(song_playing: SongFile): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.audio.src = song_playing.file_path; // Set the audio file path
      this.audio.play();

      this.song_playing = song_playing;

      // Event listener to resolve the promise when the audio finishes playing
      this.audio.onended = () => {
        resolve();
      };

      // Handle any error during playback
      this.audio.onerror = (error) => {
        reject(error);
      };
    });
  }

  pause(): void {
    this.audio.pause();
  }

  resume(): void {
    this.audio.play();
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

  getDuration(): number {
    return this.audio.duration;
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getVolume(): number {
    return this.audio.volume;
  }

  isPlaying(): boolean {
    return !this.audio.paused;
  }
}
