import { app, BrowserWindow, session, systemPreferences } from 'electron';
import path from 'path';

// Disable security warnings for dev
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
    mainWindow = new BrowserWindow({
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
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
            return callback(true);
        }
        callback(false);
    });
    // [CTO Fix] 권한 체크 핸들러 추가
    session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
        if (permission === 'media') {
            return true;
        }
        return false;
    });

    // Check MacOS Permissions (Optional but safe)
    if (process.platform === 'darwin') {
        systemPreferences.askForMediaAccess('microphone').then((accessGranted) => {
            console.log('MacOS Mic Access:', accessGranted);
        });
    }

    // Decide what to load
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

const additionalData = { myKey: 'myValue' }
const gotTheLock = app.requestSingleInstanceLock(additionalData)

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })

    // Create myWindow, load the rest of the app, etc...
    app.whenReady().then(createWindow)

    app.on('activate', () => {
        if (mainWindow === null) {
            createWindow();
        }
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
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
