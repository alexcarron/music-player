import { Injectable } from '@angular/core';
import { IpcRenderer } from 'electron';
import { AudioFile } from '../../types/AudioFile';

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
	 * @param file audio file to clone
	 * @returns the file path of the cloned audio file
	 */
	cloneAudioFile(file: File): Promise<string> {
		return new Promise<string>((resolve, reject) => {

			const reader = new FileReader();

			reader.onload = () => {
				const file_content: ArrayBuffer|string|null = reader.result;

				this.send('audioFile', {
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
				path?: string;
			}

			this.once('audioFileResponse', (_event: any, data: AudioFileResponseData) => {
				if (data.error || data.path === undefined) {
					reject(data.error)
				}
				else {
					const cloned_audio_file_path = data.path;
					resolve(cloned_audio_file_path);
				}
			})
		});
	}

	/**
	 * @returns the file paths of the cloned audio files
	 */
	getClonedAudioFiles(): Promise<AudioFile[]> {
		return new Promise<AudioFile[]>((resolve, reject) => {

			this.send('readAudioFiles');

			this.once('readAudioFilesResponse', (_event: any, audio_files: AudioFile[]) => {
				resolve(audio_files);
			})
		});
	}
}

