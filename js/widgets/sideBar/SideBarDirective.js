/**
 * @author Karen Robine
 */

(function () {
    "use strict";

    define([
        'text!widgets/sideBar/template/sideBar.tpl.html'
    ], function (tpl) {

        function SideBarDirective() {
            return {
                restrict: 'A',
                template: tpl,
                controller: 'SideBarCtrl',
                link: function (scope, element) {

                }
            };
        }

        function init(App) {
            App.directive('sidebarctrl', [SideBarDirective]);
            return SideBarDirective;
        }

        return { start: init };

    });

}).call(this);