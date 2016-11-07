'use strict';

/* Filters */

var cacheCleanerFilters = angular.module('cacheCleanerFilters', [])
    .filter('renameCacheOrLocalStorage', function() {
        return function(input) {
            input = input.replace(".", "-");
            input = input.replace("dhis2","ARDS Web Portal");
            return input;
        };
    }).filter('renameIdDb', function() {
        return function(input) {
            return input.replace("dhis2","ARDS Web Portal ");
        };
    });