'use strict';

angular.module('debwrite.newDictionary', ['ui.tree', 'selectize'])

    .controller('NewDictionaryCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$location', '$mdDialog', function ($scope, $rootScope, $http, $routeParams, $location, $mdDialog) {
        $scope.editPage = false;
        $scope.showForm = true;
        $scope.dictionaryUsers = null;
        $scope.dictionaryOwner = null;
        $scope.xsltTemplates = null;
        $scope.htmlTemplates = null;
        $scope.addHandlebarShowBox = false;
        $scope.addXSLTTemplateShowBox = false;
        $scope.dictionaryUsersDisplayed = [];
        $scope.newDictionary = {
            name: '', code: '', containers: [
                {
                    id: 0,
                    element: "hw",
                    label: "headword",
                    headword: 'true',
                    multiple: false,
                    required: true,
                    type: "text",
                    options: "",
                    containers: []
                },
                {
                    id: 1,
                    element: "pos",
                    label: "part of speech",
                    headword: "",
                    multiple: false,
                    required: false,
                    type: "select",
                    options: "noun,verb,adjective,adverb",
                    containers: []
                },
                {
                    id: 2,
                    element: "gram",
                    label: "grammar info",
                    headword: "",
                    multiple: false,
                    required: false,
                    type: "text",
                    options: "",
                    containers: []
                },
                {
                    id: 3,
                    element: "pron",
                    label: "pronunciation",
                    headword: "",
                    multiple: false,
                    required: false,
                    type: "text",
                    options: "",
                    containers: []
                },
                {
                    id: 4,
                    element: "hyph",
                    label: "hyphenation",
                    headword: "",
                    multiple: false,
                    required: false,
                    type: "text",
                    options: "",
                    containers: []
                },
                {
                    id: 5,
                    element: "meaning",
                    label: "meaning",
                    headword: "",
                    multiple: true,
                    required: false,
                    type: "container",
                    options: "",
                    containers: [
                        {
                            id: 6,
                            element: "nr",
                            label: "meaning nr",
                            headword: "",
                            multiple: false,
                            required: false,
                            type: "number",
                            options: "",
                            containers: []
                        },
                        {
                            id: 7,
                            element: "domain",
                            label: "domain",
                            headword: "",
                            multiple: false,
                            required: false,
                            type: "text",
                            options: "",
                            containers: []
                        },
                        {
                            id: 8,
                            element: "def",
                            label: "definition",
                            headword: "",
                            multiple: false,
                            required: false,
                            type: "textarea",
                            options: "",
                            containers: []
                        },
                        {
                            id: 9,
                            element: "usage",
                            label: "usage example",
                            headword: "",
                            multiple: true,
                            required: false,
                            type: "textarea",
                            options: "",
                            containers: []
                        }
                    ]
                },
                {
                    id: 10,
                    element: "synonym",
                    label: "synonym",
                    headword: "",
                    multiple: true,
                    required: false,
                    type: "text",
                    options: "",
                    containers: []
                },
                {
                    id: 11,
                    element: "antonym",
                    label: "antonym",
                    headword: "",
                    multiple: true,
                    required: false,
                    type: "text",
                    options: "",
                    containers: []
                },
                {
                    id: 12,
                    element: "reference",
                    label: "references",
                    headword: "",
                    multiple: true,
                    required: false,
                    type: "textarea",
                    options: "",
                    containers: []
                },
                {
                    id: 13,
                    element: "comment",
                    label: "comments",
                    headword: "",
                    multiple: true,
                    required: false,
                    type: "textarea",
                    options: "",
                    containers: []
                }
            ]
        };

        $scope.addedUser = {login: '', perm: ''};
        $scope.addedHtmlTemplate = {name: '', code: '', template: ''};
        $scope.addedXSLTTemplate = {name: '', code: '', template: ''};

        $scope.users = [];

        $scope.usersMyConfig = {
            create: false,
            valueField: 'login',
            labelField: 'login',
            placeholder: 'Select user . . .',
            maxItems: 1,
            searchField: ['login', 'name', 'email'],
            render: {
                option: function (data, escape) {
                    return '<div><b>' + data.login + '</b> (' + data.name + ', ' + data.email + ')</div>';
                },
                item: function (data, escape) {
                    return '<div><b>' + data.login + '</b> (' + data.name + ', ' + data.email + ')</div>';
                }
            }
        };

        $scope.addContainer = function () {
            $scope.nextId = 0;
            if ($scope.newDictionary.containers.length > 0) {
                $scope.loadMaxId($scope.newDictionary.containers);
                $scope.nextId++;
            }
            $scope.newDictionary.containers.push({
                id: $scope.nextId,
                element: "",
                label: "",
                headword: "false",
                multiple: "false",
                required: "false",
                type: "text",
                options: "",
                containers: []
            });
        };

        $scope.loadMaxId = function (containers) {
            containers.forEach(function (value) {
                if (value.id > $scope.nextId) {
                    $scope.nextId = value.id;
                }
                if (value.containers.length > 0) {
                    $scope.loadMaxId(value.containers)
                }
            });
        };

        $scope.removeContainer = function (containers, id) {
            containers.some(function (value, key) {
                if (value.id == id) {
                    containers.splice(key, 1);
                    return true;
                }
                if (value.containers.length > 0) {
                    $scope.removeContainer(value.containers, id)
                }
            });
        };

        $scope.saveDictionary = function () {
            $scope.$broadcast('show-errors-check-validity');
            if ($scope.newDictionaryForm.$invalid) { return; }

            if ($routeParams.code != null) {
                $scope.edit = '1';
            } else {
                $scope.edit = '';
            }
            $http({
                method: 'JSONP',
                url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                params: {
                    action: 'dict_save',
                    edit: $scope.edit,
                    dict_code: $scope.newDictionary.code,
                    dict_name: $scope.newDictionary.name,
                    setting: JSON.stringify($scope.newDictionary)
                },
                responseType: 'json'
            }).
                then(function (response) {
                    if (response.data.status == 'OK') {
                        if ($routeParams.code == null) {
                            $rootScope.alert = {text: "Dictionary was created.", type: "success"};
                        } else {
                            $rootScope.alert = {text: "Dictionary was edited.", type: "success"};
                        }
                    } else {
                        $rootScope.alert = {text: response.data.text, type: "danger"};
                    }
                    $location.path('/newDictionary/' + response.data.dict_code);
                }, function (response) {
                    $rootScope.alert = {text: "Failure while saving dictionary.", type: "danger"};
                });
        };

        $scope.addUser = function(user) {

            user.login = (user.login).replace('<login>', '').replace('</login>', '');
            $http({
                method: 'JSONP',
                url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                params: {
                    action: 'user_add',
                    code: $scope.newDictionary.code,
                    login: user.login
                },
                responseType: 'json'
            }).
                then(function (response) {
                    if (response.data.status == 'OK') {
                        $scope.loadDictInfo();
                        $rootScope.alert = {text: "User was added.", type: "success"};
                    } else {
                        $rootScope.alert = {text: response.data.text, type: "danger"};
                    }
                }, function (response) {
                    $rootScope.alert = {text: "Failure while added user.", type: "danger"};
                });
        };

        $scope.removeUser = function($event, login) {
            var confirm = $mdDialog.confirm()
                .title('Realy remove?')
                .textContent('Are you sure, that you realy want remove user?')
                .ariaLabel('Confirm removing')
                .targetEvent($event)
                .ok('Remove')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                $http({
                    method: 'JSONP',
                    url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                    params: {
                        action: 'user_remove',
                        code: $scope.newDictionary.code,
                        login: login
                    },
                    responseType: 'json'
                }).
                    then(function (response) {
                        if (response.data.status == 'OK') {
                            $rootScope.alert = {text: "User was removed.", type: "success"};
                            $scope.loadDictInfo();
                        } else {
                            $rootScope.alert = {text: response.data.text, type: "danger"};
                        }
                    }, function (response) {
                        $rootScope.alert = {text: "Failure while remove user.", type: "danger"};
                    });
            }, function() {
                //canceled
            });
        };

        $scope.savePermission = function(user) {
            $http({
                method: 'JSONP',
                url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                params: {
                    action: 'user_add',
                    code: $scope.newDictionary.code,
                    login: user.login,
                    perm: user.perm
                },
                responseType: 'json'
            }).
                then(function (response) {
                    if (response.data.status == 'OK') {
                        $location.path('/newDictionary/' + $scope.newDictionary.code);
                        $rootScope.alert = {text: "Permission was changed.", type: "success"};
                    } else {
                        $rootScope.alert = {text: response.data.text, type: "danger"};
                    }
                }, function (response) {
                    $rootScope.alert = {text: "Failure while saving dictionary.", type: "danger"};
                });
        };

        $scope.addXSLTTemplate = function(xsltForm) {
            $scope.$broadcast('show-errors-check-validity');
            if (xsltForm.$invalid) { return; }

            $http({
                method: 'JSONP',
                url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                params: {
                    action: 'template_save',
                    dict: $scope.newDictionary.code,
                    code: $scope.addedXSLTTemplate.code,
                    name: $scope.addedXSLTTemplate.name,
                    template: escapeSemicolon($scope.addedXSLTTemplate.template)
                },
                responseType: 'json'
            }).
                then(function (response) {
                    if (response.data.status == 'OK') {
                        $scope.loadDictInfo();
                        $rootScope.alert = {text: "XSLT template was added.", type: "success"};
                        $scope.addedXSLTTemplate = {name: '', code: '', template: ''};
                    } else {
                        $rootScope.alert = {text: response.data.text, type: "danger"};
                    }
                }, function (response) {
                    $rootScope.alert = {text: "Failure while added XSLT template.", type: "danger"};
                });
        };

        $scope.editXSLTTemplate = function(template, xsltForm) {
            $scope.$broadcast('show-errors-check-validity');
            if (xsltForm.$invalid) { return; }

            $http({
                method: 'JSONP',
                url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                params: {
                    action: 'template_save',
                    dict: $scope.newDictionary.code,
                    code: template.code,
                    name: template.name,
                    template: escapeSemicolon(template.template)
                },
                responseType: 'json'
            }).
                then(function (response) {
                    if (response.data.status == 'OK') {
                        $scope.loadDictInfo();
                        $rootScope.alert = {text: "XSLT template was edited.", type: "success"};
                    } else {
                        $rootScope.alert = {text: response.data.text, type: "danger"};
                    }
                }, function (response) {
                    $rootScope.alert = {text: "Failure while edited XSLT template.", type: "danger"};
                });
        };

        $scope.generateXSLTTemplate = function(template) {
            $scope.headwordForTemplate = null;
            $scope.findHeadword($scope.newDictionary.containers);
            $scope.pomXSLTTemplate = '<?xml version=\'1.0\' encoding=\'utf-8\'?>\n' +
            '<xsl:stylesheet version=\'1.0\' xmlns:xsl=\'http://www.w3.org/1999/XSL/Transform\'>' +
            '<xsl:template match=\'/entry\'>' +
            '<html><head>' +
            '<meta content=\'text/html; charset=utf-8\' http-equiv=\'Content-Type\'/>' +
            '<title>' + $scope.newDictionary.name + ': <xsl:value-of select="' + $scope.headwordForTemplate + '"/> (DEBWrite)</title>' +
            '</head>\n<body>' +
            '<h1><xsl:value-of select="' + $scope.headwordForTemplate + '"/></h1>\n' +
            '<xsl:apply-templates/></body></html></xsl:template>\n';
                $scope.generateXSLTContainersRecursive($scope.newDictionary.containers);
            $scope.pomXSLTTemplate += '</xsl:stylesheet>';
            template.template = $scope.pomXSLTTemplate;
        };

        $scope.generateXSLTContainersRecursive = function (values) {
            angular.forEach(values, function(value, key) {
                if(value.type == 'container') {
                    $scope.pomXSLTTemplate += '<xsl:template match="' + value.element + '"><div class="' + value.element + '" style="border: 1px solid #000; background-color:#eee;">' + value.label + ': <xsl:apply-templates/></div><br/></xsl:template>\n';
                    $scope.generateXSLTContainersRecursive(value.containers);
                } else {
                    $scope.pomXSLTTemplate += '<xsl:template match="' + value.element + '"><span class="' + value.element + '">' + value.label + ': <xsl:apply-templates/></span><br/></xsl:template>\n';

                }
            });
        };

        $scope.removeXSLTTemplate = function($event, template) {
            var confirm = $mdDialog.confirm()
                .title('Realy remove?')
                .textContent('Are you sure, that you realy want remove XSLT template?')
                .ariaLabel('Confirm removing')
                .targetEvent($event)
                .ok('Remove')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                $http({
                    method: 'JSONP',
                    url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                    params: {
                        action: 'template_remove',
                        dict: $scope.newDictionary.code,
                        code: template.code
                    },
                    responseType: 'json'
                }).
                    then(function (response) {
                        if (response.data.status == 'OK') {
                            $rootScope.alert = {text: "XSLT template was removed.", type: "success"};
                            $scope.loadDictInfo();
                        } else {
                            $rootScope.alert = {text: response.data.text, type: "danger"};
                        }
                    }, function (response) {
                        $rootScope.alert = {text: "Failure while remove XSLT template.", type: "danger"};
                    });
            }, function() {
                //canceled
            });
        };

        function escapeSemicolon(text) {
            return text
                .replace(/;/g, "[-semicolon-]");
        }

        function unescapeSemicolon(text) {
            return text
                .replace(/\[-semicolon-\]/g, ";");
        }

        $scope.addHandlebar = function(handlebarForm) {
            $scope.$broadcast('show-errors-check-validity');
            if (handlebarForm.$invalid) { return; }

            $http({
                method: 'JSONP',
                url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                params: {
                    action: 'htemplate_save',
                    dict: $scope.newDictionary.code,
                    code: $scope.addedHtmlTemplate.code,
                    name: $scope.addedHtmlTemplate.name,
                    template: escapeSemicolon($scope.addedHtmlTemplate.template)
                },
                responseType: 'json'
            }).
                then(function (response) {
                    if (response.data.status == 'OK') {
                        $scope.loadDictInfo();
                        $rootScope.alert = {text: "Handlebar template was added.", type: "success"};
                        $scope.addedHtmlTemplate = {name: '', code: '', template: ''};
                    } else {
                        $rootScope.alert = {text: response.data.text, type: "danger"};
                    }
                }, function (response) {
                    $rootScope.alert = {text: "Failure while added handlebar template.", type: "danger"};
                });
        };

        $scope.editHandlebar = function(handlebar, handlebarForm) {
            $scope.$broadcast('show-errors-check-validity');
            if (handlebarForm.$invalid) { return; }

            $http({
                method: 'JSONP',
                url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                params: {
                    action: 'htemplate_save',
                    dict: $scope.newDictionary.code,
                    code: handlebar.code,
                    name: handlebar.name,
                    template: escapeSemicolon(handlebar.template)
                },
                responseType: 'json'
            }).
                then(function (response) {
                    if (response.data.status == 'OK') {
                        $scope.loadDictInfo();
                        $rootScope.alert = {text: "Handlebar template was edited.", type: "success"};
                    } else {
                        $rootScope.alert = {text: response.data.text, type: "danger"};
                    }
                }, function (response) {
                    $rootScope.alert = {text: "Failure while edited handlebar template.", type: "danger"};
                });
        };

        $scope.generateHandlebar = function(handlebar) {
            $scope.headwordForTemplate = null;
            $scope.findHeadword($scope.newDictionary.containers);
            $scope.pomHTMLTemplate = '<html><head><meta content=\'text/html; charset=utf-8\' http-equiv=\'Content-Type\'/><title>' +
            $scope.newDictionary.name + ': {{entry.' + ($scope.headwordForTemplate || 'empty') + '}} (DEBWrite)</title></head><body>\n<h1>{{entry.' + ($scope.headwordForTemplate || 'empty') + '}}</h1>\n';
                $scope.generateHTMLContainersRecursive($scope.newDictionary.containers);
            $scope.pomHTMLTemplate += '</body></html>';
            handlebar.template = $scope.pomHTMLTemplate;
        };

        $scope.generateHTMLContainersRecursive = function (values) {
            angular.forEach(values, function(value, key) {
                if(value.type == 'container') {
                    $scope.pomHTMLTemplate += '<div style="border: 1px solid #000">\n';
                        $scope.generateHTMLContainersRecursive(value.containers);
                    $scope.pomHTMLTemplate += '</div>\n';
                } else {
                    $scope.pomHTMLTemplate += '<span><b>' + value.label + '</b>: {{entry.' + value.element + '}}</span><br/>\n'
                }
            });
        };

        $scope.findHeadword = function(values) {
            angular.forEach(values, function(value, key) {
                if(value.type == 'container') {
                    $scope.findHeadword(value.containers);
                }
                if(value.headword != '') {
                    $scope.headwordForTemplate = value.element;
                }
            });
        };

        $scope.removeHandlebar = function($event, handlebar) {
            var confirm = $mdDialog.confirm()
                .title('Realy remove?')
                .textContent('Are you sure, that you realy want remove Handlebar template?')
                .ariaLabel('Confirm removing')
                .targetEvent($event)
                .ok('Remove')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                $http({
                    method: 'JSONP',
                    url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                    params: {
                        action: 'htemplate_remove',
                        dict: $scope.newDictionary.code,
                        code: handlebar.code
                    },
                    responseType: 'json'
                }).
                    then(function (response) {
                        if (response.data.status == 'OK') {
                            $rootScope.alert = {text: "Handlebar template was removed.", type: "success"};
                            $scope.loadDictInfo();
                        } else {
                            $rootScope.alert = {text: response.data.text, type: "danger"};
                        }
                    }, function (response) {
                        $rootScope.alert = {text: "Failure while remove handlebar template.", type: "danger"};
                    });
            }, function() {
                //canceled
            });
        };


        $scope.changeHeadword = function(cotaninerId) {
            $scope.changeHeadwordRecursive($scope.newDictionary.containers, cotaninerId);
        };
        $scope.changeHeadwordRecursive = function(values, id) {
            angular.forEach(values, function(value, key) {
                console.log(value);
                if(value.type == 'container') {
                    $scope.changeHeadwordRecursive(value.containers, id);
                }
                if (value.id == id && value.type != 'container') {
                    value.headword = 'true';
                } else {
                    value.headword = '';
                }
            });
        };


        $scope.loadDictInfo = function () {
            $http({
                method: 'JSONP',
                url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                params: {action: 'dict_info', code: $routeParams.code},
                responseType: 'json'
            }).
                then(function (response) {
                    if (response.data.status == 'OK') {
                        console.log(response);
                        $scope.newDictionary.name = response.data.dict_name;
                        $scope.newDictionary.code = response.data.dict_code;
                        $scope.newDictionary.containers = JSON.parse(response.data.schema).containers;
                        $scope.dictionaryUsers = response.data.users;
                        $scope.dictionaryOwner = response.data.owner;

                        var pomXSLTTemplates = response.data.templates;
                        angular.forEach(pomXSLTTemplates, function(value, key) {
                            pomXSLTTemplates[key].template = unescapeSemicolon(pomXSLTTemplates[key].template);
                        });
                        $scope.xsltTemplates = pomXSLTTemplates;

                        var pomHtmlTemplates = response.data.htemplates;
                        angular.forEach(pomHtmlTemplates, function(value, key) {
                            pomHtmlTemplates[key].template = unescapeSemicolon(pomHtmlTemplates[key].template);
                        });
                        $scope.htmlTemplates = pomHtmlTemplates;

                    } else {
                        $scope.showForm = false;
                        $rootScope.alert = {text: response.data.text, type: "danger"};
                    }
                }, function (response) {
                    $rootScope.alert = {text: "Failure while removing dictionary.", type: "danger"};
                });
        };







        $scope.init = function () {
            $rootScope.dictDetail = $routeParams.code;
            if ($routeParams.code != null) {
                $scope.editPage = true;

                $scope.loadDictInfo();

                     //load users
                $http({
                    method: 'JSONP',
                    url: 'https://abulafia.fi.muni.cz:9050/admin?callback=JSON_CALLBACK',
                    params: {action: 'user_all'},
                    responseType: 'json'
                }).
                then(function (response) {
                    if (response.data.status == 'OK') {
                        $scope.users = response.data.users;
                    } else {
                    }
                }, function (response) {
                });

            } else {
                $scope.editPage = false;
            }
        };

    }]).directive("uniqueNameDict", function(){
        // requires an isloated model
        return {
            // restrict to an attribute type.
            restrict: 'A',
            // element must have ng-model attribute.
            require: 'ngModel',
            link: function(scope, ele, attrs, ctrl){

                // add a parser that will process each time the value is
                // parsed into the model when the user updates it.
                ctrl.$parsers.unshift(function(value) {
                    if(value){

                        var keyProperty = scope.$eval(attrs.uniqueNameDict);
                        console.log(keyProperty);


                        var valid = false;
                        ctrl.$setValidity('invalidUniqueNameDict', valid);
                    }

                    // if it's valid, return the value to the model,
                    // otherwise return undefined.
                    return valid ? value : undefined;
                });

            }
        }
    });
