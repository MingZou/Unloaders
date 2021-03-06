'use strict';
app.controller('travellerController', ['$scope', 'matrixService', '$timeout', 'connectionService', function ($scope, matrixService,  $timeout, connectionService) {

    //initialize();
    
    

    $scope.settingWorkers = true;
    $scope.workerLocations = [];
    $scope.customerLocations = [];
    
    var workerMarkers = [];
    var customerMarkers = [];
    var workerLabels = [];
    var customerLabels = [];
    
    var speed = 100; 

    var addressArray = []; 
    
    $scope.finalSolution = [];

    $scope.parameters = {
    planDays : 5,
    workTime : {start:7, end:19}, 
    dailyWorkingHours : 8,
    salary: 200,
    overtimeSalary: 300,
    overloadSalary: 400,
    trafficCost: 1
    };

    $scope.calculateWaitingMsg = null; 
    
    $scope.totalDistance = [];
    $scope.penalty = {forCapacity: 100, forTime: 90, forTravelTime: 40};
    
    $scope.matrix = [];
    var distanceMatrix = [];
    
    $scope.pageNumber = 1;
    
    $scope.iteration = 0;
    
    $scope.pathDraw = null; 
    
    $scope.showLines = function (solution){
        if(null != $scope.pathDraw)
        {
            $scope.pathDraw.setMap(null); 
            $scope.pathDraw = null; 
        }

        var coordinates = [];
        solution.forEach(function(sl) {
            if(!sl.worker){
                coordinates.push( addressArray[sl.CustomerNumber]);
            }else{
                coordinates.push( addressArray[sl.number]);
            }
        }, this);
        
        $scope.pathDraw  = new google.maps.Polyline({
            path: coordinates,
            geodesic: true,
            strokeColor: '#0000FF',
            strokeOpacity: 1.0,
            strokeWeight: 2
          });
          
        $scope.pathDraw.setMap($scope.map);
    }
    
    
    $scope.calculate = function (){
        var jsObj = {
            Parameters : $scope.parameters,
            TimeMatrix:  $scope.matrix,
            DistanceMatrix: distanceMatrix,
            WorkerNumber: $scope.workerLocations.length,
            Customers : $scope.customerLocations
        };
        
        
        
        $scope.calculateWaitingMsg = "wait..  it's coming";
        connectionService.startEvolutionForTraveller(jsObj).then(
            function (solution) {
                $scope.calculateWaitingMsg = null;
                $scope.finalSolution = solution.Order;
                $scope.finalSolution.forEach(function(slt, i) {
                    slt.unshift({worker: true, number: i});
                    slt.push({worker: true, number: i});
                }, this);
                $scope.totalDistance = solution.TotalDistances;
            }, function (err){
                $scope.calculateWaitingMsg = null;
                alert(err); 
            }
        );
    }
    
    
    
    var callback = function(response, status){
        if("OK"==status)
        {
            for(var i = 0 ; i < response.rows.length; i++)
            {
                var timeArr = [];
                var distanceArr = [];
                for(var j = 0; j < response.rows[i].elements.length; j++)
                {
                    if(null == response.rows[i].elements[j].duration)
                    {
                        if(j == 0)
                        {
                            alert("your factory may located on the water, I can't caculate :(");
                        }
                        else{
                            alert("one customer is unreachable(inside the water), customer: " + j);
                        }
                        $scope.$apply(function () { 
                             $scope.matrix= [];
                             distanceMatrix = [];
                            $scope.iteration = 0;
                        });
                        return ;
                    }
                    timeArr.push(Math.round(response.rows[i].elements[j].duration.value/36)/100);
                    distanceArr.push(Math.round(response.rows[i].elements[j].distance.value/1000));
                }
                $scope.$apply(function () { 
                 $scope.matrix.push(timeArr);
                 distanceMatrix.push(distanceArr);
                });
            }
            if($scope.iteration >= $scope.customerLocations.length + $scope.workerLocations.length -1)
            {
                $scope.$apply(function () { 
                    $scope.iteration =0;
                });
                 
                return ;
            }
            $scope.$apply(function () { 
                $scope.iteration ++;
            });
            
            
            $timeout(function(){ $scope.getMatrix($scope.iteration); }, 3000);

           
        }
        else{
            $scope.$apply(function () { 
                 $scope.matrix= [];
                 distanceMatrix= [];
                 $scope.iteration = 0;
             });
            
            alert("failed to get distances, status: " + status);
        }
    }
    
    $scope.stopMatrix = function (){
        $scope.iteration = 99;
    }

    var concatWorkerAndCustomerLocations = function(addArray){
        $scope.workerLocations.forEach(function(worker) {
            var fact_ = new google.maps.LatLng(worker.lat, worker.lng);
            addArray.push(fact_);
        }, this);
        
        for(var i = 0; i< $scope.customerLocations.length; i++)
        {
            var dest_ = new google.maps.LatLng($scope.customerLocations[i].lat, $scope.customerLocations[i].lng);
            addArray.push(dest_);
        }
    }
    
    $scope.getMatrix = function (iter_){
        var ori_des = {origins: null, destinations : null};
        if(0 == iter_)
        {    
            $scope.matrix= [];
            distanceMatrix= [];            
            $scope.iteration = 0;
        }
        addressArray = [];
        concatWorkerAndCustomerLocations(addressArray);
        
        ori_des.origins = [addressArray[iter_]];
        ori_des.destinations = addressArray
        
        matrixService.getMatrix(ori_des, callback);

        
    }
    
    $scope.changePage = function (pageNum){
        
        $scope.pageNumber = pageNum;
    }
    
    $scope.initialize = function () {
            

            var myLatlng = new google.maps.LatLng(59, 16.5);

            var mapOptions = {
                center: myLatlng,
                zoom: 8,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                draggableCursor: 'default'
            };
            var map = new google.maps.Map(document.getElementById("map"),
                mapOptions);


            $scope.map = map;

            google.maps.event.addListener($scope.map, "click", function (event) {
                var latitude = event.latLng.lat();
                var longitude = event.latLng.lng();
                if(1!= $scope.pageNumber || $scope.customerLocations.length >=24)
                {return ;}
                addMarker(latitude, longitude);
                saveToQueues(latitude, longitude);
            });

            
    }; 
    
    google.maps.event.addDomListener(window, "load", $scope.initialize());
    
    function addMarker(lat_, long_) {
           // console.log('animation ' + $scope.events[iteration].id);
           
           
            
            var image = 'images/beachflag.png';
            
            if(!$scope.settingWorkers)
            {
                image = 'images/bluePoint.png';
            }
            
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(lat_, long_),
                map: $scope.map,
                draggable: false,
                text: 'Test',
                icon: image,
                animation: google.maps.Animation.DROP
            });
            
            

            if($scope.settingWorkers){
                workerMarkers.push(marker);
            }
            else{
                customerMarkers.push(marker);
            }
            
            if($scope.pathDraw != null)
            {
                $scope.pathDraw.setMap(null); 
                $scope.pathDraw = null;
            }
    };
    
    var saveToQueues = function (lat_, long_){
        //console.log( lat_ + ', ' + long_);
        if($scope.matrix.length >0)
        {
            $scope.matrix = [];
            distanceMatrix= [];
        }
        
        if($scope.settingWorkers)
        {
            $scope.$apply(function () { 
                 $scope.workerLocations.push({lat:lat_, lng:long_});
             });
           
             var label = new MarkerWithLabel({
                position: new google.maps.LatLng(lat_, long_),
                map: $scope.map,
                icon: " ",
                title: "Marker Title",
                labelText: $scope.workerLocations.length,
                labelClass: "labels"
            });
            workerLabels.push(label);
        }
        else{
            var load_ = Math.floor((Math.random()*(4))+2);
            $scope.$apply(function () { 
                 $scope.customerLocations.push( {lat:lat_, 
                                        lng:long_,
                                        demandedDay: null,
                                        demandedPerson : null,
                                        workLoad: load_});
                                    
             });
             var label = new MarkerWithLabel({
                position: new google.maps.LatLng(lat_, long_),
                map: $scope.map,
                icon: " ",
                title: "Marker Title",
                labelText: $scope.customerLocations.length + ":" + $scope.customerLocations[$scope.customerLocations.length-1].workLoad + "hrs",
                labelClass: "labels"
            });
            customerLabels.push(label);
        }
    };
    
    $scope.resetFactory  = function (){
        $scope.workerLocations.pop();
        workerLabels[workerLabels.length-1].setMap(null);
        workerLabels.pop();
        workerMarkers[workerMarkers.length-1].setMap(null);
        workerMarkers.pop();
        if($scope.pathDraw != null)
        {
            $scope.pathDraw.setMap(null); 
            $scope.pathDraw = null;
        }
    }
    
    $scope.clearCustomer = function (){
        customerMarkers[customerMarkers.length-1].setMap(null);
        customerMarkers.pop();
        customerLabels[customerLabels.length-1].setMap(null);
        customerLabels.pop();
        $scope.customerLocations.pop();
        
        if($scope.pathDraw != null)
        {
            $scope.pathDraw.setMap(null); 
            $scope.pathDraw = null;
        }
    }
}]);