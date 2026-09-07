const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
  '.apk': 'application/vnd.android.package-archive',
};

const STATIC_ROOT = path.join(__dirname, 'out');
let server = null;
let serverPort = 0;
let mainWindow = null;

function startLocalServer(callback) {
  server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    if (pathname === '/') {
      pathname = '/index.html';
    }

    let filePath = path.join(STATIC_ROOT, pathname);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Try appending .html (Next.js static route style: /dynasty-room -> /dynasty-room.html)
        const htmlPath = filePath + '.html';
        if (fs.existsSync(htmlPath)) {
          filePath = htmlPath;
        } else {
          // If directory, try index.html
          const dirIndexPath = path.join(filePath, 'index.html');
          if (fs.existsSync(dirIndexPath)) {
            filePath = dirIndexPath;
          } else {
            // SPA fallback to index.html
            filePath = path.join(STATIC_ROOT, 'index.html');
          }
        }
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error loading ' + pathname);
          return;
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
        });
        res.end(content);
      });
    });
  });

  server.listen(0, '127.0.0.1', () => {
    serverPort = server.address().port;
    console.log([Blindside Desktop] Local static server active on http://127.0.0.1:);
    callback(serverPort);
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#09090b',
    title: 'Blindside Dynasty — Tactical Dynasty War Room',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    autoHideMenuBar: false,
  });

  const appUrl = http://127.0.0.1:/dynasty-room;
  mainWindow.loadURL(appUrl);

  // Open external links in user default browser
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http:') || targetUrl.startsWith('https:') || targetUrl.startsWith('mailto:')) {
      shell.openExternal(targetUrl);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, navUrl) => {
    const parsed = url.parse(navUrl);
    if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
      event.preventDefault();
      shell.openExternal(navUrl);
    }
  });

  createApplicationMenu(port);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createApplicationMenu(port) {
  const baseUrl = `http://127.0.0.1:${port}`;
  const template = [
    {
      label: 'War Room',
      submenu: [
        {
          label: 'Dynasty Command Center',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow && mainWindow.loadURL(`${baseUrl}/dynasty-room?arena=command&sub=action`),
        },
        {
          label: 'Players Arena',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow && mainWindow.loadURL(`${baseUrl}/dynasty-room?arena=players&sub=analyzer`),
        },
        {
          label: 'Matchups Arena',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow && mainWindow.loadURL(`${baseUrl}/dynasty-room?arena=matchups&sub=slate`),
        },
        {
          label: 'Power Arena',
          accelerator: 'CmdOrCtrl+4',
          click: () => mainWindow && mainWindow.loadURL(`${baseUrl}/dynasty-room?arena=power&sub=tiers`),
        },
        {
          label: 'Trade Hub',
          accelerator: 'CmdOrCtrl+5',
          click: () => mainWindow && mainWindow.loadURL(`${baseUrl}/dynasty-room?arena=trade&sub=architect`),
        },
        {
          label: 'Ask Coach Madden AI',
          accelerator: 'CmdOrCtrl+6',
          click: () => mainWindow && mainWindow.loadURL(`${baseUrl}/ask-madden`),
        },
        { type: 'separator' },
        {
          label: 'Reload War Room',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload(),
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit Blindside Dynasty' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen', label: 'Toggle Fullscreen' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'toggleDevTools', label: 'Toggle Tactical Inspector' },
      ],
    },
    {
      label: 'Help & Community',
      submenu: [
        {
          label: 'Tactical Documentation & Support',
          click: () => shell.openExternal('mailto:bigdillengineering@gmail.com?subject=Blindside%20Dynasty%20Support'),
        },
        {
          label: 'Kind of a Big Dill Website',
          click: () => shell.openExternal('https://kindofabigdill.com'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  startLocalServer((port) => {
    createWindow(port);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(serverPort);
    }
  });
});

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
