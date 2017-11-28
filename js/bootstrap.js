/**
 * @author Karen Robine
 */

(function() {
    "use strict";

    define([
        'angular',
        'widgets/map/MapController',
        'modules/GetterService',
        'modules/QueryService',
        'modules/PrintService',
        'widgets/navBar/NavBarBootstrap',
        'widgets/misc/MiscBootstrap',
        'widgets/identify/IdentifyBootstrap',
        'widgets/sideBar/SideBarBootstrap',
        'js/config',
        'js/helpers/utils',
        'modules/RequestHandlerService'
    ], function(
        angular, 
        MapController, 
        GetterService, 
        QueryService,
        PrintService,  
        NavBarBootstrap, 
        MiscBootstrap, 
        IdentifyBootstrap,
        SideBarBootstrap,
        config,
        utils,
        RequestHandlerService) {

        function init() {
            //https://thinkster.io/a-better-way-to-learn-angularjs/config-function
            var App = angular.module('app', ['ui.bootstrap', 'ngAnimate', 'mj.scrollingTabs'])
                .config(function ($httpProvider) {
                    //in case we need anything for the configure function
                    //Enable cross domain calls
                    $httpProvider.defaults.useXDomain = true;
                    //force http get requests to not cache. this works for MapSource.json file (all our json files)
                    //$httpProvider.defaults.cache = false;
                });
            RequestHandlerService.start(App);
            App.run(['RequestHandlerService',function(RequestHandlerService){
                var urlParams = RequestHandlerService.URLValues;
                if (!angular.equals({},urlParams)){
                    var isValidObj=RequestHandlerService.isValidParameters(urlParams);
                    if (!isValidObj.error){
                        //replace the URL $$$
                        RequestHandlerService.setMapServiceKey(); 
                    } 
                 }                   
            }]);   

            MapController.start(App);
            
            GetterService.start(App); //used by many of the widgets
            QueryService.start(App); //used by many of the widgets
            PrintService.start(App); //used by the Print Controller.
            
            //Start the widgets
            NavBarBootstrap.start(App);
            MiscBootstrap.start(App);            
            IdentifyBootstrap.start(App);            
            SideBarBootstrap.start(App);
  
            //http://cdnjs.com/libraries/angular-ui-bootstrap
            //https://docs.angularjs.org/guide/bootstrap  See notes on manual initialization
            angular.bootstrap(document.body, ['app']);

            return App;
        }

        return { start: init };

    });

}).call(this);