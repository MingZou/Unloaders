'use strict';
app.controller('mapController', ['$scope', '$location', function ($scope, $location) {
        


     var initialize = function () {
            

             var myLatlng = new google.maps.LatLng(59, 17);

            var mapOptions = {
                center: myLatlng,
                zoom: 15,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            var map = new google.maps.Map(document.getElementById("map"),
                mapOptions);

            //Marker + infowindow + angularjs compiled ng-click
            /*      var contentString = "<div><a ng-click='clickTest()'>Click me!</a></div>";
            var compiled = $compile(contentString)($scope);

            var infowindow = new google.maps.InfoWindow({
                content: compiled[0]
            });

            var marker = new google.maps.Marker({
                position: myLatlng,
                map: map,
                title: $scope.activity.eventName
            });

            google.maps.event.addListener(marker, 'click', function () {
                infowindow.open(map, marker);
            });
            */
           


            $scope.map = map;

          /*  if ("all" != $stateParams.eventId) {
                var activity = EventService.get($stateParams.eventId);

                drop(activity);
            }*/


           

           
            
    }; 
    
    
initialize();


}]);