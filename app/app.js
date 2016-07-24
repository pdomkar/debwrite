'use strict';

// Declare app level module which depends on views, and components
angular.module('debwrite', [
  'ngRoute',
  'debwrite.dictionaries',
  'debwrite.dictionariesNew'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
      $locationProvider.hashPrefix('');

      $routeProvider.when('/dictionaries', {
            templateUrl: 'dictionaries/dictionaries.html',
            controller: 'DictionariesCtrl'}).
          when('/dictionariesNew', {
            templateUrl: 'dictionariesNew/dictionariesNew.html',
            controller: 'DictionariesNewCtrl'
          }).
          otherwise('/dictionaries');
}]);
