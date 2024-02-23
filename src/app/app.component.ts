import { Component, NgModule } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FileSelectionComponent } from './components/file-selection/file-selection.component';
import { LibraryComponent } from './components/library/library.component';
import { AudioPlayerService } from './services/audio-player/audio-player.service';
import { MusicLibraryService } from './services/music-library/music-library.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
		RouterOutlet,
		FileSelectionComponent,
		LibraryComponent,
	],
	providers: [
		MusicLibraryService,
		AudioPlayerService,
	],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'music-player';
}
