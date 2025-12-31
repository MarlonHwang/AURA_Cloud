import { app, BrowserWindow } from 'electron';
import path from 'path';

// Disable security warnings for dev
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        backgroundColor: '#111',
        frame: false, // [FIX] Frameless Mode
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple migration. In prod, use preload.
            webSecurity: false, // Allow local resources
        },
        // Icon
        // icon: path.join(__dirname, '../../assets/icon.ico') 
    });

    // Decide what to load
    // If Dev: Load localhost:5173
    // If Prod: Load file
    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

import { ipcMain } from 'electron';

ipcMain.on('minimize-window', () => {
    mainWindow?.minimize();
});

ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});

ipcMain.on('close-window', () => {
    mainWindow?.close();
});
