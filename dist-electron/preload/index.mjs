import { contextBridge as t, ipcRenderer as E } from "electron";
const o = {
  // media analysis
  ANALYZE_URL: "media:analyze",
  ANALYZE_PLAYLIST: "media:analyzePlaylist",
  // downloads
  DOWNLOAD_START: "download:start",
  DOWNLOAD_CHECK_DUPLICATE: "download:checkDuplicate",
  DOWNLOAD_PAUSE: "download:pause",
  DOWNLOAD_RESUME: "download:resume",
  DOWNLOAD_CANCEL: "download:cancel",
  DOWNLOAD_RETRY: "download:retry",
  DOWNLOAD_REMOVE: "download:remove",
  DOWNLOAD_PROGRESS: "download:progress",
  // main -> renderer push
  DOWNLOAD_LIST: "download:list",
  DOWNLOAD_CLEAR_COMPLETED: "download:clearCompleted",
  // settings
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  // file management
  FILE_OPEN_LOCATION: "file:openLocation",
  FILE_OPEN: "file:open",
  PICK_DIRECTORY: "dialog:pickDirectory",
  PICK_FILE: "dialog:pickFile",
  // system
  DEPS_CHECK: "system:depsCheck",
  STATS_GET: "stats:get",
  CLIPBOARD_URL: "clipboard:url",
  // main -> renderer push
  // updater
  UPDATE_STATUS: "update:status",
  // main -> renderer push
  UPDATE_CHECK: "update:check",
  UPDATE_INSTALL: "update:install",
  // window controls
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_MAXIMIZE: "window:maximize",
  WINDOW_CLOSE: "window:close"
};
async function D(e, ...n) {
  const a = await E.invoke(e, ...n);
  if (!a.ok) throw new Error(a.error ?? "Unknown error");
  return a.data;
}
const _ = {
  /* analysis */
  analyzeUrl: (e) => D(o.ANALYZE_URL, e),
  analyzePlaylist: (e) => D(o.ANALYZE_PLAYLIST, e),
  /* downloads */
  startDownload: (e) => D(o.DOWNLOAD_START, e),
  checkDuplicate: (e) => D(o.DOWNLOAD_CHECK_DUPLICATE, e),
  pauseDownload: (e) => D(o.DOWNLOAD_PAUSE, e),
  resumeDownload: (e) => D(o.DOWNLOAD_RESUME, e),
  cancelDownload: (e) => D(o.DOWNLOAD_CANCEL, e),
  retryDownload: (e) => D(o.DOWNLOAD_RETRY, e),
  removeDownload: (e) => D(o.DOWNLOAD_REMOVE, e),
  listDownloads: () => D(o.DOWNLOAD_LIST),
  clearCompleted: () => D(o.DOWNLOAD_CLEAR_COMPLETED),
  /* settings */
  getSettings: () => D(o.SETTINGS_GET),
  setSettings: (e) => D(o.SETTINGS_SET, e),
  /* file management */
  openLocation: (e) => D(o.FILE_OPEN_LOCATION, e),
  openFile: (e) => D(o.FILE_OPEN, e),
  pickDirectory: () => D(o.PICK_DIRECTORY),
  pickFile: () => D(o.PICK_FILE),
  /* system */
  checkDependencies: () => D(o.DEPS_CHECK),
  getStatistics: () => D(o.STATS_GET),
  /* updater */
  checkForUpdates: () => D(o.UPDATE_CHECK),
  installUpdate: () => D(o.UPDATE_INSTALL),
  /* window controls */
  minimize: () => E.send(o.WINDOW_MINIMIZE),
  maximize: () => E.send(o.WINDOW_MAXIMIZE),
  close: () => E.send(o.WINDOW_CLOSE),
  /* event subscriptions — return an unsubscribe fn */
  onDownloadProgress: (e) => {
    const n = (a, O) => e(O);
    return E.on(o.DOWNLOAD_PROGRESS, n), () => {
      E.off(o.DOWNLOAD_PROGRESS, n);
    };
  },
  onClipboardUrl: (e) => {
    const n = (a, O) => e(O);
    return E.on(o.CLIPBOARD_URL, n), () => {
      E.off(o.CLIPBOARD_URL, n);
    };
  },
  onUpdateStatus: (e) => {
    const n = (a, O) => e(O);
    return E.on(o.UPDATE_STATUS, n), () => {
      E.off(o.UPDATE_STATUS, n);
    };
  }
};
t.exposeInMainWorld("mediavault", _);
