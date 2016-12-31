"use strict";

/**
 * Created by Tomasz Czart on 15.08.2016.
 */

app.controller('shortcutCreatorCtrl', ($scope, $mdDialog, $mdToast, $timeout, $window, accelerator, buttonId, callback) =>{

    const shortcuts = mainProcess.shortcuts;

    $scope.listeningForShortcut = false;//when listening for shortcut
    $scope.i18n = i18n;// import i18n

    $scope.startListeningForShortcut = startListeningForShortcut;
    $scope.stopListeningForShortcut = stopListeningForShortcut;
    $scope.pressedKeys = pressedKeys;
    $scope.saveShortcut = saveShortcut;

    if(accelerator){
        $scope.accelerator = accelerator.split('+');//get accelerator as array
    }else{
        $scope.accelerator = "";
        // If there is no accelerator start listening after 500ms
        $timeout(function() {
            var element = $window.document.getElementById('listenForShortcutButton');
            if(element)
                element.focus();
        }, 500);
    }

    /* removing shortcut (setting as false) */
    $scope.removeShortcut = () => {
        accelerator = "";
        $scope.accelerator = "";
    }

    // on button ficus start listening
    function startListeningForShortcut(){
        $scope.status = null;
        $scope.listeningForShortcut = true;
    };

    // On button blur stop listening
    function stopListeningForShortcut(){
        $scope.status = null;
        $scope.listeningForShortcut = false;
    };

    function pressedKeys(event){
        const acceleratorGenerator = require('./js/acceleratorGenerator');
        // Get accelerator after fist key clicked (location == 0)
        if(event.location == 0) {
            let result = acceleratorGenerator.getAccelerator(event);
            // If accelerator is correct (no error handling visible for user)
            if(result){
                //If accelerator already registered
                if(shortcuts.checkShortcut(result)) {
                    accelerator = result;//accelerator as string
                    $scope.accelerator = result.split('+');//accelerator as array
                    angular.element(document.querySelector('#listenForShortcutButton')).blur();
                }else{
                    $scope.status = i18n.__('ShortcutInUse');
                }
            }
        }
    };

    /* Save chosen shortcut*/
    function saveShortcut(){
        let result = shortcuts.registerShortcut(accelerator, buttonId);

        if(result == 0) $mdDialog.cancel();
        if(result == 1) $scope.status = i18n.__('ShortcutInUse');
        if(result == 2) $scope.status = i18n.__('UnknowError');
        if(result == 3){
            callback(accelerator);// Execute callback (to change accelerator in view)
            $mdDialog.hide(accelerator);// close dialog and parse argument to callback function
        }
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
});