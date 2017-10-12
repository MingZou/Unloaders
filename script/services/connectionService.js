app.service('connectionService', function ($http, $q) {
    baseUrl = "http://localhost:59080"

    this.startEvolution = function (object) {


        var request = $http({
            method: "POST", url: baseUrl + "/api/evolution/pathsearching",
            data: {
                object: object
            }
        });

        return (request.then(
             function (result) {
                return angular.fromJson(result.data);
             }, handleError
         ));
    };

    this.startEvolutionForTraveller = function (object) {
        
        
                var request = $http({
                    method: "POST", url: baseUrl + "/api/evolution/traveller",
                    data: object
                });
        
                return (request.then(
                     function (result) {
                        return angular.fromJson(result.data);
                     }, handleError
                 ));
            };


    function handleError(response) {
        if (!angular.isObject(response.data) || !response.data.message) {
            return ($q.reject("An unknown error occurred."));
        }

        return ($q.reject(response.data.message));
    }


});



