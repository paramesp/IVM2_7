/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular', 
            'js/config', 
            'js/helpers/mapHelper', 
            'js/helpers/utils',
            'js/errorMsgs',
            ], function(angular, config, mapHelper, utils, errorMsgs) {

        //************************************************************************
        //  IdentifyModal Controller
        //   https://angular-ui.github.io/bootstrap/#/modal
        //************************************************************************        
        function IdentifyModalController($scope, $log, $modalInstance, QuerySrvc, IdentifySrvc, identifyObject) {

            $scope.identifyData = identifyObject;            
            if ($scope.identifyData && $scope.identifyData.shareData) {
                $scope.shareData = $scope.identifyData.shareData; //prepares for the shareContent to be setup
            }            
            
            $scope.cancel = function () {
                $modalInstance.close($scope.identifyData); //passes data back
            };
            
            $scope.setIdentifyTabActive1 = function(evtObj) {
                var tab = (evtObj && evtObj.target) ? evtObj.target : evtObj;
                if (tab && tab.id) {
                    _.each($scope.identifyData.tabs, function(tab1) {
                        (tab1.key == tab.id) ?
                            tab1.active = true:
                            tab1.active = false;
                    }); 
                    $scope.setTitle(tab.id); 
                    //$log.info("IdentifyModalController.js: setIdentifyTabActive1() $scope.identifyData.tabs=", $scope.identifyData.tabs);                
                }                                          
            };
                   
            $scope.setTitle = function(key) {
                $scope.identifyData.title = IdentifySrvc.getTitle(key, $scope.identifyData);                                     
            };
            
            $scope.toTrusted = function(html_code) {                
                return IdentifySrvc.HTMLToTrusted(html_code);
            };
            
            $scope.zoomToExtent = function(evnt) {
                var key = (evnt.currentTarget.id.indexOf("_") > -1) ? 
                    evnt.currentTarget.id.substring(evnt.currentTarget.id.indexOf("_")+1):
                    evnt.currentTarget.id; 
                IdentifySrvc.zoomToExtent(key, $scope.identifyData.tabs, $scope.identifyData.map, $scope.identifyData.stateForestData);  
                $modalInstance.close($scope.identifyData); //passes data back 
            };                                    
        }

        function init(App) {
            App.controller('IdentModalCtrl', ['$scope', '$log', '$modalInstance', 'QuerySrvc', 'IdentifySrvc', 'identifyObject', IdentifyModalController]);
            return IdentifyModalController;
        }

        return {
            start : init
        };

    });

}).call(this); 