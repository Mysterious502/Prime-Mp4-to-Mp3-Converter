const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow;
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// ── Find ffmpeg binary ────────────────────────────────────────────────────────
function getFFmpegPath() {
  if (isDev) {
    // In dev mode, try system ffmpeg first, then local
    const possiblePaths = [
      "ffmpeg", // system PATH
      path.join(__dirname, "..", "resources", "ffmpeg.exe"),
      path.join(__dirname, "..", "resources", "ffmpeg"),
    ];
    return possiblePaths[0]; // use system ffmpeg in dev
  }
  // In production (packaged app)
  const resourcesPath = process.resourcesPath;
  const ffmpegExe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  return path.join(resourcesPath, "resources", ffmpegExe);
}

// ── Create Window ─────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, "..", "public", "icon.ico"),
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ── Window Controls ───────────────────────────────────────────────────────────
ipcMain.on("window-minimize", () => mainWindow?.minimize());
ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on("window-close", () => mainWindow?.close());

// ── File Dialog ───────────────────────────────────────────────────────────────
ipcMain.handle("select-files", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select MP4 Files",
    filters: [{ name: "MP4 Videos", extensions: ["mp4"] }],
    properties: ["openFile", "multiSelections"],
  });
  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle("select-output-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Output Folder",
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.on("open-folder", (_, folderPath) => {
  shell.openPath(folderPath);
});

// ── Conversion ────────────────────────────────────────────────────────────────
const activeConversions = new Map(); // jobId -> ffmpeg process

ipcMain.handle("convert-file", async (event, { jobId, inputPath, outputPath, bitrate }) => {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFFmpegPath();
    const args = [
      "-i", inputPath,
      "-vn",
      "-ar", "44100",
      "-ac", "2",
      "-b:a", bitrate || "192k",
      "-y",
      outputPath,
    ];

    let duration = 0;
    let stderr = "";

    const proc = spawn(ffmpegPath, args);
    activeConversions.set(jobId, proc);

    proc.stderr.on("data", (data) => {
      const chunk = data.toString();
      stderr += chunk;

      // Parse duration
      if (!duration) {
        const durationMatch = chunk.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
        if (durationMatch) {
          const [, h, m, s] = durationMatch;
          duration = parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
        }
      }

      // Parse progress
      const timeMatch = chunk.match(/time=(\d+):(\d+):(\d+\.?\d*)/);
      if (timeMatch && duration > 0) {
        const [, h, m, s] = timeMatch;
        const currentTime = parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
        const progress = Math.min(99, Math.round((currentTime / duration) * 100));
        event.sender.send("conversion-progress", { jobId, progress });
      }
    });

    proc.on("close", (code) => {
      activeConversions.delete(jobId);
      if (code === 0) {
        event.sender.send("conversion-progress", { jobId, progress: 100 });
        resolve({ success: true, outputPath });
      } else {
        // Check if FFmpeg not found
        if (stderr.includes("ENOENT") || code === null) {
          reject(new Error("FFmpeg not found. Please install FFmpeg and add it to PATH."));
        } else {
          reject(new Error(`Conversion failed (exit code ${code})`));
        }
      }
    });

    proc.on("error", (err) => {
      activeConversions.delete(jobId);
      if (err.code === "ENOENT") {
        reject(new Error("FFmpeg not found. Please install FFmpeg from https://ffmpeg.org/download.html and add to PATH."));
      } else {
        reject(new Error(err.message));
      }
    });
  });
});

ipcMain.on("cancel-conversion", (_, jobId) => {
  const proc = activeConversions.get(jobId);
  if (proc) {
    proc.kill("SIGKILL");
    activeConversions.delete(jobId);
  }
});

ipcMain.handle("check-ffmpeg", async () => {
  return new Promise((resolve) => {
    const ffmpegPath = getFFmpegPath();
    const proc = spawn(ffmpegPath, ["-version"]);
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
    setTimeout(() => { proc.kill(); resolve(false); }, 3000);
  });
});

ipcMain.handle("get-file-info", async (_, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    const name = path.basename(filePath, path.extname(filePath));
    return { name, size: stats.size, path: filePath };
  } catch {
    return null;
  }
});
