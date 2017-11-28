/**
 * @author karen@robinegis.com
 */

(function() {
    'use strict';

    var pathRX = new RegExp(/\/[^\/]+$/), locationPath = location.pathname.replace(pathRX, '');    
    
    define('angular', function() {
        if (angular) { return angular; }
        return {};
    });

    //Karen changed following from locationPath + 'js/... to '/js/
    require({
        async: true,
        aliases: [['text', 'dojo/text']],
        packages: [{
                name: 'controllers',
                location: locationPath + '/js/controllers'
            }, {
                name: 'helpers',
                location: locationPath + '/js/helpers'
            }, {
                name: 'widgets',
                location: locationPath + '/js/widgets'
            }, {
                name: 'js',
                location: locationPath + '/js'
            },  {
                name: 'modules',
                location: locationPath + '/js/modules'
            },
            {
                name:'jsoninstant',
                location: locationPath + '/json-instant'
            }
        ],
        paths: {
            underscore: locationPath + '/js/lib/underscore/underscore-min'
            //nga11y: locationPath + '/js/lib/accessibility/nga11y.min'
        }
    });

    require([
        'dojo/ready',
        'js/bootstrap'
    ], function(ready, bootstrap) {
        ready(function () {

            bootstrap.start();
        });
    });

}).call(this);

//Param added the jsoninstant location