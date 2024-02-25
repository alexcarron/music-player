const {app, BrowserWindow, ipcMain} = require('electron')
const mm = require('music-metadata');
const fs = require('fs/promises');
const url = require("url");
const path = require("path");
const { v4: uuidv4 } = require('uuid');

let main_window;

const USER_DATA_DIRECTORY_PATH = app.getPath('userData');
const CLONED_AUDIO_DIRECTORY_PATH = path.join(USER_DATA_DIRECTORY_PATH, 'cloned_audio');
const RESOURCES_DIRECTORY_PATH = path.join(USER_DATA_DIRECTORY_PATH, 'resources');
const MEDIA_DIRECTORY_PATH = path.join(USER_DATA_DIRECTORY_PATH, 'media');
const QUALITIES_FILE_NAME = 'qualities.json';
const MUSIC_LIBRARY_FILE_NAME = 'music-library.json';

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
});

const directoryExists = async function(directory_path) {
	try {
		await fs.stat(directory_path);
		return true; // Directory exists
	}
	catch (error) {
		if (error.code === 'ENOENT') {
				return false;
		}

		throw error;
	}
}

const fileExists = async function(file_path) {
	try {
		await fs.access(file_path);
		return true; // Directory exists
	}
	catch (error) {
		if (error.code === 'ENOENT') {
				return false;
		}

		throw error;
	}
}

const getMetadataFromFilePath = async function(file_path) {
	const metadata = await mm.parseFile(file_path);

	const {
		title,
		artist,
		album,
		artists,
		albumartist,
		picture
	} = metadata.common;

	let cover_art_file_path = undefined;
	if (picture) {
		const cover_picture = mm.selectCover(picture);
		if (cover_picture) {
			const data_uri_scheme = `data:${cover_picture.format}; base64,${cover_picture.data.toString('base64')}`;
			cover_art = {data_uri_scheme};

			const base64_data = cover_picture.data.toString('base64');
			const buffer = Buffer.from(base64_data, 'base64');

			let file_name = generateUniqueSongImageName(title, artist);

			console.log({file_name});

			cover_art_file_path = path.join(MEDIA_DIRECTORY_PATH, file_name);

			await updateFileContents(
				MEDIA_DIRECTORY_PATH,
				file_name,
				buffer
			);
		}
	}

	const metadata_obj = {
		title,
		artist,
		album,
		artists,
		albumartist,
		cover_art_file_path: cover_art_file_path,
	}

	return metadata_obj;
}

const getFilePathsInDirectory = async function(directory_path) {
	// Create the directory if it doesn't exist
	if (!await directoryExists(directory_path)) {
		await fs.mkdir(
			directory_path,
			{ recursive: true }
		);
	}

	return await fs.readdir(CLONED_AUDIO_DIRECTORY_PATH);
}

const getFileatPath = async function(directory_path, file_name, default_contents) {
	// Create the resources directory if it doesn't exist
	if (!await directoryExists(directory_path)) {
		await fs.mkdir(
			directory_path,
			{ recursive: true }
		);
	};

	const file_path = path.join(directory_path, file_name);

	if (!await fileExists(file_path)) {
		await fs.writeFile(
			file_path,
			default_contents
		);
	}


	return await fs.readFile(file_path);
}

function truncateFileName(fileName, maxLength) {
    if (fileName.length <= maxLength) {
        return fileName; // No truncation needed
    }
    const truncatedLength = maxLength - 10; // Leave space for suffix
    const truncatedFileName = fileName.substring(0, truncatedLength);
    return `${truncatedFileName}_${uuidv4().substring(0, 8)}.png`; // Append UUID to ensure uniqueness
}

function generateUniqueSongImageName(title, artist) {
    const timestamp = Date.now(); // Get current timestamp
    const randomString = Math.random().toString(36).substring(2, 8); // Generate random string
    const uniqueId = uuidv4().substring(0, 8); // Generate UUID and extract first 8 characters

    // Replace special characters in title and artist with underscore
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedArtist = artist.replace(/[^a-zA-Z0-9]/g, '_');

    const fileName = `${sanitizedArtist}_${sanitizedTitle}_${timestamp}_${randomString}_${uniqueId}.png`;
    const maxLength = 255; // Maximum allowed length for file names

    return truncateFileName(fileName, maxLength);
}

const updateFileContents = async function(directory_path, file_name, new_contents) {
	// Create the resources directory if it doesn't exist
	if (!await directoryExists(directory_path)) {
		await fs.mkdir(
			directory_path,
			{ recursive: true }
		);
	};

	const file_path = path.join(directory_path, file_name);

	await fs.writeFile(
		file_path,
		new_contents
	);
}

ipcMain.on('cloneAudioFile', async (event, file) => {
	const cloned_audio_file_path = path.join(CLONED_AUDIO_DIRECTORY_PATH, file.name);

	// Write file to cloned audio directory
	await fs.writeFile(
		cloned_audio_file_path,
		Buffer.from(file.content),
		async (error) => {
			if (error) {
				console.error(error);
				event.sender.send('cloneAudioFileResponse', { error: err });
			}
			else {
				const metadata_obj = await getMetadataFromFilePath(cloned_audio_file_path);

				const audio_file = {
					file_path: cloned_audio_file_path,
					metadata: metadata_obj,
				};
				event.sender.send('cloneAudioFileResponse', { audio_file: audio_file });
			}
		}
	);
})

ipcMain.on('readAudioFiles', async (event, _data) => {
	let audio_files = [];

	try {
		audio_files = await getFilePathsInDirectory(CLONED_AUDIO_DIRECTORY_PATH)
			.catch(error => console.error(error));

		audio_files = await Promise.all(audio_files.map(async file_name => {
			const file_path = path.join(CLONED_AUDIO_DIRECTORY_PATH, file_name);
			const metadata_obj = await getMetadataFromFilePath(file_path);

			const audio_file = {
				file_path: file_path,
				metadata: metadata_obj,
			};
			return audio_file;
		}));
	}
	catch (error) {
    console.error('Failed to read audio files:', error);
	}

	event.sender.send('readAudioFilesResponse', audio_files);
})

ipcMain.on('readQualities', async (event, _data) => {
	const qualities_data = await getFileatPath(
		RESOURCES_DIRECTORY_PATH,
		QUALITIES_FILE_NAME,
		JSON.stringify([], null, 2)
	)
		.catch(error => console.error(error));

	const qualities = JSON.parse(qualities_data);

	event.sender.send('readQualitiesResponse', qualities);
});

ipcMain.on('readMusicLibrary', async (event, _data) => {
	const music_library_data = await getFileatPath(
		RESOURCES_DIRECTORY_PATH,
		MUSIC_LIBRARY_FILE_NAME,
		JSON.stringify({ songs: [] }, null, 2)
	)

	const music_library = JSON.parse(music_library_data);

	event.sender.send('readMusicLibraryResponse', music_library);
});

ipcMain.on('updateMusicLibrary', async (event, new_music_library) => {
	music_library_data = JSON.stringify(new_music_library, null, 2);

	await updateFileContents(
		RESOURCES_DIRECTORY_PATH,
		MUSIC_LIBRARY_FILE_NAME,
		music_library_data
	)

	event.sender.send('updateMusicLibraryResponse');
});