'use strict';

angular.module('debwrite.dictionaries', ['smart-table', 'ui.bootstrap'])

.controller('DictionariesCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.dictionaries = null;
    $scope.dictionariesRDisplayed = [];
    $scope.dictionariesWDisplayed = [];
    $scope.dictionariesMDisplayed = [];
    $scope.dictionariesADisplayed = [];
    $scope.alert = null;

    $scope.loadDictionaries = function() {
        $http({
            method: 'JSONP',
            url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
            params: {action: 'dict_list'},
            responseType: 'json'
        }).
            then(function (response) {
                $scope.dictionaries = response.data;
                console.log($scope.dictionaries);
            }, function (response) {
                $scope.dictionaries = response.data || "Request failed";
            });
    };

    $scope.removeDictionary = function(codeOfDictionary) {
        $http({
            method: 'JSONP',
            url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
            params: {action: 'dict_del', code: codeOfDictionary},
            responseType: 'json'
        }).
            then(function(response) {
                if(response.data.status == 'OK') {
                    $scope.alert = {text: "Dictionary was removed.", type: "success"};
                } else {
                    $scope.alert = {text: response.data.text, type: "danger"};
                }
            }, function(response) {
                $scope.alert = {text: "Failure while removing dictionary.", type: "danger"};
            });
        $scope.loadDictionaries();
    };

    $scope.init = function() {
        $scope.loadDictionaries();
    };



}]);
