/**
 * @author Karen Robine
 */

(function () {
    "use strict";

    define([
        'angular',
        'js/config',
        'js/errorMsgs',
        'js/helpers/utils',
        'js/helpers/mapHelper'
    ], function (angular, config, errorMsgs, utils, mapHelper) {

        function getTitle(tab, modelData) {
            var title = tab.title;
            if (tab.isGraphics) {
                if (modelData && modelData.length > 1) {
                    title += " (" + modelData.length.toString() + ")";
                }               
            } else {
                title = (modelData && modelData.title && modelData.title.length > 0) ? modelData.title : tab.title;
            }
            return title;
        }     

        //************************************************************************
        //  Identify Service
        //  Angular services are singletons that carry out specific tasks common to web apps
        //  Handles generic code shared in both Modal (Mobile) and non-modal (Browser) case
        //http://stackoverflow.com/questions/15509457/passing-current-scope-to-an-angularjs-service        
        //I dont think i am doing scope right.  Maybe dont do it this way, and pass in identifyData instead. And maybe instead of setTitle. JUST use getTitle
        //************************************************************************        
        function IdentifyService($log, $sce, $window, QuerySrvc) {

            return {
                getTitle: function(key, identifyData) {
                    if (key && key.length > 0) {
                        //$log.info("IdentifyController.js: setTitle() key= " + key + " $scope.identifyData.tabs= ", $scope.identifyData.tabs);
                        var tab = utils.getObjectUsingKey(key, identifyData.tabs);
                        if (tab && tab.isGraphics) {
                            return getTitle(tab, tab.graphicsData); 
                        } else if (tab && tab.dataObject) {                    
                            return getTitle(tab, tab.dataObject);                        
                        } else if (tab.title) {
                            return tab.title;
                        }                           
                    }
                    return "";                  
                },
                
                HTMLToTrusted: function(html_code) {                
                    return $sce.trustAsHtml(html_code);
                },                

                zoomToExtent: function(key, tabs, map, stateForestData) {
                    var didZoom=false;

                    var tab = utils.getObjectUsingKey(key, tabs);          
                    var lyrConfig = utils.getObjectUsingKey(key, config.QueryLayers);
                
                    if (tab && tab.dataObject && tab.dataObject.value) {
                        if (tab.isForest && stateForestData) {
                            var stForObj = _.findWhere(stateForestData.forestArray, {Name: tab.dataObject.title}); 
                            if (stForObj && stForObj.XMin) {
                                mapHelper.zoomToExtent(parseFloat(stForObj.XMin), parseFloat(stForObj.YMin), parseFloat(stForObj.XMax), parseFloat(stForObj.YMax), map);
                                didZoom = true;
                            }                                            
                        } else if (lyrConfig) {
                            //wilderness zoom for example
                            var fld = _.findWhere(lyrConfig.fields, {UseForUniqueValue: true}); 
                            if (fld && lyrConfig.urls && lyrConfig.urls.length > 0) {
                                mapHelper.queryAndZoomToExtent(fld.FieldName, fld.DataType, tab.dataObject.value, lyrConfig.urls[0], map, QuerySrvc);
                                didZoom = true;                   
                            } else {
                                console.log("IdentifyService.js: Unable to zoom to extent.");
                            } 
                        }                   
                    } 
                    if (!didZoom && tab && tab.title) {
                        alert(utils.stringFormat(errorMsgs.Identify.missingData.zoomToForestData, tab.title));
                    }                        
                }                            
            };
        }

        function init(App) {
            App.factory('IdentifySrvc', ['$log', '$sce', '$window', 'QuerySrvc', IdentifyService]);
            return IdentifyService;
        }

        return { start: init };

    });

}).call(this);