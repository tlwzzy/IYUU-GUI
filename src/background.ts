'use strict'

import { app, protocol, BrowserWindow, Tray, Menu } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import * as path from "path";
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null
let tray: Tray | null

// webSecurity is already disabled in BrowserWindow. However, it seems there is
// a bug in Electron 9 https://github.com/electron/electron/issues/23664. There
// is workaround suggested in the issue
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

declare var __static: string;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: path.join(__static, 'assets/iyuu.png'),
    useContentSize: true,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: (process.env
          .ELECTRON_NODE_INTEGRATION as unknown) as boolean,

      // 直接使用这个方式，关闭chrome的CORS保护
      // refs: https://github.com/SimulatedGREG/electron-vue/issues/387
      webSecurity: false as boolean,
    }
  })

  // 关闭顶端菜单栏
  win.setMenu(null)

  // 禁止更改窗口大小
  win.setResizable(false)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  initTray()

  win.on('close', (e: Event) => {
    e.preventDefault()
    win && win.hide();
  })

  win.on('closed', () => {
    win = null
    tray = null
  })
}

function initTray() {
  tray = new Tray(path.join(__static, 'assets/iyuu.png'))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出', click: () => {
        app.quit()
      }
    }
  ])

  tray.on('click', () => {
    win && win.show();
  })

  // Call this again for Linux because we modified the context menu
  tray.setContextMenu(contextMenu)
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  win && win.removeAllListeners('close');
  win && win.close();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
