"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
// Disable security warnings for dev
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
let mainWindow = null;
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
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
    const isDev = !electron_1.app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../renderer/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
const electron_2 = require("electron");
electron_2.ipcMain.on('minimize-window', () => {
    mainWindow?.minimize();
});
electron_2.ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    }
    else {
        mainWindow?.maximize();
    }
});
electron_2.ipcMain.on('close-window', () => {
    mainWindow?.close();
});
