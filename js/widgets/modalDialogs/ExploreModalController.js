/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular', 
            'js/config'
            ], function(angular, config) {
    

        //************************************************************************
        //  Explore Controller
        //   https://angular-ui.github.io/bootstrap/#/modal
        //************************************************************************
        
        function ExploreModalController($scope, $log, $modalInstance, $timeout, modalObject) {
            
            $scope.modalObject = modalObject;
            $scope.modalObject.type = "explore";
            
            if (!$scope.modalObject.exploreData) {
                $scope.modalObject.exploreData = {
                    explorePanelData: config.queryPanels.exploreQuery,
                    keyList: []              
                };                
            }         
                       
            $scope.stateForestData = $scope.modalObject.stateForestData; //TODO: no reason to do this. Eventually we want to just stick with modalObject.stateForestData
             
            $scope.$on('modal.closing', function(event, reason, closed) {
                //handle escape key closing, or clicking on a map
                if (typeof reason != 'undefined' && typeof reason == 'string' && (reason.indexOf("escape") > -1 || reason.indexOf("backdrop") > -1)) {
                    event.preventDefault();
                    $modalInstance.close($scope.modalObject); //passes data back                        
                }
            });
            
            $timeout(function() {
               angular.element("#btnExploreClose").focus();
            }, 2000);

            $scope.cancel = function () {                
                $modalInstance.close($scope.modalObject); //passes data back
            };                  
        }

        function init(App) {
            App.controller('ExploreModalCtrl', ['$scope', '$log', '$modalInstance', '$timeout', 'modalObject', ExploreModalController]);
            return ExploreModalController;
        }

        return {
            start : init
        };

    });

}).call(this); 