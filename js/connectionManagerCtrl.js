"use strict";

/**
 * Created by Tomasz Czart on 01.08.2016.
 */

// Connection Manager popup controller
app.controller('connectionManagerCtrl', ($scope, $sce, $mdDialog) => {

    // Module to genetate QRCode
    const qr = require('qr-image');

    // Get server info and connected clients
    server.getConnectedClients(result => {
        $scope.connectedClients = result;
    });

    server.getServerInfo(result => {
        $scope.serverInfo = result;
        generateQrCode(result);
    });

    // Load i18n data
    $scope.i18n = i18n;

    // Run if there are changes on clients list
    let callback = connectedClients => {
        $scope.connectedClients = connectedClients;
        $scope.$apply();// Refresh view
    };

    // Listen for changes on clients list
    server.on('connectedClients', callback);

    let generateQrCode = (info) => {
        let svg_string = qr.imageSync(JSON.stringify(info), {
            type: 'svg',
            size: 3 // Size in px of one QRCode module
        });
        $scope.QRCode = $sce.trustAsHtml(svg_string);
    };

    $scope.changePassword = () => {
        const passwordInput = document.getElementById('password');//get password input field
        let password = passwordInput.value;//get password input value
        if(password){//if password is empty
            server.setPassword(password);//Set password in server
            $scope.serverInfo.password = password;//Assign new password to JSON
            generateQrCode($scope.serverInfo);// Generate new QRCode
            passwordInput.style.borderColor = "#4CAF50";
        }else{
            passwordInput.style.borderColor = "#F44336";
        }
    };

    // Disconnect client from server
    $scope.removeClient = (client) => {
        $scope.connectedClients.splice(client);
        server.removeClient(client);
    };

    // On dialog exit remove all listeners
    $scope.$on('$destroy', () => {
        server.removeAllListeners('connectedClients', callback);
    });

    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    /* Function for opening links in user web browser */
    $scope.openUserDefaultBrowser = openUserDefaultBrowser;

    /* Check if remote is empty */
    $scope.checkRemoteIfNotEmpty = () => {
        return angular.equals(buttons, {});
    }

});