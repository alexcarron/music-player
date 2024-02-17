import { Injectable } from '@angular/core';
import * as mm from 'music-metadata';

@Injectable({
  providedIn: 'root'
})
export class AudioFileMetadataParserService {

  constructor() { }

  private static async getMetadataFromAudioFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event: any) => {
        const buffer = event.target.result;
        try {
          const metadata = await mm.parseBuffer(buffer, file.type, { duration: true });
          resolve(metadata);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (event) => {
        reject(event.target?.error);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  static async getTitle(file: File): Promise<string | null> {
    try {
      const metadata = await AudioFileMetadataParserService.getMetadataFromAudioFile(file);
      return metadata.common.title || 'Unknown Title';
    } catch (error) {
      console.error('Error parsing title:', error);
      return null;
    }
  }

  static async getArtist(file: File): Promise<string | null> {
    try {
      const metadata = await AudioFileMetadataParserService.getMetadataFromAudioFile(file);
      return metadata.common.artist || 'Unknown Artist';
    } catch (error) {
      console.error('Error parsing artist:', error);
      return null;
    }
  }

  static async getAlbum(file: File): Promise<string | null> {
    try {
      const metadata = await AudioFileMetadataParserService.getMetadataFromAudioFile(file);
      return metadata.common.album || 'Unknown Album';
    } catch (error) {
      console.error('Error parsing album:', error);
      return null;
    }
  }
}
