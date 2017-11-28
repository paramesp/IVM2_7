/**
 * @author Karen Robine
 */

(function () {
    "use strict";

    define([
        'text!widgets/sideBar/template/layers.tpl.html'
    ], function (tpl) {

        function LayersDirective() {
            return {
                restrict: 'A',
                template: tpl,
                controller: 'LayersCtrl',
                link: function (scope, element) {

                }
            };
        }

        function init(App) {
            App.directive('layersctrl', [LayersDirective]);
            return LayersDirective;
        }

        return { start: init };

    });

}).call(this);