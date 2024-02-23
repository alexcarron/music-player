const {app, BrowserWindow, ipcMain} = require('electron')
const fs = require('fs');
const url = require("url");
const path = require("path");

let main_window;

function createWindow() {
	main_window = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
      contextIsolation: false,
		}
	});

	main_window.loadURL(
		url.format({
			pathname: path.join(__dirname, `/dist/browser/index.html`),
			protocol: "file:",
			slashes: true
		})
	);
	// Open the DevTools.
	main_window.webContents.openDevTools()

	main_window.on('closed', function () {
		main_window = null
	})
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
	if (main_window === null) createWindow()
})

ipcMain.on('audioFile', (event, file) => {
	const user_data_path = app.getPath('userData');
	const cloned_audio_file_path = path.join(user_data_path, 'cloned_audio', file.name);

  // Create the directory if it doesn't exist
	const cloned_audio_directory_path = path.dirname(cloned_audio_file_path);

	const doesClonedAudioDirectoryExist = fs.existsSync(cloned_audio_directory_path);

	if (!doesClonedAudioDirectoryExist) {
		fs.mkdirSync(
			cloned_audio_directory_path,
			{ recursive: true }
		);
	}

	// Write file to cloned audio directory
	fs.writeFile(
		cloned_audio_file_path,
		Buffer.from(file.content),
		(error) => {
			if (error) {
				console.error(error);
			event.sender.send('audioFileResponse', { error: err });
			}
			else {
				event.sender.send('audioFileResponse', { path: cloned_audio_file_path });
			}
		}
	);
})