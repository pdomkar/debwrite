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
                    if(value.values.length != undefined && value.values.length > 0) {
                        angular.forEach(value.values, function(valueIn, keyIn) {
                            $scope.fileEntries.push({"key": key+keyIn, "value": valueIn});
                        });
                    } else {
                        $scope.fileEntries.push({"key": key+"0", "value": value.values});
                    }
                }
            });
            $scope.entryXML = '<entry id="' + $scope.entryId + '">';
            $scope.filePaths = [];
            $scope.saveFiles(0); // nasledne dokončí xml string a uloží položku
        };

        /**
         * Ulozi soubory a do filePaths ulozi vracenou cestu k souboru, po ulozeni vsech souboru zavola funkci generateEntryXMLRecursive
         * @param i index ukladaneho souboru
         */
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
                                    $scope.generateEntryXMLRecursive($scope.newEntry, false);
                                }
                            }
                        } else {
                            $scope.filePaths[$scope.fileEntries[i].key] = "error";
                            if (i < (($scope.fileEntries.length) - 1)) {
                                $scope.saveFiles(++i);
                            } else {
                                if (i == (($scope.fileEntries.length) - 1)) {
                                    $scope.generateEntryXMLRecursive($scope.newEntry, false);
                                }
                            }
                        }
                    }, function (response) {
                        $scope.filePaths[$scope.fileEntries[i].key] = "error";
                        if (i < (($scope.fileEntries.length) - 1)) {
                            $scope.saveFiles(++i);
                        } else {
                            if (i == (($scope.fileEntries.length) - 1)) {
                                $scope.generateEntryXMLRecursive($scope.newEntry, false);
                            }
                        }
                    });
            } else {
                $scope.generateEntryXMLRecursive($scope.newEntry, false);
            }
        };

        /**
         * Vygeneruje vysledný xml soubor a na konci ho ulozi
         * @param values object s jednotlivými položkami pro generovani xml
         * @param submerged true pokud se jedna o volaní z rekurze
         */
        $scope.generateEntryXMLRecursive = function(values, submerged) {
            if(submerged == false) {
                $scope.iteratedItems = 0;
            }
            angular.forEach(values, function(container, key) {
                if(submerged == false) {
                    $scope.iteratedItems++;
                }
                if(container.type != 'container') {
                    if (container.multiple != true) {
                        if(container.type == 'file') {
                            if(container.values) { // kdyz odeslan file
                                if($scope.filePaths[key+"0"] == undefined) {
                                    $scope.filePaths[key+"0"] = '';
                                }
                                $scope.entryXML += '<' + key + ' elem_type="' + container.type + '">' + $scope.filePaths[key+"0"] + '</' + key + '>';
                            }
                        } else {
                            $scope.entryXML += '<' + key + ' elem_type="' + container.type + '">' + container.values + '</' + key + '>';
                        }
                    } else {
                        if(container.values != undefined && container.values.length > 0) {
                            angular.forEach(container.values, function (valueIn, keyIn) {
                                if (container.type == 'file') {
                                    if($scope.filePaths[key + keyIn] == undefined) {
                                        $scope.filePaths[key + keyIn] = '';
                                    }
                                    $scope.entryXML += '<' + key + ' elem_type="' + container.type + '">' + $scope.filePaths[key + keyIn] + '</' + key + '>';
                                } else {
                                    $scope.entryXML += '<' + key + ' elem_type="' + container.type + '">' + valueIn + '</' + key + '>';
                                }

                            });
                        } else {
                            $scope.entryXML += '<' + key + ' elem_type="' + container.type + '"></' + key + '>';
                        }
                    }
                } else {
                    $scope.entryXML += '<' + key + ' elem_type="' + container.type + '">';
                        $scope.generateEntryXMLRecursive(container.containers, true);
                    $scope.entryXML += '</' + key + '>';
                }

                if($scope.iteratedItems == Object.keys(values).length && submerged == false) { // konec => dokončit xml a uložit zaznam---------------
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
                                console.log(response);
                                if($routeParams.id == null) {
                                    $rootScope.alert = {text: "Entry was added.", type: "success"};
                                } else {
                                    $rootScope.alert = {text: "Entry was edited.", type: "success"};
                                }
                            } else {
                                console.log(response);
                                $rootScope.alert = {text: response.data.text, type: "danger"};
                            }
                        }, function (response) {
                            console.log(response);
                            if($routeParams.id == null) {
                                $rootScope.alert = {text: "Failure while added entry.", type: "danger"};
                            } else {
                                $rootScope.alert = {text: "Failure while edited entry.", type: "danger"};
                            }
                        });
                }
            });
        };


        $scope.generateNewEntryRecursive = function(values) {
            angular.forEach(values, function(value, key) {
                if(value.multiple == true) {
                    if (value.type == 'number') {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {}, "values": [0]}, ';
                    } else if (value.type == 'file') {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {}, "values": [{}]}, ';
                    } else if (value.type == 'container') {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {';
                            $scope.generateNewEntryRecursive(value.containers);
                            var lastChar = ($scope.newEntry).slice(-2);
                            if (lastChar == ', ') {
                                $scope.newEntry = ($scope.newEntry).slice(0, -2);
                            }
                        $scope.newEntry += '},"values": ""}, ';
                    } else {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {}, "values": [""]}, ';
                    }
                } else {
                    if (value.type == 'number') {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {}, "values": 0}, ';
                    } else if (value.type == 'file') {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {}, "values": {}}, ';
                    } else if (value.type == 'container') {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {';
                            $scope.generateNewEntryRecursive(value.containers);
                            var lastChar = ($scope.newEntry).slice(-2);
                            if (lastChar == ', ') {
                                $scope.newEntry = ($scope.newEntry).slice(0, -2);
                            }
                        $scope.newEntry += '},"values": ""}, ';
                    } else {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {}, "values": ""}, ';
                    }
                }
            });
        };


        $scope.generateNewEntryEditRecursive = function(values, entry) {
            angular.forEach(values, function(value, key) {
                if(value.multiple == true) {
                    if (value.type == 'number') {
                            if(entry[value.element].length != undefined && entry[value.element].length != null && entry[value.element].length > 0) {
                                var valStr = '';
                                angular.forEach(entry[value.element], function (valueIn, keyIn) {
                                    valStr += '' + valueIn.$ + ',';
                                });
                                var lastChar = (valStr).slice(-1);
                                if (lastChar == ',') { valStr = (valStr).slice(0, -1); }
                            } else {
                                var valStr = entry[value.element].$;
                            }
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {}, "values": [' + valStr + ']}, ';
                    } else if (value.type == 'file') {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {}, "values": [{}]}, ';
                    } else if (value.type == 'container') {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {';
                        $scope.generateNewEntryEditRecursive(value.containers, entry[value.element]);
                        var lastChar = ($scope.newEntry).slice(-2);
                        if (lastChar == ', ') {
                            $scope.newEntry = ($scope.newEntry).slice(0, -2);
                        }
                        $scope.newEntry += '},"values": ""}, ';
                    } else {
                            if(entry[value.element].length != undefined && entry[value.element].length != null && entry[value.element].length > 0) {
                                var valStr = '';
                                angular.forEach(entry[value.element], function (valueIn, keyIn) {
                                    valStr += '"' + valueIn.$ + '",';
                                });
                                var lastChar = (valStr).slice(-1);
                                if (lastChar == ',') { valStr = (valStr).slice(0, -1); }
                            } else {
                                var valStr = '"' + entry[value.element].$ + '"';
                            }
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {}, "values": [' + valStr + ']}, ';
                    }
                } else {
                    if (value.type == 'number') {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {}, "values": ' + entry[value.element].$ + '}, ';
                    } else if (value.type == 'file') {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {}, "values": {}}, ';
                    } else if (value.type == 'container') {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {';
                        $scope.generateNewEntryEditRecursive(value.containers, entry[value.element]);
                        var lastChar = ($scope.newEntry).slice(-2);
                        if (lastChar == ', ') {
                            $scope.newEntry = ($scope.newEntry).slice(0, -2);
                        }
                        $scope.newEntry += '},"values": ""}, ';
                    } else {
                        $scope.newEntry += '"' + value.element + '": {"id": '+ value.id +', "label": "'+ value.label +'", "headword": "'+ value.headword +'", "multiple": '+ value.multiple +', "required": '+ value.required +', "type": "'+ value.type +'", "options": '+ JSON.stringify(value.options) +', "containers": {}, "values": "' + entry[value.element].$ + '"}, ';
                    }
                }
            });
        };


        $scope.addContainerEntry = function(value) {
            if(value.type == 'file') {
                value.values.push({});
            } else if(value.type == 'number') {
                value.values.push(0);
            } else {
                value.values.push("");
            }
        };

        $scope.removeContainerEntry = function(value, index) {
            if (index > -1) {
                value.values.splice(index, 1);
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
                            var lastChar = ($scope.newEntry).slice(-2);
                            if (lastChar == ', ') {
                                $scope.newEntry = ($scope.newEntry).slice(0, -2);
                            }
                            $scope.newEntry += '}';
                            $scope.newEntry = JSON.parse($scope.newEntry);
                        }

                             //load entry for edit
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
                                        $scope.generateNewEntryEditRecursive($scope.dictionary.schema, response.data.result.entry);
                                        var lastChar = ($scope.newEntry).slice(-2);
                                        if (lastChar == ', ') {
                                            $scope.newEntry = ($scope.newEntry).slice(0, -2);
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



                    } else {
                    }
                }, function (response) {
                });



        };

    }]);
