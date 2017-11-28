/**
 * @author Karen Robine
 */

(function() {
    "use strict";

    define([
        'widgets/navBar/NavBarController',
        'widgets/navBar/NavBarDirective',
        'widgets/modalDialogs/ExploreModalController',
        'widgets/navBar/ExploreController',
        'widgets/navBar/ExploreContentDirective', 
        'widgets/navBar/SearchController',
        'widgets/navBar/SearchContentDirective',                
        'widgets/modalDialogs/BasemapsController',
        'widgets/modalDialogs/PDFController',
        'widgets/modalDialogs/ShareModalController',
        'widgets/share/ShareContentDirective',
        'widgets/share/ShareController',
    ], function(NavBarController, NavBarDirective, ExploreModalController, ExploreController, ExploreContentDirective, SearchController, SearchContentDirective, BasemapsController, PDFController, ShareModalController, ShareContentDirective, ShareController) {

        function init(App) {
            NavBarController.start(App);
            NavBarDirective.start(App);
            //LegendLayersBootstrap.start(App);
            
            ExploreModalController.start(App);
            ExploreController.start(App);
            ExploreContentDirective.start(App);
            
            SearchController.start(App);
            SearchContentDirective.start(App);
                       
            BasemapsController.start(App);
            PDFController.start(App);
            
            ShareModalController.start(App);
            ShareContentDirective.start(App);
            ShareController.start(App);
        }

        return { start: init };

    });

}).call(this);