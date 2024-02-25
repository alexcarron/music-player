import { Injectable } from '@angular/core';
import { Quality } from '../../types/Quality';
import { FileManagerService } from '../file-manager/file-manager.service';

@Injectable({
  providedIn: 'root'
})
export class QualitiesManagerService {
	private qualities: Quality[] = [];

  constructor(
		private file_manager_service: FileManagerService
	) {}

	addQuality(quality: Quality) {
		this.qualities.push(quality);
	}

	getQualities(): Quality[] {
		return this.qualities;
	}

	async loadExistingQualities() {
		const qualities = this.file_manager_service.getExistingQualities();
	}
}
