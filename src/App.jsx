import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ── Types / Constants ─────────────────────────────────────────────────────────
const STATUS = {
  IDLE: "idle",
  WAITING: "waiting",
  CONVERTING: "converting",
  DONE: "done",
  ERROR: "error",
  CANCELLED: "cancelled",
};

const BITRATES = ["128k", "192k", "256k", "320k"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateId() {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Music: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  Video: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="2" y="4" width="20" height="16" rx="3"/>
      <path d="m10 9 5 3-5 3V9z" fill="currentColor"/>
    </svg>
  ),
  Folder: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" strokeLinecap="round"/>
    </svg>
  ),
  Add: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
    </svg>
  ),
  Warning: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Minimize: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
      <path d="M5 12h14" strokeLinecap="round"/>
    </svg>
  ),
  Maximize: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
    </svg>
  ),
  OpenFolder: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2" strokeLinecap="round"/>
      <path d="M3 15l3-3 3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ── File Row Component ────────────────────────────────────────────────────────
function FileRow({ job, onRemove, onCancel }) {
  const statusColors = {
    [STATUS.IDLE]: "text-slate-400",
    [STATUS.WAITING]: "text-amber-300",
    [STATUS.CONVERTING]: "text-blue-300",
    [STATUS.DONE]: "text-emerald-400",
    [STATUS.ERROR]: "text-rose-400",
    [STATUS.CANCELLED]: "text-slate-500",
  };

  const statusText = {
    [STATUS.IDLE]: "Ready",
    [STATUS.WAITING]: "Waiting...",
    [STATUS.CONVERTING]: `${job.progress}%`,
    [STATUS.DONE]: "Done ✓",
    [STATUS.ERROR]: "Error",
    [STATUS.CANCELLED]: "Cancelled",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3 transition hover:bg-white/6"
    >
      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300">
        <Icons.Video />
      </div>

      {/* Name + size */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-200">{job.name}</p>
        <p className="text-xs text-slate-500">{formatBytes(job.size)}</p>
      </div>

      {/* Progress bar (converting only) */}
      {job.status === STATUS.CONVERTING && (
        <div className="hidden w-28 sm:block">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
              animate={{ width: `${job.progress}%` }}
              transition={{ ease: "easeOut", duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Status label */}
      <span className={cn("w-20 text-right text-xs font-medium", statusColors[job.status])}>
        {statusText[job.status]}
      </span>

      {/* Error tooltip */}
      {job.status === STATUS.ERROR && job.error && (
        <span className="hidden max-w-[160px] truncate text-xs text-rose-400 sm:block" title={job.error}>
          {job.error}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
        {job.status === STATUS.CONVERTING && (
          <button
            onClick={() => onCancel(job.id)}
            className="rounded-lg p-1.5 text-amber-300 hover:bg-amber-300/10"
            title="Cancel"
          >
            <Icons.X />
          </button>
        )}
        {(job.status === STATUS.IDLE || job.status === STATUS.ERROR || job.status === STATUS.DONE || job.status === STATUS.CANCELLED) && (
          <button
            onClick={() => onRemove(job.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
            title="Remove"
          >
            <Icons.Trash />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs, setJobs] = useState([]);
  const [outputFolder, setOutputFolder] = useState("");
  const [bitrate, setBitrate] = useState("192k");
  const [isRunning, setIsRunning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [ffmpegOk, setFfmpegOk] = useState(null); // null = checking
  const [completedCount, setCompletedCount] = useState(0);
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;

  const api = window.electronAPI;

  // Check FFmpeg on mount
  useEffect(() => {
    api.checkFFmpeg().then((ok) => setFfmpegOk(ok));
  }, []);

  // Progress listener
  useEffect(() => {
    const remove = api.onProgress(({ jobId, progress }) => {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, progress } : j))
      );
    });
    return remove;
  }, []);

  const updateJob = useCallback((id, updates) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
  }, []);

  const addFiles = useCallback(async (filePaths) => {
    const infos = await Promise.all(filePaths.map((p) => api.getFileInfo(p)));
    const newJobs = infos
      .filter(Boolean)
      .filter((info) => !jobsRef.current.some((j) => j.path === info.path))
      .map((info) => ({
        id: generateId(),
        name: info.name,
        size: info.size,
        path: info.path,
        status: STATUS.IDLE,
        progress: 0,
        error: null,
      }));
    setJobs((prev) => [...prev, ...newJobs]);
  }, []);

  const handleSelectFiles = async () => {
    const paths = await api.selectFiles();
    if (paths.length > 0) addFiles(paths);
  };

  const handleSelectFolder = async () => {
    const folder = await api.selectOutputFolder();
    if (folder) setOutputFolder(folder);
  };

  const handleRemoveJob = (id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleCancelJob = (id) => {
    api.cancelConversion(id);
    updateJob(id, { status: STATUS.CANCELLED, progress: 0 });
  };

  const handleClearAll = () => {
    setJobs([]);
    setCompletedCount(0);
  };

  // Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files)
      .filter((f) => f.name.toLowerCase().endsWith(".mp4"))
      .map((f) => f.path);
    if (files.length > 0) addFiles(files);
  };

  // ── Start batch conversion ────────────────────────────────────────────────
  const handleConvertAll = async () => {
    const idleJobs = jobs.filter((j) => j.status === STATUS.IDLE || j.status === STATUS.ERROR);
    if (idleJobs.length === 0) return;

    // Set all to waiting
    setJobs((prev) =>
      prev.map((j) =>
        idleJobs.find((ij) => ij.id === j.id)
          ? { ...j, status: STATUS.WAITING, progress: 0 }
          : j
      )
    );
    setIsRunning(true);
    setCompletedCount(0);

    // Determine output folder
    const out = outputFolder || null;

    // Convert one by one (sequential to avoid overwhelming system)
    for (const job of idleJobs) {
      updateJob(job.id, { status: STATUS.CONVERTING, progress: 0 });

      // Build output path
      const inputDir = job.path.substring(0, Math.max(job.path.lastIndexOf("/"), job.path.lastIndexOf("\\")));
      const outputDir = out || inputDir;
      const outputPath = `${outputDir}\\${job.name}.mp3`.replace(/\//g, "\\");

      try {
        await api.convertFile({
          jobId: job.id,
          inputPath: job.path,
          outputPath,
          bitrate,
        });
        updateJob(job.id, { status: STATUS.DONE, progress: 100 });
        setCompletedCount((c) => c + 1);
      } catch (err) {
        // Check if manually cancelled
        const currentJob = jobsRef.current.find((j) => j.id === job.id);
        if (currentJob?.status !== STATUS.CANCELLED) {
          updateJob(job.id, { status: STATUS.ERROR, error: err.message || "Conversion failed" });
        }
      }
    }

    setIsRunning(false);
  };

  const handleOpenOutputFolder = () => {
    if (outputFolder) api.openFolder(outputFolder);
    else {
      const doneJob = jobs.find((j) => j.status === STATUS.DONE);
      if (doneJob) {
        const dir = doneJob.path.substring(0, Math.max(doneJob.path.lastIndexOf("/"), doneJob.path.lastIndexOf("\\")));
        api.openFolder(dir);
      }
    }
  };

  // Stats
  const idleCount = jobs.filter((j) => j.status === STATUS.IDLE).length;
  const errorCount = jobs.filter((j) => j.status === STATUS.ERROR).length;
  const doneCount = jobs.filter((j) => j.status === STATUS.DONE).length;
  const convertingJob = jobs.find((j) => j.status === STATUS.CONVERTING);
  const canConvert = !isRunning && (idleCount > 0 || errorCount > 0);

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100 select-none"
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragActive(false); }}
      onDrop={handleDrop}
    >
      {/* Aurora bg */}
      <div className="pointer-events-none fixed inset-0 opacity-50">
        <div className="aurora-1 absolute -left-20 top-0 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="aurora-2 absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-purple-600/25 blur-3xl" />
      </div>

      {/* ── Title Bar ──────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex h-10 shrink-0 items-center justify-between border-b border-white/8 bg-slate-950/80 px-4 backdrop-blur"
        style={{ WebkitAppRegion: "drag" }}
      >
        <div className="flex items-center gap-2">
          <div className="text-amber-300">
            <Icons.Music />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">Prime MP4 → MP3</span>
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">Batch</span>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: "no-drag" }}>
          <button
            onClick={() => api.minimizeWindow()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <Icons.Minimize />
          </button>
          <button
            onClick={() => api.maximizeWindow()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <Icons.Maximize />
          </button>
          <button
            onClick={() => api.closeWindow()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-rose-500 hover:text-white transition"
          >
            <Icons.Close />
          </button>
        </div>
      </div>

      {/* ── FFmpeg Warning ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {ffmpegOk === false && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 flex items-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300"
          >
            <Icons.Warning />
            <span>
              <strong>FFmpeg not found.</strong> Install from{" "}
              <span className="underline cursor-pointer" onClick={() => api.openFolder("https://ffmpeg.org/download.html")}>
                ffmpeg.org
              </span>{" "}
              and add to PATH, then restart the app.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2 border-b border-white/8 bg-slate-950/60 px-4 py-2.5 backdrop-blur">
        {/* Add files */}
        <button
          onClick={handleSelectFiles}
          className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/12 hover:border-white/25"
        >
          <Icons.Add /> Add MP4 Files
        </button>

        {/* Output folder */}
        <button
          onClick={handleSelectFolder}
          className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/12 hover:border-white/25"
        >
          <Icons.Folder /> {outputFolder ? "📁 " + outputFolder.split(/[\\/]/).pop() : "Output Folder"}
        </button>

        {/* Bitrate */}
        <div className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/8 px-3 py-1.5">
          <span className="text-xs text-slate-400">Bitrate</span>
          <select
            value={bitrate}
            onChange={(e) => setBitrate(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer"
          >
            {BITRATES.map((b) => (
              <option key={b} value={b} className="bg-slate-800">{b}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {jobs.length > 0 && !isRunning && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:text-rose-400"
            >
              <Icons.Trash /> Clear All
            </button>
          )}

          {doneCount > 0 && (
            <button
              onClick={handleOpenOutputFolder}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
            >
              <Icons.OpenFolder /> Open Folder
            </button>
          )}

          {/* Convert button */}
          <button
            onClick={handleConvertAll}
            disabled={!canConvert || ffmpegOk === false}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition",
              canConvert && ffmpegOk !== false
                ? "bg-gradient-to-r from-blue-500 via-purple-500 to-amber-400 text-white hover:brightness-110"
                : "cursor-not-allowed bg-slate-700 text-slate-400"
            )}
          >
            {isRunning ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Converting {convertingJob ? `(${convertingJob.name})` : "..."}
              </>
            ) : (
              <>Convert {idleCount + errorCount > 0 ? `${idleCount + errorCount} file${idleCount + errorCount > 1 ? "s" : ""}` : "All"}</>
            )}
          </button>
        </div>
      </div>

      {/* ── File List ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-3">
        {/* Drop overlay */}
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm"
            >
              <div className="rounded-2xl border-2 border-dashed border-blue-400 bg-blue-500/10 px-12 py-8 text-center">
                <div className="mb-2 text-4xl">🎬</div>
                <p className="text-lg font-semibold text-blue-300">Drop MP4 files here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {jobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
              🎬
            </div>
            <p className="text-base font-medium text-slate-300">No files added yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Click "Add MP4 Files" or drag & drop videos here
            </p>
            <button
              onClick={handleSelectFiles}
              className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-amber-400 px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition"
            >
              <Icons.Add /> Add MP4 Files
            </button>
          </motion.div>
        )}

        {/* Job list */}
        <AnimatePresence>
          {jobs.length > 0 && (
            <motion.div className="space-y-2">
              {/* Stats bar */}
              <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-xs">
                <span className="text-slate-400">
                  Total: <span className="font-medium text-slate-200">{jobs.length}</span>
                </span>
                {doneCount > 0 && (
                  <span className="text-emerald-400">
                    ✓ Done: <span className="font-medium">{doneCount}</span>
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-rose-400">
                    ✗ Error: <span className="font-medium">{errorCount}</span>
                  </span>
                )}
                {isRunning && (
                  <span className="text-blue-300">
                    ⟳ Converting...
                  </span>
                )}
                {!isRunning && doneCount > 0 && doneCount === jobs.length && (
                  <span className="ml-auto text-emerald-400 font-medium">🎉 All done!</span>
                )}
              </div>

              {/* Individual file rows */}
              <AnimatePresence>
                {jobs.map((job) => (
                  <FileRow
                    key={job.id}
                    job={job}
                    onRemove={handleRemoveJob}
                    onCancel={handleCancelJob}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Status bar ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex shrink-0 items-center justify-between border-t border-white/8 bg-slate-950/80 px-4 py-1.5 backdrop-blur">
        <span className="text-xs text-slate-500">
          {ffmpegOk === true && "✓ FFmpeg ready"}
          {ffmpegOk === false && "⚠ FFmpeg not found"}
          {ffmpegOk === null && "Checking FFmpeg..."}
        </span>
        <span className="text-xs text-slate-600">Prime MP4 to MP3 v1.0</span>
      </div>
    </div>
  );
}
