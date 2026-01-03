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
        frame: false, // Frameless Mode
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple migration. In prod, use preload.
            webSecurity: false, // Allow local resources
        },
    });
    // Permission Handling for Microphone
    // Automatically approve media access (since this is a trusted app)
    // [CTO Fix] 마이크 권한 요청오면 무조건 "YES" 하기
    electron_1.session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
            return callback(true);
        }
        callback(false);
    });
    // [CTO Fix] 권한 체크 핸들러 추가
    electron_1.session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
        if (permission === 'media') {
            return true;
        }
        return false;
    });
    // Check MacOS Permissions (Optional but safe)
    if (process.platform === 'darwin') {
        electron_1.systemPreferences.askForMediaAccess('microphone').then((accessGranted) => {
            console.log('MacOS Mic Access:', accessGranted);
        });
    }
    // Decide what to load
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
const additionalData = { myKey: 'myValue' };
const gotTheLock = electron_1.app.requestSingleInstanceLock(additionalData);
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    });
    // Create myWindow, load the rest of the app, etc...
    electron_1.app.whenReady().then(createWindow);
    electron_1.app.on('activate', () => {
        if (mainWindow === null) {
            createWindow();
        }
    });
}
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
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
