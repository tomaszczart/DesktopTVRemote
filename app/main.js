"use strict";

/**
 * Created by Tomasz Czart on 12.07.2016.
 */

const electron = require('electron');
// Module to control application life and module to create native browser window.
const {app, Menu, Tray, shell, BrowserWindow} = electron;
//  Module to setup config and import it
const nconf = require('./js/config');
//  Module to communicate with clients
const server = require('./js/server');
//  Module to register shortcuts
const shortcuts = require('./js/shortcuts');
//  Module to support different languages
const i18n = require("i18n");
// Module to load paths
const path = require('path');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win = null;

//  Tray button-icon object reference
let trayIcon = null;

function createWindow() {
    //If window already exists, focus it
    if(!win) {
        // Create the browser window.
        win = new BrowserWindow({width: 1024, height: 596, backgroundColor: '#693d84'});

        // and load the app.html
        win.loadURL(`file://${__dirname}/app.html`);
        // hide menubar
        win.setMenuBarVisibility(false);
        // min window size
        win.setMinimumSize(670,425);

        // Open the DevTools.
       // win.webContents.openDevTools();

        // Emitted when the window is closed.
        win.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            win = null;
        });
    }else{
        win.focus();
       }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {

    let shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
        // Someone tried to run a second instance, we should focus our window.
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });

    if (shouldQuit) {
        app.quit();
        return;
    }

    //  Set up i18n (all languages files stored in 'locales' folder, its accessible globally)
    i18n.configure({
        directory: __dirname + '/locales'
    });

    // Get system locale and set as i18n locale
    i18n.setLocale(app.getLocale());

    //  Loading app tray button-icon (appears in notification area on Windows)
    trayIcon = new Tray(path.join(__dirname, '/img/app-icons/trayIcon.png'));

    //  Set text showed when button-icon is hovered
    trayIcon.setToolTip(i18n.__('AppName'));

    //  Set up tray menu (you need to right-click on tray button-icon to open this menu)
    const contextMenu = Menu.buildFromTemplate([{
        label: i18n.__('Quit') + ' ' + i18n.__('AppName'),
        click() {
            app.quit();
        }
    }]);

    //  and link up it with tray button-icon
    trayIcon.setContextMenu(contextMenu);

    //  Clicking on tray button-icon causing open/unminimize/focus actions */
    trayIcon.on('click', () => {

        createWindow();

    });

    server.startServer();
    shortcuts.registerShortcuts();

    //  Open window on app start
    createWindow();

});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    //Do nothing
});

// before app is closed
app.on('quit', () => {
    server.stopServer();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock button-icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// On uncaught exception log into console
process.on('uncaughtException', (err) => {
    app.quit();
});

// Exports milti languages support to render process
module.exports.i18n = i18n;
// Exports config to render process
module.exports.nconf = nconf;
// Exports reference to server exports to render window
module.exports.server = server;
// Exports shortcut manager to render process
module.exports.shortcuts = shortcuts;
// Exports shell
module.exports.shell = shell;