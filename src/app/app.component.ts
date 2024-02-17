import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FileSelectionComponent } from './file-selection/file-selection.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
		RouterOutlet,
		FileSelectionComponent,
	],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'music-player';
}
