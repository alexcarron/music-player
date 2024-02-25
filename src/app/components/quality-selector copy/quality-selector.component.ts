import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { CustomQualityCreator } from '../custom-quality-creator/custom-quality-creator.component';
import { QualityEditorComponent } from '../quality-editor/quality-editor.component';
import { Quality } from '../../types/Quality';
import { QualitiesManagerService } from '../../services/qualities-manager/qualities-manager.service';

@Component({
  selector: 'quality-selector',
  standalone: true,
  imports: [
		CommonModule,
		CustomQualityCreator,
		QualityEditorComponent,
	],
  templateUrl: './quality-selector.component.html',
  styleUrl: './quality-selector.component.css'
})
export class QualitySelectorComponent {
	isVisible: boolean = false;
	qualities: Quality[] = [];

	constructor(
		private qualities_manager: QualitiesManagerService
	) {}

	async ngOnInit() {
		await this.qualities_manager.loadExistingQualities();
		this.qualities = this.qualities_manager.getQualities();
	}

	toggle() {
		this.isVisible = !this.isVisible;
	}

	close() {
		this.isVisible = false;
	}

	closeOnClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
	}
}
