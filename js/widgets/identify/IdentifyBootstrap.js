/**
 * @author Karen Robine
 */

(function() {
    "use strict";

    define([
        'widgets/identify/IdentifyController',
        'widgets/identify/IdentifyModalController',
        'widgets/identify/IdentifyContentDirective',
        'widgets/identify/IdentifyService'
    ], function(IdentifyController, IdentifyModalController, IdentifyContentDirective, IdentifyService) {

        function init(App) {

            IdentifyController.start(App);            
            IdentifyService.start(App);
            //The following 2 are for modal case => mobile. 
            IdentifyModalController.start(App);
            IdentifyContentDirective.start(App);            
        }

        return { start: init };

    });

}).call(this);