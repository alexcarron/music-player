import { Injectable } from '@angular/core';
import { Song } from '../types/Song';
import { MusicLibraryInterface } from '../types/MusicLibraryInterface';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MusicLibraryService implements MusicLibraryInterface {
	private songs: Song[] = [];

	songsUpdatedObserver = new Subject<Song[]>();

	addSong(song: Song): void {
		this.songs.push(song);
		this.songsUpdatedObserver.next([...this.songs]);

		console.log(this.songs);
	};

	getSongs(): Song[] {
		return this.songs;
	};

}
