/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular', 
            'js/config', 
            'underscore', 
            'modules/LayerMaker',
            'helpers/mapHelper',
            'helpers/utils',
            'js/errorMsgs',
           ], function(angular, config, _, LayerMaker, mapHelper, utils, errorMsgs) {

        function setBasemap(key, basemapObj, map) {                 
            var layer=null;
            var lm = new LayerMaker({map:map, doLayers:false});  
            lm.hideMapLayers(config.BaseMapLayers.layers);
            layer = lm.getMapLayer(key);
            if (!layer) {
                layer = lm.createTiledMapLayer(key, basemapObj.mapURL, true);
                if (layer) {
                    lm.addLayer(1, layer);
                }                       
            }
            if (layer) {
                lm.showMapLayer(layer);
                if (basemapObj.showLayersOnBasemapSwitch) {
                    lm.setVisibleSubLayers(basemapObj.showLayersOnBasemapSwitch.key, basemapObj.showLayersOnBasemapSwitch.lyrIdArray);
                }               
            }
            return layer;
        }
        
        function verifyBasemapScale(basemapObj, map) {
            if (basemapObj.maxScale > map.getScale()) {
                return false;
            } else {
                return true;
            }       
        }
        
        //************************************************************************
        //  Basemaps Controller
        //   https://angular-ui.github.io/bootstrap/#/modal
        //   Note: This is started from navBarBootstrap
        //************************************************************************
        
        function BasemapsController($scope, $log, $modalInstance, modalObject) {
            //How to set a radio button by default: Next button solves it.
            //http://stackoverflow.com/questions/29539549/radio-button-checked-by-default-when-using-ng-repeat
            //Some better ways to deal with Close, re-open and properly setting the selectedKey
            //http://www.kendar.org/?p=/tutorials/angularjs/part03
            
            $scope.modalObject = modalObject;
            $scope.modalObject.type = "basemaps";

            if (!$scope.modalObject.basemapData) {
                $scope.modalObject.basemapData = {
                    layers: config.BaseMapLayers.layers,
                    selectedKey: config.BaseMapLayers.selectedKey, //used for model  
                };
                $scope.modalObject.basemapData.selectedValue = $scope.modalObject.basemapData.selectedKey;            
            }   

            $scope.$on('modal.closing', function(event, reason, closed) {
                //handle escape key closing, or clicking on a map
                if (typeof reason != 'undefined' && typeof reason == 'string' && (reason.indexOf("escape") > -1 || reason.indexOf("backdrop") > -1)) {
                    event.preventDefault();
                    $modalInstance.close($scope.modalObject); //passes data back                        
                }
            });

            $scope.cancel = function () {                
                //$modalInstance.dismiss('cancel');
                $modalInstance.close($scope.modalObject);
            };   
                          
            $scope.handleClickEvent = function(key) {
                //http://stackoverflow.com/questions/13077320/angularjs-trigger-when-radio-button-is-selected
                if (key != $scope.modalObject.basemapData.selectedValue) {
                    $scope.modalObject.basemapData.selectedKey = $scope.modalObject.basemapData.selectedValue = key;  
                    $scope.setLayerClass(key);
                    var basemapObj = utils.getObjectUsingKey(key, $scope.modalObject.basemapData.layers);
                
                    if (basemapObj) {
                        var layer = setBasemap(key, basemapObj, $scope.modalObject.map);
                        if (layer) {
                            if (!verifyBasemapScale(basemapObj, $scope.modalObject.map)) {
                                alert(errorMsgs.Basemap.notVisible);
                            }
                            //$modalInstance.close($scope.modalObject);  //if we decide to close it afterwards.
                        } else {
                            alert(errorMsgs.Basemap.showingError);
                        }
                    }                    
                }    
            };          
            
            $scope.setLayerClass = function(key) {
                _.each($scope.modalObject.basemapData.layers, function(lyr) {
                    (lyr.key == key) ?
                        lyr.layerClass = "btn-success":
                        lyr.layerClass = "btn-default";
                });
            };
                     
        }

        function init(App) {
            App.controller('BasemapsCtrl', ['$scope', '$log', '$modalInstance', 'modalObject', BasemapsController]);
            return BasemapsController;
        }

        return {
            start : init
        };

    });

}).call(this); 