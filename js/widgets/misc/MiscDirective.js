/**
 * @author Karen Robine
 */

(function () {
    "use strict";

    define([
        'text!widgets/misc/template/misc.tpl.html'
    ], function (tpl) {

        function MiscDirective() {
            return {
                restrict: 'A',
                template: tpl,
                controller: 'MiscCtrl',
                link: function (scope, element) {

                }
            };
        }

        function init(App) {
            App.directive('miscctrl', [MiscDirective]);
            return MiscDirective;
        }

        return { start: init };

    });

}).call(this);