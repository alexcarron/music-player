import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

function readEnvironmentVariableWithoutViteStaticReplacement(name: string) {
	return process.env[name];
}

export const VITE_DEV_SERVER_URL =
	readEnvironmentVariableWithoutViteStaticReplacement("VITE_DEV_SERVER_URL");
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
	? path.join(process.env.APP_ROOT, "public")
	: RENDERER_DIST;

let mainWindow: BrowserWindow | null;

function createMainWindow() {
	mainWindow = new BrowserWindow({
		icon: path.join(
			process.env.VITE_PUBLIC ?? RENDERER_DIST,
			"electron-vite.svg",
		),
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
		},
	});

	mainWindow.webContents.on("did-finish-load", () => {
		mainWindow?.webContents.send(
			"main-process-message",
			new Date().toLocaleString(),
		);
	});

	if (VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
	}
}

function quitWhenAllWindowsClosedExceptOnMacOS() {
	if (process.platform !== "darwin") {
		app.quit();
		mainWindow = null;
	}
}

function createMainWindowWhenNoneAreOpen() {
	if (BrowserWindow.getAllWindows().length === 0) {
		createMainWindow();
	}
}

app.on("window-all-closed", quitWhenAllWindowsClosedExceptOnMacOS);
app.on("activate", createMainWindowWhenNoneAreOpen);

app.whenReady().then(createMainWindow);
