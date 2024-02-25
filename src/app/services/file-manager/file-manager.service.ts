import { Injectable } from '@angular/core';
import { IpcRenderer } from 'electron';
import { AudioFile } from '../../types/AudioFile';
import { Quality } from '../../types/Quality';
import { SongFile } from '../../types/SongFile';
import MusicLibrary from '../../types/MusicLibrary';
import { QualityPercentage } from '../../types/QualityPercentage';
import Integer1To100 from '../../types/simple_types';

@Injectable({
  providedIn: 'root'
})
export class FileManagerService {
	private _ipc: IpcRenderer | undefined;

	constructor() {
    if (window.require) {
      try {
        this._ipc = window.require('electron').ipcRenderer;
      }
			catch (error) {
        throw error;
      }
		} else {
      console.warn('Electron\'s IPC was not loaded');
    }
	}

	private once(
		channel: string,
		listener:
			(
				event: Electron.IpcRendererEvent,
				...args: any[]
			) => void
	): void {
    if (!this._ipc) {
      return;
    }
    this._ipc.once(channel, listener);
  }

  private send(channel: string, ...args: any[]): void {
    if (!this._ipc) {
      return;
    }
    this._ipc.send(channel, ...args);
  }

	/**
	 * Copies audio file to cloned audio directory and returns file path
	 * @param {File} file audio file to clone
	 * @returns {AudioFile} the audio file path and metadata
	 */
	cloneAudioFile(file: File): Promise<AudioFile> {
		return new Promise<AudioFile>((resolve, reject) => {

			const reader = new FileReader();

			reader.onload = () => {
				const file_content: ArrayBuffer|string|null = reader.result;

				this.send('cloneAudioFile', {
					content: file_content,
					name: file.name
				});
			};

			reader.onerror = (error) => {
				reject(error)
			}

			reader.readAsArrayBuffer(file);

			interface AudioFileResponseData {
				error?: string;
				audio_file?: AudioFile;
			}

			this.once('cloneAudioFileResponse', (_event: any, data: AudioFileResponseData) => {
				if (data.error || data.audio_file === undefined || data.audio_file.file_path === undefined) {
					reject(data.error)
				}
				else {
					resolve(data.audio_file);
				}
			})
		});
	}

	readAudioFiles(): Promise<AudioFile[]> {
		return new Promise<AudioFile[]>((resolve, reject) => {
			this.send('readAudioFiles');

			this.once('readAudioFilesResponse', (_event: any, audio_file: AudioFile[]) => {
				resolve(audio_file);
			});
		});
	}

	/**
	 * @returns the file paths of the cloned audio files
	 */
	getExistingMusicLibrary(): Promise<MusicLibrary> {
		return new Promise<MusicLibrary>((resolve, reject) => {

			this.send('readMusicLibrary');

			this.once('readMusicLibraryResponse', (_event: any, music_library_data) => {
				music_library_data.songs =
					music_library_data.songs.map((song_data: SongFile) => {
						return SongFile.fromJSONObject(song_data);
					});

				resolve(music_library_data);
			});
		});
	}

	updateMusicLibrary(new_music_library: MusicLibrary): Promise<void> {
		return new Promise<void>((resolve, reject) => {

			this.send('updateMusicLibrary', new_music_library);

			this.once('updateMusicLibraryResponse', (_event: any) => {
				resolve();
			})
		});
	}

	/**
	 * @returns Existing qualities stored in local storage
	 */
	getExistingQualities(): Promise<Quality[]> {
		return new Promise<Quality[]>((resolve, reject) => {
			this.send('readQualities');

			this.once('readQualities', (_event: any, qualities: Quality[]) => {
				resolve(qualities);
			})
		});
	}
}

