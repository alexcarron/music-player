import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("ipcRenderer", {
	on(...args: Parameters<typeof ipcRenderer.on>) {
		const [channel, listener] = args;
		return ipcRenderer.on(channel, (event, ...listenerArgs) =>
			listener(event, ...listenerArgs),
		);
	},
	off(...args: Parameters<typeof ipcRenderer.off>) {
		const [channel, ...remainingArguments] = args;
		return ipcRenderer.off(channel, ...remainingArguments);
	},
	send(...args: Parameters<typeof ipcRenderer.send>) {
		const [channel, ...remainingArguments] = args;
		return ipcRenderer.send(channel, ...remainingArguments);
	},
	invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
		const [channel, ...remainingArguments] = args;
		return ipcRenderer.invoke(channel, ...remainingArguments);
	},
});
