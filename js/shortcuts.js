"use strict";

/**
 * Created by Tomasz Czart on 26.07.2016.
 */

const electron = require('electron');
// Module to control application life.
const {app, globalShortcut} = electron;
//  Module to import shortcuts
const nconf = require('./config');
// Import reference to server methods
const server = require('./server');

module.exports.registerShortcuts = () =>
{
    let buttons = nconf.get('buttons');
    for (let i in buttons) {
        if(buttons[i] == null) continue; // if button null, do not register
        let shortcut = buttons[i].shortcut;
        // If shortcut exist and if is not registered already
        if(shortcut && !globalShortcut.isRegistered(shortcut)) {
            globalShortcut.register(shortcut, () => {// Register shortcut and add action to it (There is no error handling, if there would be any error if will be ignored)
                server.broadcastCode(buttons[i].codedata);
            });
        }
    }
};

// Method to reload all registered shortcuts after changes have been made
module.exports.reloadShortcuts = () => {
    globalShortcut.unregisterAll();// First remove all shortcuts
    module.exports.registerShortcuts();// and register them once again
}

// Method checks if shortcut already exists
module.exports.checkShortcut = (accelerator) => {

    if(!accelerator) return true;//if accelerator is false it cannot be used
    // Check if already exists on list
    let buttons = nconf.get('buttons');
    for (let i in buttons) if(buttons[i] != null && buttons[i].shortcut == accelerator) return false;

    return true;
};

// This method is for registering new shortcuts
// @Return: 0 => accelerator not changed, 1 => accelerator is already in use, 2 => unknown error, 3 => all is ok
module.exports.registerShortcut = (accelerator, buttonId) => {

    // Get button
    let button = nconf.get('buttons')[buttonId];
    // and check if it is the same as current
    if(button.shortcut != accelerator) {
        // Check if button is registered
        if (module.exports.checkShortcut(accelerator)) {
            //check if accelerator is not empty
            if(accelerator) {
                //register accelerator
                let result = globalShortcut.register(accelerator, () => {// Register shortcut
                    server.broadcastCode(button.codedata);// Action after use of this shortcut
                });
                if (!result) return 2;//unknown error
            }
            if (button.shortcut) globalShortcut.unregister(button.shortcut);// Unregister old shortcut if exists
            nconf.get('buttons')[buttonId].shortcut = accelerator;
            nconf.save();//save buttons
            return 3; //all is ok
        } else {
            return 1; //accelerator is already in use
        }
    }else{
        return 0; //accelerator not changed
    }
};

app.on('will-quit', () => {
    // Unregister all shortcuts on app close
    globalShortcut.unregisterAll();
});