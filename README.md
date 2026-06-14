<div align="center">

# 🎵 Prime MP4 to MP3

### *Convert as many videos as you want — all at once, in one click*

![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

<br/>

I got tired of online converters that limit your file size, slap watermarks on everything, or just stop working mid-conversion. So I built this — a proper Windows desktop app that converts MP4 files to MP3, locally on your machine, with no restrictions and no nonsense.

Drop your files in, pick a bitrate, and let it run. That's really all there is to it.

<br/>

</div>

---

## ✨ What it does

| Feature | Description |
|---|---|
| 🗂️ **Batch Conversion** | Add as many MP4 files as you want and convert them all in one go |
| 🖱️ **Drag & Drop** | Just drag your files straight onto the window — no file picker needed |
| 🎚️ **Bitrate Control** | Pick from 128k, 192k, 256k, or 320k depending on the quality you need |
| 📁 **Custom Output Folder** | Choose exactly where you want your MP3 files to be saved |
| ⏹️ **Cancel Anytime** | Changed your mind? Stop any conversion with a single click |
| 📊 **Live Progress** | Every file shows its own progress bar so you always know what's happening |
| 🌌 **Aurora UI** | A clean, dark interface with a subtle animated background — because it should feel nice to use |
| 🔇 **No Limits, No Watermarks** | Everything runs locally. No uploads, no accounts, no catches |

---

## 🖼️ What it looks like

```
┌─────────────────────────────────────────────────┐
│  🎵 Prime MP4 → MP3            [─]  [□]  [✕]   │
├─────────────────────────────────────────────────┤
│  [+ Add MP4 Files]  [📁 Output]  Bitrate: 192k  │
│                              [Convert 3 files ▶] │
├─────────────────────────────────────────────────┤
│  🎬 vacation.mp4          23.4 MB   ████░  78%  │
│  🎬 lecture.mp4           11.2 MB   Waiting...  │
│  🎬 song_cover.mp4         4.8 MB   Ready       │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Getting it running

### Before you start

You need two things installed on your machine:

**1. Node.js** — grab it from [nodejs.org](https://nodejs.org/) (v18 or higher)

**2. FFmpeg** — this is the actual engine doing the conversion, so it's not optional

The quickest way to install FFmpeg on Windows is through Winget:

```bash
winget install Gyan.FFmpeg
```

If you'd rather do it manually, download it from [ffmpeg.org/download.html](https://ffmpeg.org/download.html), extract the zip, and add the `bin` folder to your system PATH. Run `ffmpeg -version` in your terminal to confirm it's working.

---

### Installation

```bash
# Clone the repo
git clone https://github.com/Mysterious502/Prime-Mp4-to-Mp3-Converter

# Go into the project folder
cd prime-mp4-to-mp3

# Install dependencies
npm install

# Start the app
npm run dev
```

That's it. The app will open and you're good to go.

---

### Building a standalone Windows installer

If you want to share the app or install it on a machine without Node.js, you can package it into a proper `.exe` installer:

```bash
npm run build
```

You'll find the installer at `dist-app/Prime MP4 to MP3 Setup 1.0.0.exe`. It works like any other Windows installer — just run it and you're done.

---

## 🗂️ Project structure

```
prime-mp4-to-mp3/
│
├── 📁 electron/
│   ├── main.cjs        ← The main Electron process — handles FFmpeg, file dialogs, and window controls
│   └── preload.cjs     ← The secure bridge that lets the UI talk to the system
│
├── 📁 src/
│   ├── App.jsx         ← The entire UI — file list, drag and drop, progress tracking
│   ├── main.jsx        ← React entry point
│   └── index.css       ← Aurora background animations and Tailwind base styles
│
├── index.html          ← The HTML shell that Electron loads
├── vite.config.mjs     ← Vite and Tailwind configuration
├── package.json        ← Dependencies and build scripts
└── README.md           ← You're reading it
```

---

## 🧰 Built with

| Technology | Why |
|---|---|
| **Electron** | Turns the web app into a real Windows desktop application |
| **React 18** | Handles all the UI and state |
| **Vite 5** | Builds the frontend incredibly fast |
| **Tailwind CSS v4** | Makes styling straightforward without writing a ton of CSS |
| **Framer Motion** | Adds the smooth transitions and animations throughout the UI |
| **FFmpeg** | Does the actual heavy lifting — extracts and encodes the audio |
| **clsx + tailwind-merge** | Small utilities that keep the class names clean |

---

## ⚡ Scripts

| Command | What it does |
|---|---|
| `npm install` | Installs all the dependencies |
| `npm run dev` | Starts the app in development mode with live reloading |
| `npm run build` | Packages everything into a Windows `.exe` installer |
| `npm run build:react` | Builds just the React frontend |
| `npm run preview` | Previews the production build in a browser |

---

## 🐛 Something not working?

**The app says FFmpeg isn't found**

Open a terminal and run `ffmpeg -version`. If you get an error, FFmpeg either isn't installed or isn't in your PATH. Installing via Winget usually handles everything automatically:

```bash
winget install Gyan.FFmpeg
```

Restart the app after installing.

**You're seeing an ESM error with `@tailwindcss/vite`**

Make sure the Vite config file is named `vite.config.mjs` (not `.js`) and that both files in the `electron/` folder use the `.cjs` extension. That's what keeps CommonJS and ESM from conflicting with each other.

**The app won't start at all**

Try wiping `node_modules` and doing a clean install:

```bash
rmdir /s /q node_modules
npm install
npm run dev
```

---

## 📄 License

MIT © [Mysterious](https://github.com/Mysterious502)

---

<div align="center">

Built with FFmpeg, Electron, and React

If this saved you some time, a ⭐ would be appreciated 🙏

</div>
