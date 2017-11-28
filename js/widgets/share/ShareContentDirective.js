/**
 * @author Karen Robine
 */

(function () {
    "use strict";

    define([
        'text!widgets/share/template/shareContent.tpl.html'
    ], function (tpl) {

        //Links the template with the shareModal.tpl.html
        function ShareContentDirective($timeout, $log) {
            return {
                restrict: 'A',
                template: tpl,
                controller: 'ShareCtrl',
                link: function (scope, element, attrs, ctrl, transclude) {

                }
            };
        }

        function init(App) {
            App.directive('sharecontentctrl', ['$timeout', '$log', ShareContentDirective]);
            return ShareContentDirective;
        }

        return { start: init };

    });

}).call(this);