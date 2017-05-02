'use strict';

const {
    app,
    BrowserWindow,
} = require('electron');

app.commandLine.appendSwitch('--disable-renderer-backgrounding');

app.on('ready', () => {

    const wnd = new BrowserWindow({
        width: 800,
        height: 600,
        show: !!process.env.DEBUG,
        webPreferences: {
            nodeIntegration: false,
        },
    });

    wnd.loadURL('about:blank');

});
