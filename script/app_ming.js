
var app = angular.module('app', ['ngRoute', 'angular-loading-bar']);

app.config(function ($routeProvider) {

    $routeProvider.when("/home", {
        controller: "homeController",
        templateUrl: "/views/home.html"
    });
    
    $routeProvider.when("/map", {
        controller: "mapController",
        templateUrl: "/views/map.html"
    });

    $routeProvider.when("/traveller", {
        controller: "travellerController",
        templateUrl: "/views/traveller.html"
    });


    


    $routeProvider.otherwise({ redirectTo: "/home" });

});



























