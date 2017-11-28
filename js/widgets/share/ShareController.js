/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular',
            'js/config',            
            'js/helpers/utils',
            'js/errorMsgs',
           ], function(angular, config, utils, errorMsgs) {

        //Mail open new window bug:
        //http://stackoverflow.com/questions/21461589/javascript-mailto-using-window-open
        //http://stackoverflow.com/questions/13457684/how-to-prevent-mailto-event-from-opening-a-new-tab-in-browser
        function doShare(shareObj, url, window, timeout) {
            if (shareObj && url) {
                url = utils.stringFormat(shareObj.url, url);
                //console.log("ShareController.js: doShare() shareObj= ", shareObj);                                
                var win = window.open(url, "_blank");
                if (shareObj.isMail) {
                    timeout(function() {
                        win.close();                   
                    }, 1000);                                        
                }
            } else {
                alert(errorMsgs.Share.genericError);
            }            
        }       

        //************************************************************************
        //  Share Controller
        //   https://angular-ui.github.io/bootstrap/#/modal
        //   Note: This is started from navBarBootstrap
        //************************************************************************
        
        function ShareController($scope, $log, $window, $timeout) {

            
            $scope.doShare = function(key, isExtent) {
                var shareObj, url;
                if (isExtent) {
                    shareObj = utils.getObjectUsingKey(key, $scope.shareData.shareListExtent);
                    url = $scope.shareData.urlObject.urlExtent;
                } else {
                    shareObj = utils.getObjectUsingKey(key, $scope.shareData.shareListNormal);
                    url = $scope.shareData.urlObject.urlNormal;
                }
                doShare(shareObj, url, $window, $timeout);
            };         
            
        }

        function init(App) {
            App.controller('ShareCtrl', ['$scope', '$log', '$window', '$timeout', ShareController]);
            return ShareController;
        }

        return {
            start : init
        };

    });

}).call(this); 