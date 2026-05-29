/*
  ═══════════════════════════════════════════════
  preload.js — Electron Preload / IPC Bridge

  Runs in a sandboxed context with access to
  both Node.js APIs and the DOM.
  Exposes safe APIs to the renderer (HTML pages)
  via window.electronAPI
  ═══════════════════════════════════════════════
*/

const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

contextBridge.exposeInMainWorld('electronAPI', {

  // Window controls (used by custom titlebar dots)
  closeWindow:    () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),

  // File save dialog (for CSV exports)
  saveFile: (content, defaultName) =>
    ipcRenderer.invoke('save-file', { content, defaultName }),

  // Save attendance JSON
  saveAttendance: (data) =>
    ipcRenderer.invoke('save-attendance', data),

  // Native print dialog
  printWindow: () => ipcRenderer.send('print-window'),

  // Desktop notification
  sendNotification: (title, body) =>
    ipcRenderer.send('send-notification', { title, body }),

  // Native info dialog (for student view)
  showInfo: (message) => ipcRenderer.invoke('show-info', message),

  // System info (shown in status bar)
  nodeVersion: process.versions.node,
  platform:    os.platform() + ' ' + os.arch(),
});
