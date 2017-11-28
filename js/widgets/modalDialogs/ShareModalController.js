/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular',
            'underscore',
            'js/config',            
            'js/helpers/utils',
            'js/errorMsgs',
           ], function(angular, _, config, utils, errorMsgs) {


        //************************************************************************
        //  Share Controller
        //   https://angular-ui.github.io/bootstrap/#/modal
        //   Note: This is started from navBarBootstrap
        //************************************************************************
        
        function ShareModalController($scope, $log, $window, $modalInstance, modalObject) {

            $scope.modalObject = modalObject;
            $scope.modalObject.type = "share";
                                    
            if (!$scope.modalObject.shareData) {
                $scope.modalObject.shareData = utils.getShareObject($window.location);
            }
                              

            $scope.modalObject.shareData.urlObject.urlExtent = utils.getShareObjectExtent(config.Share.URLExt, $scope.modalObject.shareData, $scope.modalObject.map);
            $scope.modalObject.shareData.urlObject.urlExtentTextbox = utils.getShareObjectExtent(config.Share.URLExtTextbox, $scope.modalObject.shareData, $scope.modalObject.map);
            $scope.shareData = $scope.modalObject.shareData; //uses shareData to build the content  
            //Param addedd these line - start           
             var extraParams={};
             _.each(config.queryPanels.exploreQuery.queryArray, function(qObj) {                               
                    if (qObj.name && qObj.isChecked) {
                        extraParams.urlExtent =config.Share.URLExtAddin + encodeURIComponent(qObj.name);
                        extraParams.urlExtentTextbox = config.Share.URLExtAddinTextBox + encodeURIComponent(qObj.name);            
                    }
              },$scope);
              
            if (!angular.equals({},extraParams)){
                 $scope.modalObject.shareData.urlObject.urlExtent +=extraParams.urlExtent;
                 $scope.modalObject.shareData.urlObject.urlExtentTextbox +=extraParams.urlExtentTextbox;
            }
            //end         
            $scope.$on('modal.closing', function(event, reason, closed) {
                if (typeof reason != 'undefined' && typeof reason == 'string' && (reason.indexOf("escape") > -1 || reason.indexOf("backdrop") > -1)) {
                    event.preventDefault();
                    $modalInstance.close($scope.modalObject); //passes data back                        
                }
            });

            $scope.cancel = function () {
                $modalInstance.close($scope.modalObject);
            };
            
        }

        function init(App) {
            App.controller('ShareModalCtrl', ['$scope', '$log', '$window', '$modalInstance', 'modalObject', ShareModalController]);
            return ShareModalController;
        }

        return {
            start : init
        };

    });

}).call(this); 