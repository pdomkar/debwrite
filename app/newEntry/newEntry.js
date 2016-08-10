'use strict';

angular.module('debwrite.newEntry', ["ng-file-model"])

    .controller('NewEntryCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$location', function ($scope, $rootScope, $http, $routeParams, $location) {
        $scope.dictionary = null;
        $scope.newEntry = null;
        $scope.editPage = false;


        $scope.saveEntry = function() {
            $scope.$broadcast('show-errors-check-validity');
            if ($scope.newEntryForm.$invalid) { return; }


            if ($routeParams.id != null) {
                $scope.entryId = $routeParams.id;
            } else {
                $scope.entryId = '';
            }
            $scope.fileEntries = [];
            angular.forEach($scope.newEntry, function(value, key) {
                if(value.type == "file") {
                    if(value.value.length != undefined) {
                        angular.forEach(value.value, function(valueIn, keyIn) {
                            $scope.fileEntries.push({"key": key+keyIn, "value": valueIn});
                        });
                    } else {
                        $scope.fileEntries.push({"key": key+"0", "value": value.value});
                    }
                }
            });
            $scope.entryXML = '<entry id="' + $scope.entryId + '">';
            $scope.filePaths = [];
            $scope.saveFiles(0); // nasledne dokončí xml string a uloží položku
        //    $scope.generateEntryXMLRecursive($scope.dictionary.schema);
        //    $scope.entryXML += '</entry>';
        //    console.log($scope.entryXML);

            //$http({
            //    method: 'JSONP',
            //    url: 'https://abulafia.fi.muni.cz:9050/' + $routeParams.code + '?callback=JSON_CALLBACK',
            //    params: {
            //        action: 'save',
            //        entry_id: $scope.entryId,
            //        data: $scope.entryXML
            //    },
            //    responseType: 'json'
            //}).
            //    then(function (response) {
            //        if (response.data.status == 'OK') {
            //            console.log("ok");
            //            $rootScope.alert = {text: "Entry was added.", type: "success"};
            //        } else {
            //            $rootScope.alert = {text: response.data.text, type: "danger"};
            //        }
            //    }, function (response) {
            //        $rootScope.alert = {text: "Failure while added entry.", type: "danger"};
            //    });
        };


        $scope.saveFiles = function(i) {
            if($scope.fileEntries[i] && $scope.fileEntries[i].value && $scope.fileEntries[i].value.data) {
                var fileData = $scope.fileEntries[i].value.data;
                fileData = fileData.match(/data:([-\w]+\/[-\w\+\.]+)?;base64,(.*)/);
                $http({
                    method: 'JSONP',
                    url: 'https://abulafia.fi.muni.cz:9050/' + $routeParams.code + '?callback=JSON_CALLBACK',
                    params: {
                        action: 'upload',
                        data: fileData[2],
                        type: fileData[1]
                    },
                    responseType: 'json'
                }).
                    then(function (response) {
                        if (response.data.status == 'OK') {
                            $scope.filePaths[$scope.fileEntries[i].key] = response.data.filename;
                            if (i < (($scope.fileEntries.length) - 1)) {
                                $scope.saveFiles(++i);

                            } else {
                                if (i == (($scope.fileEntries.length) - 1)) {
                                    $scope.generateEntryXMLRecursive($scope.dictionary.schema, false);
                                }
                            }
                        } else {
                            $scope.filePaths[$scope.fileEntries[i].key] = "error";
                            if (i < (($scope.fileEntries.length) - 1)) {
                                $scope.saveFiles(++i);
                            } else {
                                if (i == (($scope.fileEntries.length) - 1)) {
                                    $scope.generateEntryXMLRecursive($scope.dictionary.schema, false);
                                }
                            }
                        }
                    }, function (response) {
                        $scope.filePaths[$scope.fileEntries[i].key] = "error";
                        if (i < (($scope.fileEntries.length) - 1)) {
                            $scope.saveFiles(++i);
                        } else {
                            if (i == (($scope.fileEntries.length) - 1)) {
                                $scope.generateEntryXMLRecursive($scope.dictionary.schema, false);
                            }
                        }
                    });
            } else {
                $scope.generateEntryXMLRecursive($scope.dictionary.schema, false);
            }
        };

        $scope.generateEntryXMLRecursive = function(values, submerged) {
            angular.forEach(values, function(value, key) {
                if(value.type != 'container') {
                    if (value.multiple != true) {
                        if(value.type== 'file') {
                            if($scope.newEntry[value.element]) { // kdyz odeslan file
                                $scope.entryXML += '<' + value.element + ' elem_type="' + value.type + '">' + $scope.filePaths[value.element+"0"] + '</' + value.element + '>';
                            }
                        } else {
                            if($scope.newEntry[value.element] == undefined) {
                                var val = '';
                            } else {
                                var val = $scope.newEntry[value.element].value;
                            }
                            $scope.entryXML += '<' + value.element + ' elem_type="' + value.type + '">' + val + '</' + value.element + '>';
                        }
                    } else {
                        if($scope.newEntry[value.element] != undefined) {
                            angular.forEach($scope.newEntry[value.element].value, function (valueIn, keyIn) {
                                if (value.type == 'file') {
                                    $scope.entryXML += '<' + value.element + ' elem_type="' + value.type + '">' + $scope.filePaths[value.element + keyIn] + '</' + value.element + '>';
                                } else {
                                    $scope.entryXML += '<' + value.element + ' elem_type="' + value.type + '">' + valueIn + '</' + value.element + '>';
                                }

                            });
                        } else {
                            $scope.entryXML += '<' + value.element + ' elem_type="' + value.type + '"></' + value.element + '>';
                        }
                    }
                } else {
                    $scope.entryXML += '<' + value.element + ' elem_type="' + value.type + '">';
                    $scope.generateEntryXMLRecursive(value.containers, true);
                    $scope.entryXML += '</' + value.element + '>';
                }

                if(values[values.length-1] ==  value && submerged == false) { // konec dokončit xml a uložit zaznam---------------
                    $scope.entryXML += '</entry>';
                    console.log($scope.entryXML);

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
                                $rootScope.alert = {text: "Entry was added.", type: "success"};
                            } else {
                                $rootScope.alert = {text: response.data.text, type: "danger"};
                            }
                        }, function (response) {
                            $rootScope.alert = {text: "Failure while added entry.", type: "danger"};
                        });
                }
            });
        };


        $scope.generateNewEntryRecursive = function(values) {
            angular.forEach(values, function(value, key) {
                if(values[key].multiple == true) {
                    if (values[key].type == 'number') {
                        $scope.newEntry += '"' + values[key].element + '": {"value": [0], "type": "number"},';
                    } else if (values[key].type == 'file') {
                        $scope.newEntry += '"' + values[key].element + '": {"value": [{}], "type": "file"},';
                    } else if (values[key].type == 'container') {
                        $scope.generateNewEntryRecursive(values[key].containers);
                    } else {
                        $scope.newEntry += '"' + values[key].element + '": {"value": [""], "type": "' + values[key].type + '"},';
                    }
                } else {
                    if (values[key].type == 'number') {
                        $scope.newEntry += '"' + values[key].element + '": {"value": 0, "type": "number"},';
                    } else if (values[key].type == 'file') {
                        $scope.newEntry += '"' + values[key].element + '": {"value": {}, "type": "file"},';
                    } else if (values[key].type == 'container') {
                        $scope.generateNewEntryRecursive(values[key].containers);
                    } else {
                        $scope.newEntry += '"' + values[key].element + '": {"value": "", "type": "' + values[key].type + '"},';
                    }
                }
            });
        };

        $scope.isMultipleRecursive = function(values, property) {
            angular.forEach(values, function(value, key) {
                if(value.element == property) {
                    $scope.isPropertyMultiple = value.multiple;
                } else if(value.type == "container") {
                    $scope.isMultipleRecursive(value.containers, property)
                }

            });
        };

        $scope.generateNewEntryEditRecursive = function(values) {
            console.log($scope.dictionary);
            angular.forEach(values, function(value, key) {
                if(key != 'meta' && key != '@id') {
                    console.log(key);
                    console.log(value);

                    $scope.isPropertyMultiple = false;
                    $scope.isMultipleRecursive($scope.dictionary.schema, key);
                    if($scope.isPropertyMultiple) {
                        if(value.length != undefined && value.length != null && value.length > 0) {
                            $scope.newEntry += '"' + key + '": {"value": [';
                            var type = '';
                            angular.forEach(value, function (valueIn, keyIn) {
                                if(valueIn["@elem_type"] == 'number') {
                                    $scope.newEntry += '' + parseInt(valueIn.$) + ',';
                                } else if (value["@elem_type"] == 'file') {
                                    console.log("1" + value.$);
                                    $scope.newEntry += '{'+value.$+'},';
                                } else {
                                    $scope.newEntry += '"' + valueIn.$ + '",';
                                }
                                type = valueIn["@elem_type"];
                            });
                            var lastChar = ($scope.newEntry).slice(-1);
                            if (lastChar == ',') {
                                $scope.newEntry = ($scope.newEntry).slice(0, -1);
                            }
                            $scope.newEntry += '], "type": "' + type + '"},';
                        } else { // je multiple ale ma 0 nebo  jeden zaznam
                            if(value.$) { // ma jeden zaznam
                                if (value["@elem_type"] == 'number') {
                                    $scope.newEntry += '"' + key + '": {"value": ['+parseInt(value.$)+'], "type": "' + value["@elem_type"] + '"},';
                                } else if (value["@elem_type"] == 'file') {
                                    console.log("2" + value.$);
                                    console.log("3" + val);
                                    $scope.newEntry += '"' + key + '": {"value": [{"filename": "'+value.$+'"}], "type": "' + value["@elem_type"] + '"},';
                                } else {
                                    $scope.newEntry += '"' + key + '": {"value": ["'+value.$+'"], "type": "' + value["@elem_type"] + '"},';
                                }
                            } else { //multiple bez zaznamu
                                if (values[key].type == 'number') {
                                    $scope.newEntry += '"' + key + '": {"value": [0], "type": "' + value["@elem_type"] + '"},';
                                } else if (values[key].type == 'file') {
                                    console.log("4");
                                    $scope.newEntry += '"' + key + '": {"value": [{}], "type": "' + value["@elem_type"] + '"},';
                                } else {
                                    $scope.newEntry += '"' + key + '": {"value": [""], "type": "' + value["@elem_type"] + '"},';
                                }
                            }
                        }
                    } else {
                        if(value["@elem_type"] == 'container') {
                            delete value["@elem_type"];
                            $scope.generateNewEntryEditRecursive(value);
                        } else {
                           if(value.$ == undefined) {
                               var val = '';
                           } else {
                               var val = value.$;
                           }

                            if(value["@elem_type"] == 'number') {
                                $scope.newEntry += '"' + key + '": {"value": ' + val + ', "type": "' + value["@elem_type"] + '"},';
                            }  else if (values[key].type == 'file') {
                                console.log("5" + val);
                                $scope.newEntry += '"' + key + '": {"value": [{' + val + '}], "type": "' + value["@elem_type"] + '"},';
                            }else {
                                $scope.newEntry += '"' + key + '": {"value": "' + val + '", "type": "' + value["@elem_type"] + '"},';
                            }
                        }
                    }
                }

            });
        };


        $scope.addContainerEntry = function(value, type) {
            if(type == 'file') {
                value.push({});
            } else {
                value.push("");
            }
        };

        $scope.removeContainerEntry = function(value, index) {
            if (index > -1) {
                value.splice(index, 1);
            }
        };



        $scope.init = function () {
            $rootScope.dictDetail = $routeParams.code;
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
                        angular.forEach($scope.dictionary.schema, function (value, key) {
                            $scope.dictionary.schema[key].options = ($scope.dictionary.schema[key].options).split(',');
                        });

                        if ($routeParams.id == null) {
                            $scope.newEntry = '{';
                            $scope.generateNewEntryRecursive($scope.dictionary.schema);
                            var lastChar = ($scope.newEntry).slice(-1);
                            if (lastChar == ',') {
                                $scope.newEntry = ($scope.newEntry).slice(0, -1);
                            }
                            $scope.newEntry += '}';
                            $scope.newEntry = JSON.parse($scope.newEntry);
                        }
                    } else {
                    }
                }, function (response) {
                });



            if($routeParams.id != null) {
                $scope.editPage = true;

                $http({
                    method: 'JSONP',
                    url: 'https://abulafia.fi.muni.cz:9050/' + $routeParams.code + '?callback=JSON_CALLBACK',
                    params: {
                        action: 'get',
                        entry_id: $routeParams.id,
                        format: 'json'
                    },
                    responseType: 'json'
                }).
                    then(function (response) {
                        if (response.data.status == 'OK') {
                            $scope.newEntry = '{';
                            $scope.generateNewEntryEditRecursive(response.data.result.entry);
                            var lastChar = ($scope.newEntry).slice(-1);
                            if (lastChar == ',') {
                                $scope.newEntry = ($scope.newEntry).slice(0, -1);
                            }
                            $scope.newEntry += '}';
                            console.log($scope.newEntry);
                            $scope.newEntry = JSON.parse($scope.newEntry);

                        } else {
                            $scope.showForm = false;
                        }
                    }, function (response) {
                    });
            } else {
                $scope.editPage = false;
            }
        };

    }]);
