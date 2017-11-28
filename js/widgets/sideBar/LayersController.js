/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular', 
            'js/config', 
            'esri/symbols/PictureMarkerSymbol',   
            'js/helpers/utils',
            'js/helpers/mapHelper',
            'js/modules/LayerMaker',
            'js/modules/ClusterHandler',
            'js/modules/DataHandler',
            'js/modules/GraphicsContent',
            'js/errorMsgs'
           ], function(angular, config, PictureMarkerSymbol, utils, mapHelper, LayerMaker, ClusterHandler, DataHandler, GraphicsContent, errorMsgs) {

        //createMapLayer: used for fire and weather
        //TODO: this should be integrated with the new HighlightLayer code in NavBar
        function createMapLayer(layer, queryObject, map, deviceIsBrowser) {
            var lyr = null,
                ind = -1,
                lyrMaker = new LayerMaker({map : map, deviceIsBrowser: deviceIsBrowser, queryObject: queryObject});
            lyr = lyrMaker.getMapLayer(layer.key);
            if (!lyr) {                                         
                if (layer.isDynamicMapService) {                   
                    lyr = (layer.params) ? 
                        lyrMaker.createDynamicMapServiceLayer(layer.params):
                        lyrMaker.createDynamicMapServiceLayer(layer);
                    if (lyr && layer.params && layer.params.visibleLyrs) {
                        lyr.setVisibleLayers(layer.params.visibleLyrs);
                    }                                                     
                } else if (layer.isGeoRSS) {
                    lyr = lyrMaker.createGeoRSSLayer(layer.params);                  
                }
                if (lyr) {
                    if (layer.isGeoRSS) {
                        var lyrAdd = lyr.on("update-end", function(evt)  {
                            //This happens because the GeoRSS layer actually adds another graphics layer (that I dont have control over). So gLayer below it
                            lyrMaker.setMap(map);
                            var bool = lyrMaker.reorderGraphicsLayer();
                            if (bool) {
                                lyrAdd.remove();
                            }
                        }, this);                         
                    }

                    if (queryObject.dynamicMapServiceKeys) {
                        ind = lyrMaker.getFirstLayerIndex(queryObject.dynamicMapServiceKeys);
                        if (ind > -1)  {
                            lyrMaker.addLayer(ind, lyr);
                        }                           
                    }
                    if (ind == -1) {
                        map.addLayer(lyr);
                    }
                    //lyrMaker.reorderGraphicsLayer();                    
                }                                                                                           
            }
            //console.log("createMapLayer after layer added to map() lyr= ", lyr);
            return lyr;           
        }
        
        //sets to true if all of the graphics layers  checkboxes have been manually turned on by the user
        function didAllCheckboxes(dataArray) {
            var rslt = _.findWhere(dataArray, {didCheckbox: false});
            if (rslt) {
                return false;
            } 
            return true;
        }
        
        function doClusters(graphics, map, deviceIsBrowser, gLayer, doReorder) {
            var ch = new ClusterHandler({
                map: map,
                deviceIsBrowser: deviceIsBrowser,
                clusterOptions: gLayer.clusterOptions
            });
            var id = (gLayer.clusterOptions.id) ? gLayer.clusterOptions.id : "";
            return ch.processClusters(graphics, gLayer, true, id, doReorder);            
        } 
        
        function getDataObject(layer) {
            return {key: layer.key,
                    title: layer.title,
                    notes: (layer.notes) ? layer.notes : "",
                    url: (layer.url) ? layer.url : layer.ServiceURL,
                    didJsonProcess: false,
                    hasData: false,
                    isFeatured: (layer.isFeatured) ? layer.isFeatured : false,
                    isGLayer: layer.isGLayer,
                    didCheckbox: (layer.didCheckbox) ? layer.didCheckbox : false,
                    isDisabled: (layer.isDisabled == false) ? false: true,
                    isChecked: false,
                    icon: (layer.icon) ? layer.icon : null,
                    image: (layer.image) ? layer.image : null,
                    layerIndexes: (layer.dynamicLayerIndexes) ? layer.dynamicLayerIndexes: null,
                    dynamicLayerKey: (layer.dynamicLayerKey) ? layer.dynamicLayerKey : null,
                    isDynamicMapService: layer.isDynamicMapService,
                    isGeoRSS: layer.isGeoRSS,
                    params: (layer.params) ? layer.params: null,                    
                    layers: []
            };               
        }
                
        function getTheDataArray(promiseObject) {
            if (promiseObject.data && promiseObject.data.features) {
                return promiseObject.data.features;
            } else if (promiseObject.data) {
                return promiseObject.data;
            } else {
                return promiseObject;
            }
        }
        
        function setDisabledStatus(lyrArray, isDisabled, isGraphics) {
           _.each(lyrArray, function(layer) {
               if (layer.isGLayer == isGraphics) {
                   layer.isDisabled = isDisabled;
               }               
           }); 
        }
        
        function setTheDataArray() {
            var rtnArray = [];
            _.each(config.SideBarLayers, function(layer) {
               rtnArray.push(getDataObject(layer));
            });                   
            return rtnArray;
        }
        
        function setVisibility(bOn, featureObj, map) {
            if (featureObj.layers && featureObj.layers.length > 0) {
                _.each(featureObj.layers, function(layer) {
                    layer.setVisibility(bOn);                                      
                });                  
            } else if (featureObj.dynamicLayerKey && featureObj.layerIndexes) {
                mapHelper.setDynamicLayerVisibility(bOn, featureObj.dynamicLayerKey, featureObj.layerIndexes, map);
            }        
        }

        //************************************************************************
        //  Layers Controller
        //************************************************************************
        
        function LayersController($scope, $log, $sce, GetterSrvc) {

            $scope.layersData = { 
                helpURL: utils.getObjectUsingKey("help", config.Windows).URL,
                nextIdentifyActiveTab: "",               
                dataArray: setTheDataArray() 
            };
            
            $scope.map.on("load", function(event) {
                var zoomEnd = $scope.map.on("zoom-end", function(evt) {
                    //$log.info("LayersController.js: zoom-end scale= " + $scope.map.getScale() + " event = ", evt);
                    var bDoApply = false;
                    if (didAllCheckboxes($scope.layersData.dataArray)) {
                        zoomEnd.remove();
                    } else if (evt && evt.level && isNaN(evt.level) == false) {
                        _.each($scope.layersData.dataArray, function(layer) {
                            var apiObj = utils.getObjectUsingKey(layer.key, config.SideBarLayers);
                            if (apiObj && apiObj.zoomLevelForCheckbox && layer.didCheckbox == false) {
                                if (evt.level >= apiObj.zoomLevelForCheckbox && !layer.isChecked) {
                                    //Force checkbox turned on
                                    layer.isChecked = true;
                                    $scope.setLayersContent({checked: true, id: apiObj.key, fromCode: true});
                                    bDoApply = true;                                  
                                } else if (evt.level < apiObj.zoomLevelForCheckbox && layer.isChecked){
                                    //Force checkbox turned off
                                    layer.isChecked = false;
                                    $scope.setLayersContent({checked: false, id: apiObj.key, fromCode: true});
                                    bDoApply = true;                                     
                                }
                            }
                        });
                        if (bDoApply) {
                            $scope.$apply();
                        }                         
                    }                    
                });
            });          

            $scope.getContentFromAPI = function(featureObj, urlArray, gLayersArr) {
                var showedError = false;
                var dStart = new Date();
                //$log.info("getContentFromAPI() Before: $scope.map.graphicsLayerIds= ", $scope.map.graphicsLayerIds);  
                GetterSrvc.getAllDataViaHTTP(urlArray).then(function(promiseObjects) {
                    //$log.info("LayersController.js: getContentFromAPI() promiseObjects= ", promiseObjects);
                    var i = 0;
                    _.each(promiseObjects, function(promiseObject) { 
                        var jsonObj = null;
                        var dEnd = new Date();
                        var gLayer = gLayersArr[i]; 
                        var lyrObj = utils.getObjectUsingKey(gLayer.key, $scope.layersData.dataArray);
                        
                        var url = (promiseObject && promiseObject.config && promiseObject.config.url) ? promiseObject.config.url : "";                      
                        //$log.info("getContentFromAPI() Total Get JSON Load Time= " + (dEnd - dStart) / 1000 + " seconds. url=" + url + " promiseObject= ", promiseObject);
                        dStart = new Date();
                        
                        if (lyrObj) {
                            var theData = getTheDataArray(promiseObject);
                            //var theData = (promiseObject.data) ? promiseObject.data : promiseObject;  //KLR: 032916
                            if (theData) {
                                //$log.info("LayersController.js: getContentFromAPI() gLayer.key= " + gLayer.key+ " theData = ", theData);
                                var dh = new DataHandler({
                                    map: $scope.map,
                                    divObject: featureObj,
                                    queryObject: gLayer
                                });
                                jsonObj = dh.processJson(theData);
                                              
                                if (jsonObj && jsonObj.worked) {
                                    featureObj.hasData = jsonObj.worked;
                                    if (featureObj.isFeatured) {
                                        featureObj.layers = jsonObj.graphicLayers;
                                        var layerIds = $scope.map.layerIds;                                    
                                        _.each(featureObj.layers, function(layer) {
                                            if ($scope.map.getLayer(layer.id) == null) {
                                                $scope.map.addLayer(layer, 0); //needs to add these before the 'gLayer'
                                                //$log.info("LayersController.js: getContentFromAPI() layer.id = " + layer.id + " count= " + layer.graphics.length + " layer.graphics= ", layer.graphics);                                                                                                                                
                                            }  
                                        });                                    
                                        //$log.info("getContentFromAPI() After Add Featured Layers: $scope.map.graphicsLayerIds= ", $scope.map.graphicsLayerIds);                                 
                                    } else {
                                        featureObj.layers = doClusters(jsonObj.dataArray, $scope.map, $scope.deviceIsBrowser, gLayer, false);
                                        //$log.info("getContentFromAPI() After Add Clustered Layer gLayer.id= " + gLayer.id + " : $scope.map.graphicsLayerIds= ", $scope.map.graphicsLayerIds); 
                                    }                      
                                } else if (jsonObj && jsonObj.dataArray && jsonObj.dataArray.length == 0) {
                                    //handle empty Social Media layer
                                    console.log(utils.stringFormat(errorMsgs.SideBar.missingData.graphicsLayer, lyrObj.title)); 
                                }
                                featureObj.didJsonProcess = true;
                            }
                            dEnd = new Date();
                            //console.log("getContentFromAPI() Total ProcessGraphics Time= " + (dEnd - dStart) / 1000 + " seconds. ");

                            if (!featureObj.isFeatured || (featureObj.isFeatured && gLayer.clusters && gLayer.clusters.doClustersAtStartup)) {
                                //Setup Clusters                               
                                if (jsonObj && jsonObj.worked) {
                                    //lets finish it off with cluster 
                                    var doReorder = (i == (urlArray.length - 1)) ? true : false;                       
                                    var lyrs = doClusters(jsonObj.dataArray, $scope.map, $scope.deviceIsBrowser, gLayer, doReorder);
                                    if (lyrs && lyrs.length > 0) {
                                        lyrs[0].setVisibility(false);
                                        lyrObj.layers.push(lyrs[0]);                                                                       
                                        lyrObj.hasData = true;                                          
                                    }                         
                                }
                                lyrObj.didJsonProcess = true;
                            }                            
                        }  
                         
                        i++;                   
                    }); 
                    setDisabledStatus($scope.layersData.dataArray, false, true);                                       
                }, function(error) {
                    $log.error("LayersController Failure. Unable to retrieve graphics. Error: ", error); 
                    if (!showedError) {                        
                        showedError = true;
                        if (error && error.config && error.config.url && error.config.url.length > 0) {
                            $scope.removeBrokenURLAndGetContent(error.config.url, featureObj, urlArray, gLayersArr);
                        } else if (error && error.message) {
                            //Bad syntax inside the json file (format is no good typically):
                            alert(utils.stringFormat(errorMsgs.SideBar.missingData.graphicsDataMsg, error.message));
                        } else {
                            alert(errorMsgs.SideBar.missingData.graphicsData); 
                        }                                                        
                    }
                });
                
            }; 
            
            //handles case where Yonder.json file (or twitter.json) is busted. We can continue trying again.
            $scope.removeBrokenURLAndGetContent = function(url, featureObj, urlArray, gLayersArr) {
                if (url && featureObj && urlArray && gLayersArr && urlArray.length > 0 && urlArray.length == gLayersArr.length) {
                    var urlArr = [],
                        gLyrArr = [],
                        i = 0;
                    for (i=0; i < urlArray.length; i++) {
                        if (url == urlArray[i]) {
                           var lyrObj = utils.getObjectUsingKey(gLayersArr[i].key, $scope.layersData.dataArray);
                           if (lyrObj) {
                               lyrObj.didJsonProcess = true;
                               alert(utils.stringFormat(errorMsgs.SideBar.missingData.graphicsLayer, lyrObj.title)); 
                           } 
                        } else {
                            urlArr.push(urlArray[i]);
                            gLyrArr.push(gLayersArr[i]);
                        }
                    }
                    if (urlArr.length > 0 && urlArr.length < urlArray.length) {
                        $scope.getContentFromAPI(featureObj, urlArr, gLyrArr);
                    }
                }
            };
            

            $scope.setLayersContent = function(evtObj) {
                var checkbox = (evtObj && evtObj.target) ? evtObj.target : evtObj;           
                if (checkbox) {
                    var featureObj = utils.getObjectUsingKey(checkbox.id, $scope.layersData.dataArray);
                   
                    if (featureObj) {
                        $scope.toggleNavBarDropdown(); //close dropdowns
                        featureObj.isChecked = checkbox.checked;
                        if (checkbox.checked) {
                            if (featureObj.isGLayer && featureObj.didJsonProcess == false) {                        
                                var getters = [],
                                    gLayers = [];
                                //setup request to get the data 
                                //TODO: Are we still using this
                                _.each(config.SideBarLayers, function(gLayer) { 
                                    if (!gLayer.isFeatured && gLayer.isGLayer && gLayer.fileName) {
                                        getters.push(utils.getJSONFileLocation($scope.JsonFileLocation, gLayer.fileName));
                                        gLayers.push(gLayer);
                                    }
                                });
                                if (getters.length > 0) {
                                    $scope.getContentFromAPI(featureObj, getters, gLayers); 
                                }                                                                                                                
                            } else  {
                                if (!featureObj.isGLayer && (!featureObj.layers || featureObj.layers.length == 0)) {                                    
                                    var queryObject = utils.getObjectUsingKey(featureObj.key, config.SideBarLayers);
                                    var lyr = createMapLayer(featureObj, queryObject, $scope.map, $scope.deviceIsBrowser); 
                                    if (lyr) {
                                        featureObj.layers.push(lyr);
                                    }                                  
                                }
                                //Turn on layer
                                setVisibility(true, featureObj, $scope.map);
                                if (featureObj.isGLayer) {
                                    $scope.layersData.nextIdentifyActiveTab = featureObj.key;
                                }                                                               
                                if (evtObj.type) {
                                    featureObj.didCheckbox = true;
                                } 
                                if (evtObj.target || evtObj.fromCode) {
                                    $scope.setExploreData(checkbox.id, true);
                                }                                  
                            }
                        } else  {
                            //turn off layer
                            setVisibility(false, featureObj, $scope.map);
                            if (evtObj.type) {
                               featureObj.didCheckbox = true; 
                            } 
                            if (evtObj.target || evtObj.fromCode){
                                $scope.setExploreData(checkbox.id, false);
                            }                   
                        }                      
                    } else {
                        alert("There is a problem obtaining data from " + checkbox.id + ". Please check back soon.");
                    }                    
                }
            }; 
            
            
            //this is called from Explore and NavBar
            //Turns on wilderness points, for example, after the dynamic map service is loaded.
            //Currently this code is not being executed
            $scope.setLayersDataFromApp = function(queryArray) {
                //Checkbox code from Explore. all of these should be sidebar layers when they are passed in
                if (queryArray && queryArray.length > 0) {
                    _.each(queryArray, function(qObj) {
                        if (qObj && qObj.layer && qObj.layer.isSideBar) {
                            var lyrObj = utils.getObjectUsingKey(qObj.layer.key, $scope.layersData.dataArray);
                            if (lyrObj && lyrObj.isChecked != qObj.isChecked) {
                                lyrObj.isChecked = qObj.isChecked;
                                $scope.setLayersContent({checked: lyrObj.isChecked, id: qObj.layer.key, fromCode: false, type: true}); //type sets up checkbox and assumes user pressed it                            
                            }                            
                        }
                    });                     
                }
            };

            //for wildernessPts, once NavBar shows the referenceLayerloaded, calls this to change disabled status (maybe other layers too)
            $scope.setOtherLayersDisabledFalse = function() {
                _.each($scope.layersData.dataArray, function(layer) {
                    if (!layer.isGLayer && layer.isDisabled) {
                        layer.isDisabled = false;
                    }             
                });                
            };          
                    
            //Graphics Content processing is started below when the layers controller loads.
            $scope.startGraphicsContent = function() {
                var rslt = _.findWhere($scope.layersData.dataArray, {isFeatured: true});
                rslt.isChecked = true;
                //$scope.setLayersContent({checked: true, id: rslt.key});
                
                //Param added these lines and comented the above line
                if (!$scope.featurecontent){
                     $scope.setLayersContent({checked: true, id: rslt.key});
                }
                if ($scope.featurecontent){
                    rslt.isChecked = false;
                    var featureObj = utils.getObjectUsingKey(rslt.key, $scope.layersData.dataArray);
                    featureObj.isDisabled=false;
                     _.each(config.SideBarLayers, function(layerObj) {
                            if (layerObj.layers && layerObj.layers.length > 0) {
                                    _.each(layerObj.layers, function(layer) {
                                        layer.options.visible=false;                                      
                                    }); 
                            }                                   
                      });
                      var getters = [],
                                    gLayers = [];
                        _.each(config.SideBarLayers, function(gLayer) { 
                            if (!gLayer.isFeatured && gLayer.isGLayer && gLayer.fileName) {
                                getters.push(utils.getJSONFileLocation($scope.JsonFileLocation, gLayer.fileName));
                                gLayers.push(gLayer);
                            }
                        });
                        if (getters.length > 0) {
                            $scope.getContentFromAPI(featureObj, getters, gLayers); 
                        }                    

                    $scope.setLayersContent({checked: false, id: rslt.key});
                }
                //end
            };
            
            $scope.toTrusted = function(html_code) {
                return $sce.trustAsHtml(html_code);
            };

            $scope.startGraphicsContent(); //Starts tons of processing at application startup.  
                                                                   
        }

        function init(App) {
            App.controller('LayersCtrl', ['$scope', '$log', '$sce', 'GetterSrvc', LayersController]);
            return LayersController;
        }

        return {
            start : init
        };

    });

}).call(this); 