(function () {
    "use strict";

    define([
        'angular',
        'underscore',     
        'js/config',
        'js/errorMsgs',
        'js/helpers/utils',
        'text!jsoninstant/MapSource.json',
        'dojo/json'
    ], function (angular, _, config, errorMsgs, utils, MapSource,JSON) {
       
       function getURLValues(){
            var urlParameters = {};
            var query = window.location.search;
            if (query.indexOf('?') > -1) {
                query = query.substr(1);
            }
            var pairs = query.split('&');
            if (query){
                for(var i = 0; i < pairs.length; i++){
                    var splits = decodeURIComponent(pairs[i]).split('=');
                    urlParameters[splits[0]] = splits[1];
                }
            }          
         return urlParameters;
       };

      function RequestHandlerService($q,$log){
       
       var processURL={};
       
       //1. Process the request URL and read the parameters
       processURL.URLValues=getURLValues();

       //2. Get the map service key and replace the $$$ value
       processURL.setMapServiceKey=function (){
           var data;
           try{
                data = JSON.parse(MapSource,true);  
                this.processMapService(data["MapServiceSource"]) 
           }catch(error){
               this.processMapService(config.MapServices.initialKey);
           }                       
       };

       processURL.processMapService=function (key) {
            var msObj = utils.getObjectUsingKey(key, config.MapServices.mapServiceDomains);
            (msObj && msObj.location)  ?
                config.replaceURLs(msObj.location):               
                $log.error("RequestHandlerService. Unable to retrieve json item from " + config.MapServices.fileName + " using bad key name, " + key); //Bad Key in json file                       
        }
       processURL.isValidParameters=function(urlParams){
           var status={ allParamExists:true, error:"" };      
           angular.forEach(urlParams,function(value,key){
                if (!_.contains(config.request.validKeys,key)){
                    status.allParamExists=false;
                    status.error="Invalid parameter(s) found in the URL. Please check the URL is correct.";
                    $log.warn(status.error);
                }
           },status);
           return status;               
       };
       
       return processURL;     
      
      }
      function init(App) {
            App.factory('RequestHandlerService', ['$q', '$log', RequestHandlerService]);
            return RequestHandlerService;
      }

      return { start: init };  
    });

}).call(this);        