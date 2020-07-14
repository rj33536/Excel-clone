const electron = require('electron');
const ejs = require('ejs-electron');
const app = electron.app;

ejs.data({
  "title": "Excel clone",
  "rows" : 100,
  "cols" : 26
})

function createWindow() {
  const win = new electron.BrowserWindow({
    width : 800,
    height : 600,
    show : false,
    webPreferences : {
      nodeIntegration : true
    }
  })
  win.loadFile("index.ejs").then(function () {
    win.removeMenu();
    win.maximize();
    win.show();
    win.openDevTools();
  })
}

app.whenReady().then(createWindow);

app.on("window-all-closed",()=>{
  if(process.platform!=="darwin"){
    app.quit();
  }
})

app.on("activate",()=>{
  if(BrowserWindow.getAllWindows().length===0){
    createWindow();
  }
})
