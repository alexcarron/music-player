import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'custom-quality-creator',
  standalone: true,
  imports: [
		CommonModule,
		FormsModule,
	],
  templateUrl: './custom-quality-creator.component.html',
  styleUrl: './custom-quality-creator.component.css'
})
export class CustomQualityCreator {
	isVisible: boolean = false;
	quality: any = {name:null, amount:null};

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

	create() {
		console.log(this.quality);
		this.close();
	}
}
