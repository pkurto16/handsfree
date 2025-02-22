const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const robot = require('robotjs');
const bodyParser = require('body-parser');

// Initialize Express server
const server = express();
const port = 3000;
let mouseControlOn = false;

// Configure Express server
server.use(bodyParser.json());
server.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
});

// Express routes
server.post('/move', (req, res) => {
  console.log('Received move request:', req.body);
  const x = req.body.x;
  const y = req.body.y;
  console.log(`Received gaze data - x: ${x}, y: ${y}, mouseControl: ${mouseControlOn}`);
  if (typeof x === 'number' && typeof y === 'number' && mouseControlOn) {
    console.log('Moving mouse to:', x, y);
    robot.moveMouse(x, y);
  } else {
    console.log('Skipping mouse move:', { x, y, mouseControlOn });
  }
  res.sendStatus(200);
});

server.post('/toggleMouseControl', (req, res) => {
  console.log('Received toggle request:', req.body);
  mouseControlOn = req.body.mouseControlOn;
  console.log('Mouse control is now:', mouseControlOn);
  res.sendStatus(200);
});

// Start the server
server.listen(port, '127.0.0.1', () => {
  console.log(`Mouse control server is running on http://localhost:${port}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});

// Add after server setup but before createWindows()
// Handle IPC messages
ipcMain.on('toggleMouseControl', (event, value) => {
  mouseControlOn = value;
  // Forward to background window
  backgroundWindow.webContents.send('toggleMouseControl', value);
});

ipcMain.on('toggleKalmanFilter', (event, value) => {
  // Forward to background window
  backgroundWindow.webContents.send('toggleKalmanFilter', value);
});

let backgroundWindow = null;
let uiWindow = null;

function createWindows() {
  console.log('Creating windows...');

  // Create the background window for tracking
  backgroundWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    },
    skipTaskbar: true,
    show: false  // Change to true temporarily for debugging
  });

  // Create the UI window
  uiWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  console.log('Loading HTML files...');
  // Load different files for background and UI windows
  backgroundWindow.loadFile('background.html');
  uiWindow.loadFile('index.html');
  
  // Add webContents logging
  backgroundWindow.webContents.on('did-finish-load', () => {
    console.log('Background window loaded');
  });

  uiWindow.webContents.on('did-finish-load', () => {
    console.log('UI window loaded');
  });

  // Configure background window
  backgroundWindow.setAlwaysOnTop(true, 'screen-saver');
  backgroundWindow.setVisibleOnAllWorkspaces(true);
  backgroundWindow.setOpacity(0);
  backgroundWindow.setIgnoreMouseEvents(true);

  // Prevent windows from closing when the 'X' button is clicked
  backgroundWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      backgroundWindow.hide();
    }
    return false;
  });

  uiWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      uiWindow.hide();
    }
    return false;
  });
}

// Create windows when app is ready
app.whenReady().then(createWindows);

// Prevent app from closing when all windows are closed
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

// Handle app quit
function quit() {
  app.isQuitting = true;
  app.quit();
}

// Add system tray support
const { Tray, Menu } = require('electron');
let tray = null;

app.whenReady().then(() => {
  const iconPath = path.join(__dirname, 'icon.png');
  try {
    if (!require('fs').existsSync(iconPath)) {
      console.log('Warning: Tray icon not found at:', iconPath);
      return;
    }
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Show UI', 
        click: () => uiWindow.show() 
      },
      { 
        label: 'Hide UI', 
        click: () => uiWindow.hide() 
      },
      { 
        type: 'separator' 
      },
      { 
        label: 'Quit', 
        click: () => quit() 
      }
    ]);
    tray.setToolTip('Eye Gaze Mouse Control');
    tray.setContextMenu(contextMenu);
    console.log('Tray created successfully');
  } catch (error) {
    console.error('Error creating tray:', error);
  }
});

// Add error handling for windows
app.on('ready', () => {
  console.log('Application is ready');
}); 