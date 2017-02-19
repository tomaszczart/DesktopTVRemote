"use strict";

/**
 * Created by Tomasz Czart on 29.07.2016.
 */
// Main process
const mainProcess = require('electron').remote.require('./main');
// Import server exports
const server = mainProcess.server;
// Module to support different languages
const i18n = mainProcess.i18n;
// Get config and remote
const nconf = mainProcess.nconf;
// Get shell
const shell = mainProcess.shell;

let buttons = JSON.parse(JSON.stringify(nconf.get("buttons")));// removing getters and setters from object
let models = JSON.parse(JSON.stringify(nconf.get("models")));
let mapping = JSON.parse(JSON.stringify(nconf.get("mapping")));
/* NUMBER OF BUTTONS IN REMOTE */
let remoteSize = {'X': mapping[0].length, 'Y': mapping.length};

/* Function for opening links in user web browser */
function openUserDefaultBrowser(url) {
    shell.openExternal(url);
}

// Setting up Angular JS
const app = angular.module('DTVRApp', ['ngMaterial', 'ngDraggable']).config(($mdThemingProvider) => {
    $mdThemingProvider.theme('default').primaryPalette('blue').accentPalette('purple', {'default': '800'});
});

// Main controller of the app
app.controller('appCtrl', ($scope, $mdDialog) => {

    $scope.mapping = mapping;
    $scope.editing = false;
    $scope.i18n = i18n;

    $scope.openConnectionManager = function (ev) {
        $mdDialog.show({
            controller: 'connectionManagerCtrl',
            templateUrl: './html/connectionManager.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
        });
    };

    $scope.openRemoteCreator = function (ev) {
        $mdDialog.show({
            controller: 'remoteCreatorCtrl',
            templateUrl: './html/remoteCreator.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            fullscreen: true,
            clickOutsideToClose: false,
            resolve: {
                mapping: function(){
                    return $scope.mapping;
                }
            }
        }).then((selectedButtons) => {
            for(let id in selectedButtons){
                let button = selectedButtons[id];

                let row, index;

                /* Add model to model list */
                if(Object.keys(models).indexOf(button.model) == -1) {
                    let j;
                    for(let i=1; i <= Object.keys(models).length+1; i++) {
                        j = 0;
                        for (let m in models) {
                            if(models[m].length == i) break;//if exist break and look for other ont
                            j++;
                        }
                        // if model number is not used, add it to new model
                        if(j == Object.keys(models).length){
                            /**
                             * Remote button element uses ng-repeat to draw 'dots', ng-repeat
                             * requires array so we need to create one and fill with anything
                             * */
                            let temp = new Array(i);//make array
                            temp.fill(null);//fill it with nulls
                            models[button.model] = temp;
                            break;//end searching
                        }
                    }
                }

                /* get first null position */
                for(let rownum in $scope.mapping){
                    row = rownum;//get row number
                    index =  $scope.mapping[row].indexOf(null);//get null index
                    if(index != -1) break;//if null is in row, exit loop
                }

                $scope.mapping[row][index] = button._id;

                buttons[button._id] = {
                    "codetype": button.codetype,
                    "model": button.model,
                    "info": button.info,
                    "shortcut": null,
                    "codedata": button.codedata
                };
            }
            nconf.set('buttons', buttons);//set buttons in nconf
            nconf.set('mapping', $scope.mapping);
            nconf.set('models', models);
            nconf.save();//save to file
        });
    };

    $scope.openAboutDialog = function (ev) {
            $mdDialog.show({
                templateUrl: './html/about.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                controller: function (scope, $mdDialog) {
                            scope.i18n = i18n;
                            scope.openUserDefaultBrowser = openUserDefaultBrowser;
                            scope.cancel = () => {
                                $mdDialog.cancel();// Exit dialog
                            };
                        }
            });
        };

    $scope.openShortcutCreator = function(buttonId, ev, callback) {
        if($scope.editing) {
            $mdDialog.show({
                controller: 'shortcutCreatorCtrl',
                templateUrl: './html/shortcutCreator.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                resolve: {//parse button to shortcut creator
                    accelerator: () => {
                        return buttons[buttonId].shortcut;
                    },
                    buttonId: () => {
                        return buttonId;
                    },
                    callback: () =>{
                        return callback;
                    }
                }
            }).then(function (newAccelerator) {
                    buttons[buttonId].shortcut = newAccelerator;//set accelerator for view
                    nconf.set('buttons', buttons);//set buttons in nconf
                    nconf.save();//save to file
                });
        }
    };

    /* On drop complete, arguments: row is a rowIndex index and index is button index in row */
    $scope.onDropComplete = function(data, evt, destRow, destIndex){

        let startRow, startIndex;

        /* get button position */
        for(let row in $scope.mapping){
            startRow = row;//get row number
            startIndex =  $scope.mapping[row].indexOf(data);//get button index
            if(startIndex != -1) break;//if button is in row, exit loop
        }
        let temp = $scope.mapping[destRow][destIndex];

        // Replace buttons id in mapping
        if (data != null) {
            $scope.mapping[destRow][destIndex] = data;
            $scope.mapping[startRow][startIndex] = temp;
            nconf.set('mapping', $scope.mapping);//set mapping in nconf
            nconf.save();//save to file
        }
    };

    $scope.onDropCompleteRemove = function(data, evt){
        let startRow, startIndex;
        /* get button position */
        for(let row in $scope.mapping){
            startRow = row;//get row number
            startIndex =  $scope.mapping[row].indexOf(data);//get button index
            if(startIndex != -1) break;//if button is in row, exit loop
        }
        let thisButton = buttons[data];//button to remove

        $scope.mapping[startRow][startIndex] = null;// remove button id from mapping array
        delete buttons[data];// remove button object from remote object

        if(!modelExists(thisButton.model)){
            delete models[thisButton.model];// remove model object from remote object
        }

        nconf.set('buttons', buttons);//set buttons in nconf
        mainProcess.shortcuts.reloadShortcuts();//Unregister deleted shortcut
        nconf.set('models', models);//set buttons in nconf
        nconf.set('mapping', $scope.mapping);//set buttons in nconf
        nconf.save();//save to file
    };

    /* Check if any button with given model exist */
    function modelExists(model) {
        for(let i in buttons){
            if(buttons[i].model == model) return true;
        }
        return false;
    }

    /* Function for opening links in user web browser */
    $scope.openUserDefaultBrowser = openUserDefaultBrowser;

    /* Check if remote is empty */
    $scope.checkRemoteIfNotEmpty = () => {
        return angular.equals(buttons, {});
    }
});

