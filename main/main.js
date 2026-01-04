/**
 * AURA Cloud Studio - Electron Main Process
 * Project Trinity v1.0
 *
 * React + Python Backend + Electron 통합 실행
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Python 백엔드 프로세스
let pythonProcess = null;
let mainWindow = null;

/**
 * Python 백엔드 서버 시작
 */
function startPythonBackend() {
    const isPackaged = app.isPackaged;

    const pythonPath = isPackaged
        ? path.join(process.resourcesPath, 'backend', 'venv', 'Scripts', 'python.exe')
        : path.join(__dirname, '..', 'backend', 'venv', 'Scripts', 'python.exe');

    const scriptPath = isPackaged
        ? path.join(process.resourcesPath, 'backend', 'process_manager.py')
        : path.join(__dirname, '..', 'src', 'python', 'process_manager.py');

    console.log('[AURA] Starting Python backend...');
    console.log('[AURA] Python path:', pythonPath);
    console.log('[AURA] Script path:', scriptPath);

    pythonProcess = spawn(pythonPath, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python] ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python Error] ${data.toString().trim()}`);
    });

    pythonProcess.on('error', (error) => {
        console.error('[AURA] Failed to start Python backend:', error);
    });

    pythonProcess.on('close', (code) => {
        console.log(`[AURA] Python backend exited with code ${code}`);
        pythonProcess = null;
    });
}

/**
 * Python 백엔드 종료
 */
function stopPythonBackend() {
    if (pythonProcess) {
        console.log('[AURA] Stopping Python backend...');

        // Windows에서는 taskkill 사용
        if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', pythonProcess.pid, '/f', '/t']);
        } else {
            pythonProcess.kill('SIGTERM');
        }

        pythonProcess = null;
    }
}

/**
 * 메인 윈도우 생성
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        minWidth: 1280,
        minHeight: 720,
        title: 'AURA Cloud Studio',
        icon: path.join(__dirname, '..', 'assets', 'icon.png'),
        frame: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: true
        },
        backgroundColor: '#121212',
        show: false
    });

    const isPackaged = app.isPackaged;

    // 개발 모드: Vite 개발 서버 로드
    // 프로덕션: 빌드된 파일 로드
    const startUrl = isPackaged
        ? `file://${path.join(__dirname, '..', 'dist', 'index.html')}`
        : 'http://localhost:5173';

    console.log('[AURA] Loading URL:', startUrl);
    mainWindow.loadURL(startUrl);

    // 윈도우 준비되면 표시
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // 개발 모드에서 DevTools 열기
    if (!isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 앱 준비 완료
app.whenReady().then(() => {
    const isPackaged = app.isPackaged;

    console.log('[AURA] ====================================');
    console.log('[AURA] AURA Cloud Studio Starting...');
    console.log('[AURA] Mode:', isPackaged ? 'Production' : 'Development');
    console.log('[AURA] ====================================');

    // 개발 모드에서는 concurrently가 Python을 시작하므로 건너뜀
    // 프로덕션에서만 Python 백엔드 시작
    if (isPackaged) {
        startPythonBackend();
    }

    // 윈도우 생성
    createWindow();
});

// 모든 윈도우 닫힘
app.on('window-all-closed', () => {
    stopPythonBackend();

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// macOS: 독 아이콘 클릭 시
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// 앱 종료 전
app.on('before-quit', () => {
    stopPythonBackend();
});

// 예기치 않은 종료 처리
process.on('exit', () => {
    stopPythonBackend();
});

process.on('SIGINT', () => {
    stopPythonBackend();
    process.exit();
});

process.on('SIGTERM', () => {
    stopPythonBackend();
    process.exit();
});

// IPC 통신 리스너
const { ipcMain } = require('electron');

ipcMain.on('minimize-window', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
});

ipcMain.on('maximize-window', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.isMaximized() ? win.unmaximize() : win.maximize();
    }
});

ipcMain.on('close-window', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
});
