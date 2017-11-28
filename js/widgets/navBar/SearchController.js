/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular',
            'dojo/_base/lang',
            'underscore',
            'js/config',
            'js/errorMsgs',
            'js/helpers/mapHelper',
            'js/helpers/utils',
            'js/modules/LayerMaker',
            'js/modules/ClusterHandler',
            'js/modules/LayerDefsHandler',
            'js/modules/QueryTaskHandler',
            'js/modules/DataHandler',
            "js/modules/Graphics",
            ], function(angular, lang, _, config, errorMsgs, mapHelper, utils, LayerMaker, ClusterHandler, LayerDefsHandler, QueryTaskHandler, DataHandler, Graphics) {

        //PictureMarkerSymbol:  https://developers.arcgis.com/javascript/3/jsapi/picturemarkersymbol-amd.html
        //http://help.arcgis.com/en/arcgisserver/10.0/apis/rest/symbol.html#pms
        function addGraphic(text, point, map, markerSymbol, deviceIsBrowser, searchData) {                
            var graphic = null;
            //var graphicsLayer = map.getLayer(config.GenericSearch.geocodeGraphicLayer.id);
            if (!searchData.geocodeGraphicsLayer) {
                var layerMaker = new LayerMaker({
                    map : map,
                    doLayers : false,
                    deviceIsBrowser: deviceIsBrowser,
                    doReorderGraphicLayer: false
                });
                searchData.geocodeGraphicsLayer = layerMaker.createGraphicsLayerForClustering(true, config.GenericSearch.geocodeGraphicLayer.minScale, config.GenericSearch.geocodeGraphicLayer.maxScale, config.GenericSearch.geocodeGraphicLayer);               
                map.addLayer(searchData.geocodeGraphicsLayer, layerMaker.getGraphicLayerIndex());
            }
         
            if (searchData.geocodeGraphicsLayer && point) {
                searchData.geocodeGraphicsLayer.clear(); // it only has one
                var gra = new Graphics({graphicsLayer: searchData.geocodeGraphicsLayer});
                //https://developers.arcgis.com/javascript/jsapi/graphic-amd.html#graphic2
                var gJson = {
                    "geometry": {"x": point.x, "y": point.y, "spatialReference": {"wkid": 102100}},
                    "symbol": markerSymbol,
                    "attributes": {"address": text}
                };
                graphic = gra.addGraphicToGraphicLayerJson(gJson);                    
            }                

            return graphic;         
        } 
               
        function cleanSearchData(sString) {
            return sString.trim();
        }

        function doReQueryOnPan(val, activityObj, queryObject, scope) {            
            if (activityObj.reQueryObject) {
                var pan = scope.map.on("pan-end", function(evt) {
                    if (activityObj.reQueryObject && mapHelper.isScaleWithinMapScale(activityObj.reQueryObject.minScale, activityObj.reQueryObject.maxScale, scope.map)) {
                        scope.processGDataRequest(val, activityObj, queryObject, true); 
                    }
                });
                return pan;                
            }
            return null;
        }

        function doReQueryOnZoom(val, activityObj, queryObject, scope) {
            if (activityObj.reQueryObject) {
                var zoom = scope.map.on("zoom-end", function(evt) {                    
                    if (activityObj.reQueryObject) {                                                                       
                        if (mapHelper.isScaleWithinMapScale(activityObj.reQueryObject.minScale, activityObj.reQueryObject.maxScale, scope.map)) {
                            //console.log("SearchController.js: doReQueryOnZoom() zoomed in.. evt= ", evt);                           
                            scope.processGDataRequest(val, activityObj, queryObject, true);                            
                        } else if (queryObject.queryService.type){
                           //Just reload original data. but only if we are coming from
                            var clusterHandler = new ClusterHandler({
                                map: scope.map,
                                deviceIsBrowser: scope.deviceIsBrowser,
                                layerMaker: getLayerMaker(activityObj, queryObject, scope.navBarData.requiredJson, scope.map, scope.deviceIsBrowser),
                                activityObj: activityObj,
                                queryObject: queryObject,
                                clusterOptions: config.queryPanels.clusterOptions                    
                            });
                            //console.log("SearchController.js: doReQueryOnZoom() about to regenerate.  scope.navBarData.searchData.layers= ", scope.navBarData.searchData.layers);
                            scope.navBarData.searchData.layers = clusterHandler.regenerateClusters(queryObject.queryService.type, null, scope.navBarData.searchData.layers);
                        }                                       
                    }
                    //console.log("SearchController.js: doReQueryOnZoom() map Scale = " + scope.map.getScale() + " map level= " + scope.map.getLevel() + " scope.navBarData.selItem= ", scope.navBarData.selItem);
                });
                return zoom;                
            }
            return null;
        }
        

        function getActivityObjectRoads() {
            var qLayer = _.findWhere(config.queryPanels.activityOptionsArray, {key: config.GenericSearch.type}); 
            return {
                key: config.GenericSearch.type,
                queryLayerKey: (qLayer && qLayer.queryLayerKey) ? qLayer.queryLayerKey: "roadsQuery",
                layers: config.GenericSearch.layers,
                reQueryObject: config.GenericSearch.reQueryObject
            };            
        }
        
        function getLayerMaker(activityObj, queryObject, requiredJson, map, deviceIsBrowser) {
            var markerData = (requiredJson && requiredJson.data) ? utils.getObjectUsingKey("marker", requiredJson.data) : null;
            var reQueryObject = (activityObj && activityObj.reQueryObject) ? activityObj.reQueryObject : null;
            return (new LayerMaker({
                    map : map,
                    doLayers : false,
                    deviceIsBrowser: deviceIsBrowser,
                    markerData: (markerData && markerData.data) ? markerData.data : null,
                    markerDataField: (markerData && markerData.attKey) ? markerData.attKey : null,
                    queryObject: queryObject,
                    reQueryObject: reQueryObject,
                    doReorderGraphicLayer: false
            }));
        }
      
        
        function getSearchGeocodeURLs(text) {
            var rURLs = [];
            _.each(config.GenericSearch.geocodeLayers, function(lyr) {
                rURLs.push(getURL(true, lyr.url, lyr.parameters, text, lyr.maxSuggestions));
            });            
            return rURLs;
        }
        
        function getURL(doSearch, url, parameters, text, lastObj) {
            if (doSearch) {
               return utils.stringFormat((url + parameters), text, lastObj); 
            }
            return utils.stringFormat((url + parameters), text, lastObj);
        }
        
        function isValidLatters(val, text) {
            if (text.toUpperCase().indexOf(val.toUpperCase()) > -1) {
                return true;
            }
            return false;
        }
        
        function processAddressCandidate(candidate, lyr, text, map, pointScale, distance, deviceIsBrowser, searchData, timeout) {            
            if (candidate && lyr ) {               
                if (candidate.location && lyr.markerSymbol) {
                    addGraphic(text, candidate.location, map, lyr.markerSymbol, deviceIsBrowser, searchData);
                }                
                var doExtent = ((lyr.zoomType == "both" || lyr.zoomType == "extent") && (candidate.extent && !utils.isExtentAPoint(candidate.extent) && !utils.isExtentWithinDistance(candidate.extent.xmin, candidate.extent.ymin, candidate.extent.xmax, candidate.extent.ymax, distance))) ?
                    true :
                    false;
                                  
                if (candidate.location && candidate.location.x && candidate.location.y && !isNaN(candidate.location.x) && (lyr.zoomType == "point" || !doExtent)) {
                    //zoom to x and y with scale
                    //console.log("SearchController.js: processAddressCandidate() About to zoom to a point location at set scale, " + pointScale + " map= ", map);
                    timeout(function() {
                        mapHelper.zoomToPoint(candidate.location.y, candidate.location.x, pointScale, map.spatialReference.wkid, map);
                    }, 600);                                        
                    return true;
                } else if (doExtent) {
                    //zoom to extent
                    //TODO: Could have occasional bug in MapController line 153: scope.apply
                    //console.log("SearchController.js: processAddressCandidate() About to set the map extent: map= ", map);
                    timeout(function() {
                        mapHelper.zoomToExtent(candidate.extent.xmin, candidate.extent.ymin, candidate.extent.xmax, candidate.extent.ymax, map);
                    }, 600);                                        
                    return true; 
                }                
            }
            console.log("SearchController.js: processAddressCandidate() PROBLEM.. not zooming most likely due to invalid x/y location or extent= ", candidate);
            return false;
        }
 

                   
        //************************************************************************
        //  Search Controller
        //************************************************************************

        function SearchController($scope, $log, $sce, $timeout, GetterSrvc, QuerySrvc) {

            //http://stackoverflow.com/questions/24513564/angularjs-directive-call-method-from-parent-scope-within-template            
            $scope.$watch('stateForestData.selStateValue', function(newVal, oldVal) {
                //$log.info("SearchController.js: watch stateForestData.selStateValue: newVal= " + newVal + " oldVal= " + oldVal + " $scope.stateForestData= ", $scope.stateForestData);
                if ($scope.stateForestData.forestArray.length > 0) {
                    $scope.stateForestData.currentForestArray = utils.getForestArray(newVal, $scope.stateForestData.stateForestArray, $scope.stateForestData.forestArray);
                    if ($scope.stateForestData.currentForestArray != null && $scope.stateForestData.currentForestArray.length > 0) {                   
                        if ($scope.stateForestData.currentForestArray[0].Value  &&  $scope.stateForestData.currentForestArray[0].Value.length > 0) {
                            $scope.stateForestData.currentForestArray.unshift({Value: "", Name: config.StateForestQuery.forestMessage.hasData});                            
                        }                        
                    } else {
                        $scope.stateForestData.currentForestArray[0] = {Value: "", Name: config.StateForestQuery.forestMessage.noData};                                               
                    }
                    $scope.stateForestData.selForestValue = $scope.stateForestData.currentForestArray[0];                      
                }                                                   
            });
            
            //second time user opens search, we need to show the search value, and allow them to click return to bring up results 
            $scope.checkIfCanSelectVal = function() {
                if (!$scope.navBarData.searchData.isExecuting && $scope.navBarData.searchData.inputText && $scope.navBarData.searchData.searchText && $scope.navBarData.searchData.searchText.length > 0) {
                    return true;                
                }
                return false;
            };
                     
            $scope.clearSearch = function(fromCode, fromSuggest) {                
                //$log.info("clearSearch fromCode= " + fromCode + " fromSuggest= " + fromSuggest);
                if (!$scope.map.isKeyboardNavigation) {
                    mapHelper.setKeyboardNavigation($scope.map, true);
                }
                
                if (!fromCode) {
                    //this happens when user hits clear button
                    $scope.navBarData.searchData.inputText = null;
                    $scope.navBarData.searchData.searchText = "";
                }                
                if ($scope.navBarData && $scope.navBarData.searchData) {
                    if ($scope.navBarData.searchData.layers && $scope.navBarData.searchData.layers.length > 0) {
                        utils.clearReQueryEvents($scope.navBarData.searchData.reQueryEvents); 
                        $scope.navBarData.searchData.layers = mapHelper.removeLayers($scope.map, $scope.navBarData.searchData.layers, true, true);
                        config.GenericSearch.data = null; //the queryObject.data goes here.
                    }
                    if ($scope.navBarData.searchData.geocodeGraphicsLayer && !fromSuggest)  {
                        $scope.navBarData.searchData.geocodeGraphicsLayer.clear();
                    }                    
                }                
            };
            
            //closeMe probably needs some tuning.
            $scope.closeMe = function() {
                //$scope.navBarData.searchData.showTextBox = false;
                if (!$scope.map.isKeyboardNavigation) {
                    mapHelper.setKeyboardNavigation($scope.map, true);
                }
                $timeout(function() {
                    $scope.navBarData.searchData.isExecuting = false;
                    $scope.toggleNavBarDropdown();
                    $scope.setFocusFromSearch();
                }, 600);               
            };

            $scope.getLocationGeocode = function(val) {              
                //$log.info("getLocationGeocode() val= ", val);
                $scope.clearSearch(true, true);
                var urls = getSearchGeocodeURLs(val);
                 
                return GetterSrvc.getAllDataViaHTTP(urls)
                  .then(function(promiseObjects) {
                        var i = 0,
                            items = []; 
                        _.each(promiseObjects, function(promiseObject) {
                            var lyr = config.GenericSearch.geocodeLayers[i];
                            if (promiseObject && promiseObject.data && promiseObject.data.suggestions) {                                
                                //$log.info("Current Value = " + val + " : number of suggestions: " + promiseObject.data.suggestions.length + " for layer, " + lyr.url);
                                var j = 0;
                                _.each(promiseObject.data.suggestions, function(item) {                                    
                                    if (j < lyr.maxSuggestions && isValidLatters(val, item.text)) {
                                        //in arcgis before 10.4, maxSuggestions only returns 5 results. this if clause isnt necessary from 10.4 on
                                        item.layerIndex = i;
                                        item.image = lyr.image;
                                        item.addViewAllResults = false;   
                                        //$log.info("getLocationGeocode() val= " + val + " item= ", item);
                                        items.push(item);
                                        j++;                                        
                                    }                                    
                                });                               
                            } 
                            
                            if (lyr.addViewAllResults && items.length > 0) {
                                var viewText = config.GenericSearch.geocodeParameters.viewAllResults.text;
                                if (!config.GenericSearch.geocodeParameters.viewAllResults.didTrustAsHtml) {
                                    viewText = $scope.toTrusted(config.GenericSearch.geocodeParameters.viewAllResults.text);
                                    config.GenericSearch.geocodeParameters.viewAllResults.text = viewText;
                                    config.GenericSearch.geocodeParameters.viewAllResults.didTrustAsHtml = true;
                                }                                                                   
                                items.push(config.GenericSearch.geocodeParameters.viewAllResults);
                            }
                            i++;                            
                        });
                        if ($scope.navBarData.searchData.inputText != 'undefined' && $scope.navBarData.searchData.inputText.length > 0) {
                            $scope.navBarData.searchData.searchText = $scope.navBarData.searchData.inputText;
                        }
                        //$log.info("SearchController.js: getLocationGeocode(): val= " + val + " items= ", items); 
                        if (items.length > 0 && $scope.map.isKeyboardNavigation) {
                            mapHelper.setKeyboardNavigation($scope.map, false);
                        }                       
                        return items;
                });                             
            }; 
            
            $scope.onSelectGeocode = function($item, $model, $label) {
                //$log.info("onSelectGeocode() is executing: $item", $item);
                $scope.navBarData.searchData.isExecuting = true;
                if ($item && $item.text && $item.layerIndex != 'undefined' && $item.layerIndex < config.GenericSearch.geocodeLayers.length &&
                  $item.text != config.GenericSearch.geocodeParameters.viewAllResults.text) {
                    var lyr = config.GenericSearch.geocodeLayers[$item.layerIndex];
                    if (lyr) {
                        var url = getURL(false, lyr.url, lyr.paramGetAddress, $item.text, $item.magicKey);
                        
                        GetterSrvc.getDataViaHTTP(url).then(function(response) {
                            //$log.info("onSelectGeocode() response=", response);
                            if (response && response.data && response.data.candidates && response.data.candidates.length > 0) {
                                //$log.info("onSelectGeocode() got a candiate=", response.data.candidates[0]);
                                processAddressCandidate(response.data.candidates[0], lyr, $item.text, $scope.map, config.GenericSearch.geocodeParameters.pointZoomScale, config.GenericSearch.geocodeParameters.extentDistance, $scope.deviceIsBrowser, $scope.navBarData.searchData, $timeout);                               
                                $scope.closeMe();
                            }
                        });                        
                    }                   
                } else if ($item.text == config.GenericSearch.geocodeParameters.viewAllResults.text) {                   
                   $scope.prepareSearch();  //Need to do a cluster 
                }  
            }; 
                        
            $scope.prepareSearch = function()  {				
                var val = cleanSearchData($scope.navBarData.searchData.searchText);
                if (val == "") {
                    alert(errorMsgs.Search.noData);
                } else {
                    //$scope.clearSearch(true, false);                                                         
                    $scope.showHideWaitDiv(true);
                    var queryObject = lang.clone(config.GenericSearch);
                    var activityObj = lang.clone(getActivityObjectRoads());
                    $scope.navBarData.searchData.searchText = val;
                    $scope.navBarData.searchData.inputText = config.GenericSearch.geocodeParameters.viewAllResults.textNonHtml;
                    $scope.setFocusFromSearch();
                    $scope.processGDataRequest(val.toUpperCase(), activityObj, queryObject, false);                   
                }
            };

            $scope.processGenericClusters = function(val, graphics, activityObj, queryObject, fromReQuery) {
                var clusterHandler = new ClusterHandler({
                    map: $scope.map,
                    deviceIsBrowser: $scope.deviceIsBrowser,
                    layerMaker: getLayerMaker(activityObj, queryObject, $scope.navBarData.requiredJson, $scope.map, $scope.deviceIsBrowser),
                    activityObj: activityObj,
                    queryObject: queryObject,
                    queryService: QuerySrvc,
                    clusterOptions: queryObject.clusterOptions,
                    clusterLayers: $scope.navBarData.searchData.layers
                });

                if (fromReQuery) {
                   $scope.navBarData.searchData.layers = clusterHandler.regenerateClusters("", graphics, $scope.navBarData.searchData.layers);
                } else {
                    $scope.navBarData.searchData.layers = clusterHandler.processClusters(graphics, null, true, "" );                    
                    if (graphics == null || graphics.length == 0) {
                        alert(errorMsgs.NavBar.clusters.noGraphics);
                    }                   
                }
            };
            
            $scope.processGDataResults = function(theData, val, activityObj, queryObject, fromReQuery) {
                var rangerDistrictData = utils.getObjectUsingKey("rangerDistrict", $scope.navBarData.requiredJson.data);
                var rdKey = (rangerDistrictData && rangerDistrictData.attKey) ? rangerDistrictData.attKey : "";
                var dh = new DataHandler({
                    map: $scope.map,
                    activityObj: activityObj,
                    queryObject: queryObject,
                    rdCentroids: rangerDistrictData.data,
                    rdKey: rdKey,
                    fromReQuery: fromReQuery,
                    singlePointMinExtent: config.GenericSearch.geocodeParameters.singlePointMinExtent,
                    fromGeneric: true
                });
                var clusterArr = dh.processJson(theData);
                if (clusterArr && clusterArr.length > 0) {
                    if (!fromReQuery) {
                        queryObject.data = clusterArr; //This actually sets it inside the config file. Full dataset
                    }                        
                    //new code 012417 to handle zooming to extent of results.
                    var extent = dh.dataExtent;
                    if (extent) {
                        //$log.info("SearchController.js: processDataResults() fromReQuery= " + fromReQuery + " Total number of features = " + clusterArr.length + " extent= ", extent);
                        var extChg = $scope.map.on("extent-change", function(evt) {                                                      
                            if (extChg) {
                                extChg.remove();
                            }                            
                            $scope.processGDataResultsContinue(val, activityObj, queryObject, fromReQuery, clusterArr); 
                        });
                        mapHelper.zoomToExtent(extent.xmin, extent.ymin, extent.xmax, extent.ymax, $scope.map, true);
                    } else {
                       $scope.processGDataResultsContinue(val, activityObj, queryObject, fromReQuery, clusterArr); 
                    }                                                                                                                             
                 } else {
                    $scope.showHideWaitDiv(false);
                    if (theData && theData.error && theData.error.message) {
                       alert(errorMsgs.DataError);
                    } else if (!fromReQuery) {
                        alert(errorMsgs.Search.nothingReturned);
                    }
                 }
            };

            $scope.processGDataResultsContinue = function(val, activityObj, queryObject, fromReQuery, clusterArr) {
                $scope.processGenericClusters(val, clusterArr, activityObj, queryObject, fromReQuery);
                if (!fromReQuery) {
                    var bDidReqEvents = $scope.setGReQueryProcessing(val, activityObj, queryObject);
                    if (bDidReqEvents && activityObj.reQueryObject && mapHelper.isScaleWithinMapScale(activityObj.reQueryObject.minScale, activityObj.reQueryObject.maxScale, $scope.map)) {
                        //in this case, the user was zoomed in so we need to call a zoomed in request to only obtain zoomed in data
                        $scope.processGDataRequest(val, activityObj, queryObject, true);
                    } else {
                       $scope.showHideWaitDiv(false); 
                    }
                } else {
                  $scope.showHideWaitDiv(false);  
                }
                $scope.closeMe();           
            
            };
                
            $scope.processGDataRequest = function(val, activityObj, queryObject, fromReQuery) {
                $scope.showHideWaitDiv(true);
                if (fromReQuery && queryObject.queryService && queryObject.queryService.queries) {
                    var ldh = LayerDefsHandler({
                        url: config.FeatureService.url,
                        query: (queryObject.featureService) ? queryObject.featureService : queryObject.queryService,
                        params: config.FeatureService.parameters,
                        map: $scope.map,
                        doExtent: fromReQuery 
                    });
                    $scope.processGSingleRequest(ldh.getURL(val), val, activityObj, queryObject, fromReQuery);                    
                } else {
                    var qth = QueryTaskHandler({
                        url: config.FeatureService.url
                    });
                    var queryO = qth.getQueryTaskPromiseArray(qth.replaceQueries(val, queryObject.queryService.queries));
                    $scope.processGMultipleRequest(queryO, val, activityObj, queryObject, fromReQuery);                    
                }                
            };

            $scope.processGMultipleRequest = function(promiseArray, val, activityObj, queryObject, fromReQuery) {
                var dStart = new Date();
                QuerySrvc.processQueryArray(promiseArray)
                    .then(function(promiseObject){
                        var dEnd = new Date();
                        //$log.info("SearchController.js: processMultipleRequest() Total Get Data Load Time= " + (dEnd - dStart) / 1000 + " seconds. ");
                        var theData = (promiseObject.data) ? promiseObject.data : promiseObject;
                        if (theData) {
                            $scope.processGDataResults(theData, val, activityObj, queryObject, fromReQuery);
                        }
                    }, function(error) {
                        $scope.showHideWaitDiv(false);
                        $log.error("SearchController.js: processMultipleRequest() Failure. Unable to retrieve json items", error);
                        (error && error.message) ?
                            alert(errorMsgs.DataError):
                            alert(errorMsgs.NavBar.clusters.jsonProblem);
                    }
                );
            };

            $scope.processGSingleRequest = function(url, val, activityObj, queryObject, fromReQuery) {
                $scope.showHideWaitDiv(true);
                var dStart = new Date();                           
                GetterSrvc.getDataViaHTTP(url).then(function(promiseObject) {
                    var dEnd = new Date();
                    //$log.info("SearchController.js: processGSingleRequest() Total Get Data Load Time= " + (dEnd - dStart) / 1000 + " seconds. ");
                    var theData = (promiseObject.data) ? promiseObject.data : promiseObject;
                    if (theData) {
                        $scope.processGDataResults(theData, val, activityObj, queryObject, fromReQuery);                 
                    }
                  }, function(error) {
                        $scope.showHideWaitDiv(false);
                        $log.error("SearchController.js: processGSingleRequest() Failure. Unable to retrieve json items", error);
                        (error && error.message) ?
                            alert(errorMsgs.DataError):
                            alert(errorMsgs.NavBar.clusters.jsonProblem);
                  });                  
            };
            
            $scope.setFocusFromSearch = function() {   
                angular.element("#headerSearch").focus();                                  
            };
                       
            $scope.setGReQueryProcessing = function(val, activityObj, queryObject) {
                if (activityObj && activityObj.reQueryObject) {
                    utils.clearReQueryEvents($scope.navBarData.searchData.reQueryEvents); //clear any existing
                    $scope.navBarData.searchData.reQueryEvents.panEvent =  doReQueryOnPan(val, activityObj, queryObject, $scope);
                    $scope.navBarData.searchData.reQueryEvents.zoomEvent = doReQueryOnZoom(val, activityObj, queryObject, $scope);
                    return true;                                     
                } else if ($scope.navBarData.searchData.reQueryEvents.panEvent) {
                    utils.clearReQueryEvents($scope.navBarData.searchData.reQueryEvents);
                }
                return false;
            };

            $scope.toTrusted = function(html_code) {                
                return $sce.trustAsHtml(html_code);
            };
                        
            $scope.zoomToStateForest = function() {
                if ($scope.stateForestData.selStateValue.length == 0 && (!$scope.stateForestData.selForestValue || $scope.stateForestData.selForestValue.Value == "" || $scope.stateForestData.selForestValue.Value == config.StateForestQuery.forestMessage.hasData)) {
                    alert(errorMsgs.StateForest.selectionErr);
                } else {                                     
                    var stForObj = ($scope.stateForestData.selForestValue && $scope.stateForestData.selForestValue.Value && $scope.stateForestData.selForestValue.Value != "" && $scope.stateForestData.selForestValue.Value != config.StateForestQuery.forestMessage.hasData) ?
                        _.findWhere($scope.stateForestData.forestArray, {Name: $scope.stateForestData.selForestValue.Name}): 
                        _.findWhere($scope.stateForestData.stateArray, {StateCode: $scope.stateForestData.selStateValue});
                        
                    if (stForObj && stForObj.XMin && stForObj.YMin && stForObj.XMax && stForObj.YMax) {
                        mapHelper.setKeyboardNavigation($scope.map, true);
                        mapHelper.zoomToExtent(parseFloat(stForObj.XMin), parseFloat(stForObj.YMin), parseFloat(stForObj.XMax), parseFloat(stForObj.YMax), $scope.modalObject.map);
                        
                        $scope.toggleNavBarDropdown();
                    }
                }                
            };
        }

        function init(App) {
            App.controller('SearchCtrl', ['$scope', '$log', '$sce', '$timeout', 'GetterSrvc', 'QuerySrvc', SearchController]);
            return SearchController;
        }

        return {
            start : init
        };
    });

}).call(this);