// Send codedata to mobile app
let broadcastCode = codedata => {
    server.broadcastCode(codedata);
};

app.directive('remoteButton', function($timeout) {
    return {
        scope: {
            buttonId: '=buttonId',//link button-id variable from parent scope
            editing: '=editing',
            openShortcutCreator: '&openShortcutCreator'
        },
        restrict: 'E',//treat as element
        templateUrl: './html/button.tmpl.html',
        link: function(scope, elem, attr) {
             let button;
            // Callback function to change shortcut in this scope
            scope.changeShortcut = newAccelerator =>{
                scope.accelerator = newAccelerator;
            };

            // fire when ID argument is changed
            scope.$watch("buttonId",function() {
                button = buttons[scope.buttonId];//get button by id from argument
                scope.accelerator = null;
                button.shortcut ? scope.addShortcut = false : scope.addShortcut = true;
                scope.codetype = button.codetype;
                scope.typeLabel = i18n.__(button.codetype);
                scope.addShortcutLabel = i18n.__('AddShortcut');
                scope.info = button.info;
                scope.dots = models[button.model];
                elem.bind('click', () => { if(!scope.editing) broadcastCode(button.codedata)});
                $timeout(function(){
                    scope.accelerator = button.shortcut;// shortcut is the same thing as accelerator
                }, 350);
            });
        }
    };
});

app.directive('buttonBox', ['$window', function ($window) {
    return {
        restrict: 'E',
        link: function (scope, element, attrs) {
            setButtonBoxSize();// Invoke on load
            /* Monitor window size change */
            angular.element($window).bind('resize', function(){
                setButtonBoxSize();
                // manuall $digest required as resize event
                // is outside of angular
                scope.$digest();
            });
            /* Function to set width, height and font size according to aspect ratio and size od a screen */
            function  setButtonBoxSize() {
                /* Calculate remote-box size (8px padding and height of nav 48px) */
                scope.remoteWidth = $window.innerWidth - 8;
                scope.remoteHeight = $window.innerHeight - 56;
                /* 'a' calculated according to width */
                let aW = scope.remoteWidth / remoteSize.X - 8;
                /* 'a' calculated according to height */
                let aH = scope.remoteHeight / remoteSize.Y - 8;
                /* Set button-box size (and font-size) according to view aspect ratio (IMPORTANT: + 8px margin */
                if (remoteSize.Y * (aW + 8) >= scope.remoteHeight) {
                    element.css({'height': aH + 'px', 'width': aH + 'px', 'font-size': aH + 'px'});
                } else {
                    element.css({'height': aW + 'px', 'width': aW + 'px', 'font-size': aW + 'px'});
                }
            }
        }
    }
}]);