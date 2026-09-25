const path = require('node:path')
const { app, BrowserWindow, screen, shell } = require('electron')

let mainWindow

function createMainWindow() {
  const workArea = screen.getPrimaryDisplay().workArea
  const width = Math.min(390, workArea.width - 24)
  const height = Math.min(720, workArea.height - 24)

  mainWindow = new BrowserWindow({
    x: workArea.x + 12,
    y: workArea.y + workArea.height - height - 12,
    width,
    height,
    minWidth: Math.min(370, workArea.width - 24),
    minHeight: Math.min(620, workArea.height - 24),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    maximizable: false,
    skipTaskbar: false,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.setAlwaysOnTop(true, 'floating')
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
      query: { desktop: '1' },
    })
  } else {
    mainWindow.loadURL('http://127.0.0.1:5173/?desktop=1')
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createMainWindow)

app.on('window-all-closed', () => {
  app.quit()
})
