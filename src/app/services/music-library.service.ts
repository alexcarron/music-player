import { Injectable } from '@angular/core';
import { Song } from '../types/Song';
import { MusicLibraryInterface } from '../types/MusicLibraryInterface';

@Injectable({
  providedIn: 'root'
})
export class MusicLibraryService implements MusicLibraryInterface {
	private songs: Song[] = [];

	addSong(song: Song): void {
		this.songs.push(song);
	};

	getSongs(): Song[] {
		return this.songs;
	};

}
