'use strict';

angular.module('debwrite.dictionaries', ['smart-table', 'ui.bootstrap'])

.controller('DictionariesCtrl', ['$scope', '$rootScope', '$http', '$mdDialog', '$routeParams', function($scope, $rootScope, $http, $mdDialog, $routeParams) {
    $scope.dictionaries = null;
    $scope.dictionariesRDisplayed = [];
    $scope.dictionariesWDisplayed = [];
    $scope.dictionariesMDisplayed = [];
    $scope.dictionariesADisplayed = [];

    $scope.loadDictionaries = function() {
        $http({
            method: 'JSONP',
            url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
            params: {action: 'dict_list'},
            responseType: 'json'
        }).
            then(function (response) {
                $scope.dictionaries = response.data;
                $rootScope.loading = false;
            }, function (response) {
                $scope.dictionaries = response.data || "Request failed";
                $rootScope.loading = false;
            });
    };

    $scope.removeDictionary = function($event, codeOfDictionary) {
        var confirm = $mdDialog.confirm()
            .title('Realy remove?')
            .textContent('Are you sure, that you realy want remove dictionary?')
            .ariaLabel('Confirm removing')
            .targetEvent($event)
            .ok('Remove')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            $rootScope.loading = true;
            $http({
                method: 'JSONP',
                url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                params: {action: 'dict_del', code: codeOfDictionary},
                responseType: 'json'
            })
                .then(function(response) {
                    if(response.data.status == 'OK') {
                        $rootScope.alert = {text: "Dictionary was removed.", type: "success"};
                        $scope.loadDictionaries();
                    } else {
                        $rootScope.alert = {text: response.data.text, type: "danger"};
                    }
                    $rootScope.loading = false;
                }, function(response) {
                    $rootScope.loading = false;
                    $rootScope.alert = {text: "Failure while removing dictionary.", type: "danger"};
                });
        }, function() {
            //canceled
        });
    };

    $scope.init = function() {
        $rootScope.loading = true;
        $rootScope.dictDetail = $routeParams.code;
        $scope.loadDictionaries();
    };



}]);
