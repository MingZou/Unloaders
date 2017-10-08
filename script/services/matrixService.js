app.service('matrixService', function ($http, $q) {


    this.getMatrix = function (paras , callback) {


        var service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: paras.origins,
            destinations: paras.destinations,
            travelMode: google.maps.TravelMode.DRIVING,
            
            
            durationInTraffic: true,
            avoidHighways: true,
            avoidTolls: true,
          },callback);

        
    };

    

    function handleError(response) {
        if (!angular.isObject(response.data) || !response.data.message) {
            return ($q.reject("An unknown error occurred."));
        }

        return ($q.reject(response.data.message));
    }


});



