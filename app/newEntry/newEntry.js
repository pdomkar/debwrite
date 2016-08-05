'use strict';

angular.module('debwrite.newEntry', [])

    .controller('NewEntryCtrl', ['$scope', '$http', '$routeParams', '$location', function ($scope, $http, $routeParams, $location) {
        $scope.alert = null;
        $scope.dictionary = null;
        $scope.newEntry = null;
        $scope.editPage = false;
        $scope.json = { array1: ["an", "array"], obj1: { key1: 8, key2: "more text", subfields:{
            subfield1:"new subfield"
        }
        }, field2: "loremips"};


        $scope.saveEntry = function() {
            if ($routeParams.id != null) {
                $scope.entryId = $routeParams.id;
            } else {
                $scope.entryId = '';
            }

            $scope.entryXML = '<entry id="">';
            angular.forEach($scope.newEntry, function(value, key) {
                $scope.entryXML += '<' + key + ' elem_type="text">' + value + '</' + key + '>';
            });
            $scope.entryXML += '</entry>';
            var xmlDoc = $.parseXML($scope.entryXML);
            console.log(xmlDoc);


            $http({
                method: 'JSONP',
                url: 'https://abulafia.fi.muni.cz:9050/' + $routeParams.code + '?callback=JSON_CALLBACK',
                params: {
                    action: 'save',
                    entry_id: $scope.entryId,
                    data: $scope.entryXML
                },
                responseType: 'json'
            }).
                then(function (response) {
                    if (response.data.status == 'OK') {
                        $scope.alert = {text: "Entry was added.", type: "success"};
                    } else {
                        $scope.alert = {text: response.data.text, type: "danger"};
                    }
                }, function (response) {
                    $scope.alert = {text: "Failure while added entry.", type: "danger"};
                });
        };


        $scope.generateNewEntryRecursive = function(values) {
            angular.forEach(values, function(value, key) {
                if(values[key].multiple == true) {
                    if (values[key].type == 'number') {
                        $scope.newEntry += '"' + values[key].element + '": [null],';
                    } else if (values[key].type == 'container') {
                        $scope.newEntry += '"' + values[key].element + '": {';
                        $scope.generateNewEntryRecursive(values[key].containers);
                        var lastChar = ($scope.newEntry).slice(-1);
                        if (lastChar == ',') {
                            $scope.newEntry = ($scope.newEntry).slice(0, -1);
                        }
                        $scope.newEntry += '},';
                    } else {
                        $scope.newEntry += '"' + values[key].element + '": [""],';
                    }
                } else {
                    if (values[key].type == 'number') {
                        $scope.newEntry += '"' + values[key].element + '": null,';
                    } else if (values[key].type == 'container') {
                        $scope.newEntry += '"' + values[key].element + '": {';
                        $scope.generateNewEntryRecursive(values[key].containers);
                        var lastChar = ($scope.newEntry).slice(-1);
                        if (lastChar == ',') {
                            $scope.newEntry = ($scope.newEntry).slice(0, -1);
                        }
                        $scope.newEntry += '},';
                    } else {
                        $scope.newEntry += '"' + values[key].element + '": "",';
                    }
                }
            });
        };


        $scope.getModel = function(value) {
            return $scope.newEntry.meaning.domain;
            //if(($parent.$parent.$parent.$parent.value).element == '') {
            //    return value.element;
            //} else {
            //    return ($parent.$parent.$parent.$parent.value).element;
            //}

        } ;

        $scope.addContainerEntry = function(value) {
            value.push("");
            console.log(value);
        };

        $scope.removeContainerEntry = function(value, index) {
            if (index > -1) {
                value.splice(index, 1);
            }
            console.log(value);
            console.log(index);
        };



        $scope.init = function () {
            $scope.alert = null;
                //load dictionary info (of dictionary where is create new entry)
            $http({
                method: 'JSONP',
                url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                params: {
                    action: 'dict_info',
                    code: $routeParams.code
                },
                responseType: 'json'
            }).
                then(function (response) {
                    if (response.data.status == 'OK') {
                        $scope.dictionary = response.data;
                        $scope.dictionary.schema = JSON.parse(response.data.schema).containers;
                        angular.forEach($scope.dictionary.schema, function(value, key) {
                            $scope.dictionary.schema[key].options = ($scope.dictionary.schema[key].options).split(',');

                        });

                        $scope.newEntry = '{';
                            $scope.generateNewEntryRecursive($scope.dictionary.schema);
                        var lastChar = ($scope.newEntry).slice(-1);
                        if (lastChar == ',') {
                            $scope.newEntry = ($scope.newEntry).slice(0, -1);
                        }
                        $scope.newEntry += '}';
                        $scope.newEntry = JSON.parse($scope.newEntry);
                        console.log($scope.newEntry);
                    } else {
                    }
                }, function (response) {
                });

        };

    }]);
