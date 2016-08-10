'use strict';

angular.module('debwrite.import', ['smart-table', 'ui.bootstrap', 'ngSanitize'])

.controller('ImportCtrl', ['$scope', '$rootScope', '$http', '$mdDialog', '$routeParams', '$sce', function($scope, $rootScope, $http, $mdDialog, $routeParams, $sce) {
    $scope.dictionary = null;
    $scope.import = {file:{}, delCurrent: true, overEntries: false};
    $scope.srcLog = '';

    $scope.importData = function() {
        console.log($scope.import.file.data);
        var fileData = $scope.import.file.data;
        fileData = fileData.match(/data:([-\w]+\/[-\w\+\.]+)?;base64,(.*)/);
        console.log($scope.import.delCurrent);
        $http({
            method: 'JSONP',
            url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
            params: {
                action: 'import',
                code: $routeParams.code,
                data: fileData[2],
                delete: $scope.import.delCurrent,
                overwrite: $scope.import.overEntries
            },
            responseType: 'json'
        }).
            then(function (response) {
                console.log(response);
                $scope.srcLog = 'https://abulafia.fi.muni.cz:9050/admin?action=showlog&type=import&log=' + response.data.logfile;
            }, function (response) {
                console.log(response);
            });
    };

    $scope.trustSrc = function(src) {
        return $sce.trustAsResourceUrl(src);
    };

    $scope.init = function() {
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
                } else {
                }
            }, function (response) {
            });
    };

}]);
