'use strict';

angular.module('debwrite.dictionary', ['smart-table', 'ui.bootstrap'])

.controller('DictionaryCtrl', ['$scope', '$http', '$routeParams', function($scope, $http, $routeParams) {
    $scope.alert = null;
    $scope.dictionary = null;
    $scope.entries = [];
    $scope.entriesDisplayed = [];


    $scope.removeEntry = function(id) {
        $http({
            method: 'JSONP',
            url: 'https://abulafia.fi.muni.cz:9050/'+ $routeParams.code + '?callback=JSON_CALLBACK',
            params: {
                action: 'delete',
                entry_id: id
            },
            responseType: 'json'
        }).
            then(function (response) {
                if (response.data.status == 'OK') {
                    $scope.loadEntries();
                    $scope.alert = {text: "Entry was removed.", type: "success"};
                } else {
                    $scope.alert = {text: response.data.text, type: "danger"};
                }
            }, function (response) {
                $scope.alert = {text: "Failure while remove entry.", type: "danger"};
            });
    };

    $scope.loadEntries = function() {
        $http({
            method: 'JSONP',
            url: 'https://abulafia.fi.muni.cz:9050/' + $routeParams.code + '?callback=JSON_CALLBACK',
            params: {action: 'list'},
            responseType: 'json'
        }).
            then(function (response) {
                if (response.data.status == 'OK') {
                    $scope.entries = response.data.entries;
                } else {

                }
            }, function (response) {
            });
    };

    $scope.init = function() {
        $scope.alert = null;
        //load dict info
        $http({
            method: 'JSONP',
            url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
            params: {action: 'dict_info', code: $routeParams.code},
            responseType: 'json'
        }).
            then(function (response) {
                if (response.data.status == 'OK') {
                    $scope.dictionary = response.data;
                    console.log($scope.dictionary);
                } else {

                }
            }, function (response) {
            });

        //load entries of dict
        $scope.loadEntries();
    };

}]);
