import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FileSelectionComponent } from './components/file-selection/file-selection.component';
import { LibraryComponent } from './components/library/library.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
		RouterOutlet,
		FileSelectionComponent,
		LibraryComponent,
	],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'music-player';
}
