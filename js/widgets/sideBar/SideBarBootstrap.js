/**
 * @author Karen Robine
 */

(function() {
    "use strict";

    define([
        'widgets/sideBar/SideBarController',
        'widgets/sideBar/SideBarDirective',
        'widgets/sideBar/LegendDirective',
        'widgets/sideBar/LayersController',
        'widgets/sideBar/LayersDirective'                       
    ], function(SideBarController, SideBarDirective, LegendDirective, LayersController, LayersDirective) {

        function init(App) {            
            SideBarController.start(App);
            SideBarDirective.start(App);
            LegendDirective.start(App);
            LayersController.start(App);
            LayersDirective.start(App);                                       
        }

        return { start: init };

    });

}).call(this);