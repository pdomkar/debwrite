'use strict';

// Declare app level module which depends on views, and components
angular.module('debwrite', [
    'ngRoute',
    'debwrite.dictionaries',
    'debwrite.newDictionary',
    'debwrite.dictionary',
    'debwrite.newEntry'
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
          otherwise('/dictionaries');

}]).directive('ngConfirmClick', [
    function(){
        return {
            priority: 1,
            terminal: true,
            link: function (scope, element, attr) {
                var msg = attr.ngConfirmClick || "Are you sure?";
                var clickAction = attr.ngClick;
                element.bind('click',function (event) {
                    if ( window.confirm(msg) ) {
                        scope.$eval(clickAction)
                    }
                });
            }
        };
    }])
    .directive('slideToggle', [
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
        }]);
