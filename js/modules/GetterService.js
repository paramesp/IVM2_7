/**
 * @author Karen Robine
 */

(function () {
    "use strict";

    define([
        'angular'
    ], function (angular) {
        
        function GetterService($q, $http) {

            return {

                //http://stackoverflow.com/questions/18755201/angularjs-http-get-to-get-json-not-working-in-the-service-layer
                //Some articles on using deferred promise stuff: following is a good example of $q.all (but it waits for everything to come back)
                //http://stackoverflow.com/questions/18673890/angularjs-promises-q-defer
                //http://stackoverflow.com/questions/12505760/angularjs-processing-http-response-in-service
                //This is a work in progress. Nothing has been tested at all
                getAllDataViaHTTP: function(urlArray) {
                    var array = [],
                        i = 0;
                    for (i=0; i < urlArray.length; i++) {
                        //TODO: I should call fixRelativeURL
                        array.push($http.get(urlArray[i]));
                    }
                    
                    return $q.all(array);
                },
                
                //https://docs.angularjs.org/api/ng/service/$http
                //https://www.themarketingtechnologist.co/caching-http-requests-in-angularjs/ 
                //Code current sets all caching to false.  TODO: Need to check performance          
                getDataViaHTTP: function(url) {
                    var deferred = null;
                    if (url) {
                        deferred = $q.defer();
                        //console.log("GetterService.js: getDataViaHTTP() url= " + url);
                        $http.get(url, {cache: false}).then(function (data) {
                            //console.log("GetterService() getDataViaHTTP(): happiness url= ", url);
                            deferred.resolve(data);                                
                        },
                        function (error) {
                            console.log("GetterService() getDataViaHTTP: Problem getting data. Error=", error);
                            deferred.reject(error);
                        }); 
                        return deferred.promise;                       
                    }
                    return null;
                },
                
                getDataViaHTTP1: function(url) {
                    //http://stackoverflow.com/questions/19916362/angularjs-how-to-make-a-jsonp-request
                    var deferred = null;
                    if (url) {
                        deferred = $q.defer();
                        $http.get(url).then(function (data, status, headers, config) {
                            //console.log("GetterService() getDataViaHTTP(): happiness");
                            deferred.resolve(data);                                
                        },
                        function (data) {
                            console.log("GetterService() getDataViaHTTP: Problem getting data. daata=", data);
                            deferred.reject(error);
                        }); 
                        return deferred.promise;                       
                    }
                    return null;
                },
                
                 getDataViaJSONP: function(url) {
                    //http://stackoverflow.com/questions/19916362/angularjs-how-to-make-a-jsonp-request
                    var deferred = null;
                    if (url) {
                        if (url.indexOf("callback")< 0) {
                            url = url + "?callback=JSON_CALLBACK";
                        }
                        console.log("GetterService.js: getDataViaJSONP url= ", url);
                        deferred = $q.defer();
                        $http.jsonp(url).then(function (data, status, headers, config) {
                            console.log("GetterService() getDataViaJSONP(): happiness");
                            deferred.resolve(data);                                
                        },
                        function (error) {
                            console.log("GetterService() getDataViaJSONP: Problem getting data. daata=", error);
                            deferred.reject(error);
                        }); 
                        return deferred.promise;                       
                    }
                    return null;
                }                                                              
            };

        }

        function init(App) {
            App.factory('GetterSrvc', ['$q', '$http', GetterService]);
            return GetterService;
        }

        return { start: init };

    });

}).call(this);