'use strict';

angular.module('debwrite.newEntry', ['ng-file-model', 'ngSanitize'])

    .controller('NewEntryCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$location','$sce', function ($scope, $rootScope, $http, $routeParams, $location, $sce) {
        $scope.dictionary = null;
        $scope.newEntry = null;
        $scope.editPage = false;
        $scope.previewUrl = "";
        $scope.previewTemplate = "_preview_xml_";
        $scope.templatesList = [];

        $scope.saveEntry = function () {
            $scope.$broadcast('show-errors-check-validity');
            if ($scope.newEntryForm.$invalid) {
                return;
            }
            $rootScope.loading = true;
            $scope.fileEntries = [];
            $scope.setFileEntriesRecursive($scope.newEntry);
            $scope.entryXML = '<entry id="' + $scope.entryId + '">';
            $scope.filePaths = [];
            $scope.saveFiles(0); // nasledne dokončí xml string a uloží položku
        };

        $scope.setFileEntriesRecursive = function(values) {
            angular.forEach(values, function (value, key) {
                angular.forEach(value, function( valueIn, keyIn) {
                    if (valueIn != undefined && valueIn.type == "file") {
                        if (valueIn.values.length != undefined && valueIn.values.length > 0) {
                            angular.forEach(value[0].values, function (valueInIn, keyInIn) {
                                $scope.fileEntries.push({"key": key + keyInIn, "value": valueInIn});
                            });
                        } else {
                            $scope.fileEntries.push({"key": key + "0", "value": valueIn.values});
                        }
                    } else if(valueIn != undefined && valueIn.type == "container") {
                        $scope.setFileEntriesRecursive(valueIn.containers);
                    }
                });
            });
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
                                if ($routeParams.id == null) {
                                    $rootScope.alert = {text: "Entry was added.", type: "success"};
                                } else {
                                    $rootScope.alert = {text: "Entry was edited.", type: "success"};
                                }
                            } else {
                                $rootScope.alert = {text: response.data.text, type: "danger"};
                            }
                            $rootScope.loading = false;
                            $location.path('/dictionaries/' + $routeParams.code);
                        }, function (response) {
                            if ($routeParams.id == null) {
                                $rootScope.alert = {text: "Failure while added entry.", type: "danger"};
                            } else {
                                $rootScope.alert = {text: "Failure while edited entry.", type: "danger"};
                            }
                            $rootScope.loading = false;
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
            delete entry["@elem_type"];
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

        $scope.trustSrc = function(src) {
            return $sce.trustAsResourceUrl(src);
        };

        $scope.preparePreview = function(){
            $rootScope.loading = true;
            var templateSelected = null;
            angular.forEach($scope.templatesList, function(value, key) {
                if(value.code == $scope.previewTemplate) {
                    templateSelected = value;
                }
            });
            if(templateSelected != null) {
                if (templateSelected.type == "xslt") {
                    localStorage.setItem('previewXSLTTemplate', templateSelected.template);
                    localStorage.setItem('previewEntry', JSON.stringify($scope.newEntry));
                    $scope.previewUrl = "previewXSLT.html?dict_code=" + $routeParams.code + "&template_code=" + $scope.previewTemplate + "&template_type=" + templateSelected.type;
                } else if (templateSelected.type == "handlebar") {
                    localStorage.setItem('previewHandlebarTemplate', templateSelected.template);
                    localStorage.setItem('previewEntry', JSON.stringify($scope.newEntry));
                    $scope.previewUrl = "preview.html?dict_code=" + $routeParams.code + "&template_code=" + $scope.previewTemplate + "&template_type=" + templateSelected.type;
                } else {
                    $scope.previewXML = '<entry id="' + $scope.entryId + '">\n';
                    $scope.generatePreviewXMLRecursive($scope.newEntry, false);
                    localStorage.setItem('previewXML', $scope.previewXML);
                    $scope.previewUrl = "preview.html?dict_code=" + $routeParams.code + "&template_code=" + $scope.previewTemplate + "&template_type=" + templateSelected.type;
                }
            }
            var iFrame = $("#iframePreview");
            iFrame.attr("src",iFrame.attr("src"));
            $rootScope.loading = false;
        };

        $scope.generatePreviewXMLRecursive = function (values, submerged) {
            if (submerged == false) {
                $scope.iteratedPreviewItems = 0;
            }
            $scope.elemPreviewFile  = '';
            angular.forEach(values, function (containerArray, key) {
                if (submerged == false) {
                    $scope.iteratedPreviewItems++;
                }
                //iterovani kvuli multiple containeru
                angular.forEach(containerArray, function (container, indexIt) {
                    if (container.type != 'container') {
                        if (container.values != undefined && container.values.length > 0) {
                            angular.forEach(container.values, function (valueIn, keyIn) {
                                if (container.type == 'file') {
                                    $scope.previewXML += '<' + key + ' elem_type="' + container.type + '">filepath</' + key + '>\n';
                                    if($scope.elemPreviewFile != key) { //pro vlozeni jen jednou (jiz vlozenych souboru
                                        $scope.elemPreviewFile = key;
                                        angular.forEach(container.fileValues, function (nameFile, keyIn) {
                                            $scope.previewXML += '<' + key + ' elem_type="' + container.type + '">' + nameFile + '</' + key + '>\n';
                                        });
                                    }
                                } else {
                                    var strVal = valueIn;
                                    $scope.previewXML += '<' + key + ' elem_type="' + container.type + '">' + strVal + '</' + key + '>\n';
                                }
                            });
                        } else {
                            $scope.previewXML += '<' + key + ' elem_type="' + container.type + '"></' + key + '>\n';
                        }
                    } else {
                        $scope.previewXML += '<' + key + ' elem_type="' + container.type + '">\n';
                        $scope.generatePreviewXMLRecursive(container.containers, true);
                        $scope.previewXML += '</' + key + '>\n';
                    }
                });
                if ($scope.iteratedPreviewItems == Object.keys(values).length && submerged == false) { // konec => dokončit xml a uložit zaznam---------------
                    $scope.previewXML += '</entry>';
                }
            });
        };

        $scope.init = function () {
            $rootScope.loading = true;
            $rootScope.dictDetail = $routeParams.code;
            if ($routeParams.id != null && $routeParams.id != undefined) {
                $scope.entryId = $routeParams.id;
            } else {
                $scope.entryId = '';
            }

            localStorage.setItem('previewXML', '');

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
                            //set templateList property for select
                        $scope.templatesList.push({"code": "_preview_xml_", "name": "XML preview", "parent": "Blank XML", "type": "xml", "template": "null"});
                        $scope.previewTemplate = "_preview_xml_";
                        angular.forEach($scope.dictionary.templates, function (value, key) {
                            $scope.templatesList.push({
                                "code": value.code,
                                "name": value.name,
                                "parent": "XSLT templates",
                                "type": "xslt",
                                "template": value.template
                            });
                        });
                        angular.forEach($scope.dictionary.htemplates, function(value, key) {
                            $scope.templatesList.push({"code": value.code, "name": value.name, "parent": "Handlebar templates", "type": "handlebar", "template": value.template});
                        });
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
                                        $scope.newEntry = JSON.parse($scope.newEntry);
                                    } else {
                                        $scope.showForm = false;
                                    }
                                }, function (response) {
                                    $rootScope.loading = false;
                                });
                        } else {
                            $scope.editPage = false;
                        }
                    } else {
                    }
                    $rootScope.loading = false;
                }, function (response) {
                    $rootScope.loading = false;
                });
        };

    }]);
