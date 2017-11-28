/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular', 
            'js/config',
            'underscore',
            'js/helpers/utils',
            'js/helpers/mapHelper',
            'js/errorMsgs' 
            ], function(angular, config, _, utils, mapHelper, errorMsgs) {   

        //handle case for query layers such as Accessible, and Camping, need to turn off one if other one checked
        function uncheckOtherQueryLayers(qObj, queryArray) {
            _.each(queryArray, function(qArrObj)  {
                if (qObj.key != qArrObj.key && qArrObj.isChecked == true && !qArrObj.layer) {
                    //we have another one. We need to uncheck it.
                    qArrObj.isChecked = false;
                }
            });
        }

        //************************************************************************
        //  Explore Controller
        //   https://angular-ui.github.io/bootstrap/#/modal
        //************************************************************************
        
        function ExploreController($scope, $log, $timeout, QuerySrvc) { 
           

            //TODO: BUG: Space key clicked on button causes this event to occur twice.
            //TODO: maybe use the method i used in basemap to fix this. this btn-checkbox ng-model thing isnt cutting it.
            $scope.handleChangeEvent = function(value) {
                //http://stackoverflow.com/questions/13077320/angularjs-trigger-when-radio-button-is-selected
                //http://stackoverflow.com/questions/29108858/angularjs-checkbox-ng-change-issue-with-event-target
                //$log.info("ExploreController.js: handleChangeEvent value = " + value);
                var qObj = utils.getObjectUsingKey(value, $scope.modalObject.exploreData.explorePanelData.queryArray);
                //$log.info("ExploreController.js: handleChangeEvent() $scope.modalObject.didExplore= ", $scope.modalObject.didExplore + " value= " + value + " $scope.modalObject.type= " + $scope.modalObject.type + " qObj= ", qObj);     
                if (qObj) { 
                    if (!$scope.modalObject.didExplore) {
                         if ($scope.modalObject.exploreData.keyList.length == 0 || !_.contains($scope.modalObject.exploreData.keyList, value)) {
                             $scope.modalObject.exploreData.keyList.push(value);
                         }                    
                         $scope.cancel();   
                    }else if (value && value.length > 0){                        
                            if (qObj.layer && qObj.layer.isSideBar)  {
                                //This is currently not being executed, as we have no layers in our Explore that also exist in the Sidebar
                                $scope.setLayersDataFromApp([qObj]);
                            } else {
                                //handles case for query layers such as Accessible, and Camping, need to turn off one if other one checked
                                if (qObj.isChecked) {
                                    uncheckOtherQueryLayers(qObj, $scope.modalObject.exploreData.explorePanelData.queryArray);
                                }                                
                                $scope.processQueryLayer([qObj]); //NavBarController
                            }
                                                                 
                            $scope.toggleNavBarDropdown(); //close it                                     
                     }                                         
                }                                               
            };
            //Param added
            $scope.openSurvey=function(key,val){
              if (!$scope.modalObject.didExplore) {
                    //Two lines copied from NavBarController.
                    var windowObj = utils.getObjectUsingKey(key, config.Windows);
                    window.open(windowObj.URL, "_blank");
               }else{
                    $scope.openTool(key,val);
               } 
                
            };

        }
        
        function init(App) {
            App.controller('ExploreCtrl', ['$scope', '$log', '$timeout', 'QuerySrvc', ExploreController]);
            return ExploreController;
        }

        return {
            start : init
        };

    });

}).call(this); 