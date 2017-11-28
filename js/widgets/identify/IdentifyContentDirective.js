/**
 * @author Karen Robine
 */

(function () {
    "use strict";

    define([
        'text!widgets/identify/template/identifyContent.tpl.html'
    ], function (tpl) {
        //Only used for Mobile case
        //Links the template with the identifyModal.tpl.html
        function IdentifyContentDirective($timeout, $log) {
            return {
                restrict: 'A',
                template: tpl,
                link: function (scope, element, attrs, ctrl, transclude) {

                }
            };
        }

        function init(App) {
            App.directive('idcontentctrl', ['$timeout', '$log', IdentifyContentDirective]);
            return IdentifyContentDirective;
        }

        return { start: init };

    });

}).call(this);