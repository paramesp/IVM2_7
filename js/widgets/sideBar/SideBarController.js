/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular',
            'js/config',            
            'js/helpers/utils',
            'js/helpers/mapHelper',
            'js/errorMsgs',
           ], function(angular, config, utils, mapHelper, errorMsgs) {

        //************************************************************************
        //  SideBar Controller
        //   https://angular-ui.github.io/bootstrap/#/modal
        //   Note: This is started from SideBarBootstrap
        //************************************************************************
        
        function SideBarController($scope, $log, $timeout) {
            
            $scope.legendLayersObj = {
                layersShowing: false,
                legendShowing: false
            };
            
            $scope.doClear = function() {
                //clear layers
                if ($scope.layersData && $scope.layersData.dataArray && $scope.layersData.dataArray.length > 0) {
                    _.each($scope.layersData.dataArray, function(layer) {
                        //$log.info("SideBarController.js: doClear(): layer= ", layer);
                        if (layer.isChecked) {
                            layer.isChecked = false;                            
                            $scope.setLayersContent({checked: false, id: layer.key, fromCode: true}); 
                        }
                        layer.didCheckbox = true; //so it wont automatically turn back on
                    });                 
                }
                
                //clear activities
                if ($scope.navBarData && $scope.navBarData.selItem && $scope.navBarData.selItem.selectedValue && $scope.navBarData.selItem.selectedValue.length > 0 && 
                    $scope.navBarData.selItem.selectedValue != $scope.navBarData.prevSelectedKey && $scope.modalObject.exploreData && 
                    $scope.modalObject.exploreData.explorePanelData && $scope.modalObject.exploreData.explorePanelData.queryArray) {                                       
                    var qObj = utils.getObjectUsingKey($scope.navBarData.selItem.selectedValue, $scope.modalObject.exploreData.explorePanelData.queryArray);
                    if (qObj && qObj.isChecked) {
                         qObj.isChecked = false;
                         $scope.processQueryLayer([qObj]);
                    }                   
                }
                $scope.toggleNavBarDropdown(); //close it
                
                //clear search
                //http://stackoverflow.com/questions/24513564/angularjs-directive-call-method-from-parent-scope-within-template
                //https://www.airpair.com/angularjs/posts/transclusion-template-scope-in-angular-directives
                if ($scope.navBarData && $scope.navBarData.searchData) {
                    if ($scope.navBarData.searchData.layers && $scope.navBarData.searchData.layers.length > 0) {                       
                        $scope.navBarData.searchData.inputText = $scope.navBarData.searchData.searchText = "";
                        $scope.navBarData.searchData.layers = mapHelper.removeLayers($scope.map, $scope.navBarData.searchData.layers, true, false);                    
                    }
                    if ($scope.navBarData.searchData.geocodeGraphicsLayer)  {
                        $scope.navBarData.searchData.geocodeGraphicsLayer.clear();
                    }                     
                }
                //clear marker activity url parameter
                if ( $scope.markeractivitynew ){
                        $scope.markeractivitynew.isChecked=false;
                        $scope.processQueryLayer([$scope.markeractivitynew]);
                }
                   
            };
            
            $scope.setLayersLegendFocus = function(id) {
                //console.log("SideBarController.js:  setLayersLegendFocus id = "  + id);
                $timeout(function() {
                    angular.element(id).focus();
                }, 1000);
            };
            
            $scope.toggleLegendLayers = function(isLegend) {
                var tst = $scope.navBarData;
                if (isLegend) {
                    $scope.legendLayersObj.legendShowing = !$scope.legendLayersObj.legendShowing; 
                    $scope.legendLayersObj.layersShowing = false; 
                    ($scope.legendLayersObj.legendShowing) ?
                        $scope.setLayersLegendFocus("#legendUC_close"):
                        $scope.setLayersLegendFocus("#legendUCFlyout");                                            
                } else {
                   $scope.legendLayersObj.layersShowing = !$scope.legendLayersObj.layersShowing; 
                   $scope.legendLayersObj.legendShowing = false;
                    ($scope.legendLayersObj.layersShowing) ?
                        $scope.setLayersLegendFocus("#layersUC_close"):
                        $scope.setLayersLegendFocus("#layersUCFlyout");                  
                }
            }; 
                               
        }

        function init(App) {
            App.controller('SideBarCtrl', ['$scope', '$log', '$timeout', SideBarController]);
            return SideBarController;
        }

        return {
            start : init
        };

    });

}).call(this); 