/**
 * @author Karen Robine
 */

(function () {
    "use strict";

	define([
        'text!widgets/navBar/template/searchContent.tpl.html'
    ], function (tpl) {
        //And also sets the controller, SearchCtrl to drive it       
        //https://www.airpair.com/angularjs/posts/transclusion-template-scope-in-angular-directives
        function SearchContentDirective($timeout, $log, $window) {
            return {
                restrict: 'A',
                template: tpl,
                controller: 'SearchCtrl',
                //require: 'ngModel',  //this breaks it
                //scope: false,
                //tranclude: true,

                link: function (scope, element, attrs, ctrl, transclude) {
                    //http://jsfiddle.net/kMzR9/3/                                                          
                    element.bind('keypress', function (evt) {
                    	$('#genericSearch .dropdown-menu').scrollTop(0);
                    });
                    
                    element.bind('keydown', function (evt) {
                        //console.log("SearchContentDirection. keyDown");
                        if (evt.which == 40) {
                            $('#genericSearch .dropdown-menu').scrollTop(0);
                        	var resultH = $('#genericSearch .dropdown-menu .ng-scope').outerHeight();
                            var indx = $('#genericSearch .dropdown-menu .ng-scope.active').index();
                            var numItems = $('#genericSearch .dropdown-menu li.ng-scope').length;
                            if (indx == (numItems-1)) {
                               indx = -1;
                            }
                            $('#genericSearch .dropdown-menu')[0].scrollTop = (indx + 1) * resultH;
                            //console.log("SearchContentDirective. keyDown 40 resultH= " + resultH + " scrollTop after index= " + indx + "  dropdown-menu[0].scrollTop = " +  $('#genericSearch .dropdown-menu')[0].scrollTop);
                        } else if (evt.which == 13) {
                            ////second time user opens search, we need to show the search value, and allow them to click return to bring up results 
                            //following describes issue where user reopens search and then clicks enter. needs to 
                            //https://github.com/angular-ui/bootstrap/issues/759
                            if (scope.checkIfCanSelectVal()) {
                                var ngModelCtrl = element.find('#genericSearchInput').controller('ngModel');
                                ngModelCtrl.$setViewValue(""); //a bit of hacking here. Seems to make it work better?
                                ngModelCtrl.$setViewValue(scope.navBarData.searchData.searchText);
                                //https://jmcunningham.net/2014/08/09/angularjs-using-setviewvalue-and-render-to-update-models-forms/
                                //http://stackoverflow.com/questions/15269737/why-is-ngmodel-setviewvalue-not-working-from
                                //http://jsbin.com/huvejuvu/2/edit?html,js,output
                                //https://www.bennadel.com/blog/2756-experimenting-with-ngmodel-and-ngmodelcontroller-in-angularjs.htm
                                ngModelCtrl.$render(); //i think this forces view value to render the dropdown list
                                //console.log("SearchContentDirective.js: ngModelCtrl should render", ngModelCtrl);
                            }
                        }
                    });
                    
                    element.bind('keyup', function (evt) {
                        if (evt.which == 38) {
                            $('#genericSearch .dropdown-menu').scrollTop(0);
                            var resultH = $('#genericSearch .dropdown-menu .ng-scope').outerHeight();
                            var indx = $('#genericSearch .dropdown-menu .ng-scope.active').index();
                            $('#genericSearch .dropdown-menu')[0].scrollTop = indx * resultH;
                        }
                    });
                }
            };
        }

        function init(App) {
            App.directive('searchcontentctrl', ['$timeout', '$log', '$window', SearchContentDirective]);
            return SearchContentDirective;
        }

        return { start: init };

    });

}).call(this);