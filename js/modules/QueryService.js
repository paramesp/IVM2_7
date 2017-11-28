/**
 * @author Karen Robine
 */

(function () {
    "use strict";

    define([
        'angular',
        'dojo/promise/all',
        'dojo/_base/lang',
        'esri/tasks/query',
        'esri/tasks/QueryTask',
        'js/config',
        'js/errorMsgs',
        'js/helpers/utils'
    ], function (angular, all, lang, Query, QueryTask, config, errorMsgs, utils) {

        function queryGen(params) {
            return  lang.mixin(new Query(), params);
        }

        function prepareQuery(key, keyType, value, returnGeom, sr, geomPrecision, maxOffset) {
            var queryString = (keyType == "string") ? [key, " = '", value, "'"].join('') : [key, " = ", value].join('');
            return queryGen({
                where: queryString,
                outFields: [key],
                returnGeometry: returnGeom,
                maxAllowableOffset: maxOffset,
                outSpatialReference: sr,
                geometryPrecision: geomPrecision
            });
        }        
        
        function QueryService($q, $log) {

            return {
                
                //getExtent used for zoom to State-Forest
                getExtent: function (key, keyType, value, url, returnGeom, sr) {
                    var deferred = $q.defer();
                    var qTask = new QueryTask(url);
                    //https://developers.arcgis.com/javascript/jsapi/querytask-amd.html#executeforextent
                    //https://developers.arcgis.com/javascript/jsapi/query-amd.html
                    //TODO: I am not sure that the maxAllowableOffset makes any difference here. I added it to mapHelper though
                    //In IVM 1, it was used for Identify. The code is actually over in MapClickHandler. Maybe we should move it to mapUtils.
                    qTask.executeForExtent(prepareQuery(key, keyType, value, false, sr, 1, 300)).then(
                        function (featureSet) {
                            deferred.resolve(featureSet);
                        },
                        function (error) {
                            $log.error("QueryService.js: getExtent() Error follows: ", error);
                            deferred.reject(error);
                        });
                    return deferred.promise;
                }, 
                

                //work in progress using http://chariotsolutions.com/blog/post/angularjs-corner-using-promises-q-handle-asynchronous-calls/
                //This is currently called from Identify Controller code
                processQueryArray: function(promiseArray) {
                    var deferred = $q.defer();
                    $q.all(promiseArray)
                        .then(
                            function(results) {
                                deferred.resolve(results);
                            },
                            function(error) {
                                deferred.reject(error);
                            }
                        );
                    return deferred.promise;
                }
            };
        }

        function init(App) {
            App.factory('QuerySrvc', ['$q', '$log', QueryService]);
            return QueryService;
        }

        return { start: init };

    });

}).call(this);