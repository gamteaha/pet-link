const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// pet_data.json 경로 (데덴네 파이썬 앱과 동일한 파일을 공유)
function getPetDataPath() {
  // 1. 먼저 실행 파일 옆에 있는 pet_data.json 찾기 (배포판)
  const nearExe = path.join(process.cwd(), 'pet_data.json');
  if (fs.existsSync(nearExe)) return nearExe;
  // 2. 개발 환경: 소스 폴더 옆에 dedenne/pet_data.json
  const devPath = path.join(__dirname, '..', 'dedenne', 'pet_data.json');
  if (fs.existsSync(devPath)) return devPath;
  // 3. 없으면 실행 파일 옆에 새로 만들 경로 반환
  return nearExe;
}

function getDefaultPetData() {
  return {
    level: 1,
    affection: 0,
    current_costume: "default",
    last_pat_date: "",
    inventory: { bread: 0, soap: 0, towel: 0, strawberry: 0 }
  };
}

// Enable hardware acceleration for high-performance WebGL/Three.js rendering
let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Make the window click-through initially
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.maximize();

  // Load the desktop route
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000/desktop');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'out/desktop.html'));
  }

  // Toggle click-through when mouse enters/leaves the pet
  ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
    if (mainWindow) {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
    }
  });

  // Handle loading local .petlink file
  ipcMain.handle('load-petlink-file', async () => {
    try {
      const filePath = path.join(process.cwd(), 'character.petlink');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Failed to load character.petlink:', err);
    }
    return null;
  });

  // ── 인벤토리 / 가방 IPC 핸들러 ──────────────────────────────────────
  ipcMain.handle('load-pet-data', async () => {
    try {
      const filePath = getPetDataPath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load pet_data.json:', err);
    }
    return getDefaultPetData();
  });

  ipcMain.handle('save-pet-data', async (event, data) => {
    try {
      const filePath = getPetDataPath();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');
      return { success: true };
    } catch (err) {
      console.error('Failed to save pet_data.json:', err);
      return { success: false, error: err.message };
    }
  });

  // ── 우클릭 네이티브 컨텍스트 메뉴 ───────────────────────────────────
  ipcMain.on('show-context-menu', (event) => {
    const menu = Menu.buildFromTemplate([
      {
        label: '🎒 내 가방 열기/닫기',
        click: () => {
          if (mainWindow) mainWindow.webContents.send('toggle-bag');
        }
      },
      { type: 'separator' },
      {
        label: '❌ 프로그램 종료',
        click: () => app.quit()
      }
    ]);
    menu.popup({ window: mainWindow });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
