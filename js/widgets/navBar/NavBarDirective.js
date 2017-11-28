/**
 * @author Karen Robine
 */

(function () {
    "use strict";

    define([
        'text!widgets/navBar/template/navBar.tpl.html'
    ], function (tpl) {

        function NavBarDirective() {
            return {
                restrict: 'A',
                template: tpl,
                controller: 'NavBarCtrl',
                link: function (scope, element) {

                }
            };
        }

        function init(App) {
            App.directive('navbarctrl', [NavBarDirective]);
            return NavBarDirective;
        }

        return { start: init };

    });

}).call(this);