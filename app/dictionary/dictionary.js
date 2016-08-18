'use strict';

angular.module('debwrite.dictionary', ['smart-table', 'ui.bootstrap'])

.controller('DictionaryCtrl', ['$scope', '$http', '$routeParams', '$rootScope', '$mdDialog', function($scope, $http, $routeParams, $rootScope, $mdDialog) {
    $scope.dictionary = null;
    $scope.entries = [];
    $scope.entriesId = '';
    $scope.entriesDisplayed = [];


    $scope.removeEntry = function($event, id) {
        var confirm = $mdDialog.confirm()
            .title('Realy remove?')
            .textContent('Are you sure, that you realy want remove entry?')
            .ariaLabel('Confirm removing')
            .targetEvent($event)
            .ok('Remove')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            $rootScope.loading = true;
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
                        $rootScope.alert = {text: "Entry was removed.", type: "success"};
                        $scope.loadEntries();
                    } else {
                        $rootScope.alert = {text: response.data.text, type: "danger"};
                    }
                    $rootScope.loading = false;
                }, function (response) {
                    $rootScope.alert = {text: "Failure while remove entry.", type: "danger"};
                    $rootScope.loading = false;
                });
        }, function() {
            //canceled
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

                    angular.forEach($scope.entries, function(value, key) {
                        $scope.entriesId += value.id + ',';

                        $http({
                            method: 'JSONP',
                            url: 'https://abulafia.fi.muni.cz:9050/' + $routeParams.code + '?callback=JSON_CALLBACK',
                            params: {
                                action: 'get',
                                entry_id: value.id,
                                format: 'json'
                            },
                            responseType: 'json'
                        }).
                            then(function (response) {
                                if (response.data.status == 'OK') {
                                    angular.forEach(JSON.parse($scope.dictionary.schema).containers, function(valueIn, keyIn) {
                                        if(valueIn.headword == 'true') {
                                            if(response.data.result.entry[valueIn.element]) {
                                                $scope.entries[key].head = response.data.result.entry[valueIn.element].$;
                                            }
                                        }
                                    });
                                } else {
                                    $scope.entries[key].head = value.id;
                                }
                            }, function (response) {
                                $scope.entries[key].head = value.id;
                            });
                    });

                    var lastChar = ($scope.entriesId).slice(-1);
                    if (lastChar == ',') {
                        $scope.entriesId = ($scope.entriesId).slice(0, -1);
                    }
                } else {

                }
                $rootScope.loading = false;
            }, function (response) {
                $rootScope.loading = false;
            });
    };


    $scope.init = function() {
        $rootScope.loading = true;
        $rootScope.dictDetail = $routeParams.code;
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
