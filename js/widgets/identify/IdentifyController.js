/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular', 
            'underscore',
            'esri/geometry/mathUtils',
            'esri/geometry/screenUtils',
            'js/config',
            'js/helpers/mapHelper',
            'js/helpers/utils',
            'js/errorMsgs',
            'js/modules/MapClickHandler',
            'js/modules/IdentifyResultsHandler'          
           ], function(angular, _, mathUtils, screenUtils, config, mapHelper, utils, errorMsgs, MapClickHandler, IdentifyResultsHandler) {

        function clusterGraphicsCanIdentify(graphic, map) {
            var bRtn = false;
            //console.log("IdentifyController.js: clusterGraphicsCanIdentify() graphic= ", graphic);
            //if ((graphic.attributes.clusterCount == 1 && !graphic.attributes.displayVal) || (graphic.attributes.displayVal && graphic.attributes.displayVal  == 1)) {
            if (graphic.attributes.clusterCount == 1 && !graphic.attributes.displayVal) {
                //the following handles  2 cases: 1. if motorized:non-moto and the displayVal == 1  and 2. not doing motorized:non-moto and clusterCount == 1
                bRtn = true;
            } else if (graphic.attributes.clusterCount > 1 && !graphic.attributes.displayVal){
                //if clusterlayer is yonder or twitter, clusterCount > 1, and map.scale LayerID = yonderClusterPlaces or the graphics extent distance between its corners is less then the openIdentifyDistance => do Identify
                //TODO: make this more generic
               var gLayer = graphic.getLayer();
               if (gLayer && gLayer.id) {
                    var lyrObj = getGraphicsLayerFromClusterId(gLayer.id);
                    if (lyrObj && lyrObj.clusterOptions) {
                        if ((graphic.attributes.extent && graphic.attributes.extent.length == 4 && 
                         utils.isExtentWithinDistance(graphic.attributes.extent[0], graphic.attributes.extent[1], graphic.attributes.extent[2], graphic.attributes.extent[3], lyrObj.clusterOptions.openIdentifyDistance))) {
                            bRtn = true;
                        }                                                     
                    }                   
               }

            }
            return bRtn;
        }
        
        function getAssociatedGraphics(graphic, isFeatured) {
            //But I want the nested attributes
            //http://stackoverflow.com/questions/26788823/underscore-js-finding-a-nested-object
            var rtnArr = [];
            if (graphic && graphic._graphicsLayer && graphic._graphicsLayer._clusterData && graphic.attributes.clusterCount && graphic.attributes.clusterCount > 0 && graphic.attributes.clusterId) {
                //get all clusterData where clusterId =
                var id = graphic.attributes.clusterId;
                rtnArr = _.filter(graphic._graphicsLayer._clusterData, function(clusterObj) {
                    return (clusterObj.attributes.clusterId == id);
                });       
            } else if (graphic && graphic.attributes && isFeatured) {
                rtnArr.push(graphic);
            }
            
            return rtnArr;
        }
        
        function getFeaturedContentTab(graphic, tabs) {
            //i may need to add an attribute called key with the key for the yonder or twitter grpahics, so that i know which one to do below..           
            if (graphic && graphic.attributes && graphic.attributes.key && graphic.attributes.key.length > 0 && tabs && tabs.length > 0) {
                var lyr = utils.getObjectUsingKey(graphic.attributes.key, config.SideBarLayers);
                if (lyr && lyr.identifyDivId) {
                    return (utils.getObjectUsingKey(lyr.identifyDivId, tabs));
                }
            }
            return null;
        }
        
        function getGraphicsLayerFromClusterId(id) {
            var rtnArr = _.filter(config.SideBarLayers, function(layer) {
                    return (layer.isGLayer && layer.clusterOptions && layer.clusterOptions.id == id);
            });
            if (rtnArr && rtnArr.length == 1) {
                return rtnArr[0];
            } 
            return null;                       
        }
        
        //getGraphicAttributes: Loops through the arrGraphics and makes sure that they are within a tolerance of each other
        //the concept is that the graphics are overlapping. So this case handles multiples. Use openIdentifyDistance in config TODO maybe but seems to work without it??
        function getGraphicAttributes(arrGraphics) {            
            var rtnArr = [];
            _.each(arrGraphics, function(graphic) {
                rtnArr.push(graphic.attributes);
            });
            return rtnArr;
        }
        
        function getLayerData(graphic, layerKey) {
            var clusterObj = _.find(graphic._layer._clusterData, function(cObj) {
                return (cObj &&  cObj.attributes && cObj.attributes.clusterId && cObj.attributes.clusterId == graphic.attributes.clusterId);
            }); 
            if (clusterObj && clusterObj.attributes) {
                return {
                    key: layerKey, 
                    attributes: clusterObj.attributes
                };
            }           
            return {
                key: layerKey,
                attributes: graphic.attributes
            };
        }        

        function getNearestClusterGraphic(clusterKey, mapPoint, map, deviceIsBrowser, graphic) {
            var rGraphic = null,
                closestDist = 0; 
            //This maybe handles case where you click near a graphic, but you want to make sure it actually grabs the graphic.
            var gLayer = map.getLayer(clusterKey); //cluster layer
            var tol = utils.getIdentifyTolerance(map, true, deviceIsBrowser);
            if (gLayer && gLayer.visible && gLayer._clusterData && gLayer._clusterData.length > 0 && gLayer.graphics && gLayer.graphics.length > 0) {
                _.each(gLayer.graphics, function(graphc) {
                    if (graphc && graphc.attributes && graphc.attributes.clusterCount) {
                        var dist = mathUtils.getLength(graphc.geometry, mapPoint);
                        if ((dist < tol) && (closestDist == 0 || dist < closestDist)) {
                            closestDist = dist;
                            rGraphic = graphc;
                        }                                
                    }                    
                });                       
            }                   
            return rGraphic;
        }
        
        //check to see if the graphic is actually from a search query layer. If not, lets just assume its from one of the rec site dropdowns.
        function getQueryLayerKey(graphic, navKey) {
            if (graphic && graphic.attributes) {
                var val = utils.getAttributeValue(config.FeatureService.layerIdKey, graphic.attributes);
                if (val) {
                    var lyrDefObj = _.findWhere(config.GenericSearch.queryService.queries, {layerId: val});
                    if (lyrDefObj && lyrDefObj.key) {
                        return lyrDefObj.key;
                    }
                }
            }            
            return navKey;
        }
        
        function isGraphicAFeaturedLayer(graphic, featLayer) {
            if (graphic && featLayer && featLayer.layers) {
                var lyr = utils.getObjectUsingKey(graphic._graphicsLayer.id, featLayer.layers);
                if (lyr) {
                    return true;
                }
            }
           return false;
        }
        
        function isGraphicAGraphicsLayer(graphic, layerIds) {
            if (graphic._graphicsLayer && graphic._graphicsLayer.id && layerIds.indexOf(graphic._graphicsLayer.id) > 0) {
                return true;
            } 
            return false;
        }
        
        function isGraphicFromGeoRSSLayer(graphic) {
            if (graphic && graphic.attributes && graphic._graphicsLayer) {
                //console.log("IdentifyController.js: isGraphicFromGeoRSSLayer() graphic", graphic);
                var geoR = _.findWhere(config.SideBarLayers, {isGeoRSS: true});
                if (geoR && geoR.graphicsLayer && graphic._graphicsLayer.id.indexOf(geoR.graphicsLayer) > -1) {
                    return true; //got it
                }
            }
            return false;
        } 

        function isGraphicSameSpatialRef(graphic, map) {
            if (graphic.geometry && graphic.geometry.spatialReference.wkid && graphic.geometry.spatialReference.wkid == map.spatialReference.wkid) {
                return true;
            } else {
                return false;
            }
        }
        
        function setGeoRSSGraphic(graphic, tabs) {
            var queryObj =  _.findWhere(config.QueryLayers, {isGeoRSS: true}); //config.QueryLayers  isGeoRSS
            if (queryObj && queryObj.key) {
                var tab = utils.getObjectUsingKey(queryObj.key, tabs);
                if (tab && tab.dataObject) {
                    tab.dataObject.graphic = graphic; //this is an object
                    return true;                                   
                }
            }            
        } 
                
        function setTheTabArray() {
            var rtnArray = [];
            _.each(config.SideBarLayers, function(layer) {
               if (!layer.isFeatured && layer.isGLayer) {
                    rtnArray.push(
                        {paneId: layer.paneId,
                         heading: utils.toProperCase(layer.key, true),
                         title: utils.toProperCase(layer.key, true),
                         key: layer.identifyDivId,
                         identifyContainer: layer.identifyDivContId,
                         isGraphics: true,
                         hashTagPrefix: (layer.hashTagPrefix) ? layer.hashTagPrefix : "",
                         graphicsData: [] /* will hold the actual data */
                        });                         
               } 
            });
            
            _.each(config.QueryLayers, function(layer) {
                rtnArray.push(
                    {paneId: layer.paneId,
                     heading: layer.heading,
                     title: layer.title,
                     key: layer.key,
                     identifyContainer: layer.identifyDivContId,
                     isGraphics: false,
                     isForest: (layer.isForest) ? true: false,
                     isWilderness: (layer.isWilderness) ? true: false,
                     doExtentZoom: (layer.doExtentZoom) ? true: false,
                     dataObject: {
                         key: layer.key,
                         value: "",
                         title: "",
                         numberValues: 0,
                         data: [] /* will hold the actual data */ 
                     }                     
                    });                          
            });            
            rtnArray.push({paneId: "tab10", active: false, visible: true, keepVisible: true, heading: "Share", title: "Share Information", key: "share"});
            return rtnArray;
        }        
        
        //************************************************************************
        //  Identify Controller
        //  https://developers.arcgis.com/javascript/jsapi/infowindowbase-amd.html#settitle
        //************************************************************************
        
        function IdentifyController($scope, $log, $compile, $timeout, $window, $modal, GetterSrvc, QuerySrvc, IdentifySrvc) {
 
            $scope.identifyData = {
                didJSONProcess : false,
                hasData : false,
                didIdentFirstTime: false,
                doNewIdentify: false,
                title: "Identify Title",
                mapPoint: null,
                screenPoint: null,
                graphic: null,
                layerData: {},
                tabs: setTheTabArray(), 
                activityData: null                           
            };
            

            //var content = '<div id="infowindow_content" style="overflow-y:auto;" ng-include src="\'js//widgets//identify//template//identifyContent.tpl.html\'"></div>';
            var content = '<div id="infowindow_content" ng-include src="\'js//widgets//identify//template//identifyContent.tpl.html\'"></div>';
            //content = '<div id="infowindow_content" style="overflow-y:auto;">Parcel ID: <br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello<br>hello world<br>hello world<br>hello world<br>hello world<br>hello world</div>';
            var title = '<div id="infowindow_title" ng-include src="\'js//widgets//identify//template//identifyTitle.tpl.html\'"></div>';
            //var content = '<div id="infowindow_content" idcntctrlbrwsr></div>'; //this should work as well or instead, use idcontentctrl and share the directive with mobile and browser.
            
            $scope.map.on("load", function(event) {
 
                $scope.map.on("click", function(evt) { 
                    $scope.identifyData.doNewIdentify = true;                     
                    (evt.graphic && evt.graphic.attributes) ?
                        $scope.identifyData.graphic = evt.graphic :
                        $scope.identifyData.graphic = null;
                    $scope.setMapAndScreenPoints(evt);
                                        
                    if ($scope.map.infoWindow.isShowing) {
                        $scope.map.infoWindow.hide();
                    } else if (!$scope.identifyData.didJSONProcess) {
                        $scope.setActivityData(); //only happens once
                    } else {
                        $scope.clearIdentifyData();
                        $scope.startIdentifyProcessing();
                    }                                       
                });
                
                $scope.map.infoWindow.on("show", function(evt) {
                    //$log.info("IdentifyController.js map.infowindow.on.show() evt=", evt.target);
                    var tab = _.findWhere($scope.identifyData.tabs, {active: true});
                    if (tab) {
                        //http://stackoverflow.com/questions/31193575/trap-focus-in-html-container-with-angular
                        $timeout(function() {
                            var key = "#" + tab.key;
                            var dom = $(key);
                            if (dom && dom.length > 0) {
                                dom[0].focus();
                            }
                        },500);
                    }
                });
                                               
                $scope.map.infoWindow.on("hide", function(evt) { 
                    //Karen added.
                    $scope.map.infoWindow.setContent("");
                    $scope.map.infoWindow.setTitle("");
                    $scope.clearIdentifyData();
                    //$log.info("IdentifyController.js: map.infoWindow.on.hide() (after clearIdentifyData method called) $scope.identifyData= ", $scope.identifyData);
                    if ($scope.identifyData.mapPoint && $scope.identifyData.screenPoint && $scope.identifyData.doNewIdentify) {
                        $scope.startIdentifyProcessing();
                    } else {
                        $scope.identifyData.doNewIdentify = false;
                    }                                
                });
            });
            

            $scope.cancel = function() {
                $scope.map.infoWindow.hide();
            };
            
            $scope.clearIdentifyData = function() {
                _.each($scope.identifyData.tabs, function(tab) {
                    if (tab.isGraphics) {
                        tab.graphicsData = [];
                    } else if (tab.dataObject) {
                        tab.dataObject.title = "";
                        tab.dataObject.data = [];
                        tab.dataObject.graphic = null; //possible rss data graphic
                    }
                });            
            };
            
            $scope.handleIdentifyOnMapClick = function(content, title, hasGData) {           
                var qb = new MapClickHandler({
                    mapPoint: $scope.identifyData.mapPoint,
                    map: $scope.map,
                    doPromiseArray: true,
                    deviceIsBrowser: $scope.deviceIsBrowser,
                    layerData: $scope.identifyData.layerData
                });
                qb.addIdentifyClickLocation();
                $scope.toggleNavBarDropdown(); //close dropdowns
                var promiseArray = qb.getIdentifyPromiseArray();
                
                if (promiseArray && promiseArray.length>0) {
                    var curLayerArray = qb.getCurrentLayerArray();
                    
                    QuerySrvc.processQueryArray(promiseArray)
                        .then(function(results){
                            var forestArr = ($scope.$parent && $scope.$parent.modalObject && $scope.$parent.modalObject.stateForestData && $scope.$parent.modalObject.stateForestData.forestArray) ?
                                $scope.$parent.modalObject.stateForestData.forestArray:
                                [];
                            //$log.info("IdentifyController: Got some results but before call results identData.tabs= ", $scope.identifyData);
                            var idResults = new IdentifyResultsHandler({
                                mapPoint: $scope.identifyData.mapPoint,
                                map: $scope.map,
                                currentLayerArray: curLayerArray,
                                forestArray: forestArr,
                                activityData: $scope.identifyData.activityData                                
                            });
                            idResults.processQueryResults($scope.map, results, $scope.identifyData, hasGData);
                            //console.log("identifyController.js: handleIdentifyOnMapClick():  $scope.identifyData= ", $scope.identifyData);
                            if ($scope.identifyData.hasData) {
                                $scope.setIdentifyWindow($scope.identifyData.screenPoint); 
                            }
                                                                                                                            
                            $scope.showHideWaitDiv(false, false);
                            //console.log("IdentifyController.js: handleIdentifyOnMapClick() END $scope.identifyData", $scope.identifyData); 
                        }, function(error) {
                            $log.error("IdentifyController.js: handleIdentifyOnMapClick() : Error= ", error);
                            if (error && error.message) {
                                (hasGData) ?
                                    alert(errorMsgs.Identify.missingData.fsData):                                   
                                    alert(errorMsgs.DataError);                                                                                                 
                            } 
                            if (hasGData) {                      
                                _.each($scope.identifyData.tabs, function(tab) { 
                                    if (!tab.isGraphics && tab.dataObject) {
                                        tab.dataObject.data = [];
                                    }
                                });                                
                                $scope.setIdentifyWindow($scope.identifyData.screenPoint);                     
                            } 
                            $scope.showHideWaitDiv(false, false);  
                        }                        
                    );                   
                } else {
                    $scope.showHideWaitDiv(false, false); 
                }                                   
            };        

            //Only for Mobile
            //Maybe following documents for good ways to pull this off. ******************************************************
            //http://weblogs.asp.net/dwahlin/building-an-angularjs-modal-service
            //https://github.com/DanWahlin/CustomerManager
            //http://angular-ui.github.io/bootstrap/#/modal
            $scope.openIdentifyDialog = function () { 
                $scope.identifyData.map = $scope.map; //just to get map so we can zoom to forest from anchor
                if ($scope.shareData) {
                    $scope.identifyData.shareData = $scope.shareData;
                }
                if ($scope.stateForestData) {
                    $scope.identifyData.stateForestData = $scope.stateForestData;
                }
 
                var modalInstance = $modal.open({
                    animation: config.modalDialogs.doAnimation, 
                    backdrop: config.modalDialogs.doBackdrop,
                    templateUrl: "js//widgets//identify//template//identifyModal.tpl.html",
                    controller: "IdentModalCtrl", 
                    size: "identify",
                    resolve: {
                        identifyObject: function() {
                            return $scope.identifyData;
                        }                       
                    }
               });
                modalInstance.result.then(function (identifyObj) {
                    //http://www.kendar.org/?p=/tutorials/angularjs/part03
                    if (identifyObj!=null) {
                           $scope.identifyData = identifyObj;
                           //$log.info("modalInstance.result.then() Coming back in $scope.identifyData= ", $scope.identifyData);                 
                    }
                }, function () {
                    $log.info('IdentifyController.js: Modal dismissed at: ' + new Date());
                });
            };
            
            $scope.setActivityData = function() {
                var url = utils.getJSONFileLocation($scope.JsonFileLocation, config.Identify.activityJSON);
                GetterSrvc.getDataViaHTTP(url).then(function(promiseObject) {
                    var theData = (promiseObject.data) ? promiseObject.data : promiseObject;
                    if (theData && theData.Activities) {
                        $scope.identifyData.activityData = theData.Activities;
                        $scope.identifyData.didJSONProcess = true;
                        $scope.startIdentifyProcessing();                      
                    }
                }, function(error) {
                    $log.error("IdentifyController setActivityData() GetterSrvc.getDataViaHTTP() Failure. Unable to retrieve json items", error);
                    $scope.identifyData.didJSONProcess = true;
                    $scope.startIdentifyProcessing();                   
                });                    
            };  
              
            //Prior to Identify,  see if user previously turned on Yonder or Twitter checkbox..  Set its tab active if so
            //Else, just set tab.active = false always.  We no longer will look at previous active tab
            $scope.setIdentifyTabActive = function() {
                var key = ($scope.layersData && $scope.layersData.nextIdentifyActiveTab && $scope.layersData.nextIdentifyActiveTab.length > 0) ?
                    $scope.layersData.nextIdentifyActiveTab:
                    "";
                $scope.setIdentifyTabActive2(key);  //TODO

                if ($scope.layersData && $scope.layersData.nextIdentifyActiveTab && $scope.layersData.nextIdentifyActiveTab.length > 0) {
                   $scope.layersData.nextIdentifyActiveTab = "";   
                }                                              
            };
            
            //this is called from identifyContent tab click and setIdentifyTabActive
            $scope.setIdentifyTabActive1 = function(evtObj) {
                var tab = (evtObj && evtObj.target) ? evtObj.target : evtObj;
                if (tab && tab.id) {
                    $scope.setIdentifyTabActive2(tab.id);
                    $scope.setTitle(tab.id); 
                    //tab.focus();                
                }                                            
            }; 
            
            $scope.setIdentifyTabActive2 = function(key) {
                _.each($scope.identifyData.tabs, function(tab) {
                    if (tab.key == key) {
                        tab.active = true;
                    } else {
                        tab.active = false;
                    }
                });                 
            };
            
       
            $scope.setIdentifyWindow = function(screenPoint) {
                //http://roubenmeschian.com/rubo/?p=51  
                //http://www.bennadel.com/blog/2748-compiling-transcluded-content-in-angularjs-directives.htm              
                $scope.setIdentifyVisibility();
                $scope.setTitle("");
                $scope.setShareData();
                //if ($scope.device.key != "mobile") {           
                if ($scope.deviceIsBrowser) {
                    //http://stackoverflow.com/questions/25943479/compileing-already-compiled-elements-is-not-supported-what-to-do-then 
                    //http://stackoverflow.com/questions/17090964/replace-element-in-angularjs-directive-linking-function                   
                    if ($scope.identifyData.didIdentFirstTime == false) {
                        //http://odetocode.com/blogs/scott/archive/2014/05/07/using-compile-in-angular.aspx
                        var compiledContent = $compile(content)($scope);
                        var compiledTitle = $compile(title)($scope);                                               
                        $scope.map.infoWindow.setContent(compiledContent[0]);
                        $scope.map.infoWindow.setTitle(compiledTitle[0]);  //this is changed by the model
                        $scope.identifyData.didIdentFirstTime = true;                   
                    } else {
                        var compiledContent = $compile(content)($scope, function(clone) {
                            $(content).replaceWith(clone); //jquery does this
                        });
                        var compiledTitle = $compile(title)($scope, function(clone) {
                            $(title).replaceWith(clone);
                        });
                        $scope.map.infoWindow.setContent(compiledContent[0]);
                        $scope.map.infoWindow.setTitle(compiledTitle[0]);  //this is changed by the model                                                
                    }                   
                   $scope.map.infoWindow.resize(config.Identify.size[0],config.Identify.size[1]); //width, height                  
                   $scope.map.infoWindow.show(screenPoint, $scope.map.getInfoWindowAnchor(screenPoint));
                                                     
                } else {
                    $scope.openIdentifyDialog();                                     
                }                                                    
            };
        
            //sets tab visibility and active status. Visibility used in template too
            $scope.setIdentifyVisibility = function() {
                var bHasActive = false,
                    bIsVisible = false,
                    i = 0,
                    itm = -1;
                    
                _.each($scope.identifyData.tabs, function(tab) {
                    if (!tab.keepVisible) {
                        if (tab.isGraphics) {
                            tab.visible = (tab.graphicsData.length > 0)  ? true :  false;    
                        } else {
                            //set visibility of the various feature layers
                            tab.visible = (tab.dataObject && typeof tab.dataObject == 'object' && tab.dataObject.data !=null && tab.dataObject.data.length > 0)  ? true :  false; 
                        }
                        if (tab.visible == false && tab.active == true) {
                            tab.active = false;  
                        }
                        if (!bHasActive && tab.active) {
                            bHasActive = true;
                        }
                        if (!bIsVisible && tab.visible) {
                            bIsVisible = true;
                        }
                        if (itm < 0 && tab.visible && !tab.active) {
                            itm = i;
                        }                        
                    }                   
                    i++;
                });
                if (!bHasActive && bIsVisible && itm > -1) {
                    $scope.identifyData.tabs[itm].active = true; //set one active if there are currently no active tabs.
                } 
                //$log.info("IdentifyController.js: setIdentifyVisbilitiy() (after setting it) tabs= ", $scope.identifyData.tabs);
            };           

            $scope.setMapAndScreenPoints = function(evt) {
                //var genericLayers = ($scope.searchData && $scope.searchData.layers && $scope.searchData.layers.length > 0) ? $scope.searchData.layers : [];
                //$log.info("IdentifyController.js: setMapAndScreenPoints() $scope.map.graphicsLayerIds = ", $scope.map.graphicsLayerIds); 
                if (evt.graphic && evt.graphic.attributes && isGraphicSameSpatialRef(evt.graphic, $scope.map) && 
                 ((evt.graphic.attributes.clusterCount && evt.graphic.attributes.clusterCount == 1 && isGraphicAGraphicsLayer(evt.graphic, $scope.map.graphicsLayerIds) || 
                 (evt.graphic.attributes.address)))) {
                    $scope.identifyData.mapPoint = mapHelper.createMapPoint(evt.graphic.geometry.x, evt.graphic.geometry.y, $scope.map.spatialReference.wkid);                   
                    $scope.identifyData.screenPoint = screenUtils.toScreenPoint($scope.map.extent, $scope.map.width, $scope.map.height, $scope.identifyData.mapPoint);
                    
                    //var key = getQueryLayerKey(evt.graphic, $scope.navBarData.selLayerKey); //I removed $scope.navBarData.selLayerKey as it wasnt working right
                    var key = getQueryLayerKey(evt.graphic, "");
                    $scope.identifyData.layerData = getLayerData(evt.graphic, key); //key of the query layer name. we need to query it if out of scale
                    //$log.info("IdentifyController.js: setMapAndScreenPoints() $scope.identifyData.layerData= ", $scope.identifyData.layerData);                     
                } else {
                    $scope.identifyData.mapPoint = evt.mapPoint;
                    $scope.identifyData.screenPoint = evt.screenPoint;
                    $scope.identifyData.layerData = {};                    
                }
            };
            
            $scope.setShareData = function() {                
                if (!$scope.shareData) {
                    $scope.shareData = utils.getShareObject($window.location);
                }
                $scope.shareData.urlObject.urlExtent = utils.getShareObjectExtent(config.Share.URLExt, $scope.shareData, $scope.map);  //sets up url with current extent 
                $scope.shareData.urlObject.urlExtentTextbox = utils.getShareObjectExtent(config.Share.URLExtTextbox, $scope.shareData, $scope.map);
                //$log.info("IdentifyController.js: setShareData(): $scope.shareData= ", $scope.shareData);             
            };
                        
            //Note: Since these are already set properly, because select is calling this, i dont want to set tab.active here.
            $scope.setTitle = function(key) {
                if (key.length == 0) {
                    var tab = _.findWhere($scope.identifyData.tabs, {active: true});
                    if (tab) {
                        key = tab.key;
                    }
                }
                $scope.identifyData.title = IdentifySrvc.getTitle(key, $scope.identifyData);                                         
            };
            
            $scope.startIdentifyProcessing = function() {
                var doIdentify = false,
                    hasData = false;
                $scope.identifyData.doNewIdentify = false;
                
                if ($scope.identifyData.graphic) {
                    if ($scope.identifyData.graphic.attributes.clusterCount && clusterGraphicsCanIdentify($scope.identifyData.graphic, $scope.map)) {
                        doIdentify = true;
                    } else if (!$scope.identifyData.graphic.attributes.clusterCount) {
                        doIdentify = true;
                        if (isGraphicFromGeoRSSLayer($scope.identifyData.graphic)) {
                            //Handles fire data (GeoRSS Feed) inside weather-fire tab.                          
                            hasData = setGeoRSSGraphic($scope.identifyData.graphic, $scope.identifyData.tabs);
                        }
                    }                    
                } else {
                    doIdentify = true;
                }
                                                                                               
                if (doIdentify) {                  
                    $scope.showHideWaitDiv(true, false);
                    $scope.setIdentifyTabActive();
                    _.each(config.SideBarLayers, function(layer) {
                        var graph = null,
                            tab = null;
                            
                        if (layer.isGLayer && !layer.isFeatured && layer.clusterOptions) {                            
                            tab = utils.getObjectUsingKey(layer.identifyDivId, $scope.identifyData.tabs);
                            graph = ($scope.identifyData.graphic && $scope.identifyData.graphic._graphicsLayer && $scope.identifyData.graphic._graphicsLayer.id && $scope.identifyData.graphic._graphicsLayer.id == layer.clusterOptions.id) ?
                                $scope.identifyData.graphic:
                                getNearestClusterGraphic(layer.clusterOptions.id, $scope.identifyData.mapPoint, $scope.map, $scope.deviceIsBrowser, $scope.identifyData.graphic);                                                                                                         
                        } else if (layer.isFeatured && $scope.identifyData.graphic && isGraphicAFeaturedLayer($scope.identifyData.graphic, layer)) {
                            graph = $scope.identifyData.graphic;
                            tab = getFeaturedContentTab($scope.identifyData.graphic, $scope.identifyData.tabs);
                        }
                        
                        if (tab && graph) {
                            var rArr = getAssociatedGraphics(graph, layer.isFeatured); 
                            if (rArr && rArr.length > 0) {
                                tab.graphicsData = getGraphicAttributes(rArr);
                                if (tab.graphicsData.length > 0) {
                                    hasData = true;
                                }
                            }
                        }                                                                       
                    });                    
                    //$log.info("IdentifyController.js: startIdentifyProcessing() $scope.identifyData.tabs = ", $scope.identifyData.tabs);
                    $scope.handleIdentifyOnMapClick(content, title, hasData);                                                                      
                }                
            };
            
            $scope.toTrusted = function(html_code) {                
                return IdentifySrvc.HTMLToTrusted(html_code);
            };
            
            $scope.zoomToExtent = function(evnt) { 
                var key = (evnt.currentTarget.id.indexOf("_") > -1) ? 
                    evnt.currentTarget.id.substring(evnt.currentTarget.id.indexOf("_")+1):
                    evnt.currentTarget.id; 
                IdentifySrvc.zoomToExtent(key, $scope.identifyData.tabs, $scope.map, $scope.stateForestData);                      
            };
        } 

        function init(App) {           
            App.controller('IdentifyCtrl', ['$scope', '$log', '$compile', '$timeout', '$window', '$modal', 'GetterSrvc', 'QuerySrvc', 'IdentifySrvc', IdentifyController]);
            return IdentifyController;
        }

        return {
            start : init
        };

    });

}).call(this); 