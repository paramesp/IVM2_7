/**
 * @author Karen Robine
 */

(function() {
    "use strict";

    define([
        'widgets/misc/MiscController',
        'widgets/misc/MiscDirective'
    ], function(MiscController, MiscDirective) {

        function init(App) {
            MiscController.start(App);
            MiscDirective.start(App);
        }

        return { start: init };

    });

}).call(this);