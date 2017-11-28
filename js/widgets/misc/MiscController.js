/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular', 
            'js/config',              
            'esri/symbols/PictureMarkerSymbol',
            'modules/Graphics',
            'helpers/mapHelper',
            ], function(angular, config, PictureMarkerSymbol, Graphics, mapHelper) {              
        
        function showMarkerSymbol(mapPoint, map) {
            var gLayer = map.getLayer(config.LocateMe.key);
            var gra = new Graphics({graphicsLayer: gLayer});
            gra.addGraphicToGraphicLayer(mapPoint, new PictureMarkerSymbol(config.LocateMe.geolocatedImage, config.LocateMe.size, config.LocateMe.size), null);
        }
        
        //************************************************************************
        //  Misc Controller
        //************************************************************************
        
        function MiscController($scope, $log) {

            $scope.locateMeData = {
                showWaitDiv: false
            };
            
            //https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/Using_geolocation  
            //https://developers.google.com/web/fundamentals/native-hardware/user-location/obtain-location?hl=en
            //https://developers.google.com/web/updates/2016/04/geolocation-on-secure-contexts-only
            $scope.locateMe = function() {
                $scope.showHideWaitDiv(true, false);
                try {
                    navigator.geolocation.getCurrentPosition(
                        function (position) {
                            var mapPoint = mapHelper.zoomToPoint(position.coords.latitude, position.coords.longitude, config.GenericSearch.singlePointZoomScale, 4326, $scope.map);
                            showMarkerSymbol(mapPoint, $scope.map);
                            $scope.showHideWaitDiv(false, true);
                        },
                        function (error) {
                            $scope.showHideWaitDiv(false, true);
                                                                      
                            switch (error.code) {
                                case error.TIMEOUT:
                                    //alert("The browser is unable to supply a position at this time: Position Service timed out");
                                    break;
                                case error.POSITION_UNAVAILABLE:
                                    alert("The browser is unable to supply a position at this time: Position unavailable");
                                    break;
                                case error.PERMISSION_DENIED:
                                    //https://developers.google.com/web/updates/2016/04/geolocation-on-secure-contexts-only
                                    alert("The browser is unable to supply a position at this time: Permission denied");
                                    break;
                                case error.UNKNOWN_ERROR:
                                    alert("The browser is unable to supply a position at this time: Unknown error");
                                    break;
                            }
                        }, { timeout: 5000 });        
                } catch (err) {
                    $scope.showHideWaitDiv(false, true);
                    alert("Geolocation functionality is not supported.");       
                }
            };
            

            //http://www.sitepoint.com/understanding-angulars-apply-digest/
            $scope.showHideWaitDiv = function(bTurnOn, bDoApply) {
                $scope.locateMeData.showWaitDiv = bTurnOn;
                //$log.info("MiscController.js: showHideWaitDiv bTurnOn= " + bTurnOn + " bDoApply= " + bDoApply);
                try {
                    if (bDoApply) {
                        $scope.$apply(); 
                    }                     
                } catch (e) {
                    $log.error("MiscController.js: showHideWaitDiv() Error. TODO: For this case, dont apply. Error: ", e);
                }                         
            };     
            
        }

        function init(App) {
            App.controller('MiscCtrl', ['$scope', '$log', MiscController]);
            return MiscController;
        }

        return {
            start : init
        };

    });

}).call(this); 