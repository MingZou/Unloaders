'use strict';
app.controller('travellerController', ['$scope', 'matrixService', '$timeout', 'connectionService', function ($scope, matrixService,  $timeout, connectionService) {

    //initialize();
    
    

    $scope.settingWorkers = true;
    $scope.workerLocations = [];
    $scope.customerLocations = [];
    
    var factoryMarkers = [];
    var customerMarkers = [];
    var factoryLabels = [];
    var speed = 100; 
    
    $scope.finalSolution = [];
    $scope.workTime = {start:7, end:18};

    $scope.calculateWaitingMsg = null; 
    
    $scope.trucks = [
        {capacity: 34},{capacity: 34}
    ]
    $scope.totalDistance = [];
    $scope.penalty = {forCapacity: 100, forTime: 90, forTravelTime: 40};
    
    $scope.matrix = [];
    
    $scope.pageNumber = 1;
    
    $scope.iteration = 0;
    
    $scope.pathDraw = null; 
    
    $scope.addTruck = function (add){

        if(true == add){
            if($scope.trucks.length <= 3)
            {
                $scope.trucks.push({capacity: 34});
            }
        }
        else{
            if($scope.trucks.length>=2)
            {
                $scope.trucks.pop();
            }
        }
    }
    
    $scope.showLines = function (truckNum){
        if(null != $scope.pathDraw)
        {
            $scope.pathDraw.setMap(null); 
            $scope.pathDraw = null; 
        }
        var coordinates = [];
        coordinates.push( new google.maps.LatLng($scope.settingWorkers.lat, $scope.settingWorkers.lng));
        for(var i = 0; i< $scope.finalSolution[truckNum].length; i++)
        {
            if(0 == $scope.finalSolution[truckNum][i].locationNumber)
            {
                coordinates.push( new google.maps.LatLng($scope.settingWorkers.lat, $scope.settingWorkers.lng));
            }
            else
            {
                coordinates.push( new google.maps.LatLng($scope.customerLocations[$scope.finalSolution[truckNum][i].locationNumber-1].lat, $scope.customerLocations[$scope.finalSolution[truckNum][i].locationNumber-1].lng));
            }
        }
        
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
        var openWindows = [];
        openWindows.push({
                start: $scope.workTime.start,
                end: $scope.workTime.end,
                load: 0
            });
        for(var i = 0 ; i< $scope.customerLocations.length ; i++)
        {
            openWindows.push({
                start: $scope.customerLocations[i].start,
                end: $scope.customerLocations[i].end,
                load: $scope.customerLocations[i].load
            });
        }
        var jsObj = {
            trucks : $scope.trucks,
            penalty : $scope.penalty,
            timeMatrix:  $scope.matrix,
            openWindows: openWindows
        };
        
        
        
        $scope.calculateWaitingMsg = "wait..  it's coming";
        connectionService.startEvolution(jsObj).then(
            function (solution) {
                $scope.calculateWaitingMsg = null;
                $scope.finalSolution = [];
                $scope.totalDistance = [];
                var floatMark = 0; 
                for(var i = 0; i < $scope.trucks.length; i++)
                {
                    var oneSolution = [];
                    var dist_= 0; 
                    for(var j = floatMark + 1; j < solution.unloadInfos.length; j ++)
                    {   
                        oneSolution.push(solution.unloadInfos[j]);
                        dist_ += $scope.matrix[oneSolution[oneSolution.length -1].locationNumber][oneSolution.length == 1 ? 0: oneSolution[oneSolution.length -2].locationNumber] * speed
                        if(0 == solution.unloadInfos[j].locationNumber)
                        {
                            floatMark = j; 
                            
                            break; 
                        }
                        
                    }
                    $scope.totalDistance.push(dist_);
                            dist_ = 0;
                     $scope.finalSolution.push(oneSolution);
                }
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
                for(var j = 0; j < response.rows[i].elements.length; j++)
                {
                    if(null == response.rows[i].elements[j].duration)
                    {
                        if(j == 0)
                        {
                            alert("your factory may lacated on the water, I can't caculate :(");
                        }
                        else{
                            alert("one customer is unreachable(inside the water), customer: " + j);
                        }
                        $scope.$apply(function () { 
                             $scope.matrix= [];
                            $scope.iteration = 0;
                        });
                        return ;
                    }
                    timeArr.push(Math.round(response.rows[i].elements[j].duration.value/36)/100);
                }
                $scope.$apply(function () { 
                 $scope.matrix.push(timeArr);
                });
            }
            if($scope.iteration >= $scope.customerLocations.length)
            {
                $scope.$apply(function () { 
                    $scope.iteration =0;
                });
                 
                return ;
            }
            $scope.$apply(function () { 
                $scope.iteration ++;
            });
            
            
            if(0 == $scope.iteration)
            {
                $scope.getMatrix($scope.iteration);
            }
            else{
                $timeout(function(){ $scope.getMatrix($scope.iteration); }, 3000);
            }
           
        }
        else{
            $scope.$apply(function () { 
                 $scope.matrix= [];
                 $scope.iteration = 0;
             });
            
            alert("failed to get distances, status: " + status);
        }
    }
    
    $scope.stopMatrix = function (){
        $scope.iteration = 99;
    }
    
    $scope.getMatrix = function (iter_){
        var ori_des = {origins: null, destinations : null};
        if(0 == iter_)
        {    
            $scope.matrix= [];
            $scope.iteration = 0;
        }
        
        var addArr_ = []; 
        
        var fact_ = new google.maps.LatLng($scope.settingWorkers.lat, $scope.settingWorkers.lng);
        addArr_.push(fact_);
        
        for(var i = 0; i< $scope.customerLocations.length; i++)
        {
            var dest_ = new google.maps.LatLng($scope.customerLocations[i].lat, $scope.customerLocations[i].lng);
            addArr_.push(dest_);
        }
        
        ori_des.origins = [addArr_[iter_]];
        ori_des.destinations = addArr_
        
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
                factoryMarkers.push(marker);
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
        }
        
        if($scope.settingWorkers)
        {
            $scope.$apply(function () { 
                 $scope.workerLocations.push({lat:lat_, 
                                            lng:long_, 
                                            start: $scope.workTime.start, 
                                            end: $scope.workTime.end});
             });
           
        }
        else{
            var startTime_ = Math.floor((Math.random()*($scope.workTime.end - $scope.workTime.start-1))+ $scope.workTime.start);
            var endT_ = ($scope.workTime.end - startTime_)>4 ? 4 : ($scope.workTime.end - startTime_)
            var endTime_ = Math.floor((Math.random()*(endT_))+ startTime_+1);
            
            var load_ = Math.floor((Math.random()*(5))+1);
            $scope.$apply(function () { 
                 $scope.customerLocations.push( {lat:lat_, 
                                        lng:long_,
                                        start: startTime_,
                                        end : endTime_,
                                        load: load_});
                                    
                // customerMarkers[customerMarkers.length -1].set("labelContent",startTime_);
             });
             var label = new MarkerWithLabel({
                position: new google.maps.LatLng(lat_, long_),
                map: $scope.map,
                icon: " ",
                title: "Marker Title",
                labelText: $scope.customerLocations.length + ":" + startTime_ + "/" + endTime_,
                labelClass: "labels"
            });
            factoryLabels.push(label);
        }
    };
    
    $scope.resetFactory  = function (){
        $scope.settingWorkers = null; 
         factoryMarkers[0].setMap(null);
        factoryMarkers = [];
        if($scope.pathDraw != null)
        {
            $scope.pathDraw.setMap(null); 
            $scope.pathDraw = null;
        }
    }
    
    $scope.clearCustomer = function (){
        customerMarkers[customerMarkers.length-1].setMap(null);
        factoryLabels[customerMarkers.length-1].setMap(null);
        factoryLabels.pop();
        customerMarkers.pop();
        $scope.customerLocations.pop();
        
        if($scope.pathDraw != null)
        {
            $scope.pathDraw.setMap(null); 
            $scope.pathDraw = null;
        }
    }
}]);