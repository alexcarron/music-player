import { Component, NgModule } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FileSelectionComponent } from './components/file-selection/file-selection.component';
import { LibraryComponent } from './components/library/library.component';
import { AudioPlayerService } from './services/audio-player/audio-player.service';
import { MusicLibraryService } from './services/music-library/music-library.service';
import { QueueService } from './services/queue/queue.service';
import { CurrentlyPlayingSongComponent } from './components/current-playing-song/currently-playing-song.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
		RouterOutlet,
		FileSelectionComponent,
		LibraryComponent,
		CurrentlyPlayingSongComponent,
	],
	providers: [
		MusicLibraryService,
		AudioPlayerService,
		QueueService,
	],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'music-player';
}
