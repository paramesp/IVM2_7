/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular', 
            'js/config', 
            'underscore',
            'js/helpers/utils',
            'js/helpers/mapHelper',
            'js/modules/LayerMaker',
            'js/modules/LayerDefsHandler',
            'js/modules/QueryTaskHandler',
            'js/modules/ClusterHandler',
            'js/modules/DataHandler', 
            'esri/symbols/PictureMarkerSymbol',
            'js/errorMsgs'            
            ], function(angular, config, _, utils, mapHelper, LayerMaker, LayerDefsHandler, QueryTaskHandler, ClusterHandler, DataHandler, PictureMarkerSymbol, errorMsgs) {
        
        function closeInfoWindow(map, deviceIsBrowser) {
            if (deviceIsBrowser && map.infoWindow && map.infoWindow.isShowing) {
                map.infoWindow.hide();
            }
        }
        var x =[{'id':0,'source':{'type':'mapLayer','mapLayerId':0},'drawingInfo':{'renderer':{'type':'simple','symbol':{'type':'esriSFS','style':'esriSFSSolid','color':[255,0,0,255],"outline" : {"type" : "esriSLS", "style" : "esriSLSSolid", "color" : [110,110,110,255], "width" : 1.0 }}}}}]

        function doReQueryOnPan(val, activityObj, queryObject, scope) {            
            if (activityObj.reQueryObject) {
                var pan = scope.map.on("pan-end", function(evt) {
                    if (activityObj.reQueryObject && mapHelper.isScaleWithinMapScale(activityObj.reQueryObject.minScale, activityObj.reQueryObject.maxScale, scope.map)) {
                        scope.processDataRequest(val, activityObj, queryObject, true); 
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
                            //console.log("NavBarController.js: doReQueryOnZoom() zoomed in.. evt= ", evt);                           
                            scope.processDataRequest(val, activityObj, queryObject, true);                            
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
                            //console.log("NavBarController.js: doReQueryOnZoom() about to regenerate.  scope.navBarData.clusterLayers= ", scope.navBarData.clusterLayers);
                            scope.navBarData.clusterLayers = clusterHandler.regenerateClusters(queryObject.queryService.type, null, scope.navBarData.clusterLayers);
                        }                                       
                    }
                    //console.log("NavBarController.js: doReQueryOnZoom() map Scale = " + scope.map.getScale() + " map level= " + scope.map.getLevel() + " scope.navBarData.selItem= ", scope.navBarData.selItem);
                });
                return zoom;                
            }

            return null;
        }
        
        function getActivityObject(queryObject) {
            if (queryObject && queryObject.type && config.queryPanels.activityOptionsArray && config.queryPanels.activityOptionsArray.length > 0) {
                return (utils.getObjectUsingKey(queryObject.type, config.queryPanels.activityOptionsArray));
            }
            return null;
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
        
        function getURLArray(jsonLoc, arr) {
            var urls = [];
            if (arr && arr.length > 0) {
                _.each(arr, function(arrObj) {
                    if (arrObj && arrObj.fileName) {
                        urls.push(utils.getJSONFileLocation(jsonLoc, arrObj.fileName));
                    }                    
                });
            }
            return urls;
        }      

        function isGraphicValueLegal(queryObject, attributes) {
            var bRtn = false;
            _.each(queryObject.lyrValue, function(val, i) {
                var key = queryObject.queryField[i];                     
                if (val == attributes[key] || isGraphicValueNotNull(val, attributes[key])) {
                    bRtn = true;
                }
            }, this);
            return bRtn;
        }
        
        function isGraphicValueNotNull(queryVal, attVal) {
            if (queryVal && queryVal.toUpperCase() == "IS NOT NULL" && attVal && attVal.trim().length > 0) {
                return true;
            } else {
                return false;
            }
        } 
        
        function processMapService(key, log) {
            var msObj = utils.getObjectUsingKey(key, config.MapServices.mapServiceDomains);
            (msObj && msObj.location)  ?
                config.replaceURLs(msObj.location):               
                log.error("NavBarController GetterSrvc.getDataViaHTTP()Failure. Unable to retrieve json item from " + config.MapServices.fileName + " using bad key name, " + key); //Bad Key in json file                       
        }
        
        //TODO: This shouldnt be necessary. Eventually have Nathan fix this.  Except I still might need the sortBy to keep forests in alphabetical order
        function rejectSelectAForestAndSort(arr) {
            var rtnA = _.reject(arr, function(arrO) {
                return (arrO.Name && arrO.Name == config.StateForestQuery.forestMessage.hasData);
            }); 
            return _.sortBy(rtnA, 'Name');
        }     

        //after a query completes. we will set the sublayers of the highlight layers (from config), 
        //or we just set the visibility off or on depending upon hasData (which is also isVisible) 
        function setHighlightedLayersVisibility(hasData, queryObject, activityObj, map, deviceIsBrowser) {
            var lyrMaker = getLayerMaker(activityObj, queryObject, null, map, deviceIsBrowser);
            if (config.HighlightLayers) {                               
                _.each(config.HighlightLayers, function(layer) {
                    var addLayer = false;
                    var lyr = lyrMaker.getMapLayer(layer.key);
                    if (!lyr) {
                        lyr = lyrMaker.createDynamicMapServiceLayer(layer);
                        addLayer = true;
                    }
                    if (lyr) {
                        var qLayer = (queryObject.visibleLayers) ? utils.getObjectUsingKey(layer.key, queryObject.visibleLayers) : null;
                        if (hasData) {
                            (qLayer && qLayer.layerIds) ?
                                lyr.setVisibleLayers(qLayer.layerIds):
                                lyr.setVisibleLayers([-1]);                 
                            lyr.setVisibility(true);
                        } else {
                            
                            lyr.setVisibleLayers([-1]);
                            lyr.setVisibility(false);
                        }                       
                        if (addLayer) {
                            var ind = lyrMaker.getFirstLayerIndex(layer.dynamicMapServiceKeys);
                            (ind > -1) ? 
                                lyrMaker.addLayer(ind, lyr):
                                map.addLayer(lyr);  
                        }                                          
                    }
                });
            }            
        }        

                                
        //************************************************************************
        //  NavBar Controller
        //************************************************************************
        
        function NavBarController($scope, $log, $modal, $timeout, $sce, GetterSrvc, QuerySrvc) {
            $scope.angularcontroller="NavigationBarcontroller";
            $scope.navBarData = {
                modalOpenTabIndex: -1,
                explorePanelData: config.queryPanels.exploreQuery,
                otherDropdownArray: config.queryPanels.otherDropdownArray,
                prevSelectedKey: "",
                selectedKey: "",
                selItem: {
                    selectedValue: "",
                    title: "", //used by legend
                    type: "", //used by legend
                    mapLevel: 0 //used by legend
                },
                value: "",
                clusterLayers: [], 
                referenceLayerLoaded: false,               
                requiredJson: config.FeatureService.requiredJsonFiles, //FeatureService.requiredJsonFiles with the actualData
                reQueryEvents: {panEvent: null, zoomEvent: null},
                searchData: {
                    inputText: "",
                    searchText: "",
                    layers: [],
                    isExecuting: false,
                    geocodeGraphicsLayer: null,
                    geocodeParameters: config.GenericSearch.geocodeParameters,
                    mapLevel: config.GenericSearch.reQueryObject.mapLevel, //used by legend
                    reQueryEvents: {panEvent: null, zoomEvent: null},
                }                                                 
            };
            
            //http://www.undefinednull.com/2014/08/11/a-brief-walk-through-of-the-ng-options-in-angularjs/
            $scope.stateForestData = {
                didJSONProcess : false,
                hasData : false, 
                selStateValue: "",
                selForestValue: null, //set to object of forestArray            
                stateArray: [],
                forestArray: [],
                stateForestArray: [],
                currentForestArray: []
            };           

            //current modal object Usage of it follows: http://www.kendar.org/?p=/tutorials/angularjs/part03  
            //we can put more stuff in here for other modal dialogs
            $scope.modalObject = {
                map: $scope.map,
                selectedBasemapKey: "",
                stateForestData: $scope.stateForestData,
                didExplore: false,
                selItem: $scope.navBarData.selItem,
                searchData: $scope.navBarData.searchData
            };            
            
            $scope.openModalDialog = function (name) {                
                var modalDialogObj = utils.getObjectUsingKey(name, config.modalDialogs.dialogArray);
                if (modalDialogObj) {
                    var url = config.modalDialogs.templateURL + modalDialogObj.template;                
                    var controllerName = modalDialogObj.controller;
                    //$log.info("NavBarController.js: open modal name= " + name + " url = " + url + " controllerName= " + controllerName + " $scope.map= ", $scope.map); 
                    var modalInstance = $modal.open({
                        animation: config.modalDialogs.doAnimation, 
                        backdrop: config.modalDialogs.doBackdrop,
                        templateUrl: url,
                        controller: controllerName,
                        windowClass: modalDialogObj.windowClass,
                        resolve: {
                            modalObject: function() {
                                return $scope.modalObject;
                            }                       
                        },
                    });

                    closeInfoWindow($scope.map, $scope.deviceIsBrowser);
                    $scope.toggleNavBarDropdown(); //close dropdowns
                    $scope.setModalOpenTabIndex(true);

                    modalInstance.result.then(function (modalObj) {
                        
                        //http://www.kendar.org/?p=/tutorials/angularjs/part03
                        $scope.setModalOpenTabIndex(false);
                        if (modalObj && modalObj.type) {
                            if (modalObj.type == "explore") {
                                var sBarArr = [],
                                    qArr = [],
                                    bOtherLayer=false; //Useful if a dynamic layer such as Wilderness points is on Explore
                          
                                var queryArr = (modalObj.exploreData.keyList.length > 0) ?
                                    modalObj.exploreData.explorePanelData.queryArray:
                                    null;

                                if (modalObj.exploreData.keyList.length > 0) {
                                    _.each(modalObj.exploreData.keyList, function(key) {
                                        var qObj = utils.getObjectUsingKey(key, modalObj.exploreData.explorePanelData.queryArray);
                                        if (qObj) {
                                            //Note: Current code does not implement .layer and .layer.isSideBar. But it will handle it if its added (ie. Yonder-Twitter)
                                            if (qObj.layer && qObj.layer.isSideBar) {
                                               //This happens if Yonder is on Explore opener.. and user clicks it                  
                                               sBarArr.push(qObj);  
                                               if (qObj.layer.isOtherLayer) {
                                                   bOtherLayer = true;
                                               } 
                                            } else {
                                               qArr.push(qObj); 
                                            }                                                                                                
                                        }
                                    });
                                }
                                
                                if (qArr && qArr.length > 0) {
                                    $scope.processQueryLayer(qArr); //always do this separate from dynamic layer processing    
                                }                                                   
                                if (!$scope.modalObject.didExplore) {  
                                    $scope.modalObject.didExplore = true;
                                    $scope.setJSONData();
                                    if (bOtherLayer) {
                                       $scope.processDynamicLayers(sBarArr); //code currently doesnt execute
                                    } else {                                        
                                        if (sBarArr && sBarArr.length > 0) {
                                           $scope.setLayersDataFromApp(sBarArr); //if no wildernesspts, do separate from dynamic layer process. Code currently doesnt execute
                                        }
                                        $scope.processDynamicLayers([]);
                                    }
                                } else if (sBarArr && sBarArr.length > 0) {
                                    $scope.setLayersDataFromApp(sBarArr); //code currently doesnt execute                                                  
                                }                                                          
                            } else if (modalObj.type == "pdf" && modalObj.printObject) {
                                $scope.modalObject.printObject = modalObj.printObject;
                            }  else if (modalObj.type == "share" && modalObj.shareData) {
                                $scope.modalObject.shareData = $scope.shareData = modalObj.shareData; //sets up shareData. Also used in Identify.
                            }                                             
                        }
                    });

                }                                               
            };
            
            $scope.openTool = function(key, type) {
                if (typeof type != 'undefined' && typeof type == 'string' && type == "window") {
                   $scope.openWindow(key);  
                } else if (key && utils.getObjectUsingKey(key, config.modalDialogs.dialogArray)) {
                   $scope.openModalDialog(key);
                } else if (key == "legend") {
                    $scope.toggleLegendLayers(true);
                } else {
                   alert(errorMsgs.NavBar.other.missingFunctionality); 
                }               
            };  
            
            $scope.openWindow = function(key) {
                //TODO: If we only have one, dont need an array
                var windowObj = utils.getObjectUsingKey(key, config.Windows);
                window.open(windowObj.URL, "_blank");
            };
            
            $scope.processClusters = function(graphics, activityObj, queryObject, fromReQuery) {
                var clusterHandler = new ClusterHandler({
                    map: $scope.map,
                    deviceIsBrowser: $scope.deviceIsBrowser,                   
                    layerMaker: getLayerMaker(activityObj, queryObject, $scope.navBarData.requiredJson, $scope.map, $scope.deviceIsBrowser),
                    activityObj: activityObj,
                    queryObject: queryObject,
                    queryService: QuerySrvc,
                    clusterOptions: config.queryPanels.clusterOptions,
                    clusterLayers: $scope.navBarData.clusterLayers                     
                });               
                //console.log("NavBarController.js:  processClusters() fromReQuery= " + fromReQuery + " $scope.navBarData.clusterLayers = " , $scope.navBarData.clusterLayers);
                if (fromReQuery) {
                   $scope.navBarData.clusterLayers = clusterHandler.regenerateClusters("", graphics, $scope.navBarData.clusterLayers);
                } else {
                    $scope.navBarData.clusterLayers = clusterHandler.processClusters(graphics, config.queryPanels, true, "" ); 
                    if (graphics==null || graphics.length==0) {
                        alert(errorMsgs.NavBar.clusters.noGraphics);
                    }                 
                }                               
            };
            
            $scope.processDynamicLayers = function(sBarArr) {
                var lyrs = new LayerMaker({map:$scope.map, doLayers:true, isStartup: false});
                lyrs.addLayersToMap(); 
                var actualLayers = lyrs.getActualLayers();
                var ref = _.findWhere(config.Layers, {isReference: true});
                if (actualLayers && actualLayers.length > 0) {
                    _.each(actualLayers, function(lyr) {
                        if (ref && lyr.id == ref.Key) {                  
                            var lyrUpdateEnd = lyr.on("update-end", function(lyrObj) {
                                $scope.navBarData.referenceLayerLoaded = true;
                                $scope.setOtherLayersDisabledFalse();
                                if (sBarArr && sBarArr.length > 0) {
                                    $scope.setLayersDataFromApp(sBarArr);                                                                           
                                }
                                $scope.$apply(); //i am using referenceLayerLoaded on wilderness on sidebar. so need the value to work since in the template
                                lyrUpdateEnd.remove();                    
                            });
                            lyr.on("error", function(lyrError) {
                                var lyrT = lyrError.target;
                                var error = lyrError.error.message;
                                $log.error("NavBarController.js: Closing Explore() layer, " + lyrT.id + " load error= " + error + " error object: ", lyrError);
                                lyrUpdateEnd.remove();                  
                            });                            
                        }
                        $scope.map.addLayer(lyr);
                    }); 
                }                           
            };
            
            $scope.processDataRequest = function(val, activityObj, queryObject, fromReQuery) {  
             
                var queryO = null,
                    doSingle = true;
                if ((queryObject.featureService && queryObject.featureService.layerDefs && queryObject.featureService.layerDefs.length > 0) || (fromReQuery && queryObject.queryService && queryObject.queryService.queries)) {
                    var ldh = LayerDefsHandler({
                        url: config.FeatureService.url,
                        query: (queryObject.featureService) ? queryObject.featureService : queryObject.queryService,
                        params: config.FeatureService.parameters,
                        map: $scope.map,
                        doExtent: fromReQuery 
                    });
                    queryO = ldh.getURL();                                        
                } else if (queryObject.queryService && queryObject.queryService.queries) {
                    var qth = QueryTaskHandler({
                       url: config.FeatureService.url
                    });
                    queryO = qth.getQueryTaskPromiseArray(queryObject.queryService.queries);
                    doSingle = false;
                } else {
                    $log.error("NavBarController.js: processDataRequest(): There was a problem processing the results due to unavailable queries.");
                }
                
                (doSingle) ?
                    $scope.processSingleRequest(queryO, val, activityObj, queryObject, fromReQuery):
                    $scope.processMultipleRequest(queryO, val, activityObj, queryObject, fromReQuery);  
            };
            
            $scope.processDataResults = function(theData, val, activityObj, queryObject, fromReQuery) {
                var rangerDistrictData = utils.getObjectUsingKey("rangerDistrict", $scope.navBarData.requiredJson.data);             
                var rdKey = (rangerDistrictData && rangerDistrictData.attKey) ? rangerDistrictData.attKey : "";
                var dh = new DataHandler({
                    map: $scope.map,
                    activityObj: activityObj,
                    queryObject: queryObject,
                    rdCentroids: rangerDistrictData.data,
                    rdKey: rdKey, 
                    fromReQuery: fromReQuery
                });
            
                var clusterArr = dh.processJson(theData);
                //$log.info("NavBarController.js: processDataResults() fromReQuery= " + fromReQuery + " Total number of features = " + clusterArr.length);                        
                if (clusterArr && clusterArr.length > 0) { 
                    //$log.info("NavBarController.js: processDataResults() Total number of features = " + clusterArr.length);                           
                    $scope.navBarData.value = val;                                        
                    if (queryObject.featureService || queryObject.queryService) {
                        if (!fromReQuery) {
                            queryObject.data = clusterArr; //This actually sets it inside the config file.
                        }
                        $scope.processClusters(clusterArr, activityObj, queryObject, fromReQuery);
                        if (!fromReQuery) {
                            setHighlightedLayersVisibility(true, queryObject, activityObj, $scope.map, $scope.deviceIsBrowser); 
                            var bDidReqEvents = $scope.setReQueryProcessing(val, activityObj, queryObject);
                            if (bDidReqEvents && activityObj.reQueryObject && mapHelper.isScaleWithinMapScale(activityObj.reQueryObject.minScale, activityObj.reQueryObject.maxScale, $scope.map)) {
                                //in this case, the user was zoomed in so we need to call a zoomed in request to only obtain zoomed in data
                                $scope.processDataRequest(val, activityObj, queryObject, true);
                            }                                                          
                        }                                                                                                 
                    } else {
                        $log.error("NavBarController.js: processDataResults(). Each queryObject must either have an associated featureService or queryService."); 
                    }                                                                                         
                    $scope.showHideWaitDiv(false);                                                                  
                 } else {
                    $scope.showHideWaitDiv(false);
                    if (theData && theData.error && theData.error.message) {
                       alert(utils.stringFormat(errorMsgs.DataError, theData.error.message)); 
                    } else if (activityObj && activityObj.showNoDataError) {
                        alert(errorMsgs.NavBar.clusters.jsonProblem);
                    }                                                
                 }                                   
            };

            $scope.processMultipleRequest = function(promiseArray, val, activityObj, queryObject, fromReQuery) {
                var dStart = new Date();                           
                QuerySrvc.processQueryArray(promiseArray)
                    .then(function(promiseObject){
                        var dEnd = new Date();
                        //$log.info("NavBarController.js: processMultipleRequest() Total Get Data Load Time= " + (dEnd - dStart) / 1000 + " seconds. ");                    
                        var theData = (promiseObject.data) ? promiseObject.data : promiseObject;
                        if (theData) {
                            $scope.processDataResults(theData, val, activityObj, queryObject, fromReQuery);                 
                        }
                    }, function(error) {
                        $scope.showHideWaitDiv(false);
                        $log.error("NavBarController.js: processMultipleRequest() Failure. Unable to retrieve json items", error);
                        (error && error.message) ?
                            alert(utils.stringFormat(errorMsgs.DataError, error.message)):
                            alert(errorMsgs.NavBar.clusters.jsonProblem);
                    }                 
                );                
            };
                        
            //Called after Explore dialog closes
            //TODO: Should I remove the Array part of this.  
            $scope.processQueryLayer = function(queryArray) {
                if (queryArray && queryArray.length > 0) {
                    var qObj = (queryArray[0].noData && queryArray.length > 1) ? 
                        queryArray[1]: 
                        queryArray[0]; //TODO: This code is temporary. Need to figure out radio button vs. checkbox issue
                        
                    if (qObj && qObj.key) {
                        (qObj.isChecked) ?
                            $scope.navBarData.prevSelectedKey = "":
                            $scope.navBarData.prevSelectedKey = $scope.navBarData.selectedKey;
                        $scope.navBarData.selItem.selectedValue = $scope.navBarData.selectedKey = qObj.key;
                        //$scope.navBarData.selLayerKey = ""; //this was used for identifying a query layers feature when zoomed way out, but I changed method 
                        $scope.setClusterContent(qObj);                       
                    }
                }
            };
          
            $scope.processSingleRequest = function(url, val, activityObj, queryObject, fromReQuery) {
                $scope.showHideWaitDiv(true);
                var dStart = new Date();                           
                GetterSrvc.getDataViaHTTP(url).then(function(promiseObject) {
                    var dEnd = new Date();
                    //$log.info("NavBarController.js: processSingleRequest() Total Get Data Load Time= " + (dEnd - dStart) / 1000 + " seconds. ");
                    var theData = (promiseObject.data) ? promiseObject.data : promiseObject;
                    if (theData) {
                        $scope.processDataResults(theData, val, activityObj, queryObject, fromReQuery);                 
                    }
                  }, function(error) {
                        $scope.showHideWaitDiv(false);
                        $log.error("NavBarController.js: processSingleRequest() Failure. Unable to retrieve json items. Error: ", error);
                        alert(errorMsgs.DataError);
                  });                  
            };

            $scope.setClusterContent = function(queryObject) {
                var activityObj=null, 
                    val;

                if (config.queryPanels && config.queryPanels.doJson) {
                    $scope.showHideWaitDiv(true);
                    val = (queryObject && queryObject.key) ? 
                        queryObject.key: 
                        "";
                    activityObj = getActivityObject(queryObject);                           
                     
                    if (!queryObject || !activityObj) {
                        $scope.showHideWaitDiv(false);
                        alert(errorMsgs.NavBar.clusters.missingDiv);
                        return;
                    }
                    $scope.setSelectedItemTitleType(queryObject, activityObj, queryObject.isChecked);
                    //$log.info("NavBarController.js: setClusterContent val= " + val + " key= " + key + " $scope.navBarData.selItem.selectedValue= " + $scope.navBarData.selItem.selectedValue + " bIsOn= " + bIsOn + " queryObject= ", queryObject);
                                            
                    if (queryObject.isChecked) {                                                                
                        if (queryObject.data) {
                            if (val != $scope.navBarData.value) {
                                utils.clearReQueryEvents($scope.navBarData.reQueryEvents); 
                                $scope.navBarData.clusterLayers = mapHelper.removeLayers($scope.map, $scope.navBarData.clusterLayers, true, true);
                                $scope.navBarData.value = val;
                                if (activityObj.reQueryObject && mapHelper.isScaleWithinMapScale(activityObj.reQueryObject.minScale, activityObj.reQueryObject.maxScale, $scope.map)) {
                                    $scope.setReQueryProcessing(val, activityObj, queryObject);
                                    $scope.processDataRequest(val, activityObj, queryObject, true); //zoomed in so need to do a requery
                                } else {
                                    (activityObj.reQueryObject) ?
                                        $scope.setReQueryProcessing(val, activityObj, queryObject):
                                        utils.clearReQueryEvents($scope.navBarData.reQueryEvents);
                                    
                                    $scope.processClusters(queryObject.data, activityObj, queryObject, false);
                                } 
                            }
                            mapHelper.setLayersVisibility($scope.navBarData.clusterLayers, true);
                            setHighlightedLayersVisibility(true, queryObject, activityObj, $scope.map, $scope.deviceIsBrowser);
                            $scope.showHideWaitDiv(false);
                        } else {
                            setHighlightedLayersVisibility(false, queryObject, activityObj, $scope.map, $scope.deviceIsBrowser); 
                            utils.clearReQueryEvents($scope.navBarData.reQueryEvents); //Karen testing stuff to fix clusterLayer bug
                            $scope.navBarData.clusterLayers = mapHelper.removeLayers($scope.map, $scope.navBarData.clusterLayers, true, true); 
                                                                                                             
                            if (queryObject.featureService && !$scope.navBarData.requiredJson.didJson) {
                                //this ONLY happens if user selects Accessibility from Explore. I get data when close explore otherwise
                                $scope.setJSONData();
                                $timeout(function() {
                                    //wait 1 second before processing the feature service to allow the marker data to arrive
                                    $scope.processDataRequest(val, activityObj, queryObject, false);
                                }, 1000);
                            } else {
                                $scope.processDataRequest(val, activityObj, queryObject, false);
                            }                                                                                                                          
                        }
                    } else if (queryObject.data) {
                        mapHelper.setLayersVisibility($scope.navBarData.clusterLayers, false);
                        setHighlightedLayersVisibility(false, queryObject, activityObj, $scope.map, $scope.deviceIsBrowser);
                        if (activityObj.reQueryObject) {
                            utils.clearReQueryEvents($scope.navBarData.reQueryEvents);
                        }
                        $scope.showHideWaitDiv(false);
                    } else {
                        $scope.showHideWaitDiv(false);
                    }                   
                }
            };
            
            $scope.setExploreData = function(key, isOn) {
               //$log.info("NavBarController.js; setExploreData() key= " + key + " isOn= " + isOn);
               if (key && $scope.modalObject.exploreData && $scope.modalObject.exploreData.explorePanelData &&  $scope.modalObject.exploreData.explorePanelData.queryArray && $scope.modalObject.exploreData.explorePanelData.queryArray.length > 0) {
                    var expObj = _.find($scope.modalObject.exploreData.explorePanelData.queryArray, function(qObj) {
                        //return (qObj &&  ((qObj.key == key) || (qObj.gLayer && qObj.gLayer.key && qObj.gLayer.key == key) || (qObj.oLayer && qObj.oLayer.key && qObj.oLayer.key == key)));
                        return (qObj &&  ((qObj.key == key) || (qObj.layer && qObj.layer.key && qObj.layer.key == key)));
                    });
                    if (expObj && expObj.isChecked != isOn) {
                        expObj.isChecked = isOn; 
                    }                    
               }
            }; 

            $scope.setJSONData = function() {
                if (!$scope.navBarData.requiredJson.didJson) {
                    var urls = getURLArray($scope.JsonFileLocation, $scope.navBarData.requiredJson.data);
                    var i = 0;
                    GetterSrvc.getAllDataViaHTTP(urls).then(function(promiseObjects) {
                        _.each(promiseObjects, function(promiseObject) {
                            var theData = (promiseObject.data) ? promiseObject.data : promiseObject;
                            if (theData && $scope.navBarData.requiredJson.data[i]) {
                                $scope.navBarData.requiredJson.data[i].data = theData;                                
                            }
                            i++;
                        });
                        $scope.navBarData.requiredJson.didJson = true;
                        // $log.info("NavBarController.js: setJSONData() $scope.navBarData.requiredJson= ", $scope.navBarData.requiredJson );
                    }, function(error) {
                        $log.error("NavBarController setJSONData() GetterSrvc.getDataViaHTTP() Failure. Unable to retrieve json items", error);                
                    });                       
                }                 
            };
            
            $scope.setKeyboardNavigation = function() {
                if (!$scope.map.isKeyboardNavigation) {
                    mapHelper.setKeyboardNavigation($scope.map, true);
                }
            };             
                         
            $scope.setModalOpenTabIndex = function(bOpen) {
                (bOpen) ?
                    $scope.navBarData.modalOpenTabIndex = -1:
                    $scope.navBarData.modalOpenTabIndex = 0;
            };
            
            //called from processDataResults
            $scope.setReQueryProcessing = function(val, activityObj, queryObject) {
                if (activityObj && activityObj.reQueryObject) {
                    utils.clearReQueryEvents($scope.navBarData.reQueryEvents); //clear any existing
                    $scope.navBarData.reQueryEvents.panEvent =  doReQueryOnPan(val, activityObj, queryObject, $scope);
                    $scope.navBarData.reQueryEvents.zoomEvent = doReQueryOnZoom(val, activityObj, queryObject, $scope);
                    return true;                                     
                } else if ($scope.navBarData.reQueryEvents.panEvent) {
                    utils.clearReQueryEvents($scope.navBarData.reQueryEvents);
                }
                return false;
            };
            $scope.setSearchElements = function(key, isShowing) {               
                if (key) {
                    var ref = _.findWhere($scope.navBarData.otherDropdownArray, {isSearch: true});
                    if (ref && ref.key == key) {
                        if (isShowing) {
                            //opening search
                            if ($scope.navBarData.searchData.inputText && $scope.navBarData.searchData.searchText && $scope.navBarData.searchData.searchText.length > 0) {
                                $("#genericSearchInput").val($scope.navBarData.searchData.searchText);                           
                            }
                            $timeout(function() {                              
                                angular.element("#genericSearchInput").focus();                    
                            }, 1000);                              
                        } else {
                            mapHelper.setKeyboardNavigation($scope.map, true);
                        }
                      
                    }
                }
            };
            
            $scope.setSelectedItemTitleType = function(queryObject, activityObj, bIsOn) {
                if (!queryObject || !activityObj || !bIsOn) {
                    $scope.navBarData.selItem.title = $scope.navBarData.selItem.type = ""; 
                    $scope.navBarData.selItem.mapLevel = 0; 
                    $scope.navBarData.selItem.pdfLegendKey = -1;           
                } else {
                    $scope.navBarData.selItem.type = queryObject.type;
                    $scope.navBarData.selItem.title = (queryObject.title) ? queryObject.title: queryObject.name;
                    $scope.navBarData.selItem.pdfLegendKey = (typeof queryObject.pdfLegendKey == 'number') ? queryObject.pdfLegendKey: -1; //for pdf
                    //The following is used in the legend
                    $scope.navBarData.selItem.dontShowManagedInLegend = (queryObject.dontShowManagedInLegend) ? queryObject.dontShowManagedInLegend: false;
                    if (activityObj && activityObj.reQueryObject && activityObj.reQueryObject.mapLevel) {
                        $scope.navBarData.selItem.mapLevel = activityObj.reQueryObject.mapLevel;
                    } else if (queryObject && queryObject.mapLevel) {
                        $scope.navBarData.selItem.mapLevel = queryObject.mapLevel;
                    } else {
                        $scope.navBarData.selItem.mapLevel = 0;
                    }
                }
            };                   
           
           //toggleNavBarDropdown:  Pass in a key to toggle the dropdown, or pass in blank value to close all the dropdowns
           $scope.toggleNavBarDropdown = function(key) { 
               
               //$log.info("NavBarController.js: toggleNavBarDropdown key = " + key);
               _.each($scope.navBarData.queryArray, function(qObj) {
                   if (qObj && qObj.key && key == qObj.key) {
                       (qObj.showing) ? qObj.showing = false: qObj.showing = true;

                   } else {
                       qObj.showing = false;
                   }
               });
               _.each($scope.navBarData.otherDropdownArray, function(qObj) {
                   if (qObj && qObj.key && key == qObj.key) {
                       (qObj.showing) ? qObj.showing = false: qObj.showing = true;
                   } else {
                       qObj.showing = false;
                   }
               });
           };

            $scope.toggleSelectedClass = function(value) {
                //$log.info("NavbarController.js: toggleSelectedClass() value= " + value + " $scope.navBarData.selItem.selectedValue= " + $scope.navBarData.selItem.selectedValue + " $scope.navBarData.prevSelectedKey= " + $scope.navBarData.prevSelectedKey );
                if (value == $scope.navBarData.selItem.selectedValue) {
                    if (value == $scope.navBarData.prevSelectedKey) {
                        return "btn-default"; //thus, the toggle
                    } else {
                        return "btn-success";
                    }                   
                } else {
                    return "btn-default";
                }
            };
            
            $scope.toTrusted = function (value) {
                return $sce.trustAsHtml(value);
            };
                        
            //Read MapSource.json file and call function to prepare all our services in config.js
            //I handle the following errors: no or bad MapServices.fileName, bad key or no key or bad format in MapServices.fileName, 
            //could also funnel through this if the services arent good.  User will get an error on identify if thats the case (ie. set a key, test pointing to bad name)                      
            var fileLoc = (config.MapServices.folderName && config.MapServices.folderName.oldFolder && config.MapServices.folderName.oldFolder) ?
                ($scope.JsonFileLocation.replace(config.MapServices.folderName.oldFolder, config.MapServices.folderName.newFolder)):
                $scope.JsonFileLocation;
            
            GetterSrvc.getDataViaHTTP(utils.getJSONFileLocation(fileLoc, config.MapServices.fileName)).then(function(promiseObject) {
                (promiseObject.data && promiseObject.data["MapServiceSource"] != null && config.MapServices.mapServiceDomains != null) ?
                    processMapService(promiseObject.data["MapServiceSource"], $log):                                                                                
                    processMapService(config.MapServices.initialKey, $log);                
            }, function(error) {
                $log.error("NavBarController GetterSrvc.getDataViaHTTP()Failure. Unable to retrieve json item from " + config.MapServices.fileName + ". Using our initial Key" + config.MapServices.initialKey, error); 
                processMapService(config.MapServices.initialKey, $log); 
            });                   
            
            //Setup data for the States and Forests. TODO: Question: I wonder if i should do this now 
            var url1 = utils.getJSONFileLocation($scope.JsonFileLocation, config.StateForestQuery.fileName);         
            GetterSrvc.getDataViaHTTP(url1).then(function(promiseObject) {
                var theData = (promiseObject.data) ? promiseObject.data : promiseObject;
                if (theData && theData[config.StateForestQuery.stateKey] != null && theData[config.StateForestQuery.forestKey] != null &&
                    theData[config.StateForestQuery.stateForestKey] != null) {
                    
                    theData[config.StateForestQuery.forestKey] = rejectSelectAForestAndSort(theData[config.StateForestQuery.forestKey]);
                    $scope.stateForestData.stateArray = theData[config.StateForestQuery.stateKey];
                    $scope.stateForestData.forestArray = theData[config.StateForestQuery.forestKey]; //sort is handled in rejectSelecctAForestAndSort
                    $scope.stateForestData.stateForestArray = theData[config.StateForestQuery.stateForestKey];
                    $scope.stateForestData.currentForestArray = theData[config.StateForestQuery.forestKey];
 
                    if ($scope.stateForestData.currentForestArray != null && $scope.stateForestData.currentForestArray.length > 0 &&
                        $scope.stateForestData.currentForestArray[0].Value  &&  $scope.stateForestData.currentForestArray[0].Value.length > 0) {
                        $scope.stateForestData.currentForestArray.unshift({Value: "", Name: config.StateForestQuery.forestMessage.hasData}); //Adds Select A Forest
                        $scope.stateForestData.selForestValue = $scope.stateForestData.currentForestArray[0]; //Makes sure its selected
                    }
                    $scope.stateForestData.didJSONProcess = $scope.stateForestData.hasData = true;
                    //Param added these lines - start
                    if ($scope.openExploreMenu ==='yes'){
                        $scope.openModalDialog(config.modalDialogs.openModalAtStartup.modalKey);
                    }else{                      
                        $scope.modalObject.didExplore = true;
                        $scope.setJSONData();
                        $scope.processDynamicLayers([]);
                         if (!$scope.modalObject.exploreData) {
                                $scope.modalObject.exploreData = {
                                    explorePanelData: config.queryPanels.exploreQuery,
                                    keyList: []              
                                };                
                        }

                        if($scope.activityType){                          
                             _.each($scope.modalObject.exploreData.explorePanelData.queryArray, function(qObj) {                                 
                                     if (qObj.name) {
                                       if (qObj.name.toLowerCase().indexOf($scope.activityType.toLowerCase()) != -1){
                                          $scope.recactivity=qObj;
                                       }
                                   }
                             },$scope);
                            if ( $scope.recactivity){
                                $scope.recactivity.isChecked=true;
                                $scope.processQueryLayer([$scope.recactivity]);
                            }
                       }
                       if($scope.markeractivity){
                          $scope.showMarkerActivity();                     
                       }                       
                    }    
                    //end
                }
            }, function(error) {
                $log.error("NavBarController GetterSrvc.getDataViaHTTP()Failure. Unable to retrieve json items", error);
                $scope.stateForestData.didJSONProcess = true;
                $scope.stateForestData.hasData = false;
            });
            $scope.findParentGroup=function(markertype){
              var markeractivity={};
                _.each(config.request.markeractivity,function(activityObj){
                    _.each(activityObj.activity,function(type){
                        if (type.toLowerCase() === markertype.toLowerCase()){
                            markeractivity.Qry="MARKERACTIVITY IN ('"+type+"')";
                            markeractivity.parent=activityObj.name;
                            var imageName=$scope.getClusterIcons(type);
                            if (imageName){
                                markeractivity.imageName=imageName;
                            }
                        }
                    },$scope);
                },$scope);
               return markeractivity; 
            };
            $scope.getClusterIcons=function(activity){
               var imageName; 
                 _.each(config.request.clusterIcons,function(iconObj){
                        if (activity.toLowerCase() === iconObj.name.toLowerCase()){
                            imageName=iconObj.imageName;
                        }
                 },$scope);
               return imageName;  
            };
            $scope.showMarkerActivity=function(){
                    var tempMarker= $scope.findParentGroup($scope.markeractivity);                          
                    _.each($scope.modalObject.exploreData.explorePanelData.queryArray, function(qObj) {                                 
                            if (qObj.name && tempMarker.parent) {                                        
                               if (qObj.name.toLowerCase().indexOf(tempMarker.parent.toLowerCase()) != -1){
                                    //Make a copy of the query object  
                                    $scope.markeractivitynew=angular.copy(qObj);
                              
                                    if ($scope.markeractivitynew.featureService){
                                        if (!_.isEmpty($scope.markeractivitynew.featureService.layerDefs)){
                                            $scope.markeractivitynew.featureService.layerDefs[0].where=tempMarker.Qry;                                          
                                        }
                                    }
                                
                                    if ($scope.markeractivitynew.queryService && $scope.markeractivitynew.queryService.queries){
                                        if (!_.isEmpty($scope.markeractivitynew.queryService.queries)){
                                             $scope.markeractivitynew.queryService.queries[0].queryObject.where=tempMarker.Qry;
                                        // $scope.markeractivitynew.queryService.queries[1]=undefined;
                                        }
                                    }
                                    if (_.has(tempMarker,"imageName")){
                                        $scope.markeractivitynew.imageName=tempMarker.imageName;
                                    }    
                                }
                            }
                        },$scope);
                    if ( $scope.markeractivitynew ){
                        $scope.markeractivitynew.isChecked=true;
                        $scope.processQueryLayer([$scope.markeractivitynew]);
                    }
            };                                                         
        }

        function init(App) {
            App.controller('NavBarCtrl', ['$scope', '$log', '$modal', '$timeout', '$sce', 'GetterSrvc', 'QuerySrvc', NavBarController]);
            return NavBarController;
        }

        return {
            start : init
        };

    });

}).call(this); 