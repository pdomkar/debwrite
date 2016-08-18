'use strict';

// Declare app level module which depends on views, and components
angular.module('debwrite', [
    'ngRoute',
    'debwrite.dictionaries',
    'debwrite.newDictionary',
    'debwrite.dictionary',
    'debwrite.newEntry',
    'debwrite.import',
    'ui.bootstrap.showErrors',
    'ngMaterial'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
      $locationProvider.hashPrefix('');

      $routeProvider.
          when('/dictionaries', {
            templateUrl: 'dictionaries/dictionaries.html',
            controller: 'DictionariesCtrl'
          }).
          when('/dictionaries/:code', {
              templateUrl: 'dictionary/dictionary.html',
              controller: 'DictionaryCtrl'
          }).
          when('/newDictionary', {
            templateUrl: 'newDictionary/newDictionary.html',
            controller: 'NewDictionaryCtrl'
          }).
          when('/newDictionary/:code', {
              templateUrl: 'newDictionary/newDictionary.html',
              controller: 'NewDictionaryCtrl'
          }).
          when('/newEntry/:code', {
              templateUrl: 'newEntry/newEntry.html',
              controller: 'NewEntryCtrl'
          }).
          when('/newEntry/:code/:id', {
              templateUrl: 'newEntry/newEntry.html',
              controller: 'NewEntryCtrl'
          }).
          when('/dictionaries/import/:code', {
              templateUrl: 'dictionaries/import/import.html',
              controller: 'ImportCtrl'
          }).
          otherwise('/dictionaries');

}]).config(['showErrorsConfigProvider', function(showErrorsConfigProvider) {
        showErrorsConfigProvider.showSuccess(true);
    }]).run(['$rootScope', '$timeout', '$routeParams', function($rootScope, $timeout, $routeParams) {

        $rootScope.alert = {text: '', type: 'success'};
        $rootScope.$watch('alert', function(newVal, oldVal){
            $timeout(function() {
                $rootScope.alert.text = '';
            }, 3000);
        }, true);
    }]).directive('slideToggle', [
        function() {
            return {
                restrict: 'A',
                scope:{
                    isOpen: "=slideToggle" // 'data-slide-toggle' in our html
                },
                link: function(scope, element, attr) {
                    var slideDuration = parseInt(attr.slideToggleDuration, 10) || 200;

                    // Watch for when the value bound to isOpen changes
                    // When it changes trigger a slideToggle
                    scope.$watch('isOpen', function(newIsOpenVal, oldIsOpenVal){
                        if(newIsOpenVal !== oldIsOpenVal){
                            element.stop().slideToggle(slideDuration);
                        }
                    });

                }
            };
        }]).directive('showErrors', function ($timeout, showErrorsConfig) {
        var getShowSuccess, linkFn;
        getShowSuccess = function (options) {
            var showSuccess;
            showSuccess = showErrorsConfig.showSuccess;
            if (options && options.showSuccess != null) {
                showSuccess = options.showSuccess;
            }
            return showSuccess;
        };
        linkFn = function (scope, el, attrs, formCtrl) {
            var blurred, inputEl, inputName, inputNgEl, options, showSuccess, toggleClasses;
            blurred = false;
            options = scope.$eval(attrs.showErrors);
            showSuccess = getShowSuccess(options);
            inputEl = el[0].querySelector('[name]');
            inputNgEl = angular.element(inputEl);
            inputName = inputNgEl.attr('name');
            if (!inputName) {
                throw 'show-errors element has no child input elements with a \'name\' attribute';
            }
            inputNgEl.bind('blur', function () {
                blurred = true;
                return toggleClasses(formCtrl[inputName].$invalid);
            });
            scope.$watch(function () {
                return formCtrl[inputName] && formCtrl[inputName].$invalid;
            }, function (invalid) {
                if (!blurred) {
                    return;
                }
                return toggleClasses(invalid);
            });
            scope.$on('show-errors-check-validity', function () {
                return toggleClasses(formCtrl[inputName].$invalid);
            });
            scope.$on('show-errors-reset', function () {
                return $timeout(function () {
                    el.removeClass('has-error');
                    el.removeClass('has-success');
                    return blurred = false;
                }, 0, false);
            });
            return toggleClasses = function (invalid) {
                el.toggleClass('has-error', invalid);
                if (showSuccess) {
                    return el.toggleClass('has-success', !invalid);
                }
            };
        };
        return {
            restrict: 'A',
            require: '^form',
            compile: function (elem, attrs) {
                if (!elem.hasClass('form-group')) {
                    throw 'show-errors element does not have the \'form-group\' class';
                }
                return linkFn;
            }
        };
    }
).directive('changeNewLines', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModelController) {
            ngModelController.$parsers.push(function(data) {
                //convert data from view format to model format
                return data.replace(/\n/g, '-newLine-');
            });

            ngModelController.$formatters.push(function(data) {
                //convert data from model format to view format
                return data.replace(/-newLine-/g, '\n');
            });
        }
    }
}).directive('loading', function () {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="loading"><div id="loader"></div></div>',
        link: function (scope, element, attr) {
            scope.$watch('loading', function (val) {
                if (val) {
                    $(element).show();
                    $(element).height(10000);
                } else {
                    $(element).hide();

                }
            });
        }
    }
}).filter('capitalize', function() {
    return function(input) {
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});
