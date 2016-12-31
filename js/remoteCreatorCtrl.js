"use strict";

const low = require('lowdb');

/**
 * Created by Tomasz Czart on 29.10.2016.
 */

app.controller('remoteCreatorCtrl', ($scope, $mdDialog, $http, $mdToast, mapping) =>{

    $scope.i18n = i18n;// import i18n
    $scope.remoteNumber = 0;
    $scope.noInternetConnection = false;
    $scope.remotesLoading = false;
    $scope.searchResults = [];
    $scope.selectedButtons = [];
    $scope.availableSpace = coutnAvailableSpace();// get space left in remote
    let db = {};

    let toastIsDisplayed = false;//if true do not show toast

    $scope.querySearch = querySearch;
    $scope.selectedDevicetypeChange = selectedDevicetypeChange;
    $scope.selectedVendorChange = selectedVendorChange;
    $scope.getNextRemote = getNextRemote;
    $scope.getPreviousRemote = getPreviousRemote;
    $scope.loadRemoteFromArray = loadRemoteFromArray;
    $scope.broadcastCode = broadcastCode;
    $scope.removeFromSelected = removeFromSelected;
    $scope.openUserDefaultBrowser = openUserDefaultBrowser;
    $scope.addButtonToSelected = addButtonToSelected;
    $scope.isSelected = isSelected;
    $scope.selectAllButtons = selectAllButtons;
    $scope.openSelectedButtonsContainer = openSelectedButtonsContainer;
    $scope.areAllSelected = areAllSelected;

    loadAll();

    function coutnAvailableSpace() {
        let space = remoteSize.X * remoteSize.Y;//whole remote space
        /* subtract all occupied space */
        for(let i in mapping){
            for(let j in mapping[i]) {
                if (mapping[i][j]) {
                    space--;
                }
            }
        }
        return space;
    }

    /* Function to remove button from selected. As a argument gets button id IN selectedButtons ARRAY  */
    function removeFromSelected(id) {
        $scope.selectedButtons.splice(id, 1);
    }

    /* Function adds button to selected array */
    function addButtonToSelected(remote, button) {

        let id = remote._id + button.codetype;

            if(!buttons[id]){

                if(isSelected(id)){// if is selected, unselect

                    for(let buttonId in $scope.selectedButtons){
                        if($scope.selectedButtons[buttonId]._id == id){
                            removeFromSelected(buttonId);
                            break;
                        }
                    }
                }else {
                    if (($scope.availableSpace - $scope.selectedButtons.length) > 0) {
                            let temp = {
                                "_id": id,
                                "codetype": button.codetype,
                                "model": remote.model,
                                "info": remote.vendor + ' ' + i18n.__('devicetype-' + remote.devicetype),
                                "shortcut": null,
                                "codedata": button.codedata
                            };
                            $scope.selectedButtons.unshift(temp);
                    } else {
                        /* Show notification if there is no space left */
                        showToast(i18n.__('RemoteIsFull'));
                    }
                }
            }else{
                /* Show notification if button is in remote already */
                showToast(i18n.__('AlreadyAdded'));
            }
    }

    /* Show only one instance of the toast */
    function showToast(msg){
        if (!toastIsDisplayed) {
            toastIsDisplayed = true;//do not show next one till this is displaying
            $mdToast.show(
                $mdToast.simple()
                    .textContent(msg)
                    .position('left bottom')
                    .hideDelay(2000)
            ).then(() => {
                toastIsDisplayed = false;// enable toast again
            });
        }
    }

    /* Check if button is on selected list */
    function isSelected(id) {
        for(let buttonId in $scope.selectedButtons){
            if($scope.selectedButtons[buttonId]._id == id) return true;
        }
        return false;
    }

    /* Select all buttons in selected remote, if already selected, deselect them */
    function selectAllButtons(remote) {
        /* if is not selected and all are not selected, select all else deselect all */
        if(!areAllSelected(remote)){
            /* Select all */
            for (let codeId in remote.codes) {
                if (!isSelected(remote._id + remote.codes[codeId].codetype)) {
                    addButtonToSelected(remote, remote.codes[codeId]);
                }
            }
        }else{
            /* Deselect all */
            for (let codeId in remote.codes) {
                addButtonToSelected(remote, remote.codes[codeId]);
            }
        }
    }

    function areAllSelected(remote) {
        for(let codeId in remote.codes) {
            if (!isSelected(remote._id + remote.codes[codeId].codetype)) return false;
        }
        return true;
    }

    /* Open selected buttons container */
    function openSelectedButtonsContainer() {
        if($scope.selectedButtons.length) $scope.isAllButtonsContainerOpen = !$scope.isAllButtonsContainerOpen;
    }

    function querySearch (query) {
        return  query ? $scope.vendors.filter(createFilterFor(query)) : $scope.vendors;
    }

    function selectedVendorChange(vendor) {
        $scope.selectedVendor = vendor;
        $scope.remoteNumber = 0;// Always show first remote after devicetype or vendor change
        getRemotes();
    }

    function selectedDevicetypeChange(devicetype) {
        $scope.selectedDevicetype = devicetype;
        $scope.remoteNumber = 0;// Always show first remote after devicetype or vendor change
        getRemotes();
    }

    /* When user select a new vendor or devicetype */
    function getRemotes() {
        $scope.searchResults = db.get('remotes').filter({vendor: $scope.selectedVendor, devicetype: $scope.selectedDevicetype}).value();
    }

    function loadRemoteFromArray(id){
        return $scope.searchResults[id];
    }

    function getNextRemote(){
        if($scope.remoteNumber < $scope.searchResults.length){
            $scope.next = true;
            $scope.remoteNumber++;
        }
    }

    function getPreviousRemote(){
        if($scope.remoteNumber >= 0){
            $scope.next = false;
            $scope.remoteNumber--;
        }
    }

    /* Load all vendors and devicetypes */
    function loadAll() {
        db = low(__dirname + '/db/db.json');
        $scope.vendors = db.get('vendors').value();
        $scope.devicetypes = db.get('devicetypes').value();
    }

    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
        let lowercaseQuery = query.toLowerCase();

        return function filterFn(vendor) {
            return (vendor.toLowerCase().indexOf(lowercaseQuery) === 0);
        };
    }

    /* Save chosen buttons */
    $scope.save = () => {
        $mdDialog.hide($scope.selectedButtons);// close dialog and parse argument to callback function
    };

    $scope.cancel = () => {
        $mdDialog.cancel();// Exit dialog
    };

});