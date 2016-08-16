'use strict';

angular.module('debwrite.newEntry', ["ng-file-model"])

    .controller('NewEntryCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$location', function ($scope, $rootScope, $http, $routeParams, $location) {
        $scope.dictionary = null;
        $scope.newEntry = null;
        $scope.editPage = false;


        $scope.saveEntry = function () {
            $scope.$broadcast('show-errors-check-validity');
            if ($scope.newEntryForm.$invalid) {
                return;
            }

            if ($routeParams.id != null) {
                $scope.entryId = $routeParams.id;
            } else {
                $scope.entryId = '';
            }

            $scope.fileEntries = [];
            angular.forEach($scope.newEntry, function (value, key) {
                if (value[0] != undefined && value[0].type == "file") {
                    if (value[0].values.length != undefined && value[0].values.length > 0) {
                        angular.forEach(value[0].values, function (valueIn, keyIn) {
                            $scope.fileEntries.push({"key": key + keyIn, "value": valueIn});
                        });
                    } else {
                        $scope.fileEntries.push({"key": key + "0", "value": value[0].values});
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
        $scope.saveFiles = function (i) {
            if ($scope.fileEntries[i] && $scope.fileEntries[i].value && $scope.fileEntries[i].value.data) {
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
        $scope.generateEntryXMLRecursive = function (values, submerged) {
            if (submerged == false) {
                $scope.iteratedItems = 0;
            }
            $scope.elemFile  = '';

            angular.forEach(values, function (containerArray, key) {
                if (submerged == false) {
                    $scope.iteratedItems++;
                }

                //iterovani kvuli multiple containeru
                angular.forEach(containerArray, function (container, indexIt) {
                    if (container.type != 'container') {
                        if (container.values != undefined && container.values.length > 0) {
                            angular.forEach(container.values, function (valueIn, keyIn) {
                                if (container.type == 'file') {
                                    if ($scope.filePaths[key + keyIn] == undefined) {
                                        $scope.filePaths[key + keyIn] = '';
                                    }
                                    $scope.entryXML += '<' + key + ' elem_type="' + container.type + '">' + $scope.filePaths[key + keyIn] + '</' + key + '>';
                                    if($scope.elemFile != key) { //pro vlozeni jen jednou (jiz vlozenych souboru
                                        $scope.elemFile = key;
                                        angular.forEach(container.fileValues, function (nameFile, keyIn) {
                                            $scope.entryXML += '<' + key + ' elem_type="' + container.type + '">' + nameFile + '</' + key + '>';
                                        });
                                    }
                                } else {
                                    if(container.type == 'textarea') {
                                        var strVal = valueIn.replace(/\n/g, '-newLine-');
                                    } else {
                                        var strVal = valueIn;
                                    }
                                    $scope.entryXML += '<' + key + ' elem_type="' + container.type + '">' + strVal + '</' + key + '>';
                                }
                            });
                        } else {
                            $scope.entryXML += '<' + key + ' elem_type="' + container.type + '"></' + key + '>';
                        }
                    } else {
                        $scope.entryXML += '<' + key + ' elem_type="' + container.type + '">';
                        $scope.generateEntryXMLRecursive(container.containers, true);
                        $scope.entryXML += '</' + key + '>';
                    }
                });

                if ($scope.iteratedItems == Object.keys(values).length && submerged == false) { // konec => dokončit xml a uložit zaznam---------------
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
                                if ($routeParams.id == null) {
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
                            if ($routeParams.id == null) {
                                $rootScope.alert = {text: "Failure while added entry.", type: "danger"};
                            } else {
                                $rootScope.alert = {text: "Failure while edited entry.", type: "danger"};
                            }
                        });
                }
            });
        };


        $scope.generateNewEntryRecursive = function (values) {
            angular.forEach(values, function (value, key) {
                if (value.type == 'number') {
                    $scope.newEntry += '"' + value.element + '": [{"id": ' + value.id + ', "label": "' + value.label + '", "headword": "' + value.headword + '", "multiple": ' + value.multiple + ', "required": ' + value.required + ', "type": "' + value.type + '", "options": ' + JSON.stringify(value.options) + ', "containers": {}, "values": [0]}], ';
                } else if (value.type == 'file') {
                    $scope.newEntry += '"' + value.element + '": [{"id": ' + value.id + ', "label": "' + value.label + '", "headword": "' + value.headword + '", "multiple": ' + value.multiple + ', "required": ' + value.required + ', "type": "' + value.type + '", "options": ' + JSON.stringify(value.options) + ', "containers": {}, "values": [{}]}], ';
                } else if (value.type == 'container') {
                    $scope.newEntry += '"' + value.element + '": [{"id": ' + value.id + ', "label": "' + value.label + '", "headword": "' + value.headword + '", "multiple": ' + value.multiple + ', "required": ' + value.required + ', "type": "' + value.type + '", "options": ' + JSON.stringify(value.options) + ', "containers": {';
                    $scope.generateNewEntryRecursive(value.containers);
                    var lastChar = ($scope.newEntry).slice(-2);
                    if (lastChar == ', ') {
                        $scope.newEntry = ($scope.newEntry).slice(0, -2);
                    }
                    $scope.newEntry += '},"values": ""}], ';
                } else {
                    $scope.newEntry += '"' + value.element + '": [{"id": ' + value.id + ', "label": "' + value.label + '", "headword": "' + value.headword + '", "multiple": ' + value.multiple + ', "required": ' + value.required + ', "type": "' + value.type + '", "options": ' + JSON.stringify(value.options) + ', "containers": {}, "values": [""]}], ';
                }
            });
        };


        $scope.generateNewEntryEditRecursive = function (values, entry) {
            delete entry["@id"];
            delete entry["@elem_type"]
            delete entry["meta"];

            angular.forEach(values, function(container, key) {
                if( container.type == "container" ) {
                    if (Array.isArray(entry[container.element])) {
                        $scope.newEntry += '"' + container.element + '": [';
                        angular.forEach(entry[container.element], function (entryVal, key) {
                            $scope.newEntry += '{"id": ' + container.id + ', "label": "' + container.label + '", "headword": "' + container.headword + '", "multiple": ' + container.multiple + ', "required": ' + container.required + ', "type": "' + container.type + '", "options": ' + JSON.stringify(container.options) + ', "containers": {';
                            $scope.generateNewEntryEditRecursive(container.containers, entryVal);
                            $scope.newEntry += '},"values": ""}, ';
                        });
                        $scope.newEntry += '], ';
                    } else {
                        $scope.newEntry += '"' + container.element + '": [{"id": ' + container.id + ', "label": "' + container.label + '", "headword": "' + container.headword + '", "multiple": ' + container.multiple + ', "required": ' + container.required + ', "type": "' + container.type + '", "options": ' + JSON.stringify(container.options) + ', "containers": {';
                        $scope.generateNewEntryEditRecursive(container.containers, entry[container.element]);
                        $scope.newEntry += '},"values": ""}], ';
                    }
                } else if( container.type == "number" ) {
                        if(Array.isArray(entry[container.element])) {
                            var valStr = '';
                            angular.forEach(entry[container.element], function(entryVal, key) {
                                valStr += entryVal.$ + ', ';
                            });
                            var lastChar = (valStr).slice(-2);
                            if (lastChar == ', ') { valStr = (valStr).slice(0, -2); }
                        } else {
                            var valStr = entry[container.element].$;
                        }
                        $scope.newEntry += '"' + container.element + '": [{"id": ' + container.id + ', "label": "' + container.label + '", "headword": "' + container.headword + '", "multiple": ' + container.multiple + ', "required": ' + container.required + ', "type": "' + container.type + '", "options": ' + JSON.stringify(container.options) + ', "containers": {}, "values": [' + valStr + ']}], ';
                } else if( container.type == "file" ) {
                        if(Array.isArray(entry[container.element])) {
                            var valStr = '';
                            angular.forEach(entry[container.element], function(entryVal, key) {
                                if (entryVal.$ == undefined || entryVal.$ == "undefined") {
                                    valStr += '';
                                } else {
                                    valStr += '"' + entryVal.$ + '", ';
                                }
                            });
                            var lastChar = (valStr).slice(-2);
                            if (lastChar == ', ') { valStr = (valStr).slice(0, -2); }
                        } else {
                            if(entry[container.element].$ == undefined || entry[container.element].$ == "undefined") {
                                var valStr = '';
                            } else {
                                var valStr = '"' + entry[container.element].$ + '"';
                            }
                        }
                        $scope.newEntry += '"' + container.element + '": [{"id": ' + container.id + ', "label": "' + container.label + '", "headword": "' + container.headword + '", "multiple": ' + container.multiple + ', "required": ' + container.required + ', "type": "' + container.type + '", "options": ' + JSON.stringify(container.options) + ', "containers": {}, "values": [{}], "fileValues": [' + valStr + ']}], ';
                } else {
                        if(Array.isArray(entry[container.element])) {
                            var valStr = '';
                            angular.forEach(entry[container.element], function(entryVal, key) {
                                if (entryVal.$ == undefined || entryVal.$ == "undefined") {
                                    valStr += '"", ';
                                } else {
                                    valStr += '"' + entryVal.$ + '", ';
                                }
                            });
                            var lastChar = (valStr).slice(-2);
                            if (lastChar == ', ') { valStr = (valStr).slice(0, -2); }
                        } else {
                            if (entry[container.element].$ == undefined || entry[container.element].$ == "undefined") {
                                var valStr = '""';
                            } else {
                                var valStr = '"' + entry[container.element].$ + '"';
                            }
                        }
                        $scope.newEntry += '"' + container.element + '": [{"id": ' + container.id + ', "label": "' + container.label + '", "headword": "' + container.headword + '", "multiple": ' + container.multiple + ', "required": ' + container.required + ', "type": "' + container.type + '", "options": ' + JSON.stringify(container.options) + ', "containers": {}, "values": [' + valStr + ']}], ';
                }
            });
        };


        $scope.addContainerEntry = function (value) {
            if ((value[0] != undefined) && (value[0].type = 'container')) {
                var previousContainer = $.extend(true, {}, value[value.length - 1]); //vytvoření hluboke kopie
                value.push(previousContainer);
            } else {
                if (value.type == 'file') {
                    value.values.push({});
                } else if (value.type == 'number') {
                    value.values.push(0);
                } else {
                    value.values.push("");
                }
            }
        };

        $scope.removeContainerEntry = function (value, index) {
            if (index > -1) {
                value.splice(index, 1);
            }
        };

        $scope.removeFile = function (values, index) {
            if (index > -1) {
                values.splice(index, 1);
            }
        };

        $scope.changeSelectOptionRecursive = function(values) {
            angular.forEach(values, function (value, key) {
                if(value.type == "container") {
                    $scope.changeSelectOptionRecursive(value.containers);
                } else if( value.type == "select") {
                    values[key].options = (values[key].options).split(',');
                }
            });
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
                        $scope.changeSelectOptionRecursive($scope.dictionary.schema);
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
                        if ($routeParams.id != null) {
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
                                        $scope.newEntry = ($scope.newEntry).replace(/], }/g, ']}'); // kvuli validite ( na konci přebytečná čarka
                                        $scope.newEntry = ($scope.newEntry).replace(/}, ]/g, '}]'); // kvuli validite ( na konci přebytečná čarka
                                        console.log($scope.newEntry);
                                        $scope.newEntry = JSON.parse($scope.newEntry);
                                        console.log($scope.newEntry);
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
