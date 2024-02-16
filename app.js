const {app, BrowserWindow} = require('electron')
const url = require("url");
const path = require("path");

let main_window;

function createWindow() {
	main_window = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true
		}
	});

	main_window.loadURL(
		url.format({
			pathname: path.join(__dirname, `/dist/music-player/browser/index.html`),
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