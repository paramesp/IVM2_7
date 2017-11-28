/**
 * @author Karen Robine
 */

(function() {
    "use strict";

    define([
        'angular',
        'underscore',
        'dojo/dom-construct',        
        'esri/map',
        'esri/dijit/Scalebar',
        'esri/dijit/InfoWindow',
        'esri/dijit/Popup',
        'esri/geometry/Extent',
        'esri/config',
        'js/config',
        'helpers/mapHelper',
        'js/helpers/utils',
        'modules/LayerMaker',
        'esri/urlUtils',
        'modules/Eclipse2017'
    ], function(angular, _, domConstruct, Map, Scalebar, InfoWindow, Popup, Extent, esriConfig, config, mapHelper, utils, LayerMaker, urlUtils,Eclipse2017) {
        
        function extractQueryParametersAndZoom(map) {
            //http://stackoverflow.com/questions/20655877/angularjs-get-current-url-parameters-using-ngroute
            //var search = location.$$absUrl;
            var lat = getQueryString('lat');
            var lng = getQueryString('long');
            var dist = getQueryString('dist');
            
            
            if (lat != "" && lng != "" && dist != "" && !isNaN(lat) && !isNaN(lng) && !isNaN(dist) && utils.isLegalLatLongValue(lat, lng)) {
                    mapHelper.zoomToExtentUsingDistance(parseFloat(lat), parseFloat(lng), parseFloat(dist), map);
            } else {
                var minx = getQueryString('minx');
                var miny = getQueryString('miny');
                var maxx = getQueryString('maxx');
                var maxy = getQueryString('maxy');
                if (minx != "" && miny != "" && maxx != "" && maxy != "" && !isNaN(minx) && !isNaN(maxx) && !isNaN(miny) && !isNaN(maxy))  {
                       mapHelper.zoomToExtent(parseFloat(minx), parseFloat(miny), parseFloat(maxx), parseFloat(maxy), map);
                }              
            }
        }
               
        function getJsonFileLocation(window) {
            var locObj = utils.getObjectUsingKey(window.location.hostname, config.JsonFileLocations);
            if (locObj && locObj.location) {
                return locObj.location;
            } else {
                return "json//";
            }
        }

        function getProxyLocation(window) {
            var locObj = utils.getObjectUsingKey(window.location.hostname, config.Proxy.proxyLocs);
            if (locObj && locObj.location) {
                return locObj.location;
            } 
            return config.Proxy.defaultProxyLoc;
        }
                
        function getQueryString(key) {
            var def = "";
            key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
            var qs = regex.exec(window.location.href);
            if (qs == null) {
                return def;
            } else {
                return qs[1]; 
            }              
        }
        
        function mapConfigs() {
            //console.log("MapController.js: mapConfigs(). This happens fourth");
            var mapExtent = config.DefaultExtent.split(','); 
            var doZoom = mapHelper.getZoomCapability();
          
            ////var infoWindow = new InfoWindow({}, domConstruct.create("div", {"id": "ivmIdentify"}));
            var infoWindow = new Popup({}, domConstruct.create("div", {"id": "ivmIdentify"}));
            infoWindow.startup();
            
            return {
                basemap: config.BaseMapLayers.DefaultBaseMap,
                extent: new Extent({xmin:parseFloat(mapExtent[0]),ymin:parseFloat(mapExtent[1]),xmax:parseFloat(mapExtent[2]),ymax:parseFloat(mapExtent[3]),spatialReference:{wkid:102100}}),
                autoResize: true,
                logo: false,
                infoWindow: infoWindow, 
                wrapAround180: true,
                fadeOnZoom: true, /* not available if navigationMode is classic. */
                optimizePanAnimation: false, /* Added 111115 */
                navigationMode: "css-transforms", /* Changed 111115 classic */
                slider: doZoom,
                sliderStyle: "small",
                showLabels: true
            };
        }

        function mapGen(elem) {
            return new Map(elem, mapConfigs());
        }
        
        function setCors() {
            if (config.CorsServers && config.CorsServers.length > 0) {
                _.each(config.CorsServers, function(srvr) {
                    esriConfig.defaults.io.corsEnabledServers.push(srvr);
                });                 
            }
        }

        //https://developers.arcgis.com/javascript/3/jshelp/ags_proxy.html
        function setProxy(window) {
            if (typeof config.Proxy != 'undefined' && config.Proxy){
                var proxyUrl = utils.stringFormat(config.Proxy.proxyUrl, getProxyLocation(window));                                
                urlUtils.addProxyRule({
                    urlPrefix: config.Proxy.urlPrefix, 
                    proxyUrl: proxyUrl
                });
           }
        }
        
        function windowOnOrientationChange(map, theWindow) {
            theWindow.onorientationchange = function() 
            {
                //I cant seem to get this to work on my smartphone. But window.onresize works
                //alert("windowOnOrientationChange() we have an orientation change");                
                var orientation = theWindow.orientation;
                //console.log("windowOnOrientationChange() we have an orientation change: orientation", orientation);
                map.reposition();
                map.resize(); 
            }            
        } 

        function MapController($scope, $window, $location, $log) {
            $scope.map = mapGen('map');
            $scope.mapLevel = 0;

            //Param added these lines -start
            $scope.setURLParameters=function(){
                $scope.openExploreMenu=  getQueryString('exploremenu'); 
                try{
                    $scope.activityType = decodeURIComponent(getQueryString('activity')); 
                }catch(error){
                    $log.warn("Unknow activity type");
                }   
                $scope.eclipse2017=getQueryString('eclipse'); 
                $scope.recareaid = getQueryString('recid');
                $scope.featurecontent= getQueryString('featurecontent');
                $scope.markeractivity= decodeURIComponent(getQueryString('markeractivity'));

                if ($scope.featurecontent){
                    $scope.featurecontent=$scope.featurecontent.toLowerCase() === 'no'?$scope.featurecontent.toLowerCase():undefined;
                }
       
                if ($scope.openExploreMenu){
                    $scope.openExploreMenu= $scope.openExploreMenu.toLowerCase();
                }else{
                    $scope.openExploreMenu="yes";
                }
                if ($scope.activityType){
                    $scope.openExploreMenu="no";                
                }            
                if ($scope.recareaid) { 
                    mapHelper.queryAndZoomToPoint(config.zoomToRecArea.field, config.zoomToRecArea.dataType, config.zoomToRecArea.url, config.zoomToRecArea.zoomLevel,$scope.recareaid,$scope.map);
                }
                if ($scope.eclipse2017){
                    var eclipseLyr = new Eclipse2017({map:$scope.map});
                    eclipseLyr.addFeatureLayerToMap(config.request.eclipse2017);                
                }
                            
            }
            $scope.setURLParameters();
            // end
            $scope.map.on("key-down", function(evt) {
                //https://geonet.esri.com/thread/30961
                if (evt.keyCode == 27 && $scope.map && $scope.map.infoWindow && $scope.map.infoWindow.isShowing) {
                    $scope.map.infoWindow.hide();
                }               
            });
                                   
            $scope.map.on("load", function(event) {
                //console.log("mapOnLoadEvent() map.on load happened time= " +  new Date());                
                if (config.AddScalebar) {var scalebar = new Scalebar({map: $scope.map}); }
                
                var lyrs = new LayerMaker({map: $scope.map, doLayers:true, device: $scope.device, isStartup: true});
                lyrs.addLayersToMap(); 
                //use location to extract lat, long and scale if necessary 
                
                extractQueryParametersAndZoom($scope.map);
                
                $scope.map.on("zoom-end", function(evt) {                   
                    //we occasionally error here due to the following:
                    //https://docs.angularjs.org/error/$rootScope/inprog
                    $scope.mapLevel = evt.level;
                    //$log.info("MapController() zoom-end: $scope.mapLevel= ", $scope.mapLevel);                   
                    $scope.$apply();
                });                                     
            }); 

            //$scope.device = getDeviceType($window);
            $scope.deviceIsBrowser = ($window.innerWidth > config.DeviceTypes.smartPhoneMaxWidth || $window.innerHeight > config.DeviceTypes.smartPhoneMaxWidth) ? true: false;
                                   
            $scope.JsonFileLocation = getJsonFileLocation($window);
            
            setCors();
            setProxy($window); 
            
            windowOnOrientationChange($scope.map, $window);                        
            
        }
        function init(App) {
            App.controller('AppCtrl', ['$scope', '$window', '$location', '$log', MapController]);
            return MapController;
        }

        return { start: init };

    });

}).call(this);