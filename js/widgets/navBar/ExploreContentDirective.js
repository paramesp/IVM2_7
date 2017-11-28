/**
 * @author Karen Robine
 */

(function () {
    "use strict";

    define([
        'text!widgets/navBar/template/exploreContent.tpl.html'
    ], function (tpl) {

        //Links the template with the identifyModal.tpl.html
        //And also sets the controller, ExploreCtrl to drive it
        function ExploreContentDirective($log) {
            return {
                restrict: 'A',
                template: tpl,
                controller: 'ExploreCtrl',
                link: function (scope, element, attrs, ctrl, transclude) {
                    //console.log("ExploreController.js element= ", element);                    
                }
            };
        }

        function init(App) {
            App.directive('explorecontentctrl', ['$log', ExploreContentDirective]);
            return ExploreContentDirective;
        }

        return { start: init };

    });

}).call(this);