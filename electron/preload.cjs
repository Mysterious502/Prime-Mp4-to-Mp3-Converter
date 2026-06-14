const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Window controls
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  maximizeWindow: () => ipcRenderer.send("window-maximize"),
  closeWindow: () => ipcRenderer.send("window-close"),

  // File dialogs
  selectFiles: () => ipcRenderer.invoke("select-files"),
  selectOutputFolder: () => ipcRenderer.invoke("select-output-folder"),
  openFolder: (path) => ipcRenderer.send("open-folder", path),

  // Conversion
  convertFile: (opts) => ipcRenderer.invoke("convert-file", opts),
  cancelConversion: (jobId) => ipcRenderer.send("cancel-conversion", jobId),
  onProgress: (cb) => {
    ipcRenderer.on("conversion-progress", (_, data) => cb(data));
    return () => ipcRenderer.removeAllListeners("conversion-progress");
  },

  // Utils
  checkFFmpeg: () => ipcRenderer.invoke("check-ffmpeg"),
  getFileInfo: (path) => ipcRenderer.invoke("get-file-info", path),
});
