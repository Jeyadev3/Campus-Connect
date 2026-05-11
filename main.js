/*
  ═══════════════════════════════════════════════
  main.js — Electron Main Process
  Campus Connect Desktop App

  Run with:  npm start
  Dev mode:  npm run dev
  Build:     npm run build
  ═══════════════════════════════════════════════
*/

const { app, BrowserWindow, ipcMain, dialog, Notification, Menu } = require('electron');
const path = require('path');
const fs   = require('fs');

let mainWindow;

// ── CREATE WINDOW ──
function createWindow() {
  mainWindow = new BrowserWindow({
    width:     1280,
    height:    820,
    minWidth:  900,
    minHeight: 600,
    frame:     false,              // Frameless — custom HTML titlebar handles drag/close
    backgroundColor: '#0B1F3A',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    }
  });

  // Load the login page using absolute file:// URL to avoid path issues
  mainWindow.loadURL('file://' + path.join(__dirname, 'index.html'));

  // Open DevTools in dev mode only
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── APP READY ──
app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window on dock click
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // ── MENU BAR ──
  const menu = Menu.buildFromTemplate([
    {
      label: 'Campus Connect',
      submenu: [
        { label: 'Dashboard', click: () => mainWindow.loadURL('file://' + path.join(__dirname, 'dashboard.html')) },
        { label: 'Students',  click: () => mainWindow.loadURL('file://' + path.join(__dirname, 'students.html'))  },
        { label: 'Results',   click: () => mainWindow.loadURL('file://' + path.join(__dirname, 'results.html'))   },
        { type: 'separator' },
        { label: 'Quit', role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut'  }, { role: 'copy' }, { role: 'paste'    }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn'    },
        { role: 'zoomOut'   },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ════════════════════════════════════
//  IPC HANDLERS  (renderer → main)
// ════════════════════════════════════

// 1. Close window
ipcMain.on('close-window', () => { if (mainWindow) mainWindow.close(); });

// 2. Minimize window
ipcMain.on('minimize-window', () => { if (mainWindow) mainWindow.minimize(); });

// 3. Maximize / Restore
ipcMain.on('maximize-window', () => {
  if (!mainWindow) return;
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});

// 4. Save file — native Save Dialog (CSV exports)
ipcMain.handle('save-file', async (event, { content, defaultName }) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'export.csv',
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*']   }
    ]
  });
  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, filePath };
  }
  return { success: false };
});

// 5. Print window
ipcMain.on('print-window', () => {
  if (mainWindow) mainWindow.webContents.print({ silent: false, printBackground: true });
});

// 6. Native desktop notification
ipcMain.on('send-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// 7. Show native info message box
ipcMain.handle('show-info', async (event, message) => {
  await dialog.showMessageBox(mainWindow, {
    type:    'info',
    title:   'Student Details',
    message: message,
    buttons: ['OK']
  });
});

// 8. Save attendance data (referenced in results.html)
ipcMain.handle('save-attendance', async (event, data) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'attendance_data.json',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*']     }
    ]
  });
  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, filePath };
  }
  return { success: false };
});
