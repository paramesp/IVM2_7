/**
 * @author Karen Robine
 */

(function () {
    "use strict";

    define([
        'text!widgets/sideBar/template/legend.tpl.html'
    ], function (tpl) {

        function LegendDirective() {
            return {
                restrict: 'A',
                template: tpl,
                //controller: 'LegendCtrl',
                link: function (scope, element) {

                }
            };
        }

        function init(App) {
            App.directive('legendctrl', [LegendDirective]);
            return LegendDirective;
        }

        return { start: init };

    });

}).call(this);