import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'quality-editor',
  standalone: true,
  imports: [
		CommonModule,
		FormsModule,
	],
  templateUrl: './quality-editor.component.html',
  styleUrl: './quality-editor.component.css'
})
export class QualityEditorComponent {
	isVisible: boolean = false;
	@Input() quality!: {name: string, amount: number};

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

	edit() {
		console.log(this.quality);
		this.close();
	}
}
