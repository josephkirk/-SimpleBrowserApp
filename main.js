const { app, BrowserWindow } = require('electron')

const os = require('os');

const child_process = require('child_process');
const dialog = app.dialog;

const config = require('config');

let app_url
let splash

const platforms = {
  WINDOWS: 'WINDOWS',
  MAC: 'MAC',
  LINUX: 'LINUX',
  SUN: 'SUN',
  OPENBSD: 'OPENBSD',
  ANDROID: 'ANDROID',
  AIX: 'AIX',
};

const platformsNames = {
  win32: platforms.WINDOWS,
  darwin: platforms.MAC,
  linux: platforms.LINUX,
  sunos: platforms.SUN,
  openbsd: platforms.OPENBSD,
  android: platforms.ANDROID,
  aix: platforms.AIX,
};

const currentPlatform = platformsNames[os.platform()];
const findHandlerOrDefault = (handlerName, dictionary) => {
  const handler = dictionary[handlerName];

  if (handler) {
    return handler;
  }

  if (dictionary.default) {
    return dictionary.default;
  }

  return () => null;
};

const byOS = findHandlerOrDefault.bind(null, currentPlatform);

// usage
const getKillCommand = byOS({
  [platforms.MAC]: pname => `pkill -f ${pname}`,
  [platforms.WINDOWS]: pname => `taskkill /IM ${pname} /F`,
  [platforms.LINUX]: pname => `pkill -f ${pname}`,
  default: pname => ``,
});

// This function will output the lines from the script 
// and will return the full combined output
// as well as exit code when it's done (using the callback).
function run_script(command, args, callback) {
    console.log(`run ${command}`);
    var child = child_process.spawn(command, args, {
        encoding: 'utf8',
        shell: true
    });
    // You can also use a variable to save the output for when the script closes later
    child.on('error', (error) => {
        dialog.showMessageBox({
            title: 'Title',
            type: 'warning',
            message: 'Error occured.\r\n' + error
        });
    });

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data) => {
        //Here is the output
        data=data.toString();   
        console.log(data);      
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (data) => {
        // Return some data to the renderer process with the mainprocess-response ID
        mainWindow.webContents.send('mainprocess-response', data);
        //Here is the output from the command
        console.log(data);  
    });

    child.on('close', (code) => {
        //Here you can get the exit code of the script  
        switch (code) {
            case 0:
                dialog.showMessageBox({
                    title: 'Title',
                    type: 'info',
                    message: 'End process.\r\n'
                });
                break;
        }

    });
    if (typeof callback === 'function')
        callback();
}

function createWindow () {
//   const win = new BrowserWindow({
//     width: 800,
//     height: 600,
//     webPreferences: {
//       nodeIntegration: true
//     }
//   })

//   win.loadURL('https://onikuma.shotgunstudio.com')
    run_script(getKillCommand(app.name), [], null);
    mainWindow = new BrowserWindow({
        titleBarStyle: 'hidden',
        width: 1920,
        height: 1080,
        show: false, // don't show the main window
        webPreferences: {
        nodeIntegration: true
        }
    });
    // create a new `splash`-Window 
    splash = new BrowserWindow({width: 810, height: 610, transparent: true, frame: false, alwaysOnTop: true});
    splash.loadFile(`index.html`);
    if (config.has("URL"))
    {
        app_url = config.get('URL');
    }
    console.log(`Loading ${app_url}`)
    mainWindow.loadURL(app_url);

    // if main window is ready to show, then destroy the splash window and show up the main window
    mainWindow.once('ready-to-show', () => {
    splash.destroy();
    mainWindow.show();
    });
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// app.on('ready', () => {
//     // create main browser window
//     mainWindow = new BrowserWindow({
//         titleBarStyle: 'hidden',
//         width: 1920,
//         height: 1080,
//         show: false // don't show the main window
//     });
//     // create a new `splash`-Window 
//     splash = new BrowserWindow({width: 810, height: 610, transparent: true, frame: false, alwaysOnTop: true});
//     splash.loadFile(`index.html`);
//     mainWindow.loadURL(`https://onikuma.shotgunstudio.com`);
  
//     // if main window is ready to show, then destroy the splash window and show up the main window
//     mainWindow.once('ready-to-show', () => {
//       splash.destroy();
//       mainWindow.show();
//     });
//   });