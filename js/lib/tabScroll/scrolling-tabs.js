/**
 * angular-bootstrap-scrolling-tabs
 * @version v0.0.22
 * @link https://github.com/mikejacobson/angular-bootstrap-scrolling-tabs
 * @author Mike Jacobson <michaeljjacobson1@gmail.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 * Modifications made by Karen Robine June/July, 2016
 */
;(function () {
  'use strict';

  var CONSTANTS = {
    CONTINUOUS_SCROLLING_TIMEOUT_INTERVAL: 50, // timeout interval for repeatedly moving the tabs container
                                                // by one increment while the mouse is held down--decrease to
                                                // make mousedown continous scrolling faster
    SCROLL_OFFSET_FRACTION: 6, // each click moves the container this fraction of the fixed container--decrease
                               // to make the tabs scroll farther per click
    DATA_KEY_IS_MOUSEDOWN: 'ismousedown'
  },

  scrollingTabsModule = angular.module('mj.scrollingTabs', []),

  /* *************************************************************
   * scrolling-tabs element directive template
   * *************************************************************/
  // plunk: http://plnkr.co/edit/YhKiIhuAPkpAyacu6tuk
  scrollingTabsTemplate = [
    '<div class="scrtabs-tab-container">',
    ' <div class="scrtabs-tab-scroll-arrow scrtabs-js-tab-scroll-arrow-left"><span class="tk-caret-left tk-font-24"></span></div>',
    '   <div class="scrtabs-tabs-fixed-container">',
    '     <div class="scrtabs-tabs-movable-container">',
    '       <ul class="nav nav-tabs" role="tablist">',
    '         <li ng-class="{ \'active\': tab[propActive || \'active\'], ',
    '                         \'disabled\': tab[propDisabled || \'disabled\'] }" ',
    '             data-tab="{{tab}}" data-index="{{$index}}" ng-repeat="tab in tabsArr">',
    '           <a ng-href="{{\'#\' + tab[propPaneId || \'paneId\']}}" role="tab"',
    '                data-toggle="{{tab[propDisabled || \'disabled\'] ? \'\' : \'tab\'}}" ',
    '                ng-bind-html="sanitize(tab[propTitle || \'title\']);">',
    '           </a>',
    '         </li>',
    '       </ul>',
    '     </div>',
    ' </div>',
    ' <div class="scrtabs-tab-scroll-arrow scrtabs-js-tab-scroll-arrow-right"><span class="tk-caret-right tk-font-24"></span></div>',
    '</div>'
  ].join(''),


  /* *************************************************************
   * scrolling-tabs-wrapper element directive template
   * *************************************************************/
  // plunk: http://plnkr.co/edit/lWeQxxecKPudK7xlQxS3
  scrollingTabsWrapperTemplate = [
    '<div class="scrtabs-tab-container">',
    ' <div class="scrtabs-tab-scroll-arrow scrtabs-js-tab-scroll-arrow-left"><span class="tk-caret-left tk-font-24"></span></div>',
    '   <div class="scrtabs-tabs-fixed-container">',
    '     <div class="scrtabs-tabs-movable-container" ng-transclude></div>',
    '   </div>',
    ' <div class="scrtabs-tab-scroll-arrow scrtabs-js-tab-scroll-arrow-right"><span class="tk-caret-right tk-font-24"></span></div>',
    ' <div class="scrtabs-tab-content-outside-movable-container" ng-transclude></div>',
    '</div>'
  ].join('');




  // smartresize from Paul Irish (debounced window resize)
  (function ($, sr) {
    var debounce = function (func, threshold, execAsap) {
      var timeout;

      return function debounced() {
        var obj = this, args = arguments;
        function delayed() {
          if (!execAsap)
            func.apply(obj, args);
          timeout = null;
        }

        if (timeout)
          clearTimeout(timeout);
        else if (execAsap)
          func.apply(obj, args);

        timeout = setTimeout(delayed, threshold || 100);
      };
    };
    jQuery.fn[sr] = function (fn) { return fn ? this.bind('resize.scrtabs', debounce(fn)) : this.trigger(sr); };

  })(jQuery, 'smartresize');



  /* ***********************************************************************************
   * EventHandlers - Class that each instance of ScrollingTabsControl will instantiate
   * **********************************************************************************/
  function EventHandlers(scrollingTabsControl) {
    var evh = this;

    evh.stc = scrollingTabsControl;
  }

  // prototype methods
  (function (p){
    p.handleClickOnLeftScrollArrow = function (e) {
      var evh = this,
          stc = evh.stc;

      stc.scrollMovement.incrementScrollLeft();
    };

    p.handleClickOnRightScrollArrow = function (e) {
      var evh = this,
          stc = evh.stc,
          scrollMovement = stc.scrollMovement;

      scrollMovement.incrementScrollRight(scrollMovement.getMinPos());
    };

    p.handleMousedownOnLeftScrollArrow = function (e) {
      var evh = this,
          stc = evh.stc;

      stc.scrollMovement.startScrollLeft();
    };

    p.handleMousedownOnRightScrollArrow = function (e) {
      var evh = this,
          stc = evh.stc;

      stc.scrollMovement.startScrollRight();
    };

    p.handleMouseupOnLeftScrollArrow = function (e) {
      var evh = this,
          stc = evh.stc;

      stc.scrollMovement.stopScrollLeft();
    };

    p.handleMouseupOnRightScrollArrow = function (e) {
      var evh = this,
          stc = evh.stc;

      stc.scrollMovement.stopScrollRight();
    };

    p.handleWindowResize = function (e) {
      var evh = this,
          stc = evh.stc,
          newWinWidth = stc.$win.width();

      if (newWinWidth === stc.winWidth) {
        return false; // false alarm
      }

      stc.winWidth = newWinWidth;
      stc.elementsHandler.refreshAllElementSizes();
    };

  }(EventHandlers.prototype));



  /* ***********************************************************************************
   * ElementsHandler - Class that each instance of ScrollingTabsControl will instantiate
   * **********************************************************************************/
  function ElementsHandler(scrollingTabsControl) {
    var ehd = this;

    ehd.stc = scrollingTabsControl;
  }

  // ElementsHandler prototype methods
  (function (p) {
      
      p.isModalWindow = function($tabsContainer) {
          //Karen, need to determine if modal window
          if ($tabsContainer.parent().attr('id') && $tabsContainer.parent().attr('id').indexOf("identifyTabs") > -1) {
              return true;
          }
          return false;
      };
      
      p.isCurrentTabVisible = function(isModalWindow, $li) {
          //Karen, determine if current tab is visible
          if (isModalWindow && $li.attr('class')) {
              var cls = [];
              if ($li.attr('class').indexOf(" ") > -1)  {
                  cls = $li.attr('class').split(' ');
              } else {
                  cls[0] = $li.attr('class');
              }
              if ($.inArray("ng-hide", cls) < 0 || $.inArray("ng-hide-remove", cls) > -1) {
                  return true;
              }                       
          } else if (!isModalWindow){
              if ($li.attr('class').indexOf("ng-hide") < 0) {
                  return true;
              }
          }
          return false;
      };
      
      p.initElements = function (options) {
        var ehd = this,
            stc = ehd.stc,
            $tabsContainer = stc.$tabsContainer;

        ehd.setElementReferences();

        if (options.isWrappingAngularUITabset && options.isWatchingDom) {
          ehd.moveTabContentOutsideScrollContainer(options);
        }

        ehd.setEventListeners();
      };

      p.moveTabContentOutsideScrollContainer = function (options) {
        var ehd = this,
            stc = ehd.stc,
            $tabsContainer = stc.$tabsContainer,
            tabContentCloneCssClass = 'scrtabs-tab-content-clone',
            $tabContentInMovableContainer = $tabsContainer.find('.scrtabs-tabs-movable-container .tab-content'),
            $currTcClone,
            $newTcClone;

        // if the tabs won't be changing, we can just move the
        // the .tab-content outside the scrolling container right now
        if (!options.isWatchingTabs) {
          $tabContentInMovableContainer.show().appendTo($tabsContainer);
          return;
        }

        /* if we're watching the tabs for changes, we can't just
         * move the .tab-content outside the scrolling container because
         * that will break the angular-ui directive dependencies, and
         * an error will be thrown as soon as the tabs change;
         * so we leave the .tab-content where it is but hide it, then
         * make a clone and move the clone outside the scroll container,
         * which will be the visible .tab-content.
         */

        // create new clone
        $newTcClone = $tabContentInMovableContainer
                        .clone()
                        .addClass(tabContentCloneCssClass);

        // get the current clone, if it exists
        $currTcClone = $tabsContainer.find('.' + tabContentCloneCssClass);

        if ($currTcClone.length) { // already a clone there so replace it
          $currTcClone.replaceWith($newTcClone);
        } else {
          $tabsContainer.append($newTcClone);
        }

      };

      p.refreshAllElementSizes = function () {
        var ehd = this,
            stc = ehd.stc,
            smv = stc.scrollMovement,
            scrollArrowsWereVisible = stc.scrollArrowsVisible,
            actionsTaken = {
              didScrollToActiveTab: false
            },
            minPos;

        ehd.setElementWidths();
        ehd.setScrollArrowVisibility();

        if (stc.scrollArrowsVisible) {
          ehd.setFixedContainerWidthForJustVisibleScrollArrows();
        }

        // this could have been a window resize or the removal of a
        // dynamic tab, so make sure the movable container is positioned
        // correctly because, if it is far to the left and we increased the
        // window width, it's possible that the tabs will be too far left,
        // beyond the min pos.
        if (stc.scrollArrowsVisible || scrollArrowsWereVisible) {
          if (stc.scrollArrowsVisible) {
            // make sure container not too far left
            minPos = smv.getMinPos();
            if (stc.movableContainerLeftPos < minPos) {
              smv.incrementScrollRight(minPos);
            } else {
              smv.scrollToActiveTab({
                isOnWindowResize: true
              });

              actionsTaken.didScrollToActiveTab = true;
            }
          } else {
            // scroll arrows went away after resize, so position movable container at 0
            stc.movableContainerLeftPos = 0;
            smv.slideMovableContainerToLeftPos();
          }
        }

        return actionsTaken;
      };

      p.removeTranscludedTabContentOutsideMovableContainer = function () {
        var ehd = this,
            stc = ehd.stc,
            $tabsContainer = stc.$tabsContainer;

        $tabsContainer.find('.scrtabs-tab-content-outside-movable-container').remove();
      };

      p.setElementReferences = function () {
        var ehd = this,
            stc = ehd.stc,
            $tabsContainer = stc.$tabsContainer;

        stc.isNavPills = false;
        stc.isModalWindow = ehd.isModalWindow($tabsContainer);
        
        stc.$fixedContainer = $tabsContainer.find('.scrtabs-tabs-fixed-container');
        stc.$movableContainer = $tabsContainer.find('.scrtabs-tabs-movable-container');
        stc.$tabsUl = stc.$movableContainer.find('.nav-tabs');

        // check for pills
        if (!stc.$tabsUl.length) {
          stc.$tabsUl = stc.$movableContainer.find('.nav-pills');

          if (stc.$tabsUl.length) {
            stc.isNavPills = true;
          }
        }

        stc.$tabsLiCollection = stc.$tabsUl.find('> li');
        stc.$leftScrollArrow = $tabsContainer.find('.scrtabs-js-tab-scroll-arrow-left');
        stc.$rightScrollArrow = $tabsContainer.find('.scrtabs-js-tab-scroll-arrow-right');
        stc.$scrollArrows = stc.$leftScrollArrow.add(stc.$rightScrollArrow);

        stc.$win = $(window);
      };

      p.setElementWidths = function () {
        var ehd = this,
            stc = ehd.stc;

        stc.containerWidth = stc.$tabsContainer.outerWidth();
        stc.winWidth = stc.$win.width();

        stc.scrollArrowsCombinedWidth = stc.$leftScrollArrow.outerWidth() + stc.$rightScrollArrow.outerWidth();

        ehd.setFixedContainerWidth();
        ehd.setMovableContainerWidth();
      };

      p.setEventListeners = function () {
        var ehd = this,
            stc = ehd.stc,
            evh = stc.eventHandlers; // eventHandlers

        stc.$leftScrollArrow.off('.scrtabs').on({
          'mousedown.scrtabs': function (e) { evh.handleMousedownOnLeftScrollArrow.call(evh, e); },
          'mouseup.scrtabs': function (e) { evh.handleMouseupOnLeftScrollArrow.call(evh, e); },
          'click.scrtabs': function (e) { evh.handleClickOnLeftScrollArrow.call(evh, e); }
        });

        stc.$rightScrollArrow.off('.scrtabs').on({
          'mousedown.scrtabs': function (e) { evh.handleMousedownOnRightScrollArrow.call(evh, e); },
          'mouseup.scrtabs': function (e) { evh.handleMouseupOnRightScrollArrow.call(evh, e); },
          'click.scrtabs': function (e) { evh.handleClickOnRightScrollArrow.call(evh, e); }
        });

        stc.$win.smartresize(function (e) { evh.handleWindowResize.call(evh, e); });

      };

      p.setFixedContainerWidth = function () {
        var ehd = this,
            stc = ehd.stc;

        stc.$fixedContainer.width(stc.fixedContainerWidth = stc.$tabsContainer.outerWidth());
      };

      p.setFixedContainerWidthForJustHiddenScrollArrows = function () {
        var ehd = this,
            stc = ehd.stc;

        stc.$fixedContainer.width(stc.fixedContainerWidth);
      };

      p.setFixedContainerWidthForJustVisibleScrollArrows = function () {
        var ehd = this,
            stc = ehd.stc;

        stc.$fixedContainer.width(stc.fixedContainerWidth - stc.scrollArrowsCombinedWidth);
      };

      p.setMovableContainerWidth = function () {
        var ehd = this,
            stc = ehd.stc,
            $tabLi = stc.$tabsUl.find('li');

        stc.movableContainerWidth = 0;

        if ($tabLi.length) {

          $tabLi.each(function __getLiWidth() {
            var $li = $(this),
                totalMargin = 0;
                
            //if ((!stc.isModalWindow && $li.attr('class').indexOf("ng-hide") < 0) || (stc.isModalWindow && $li.attr('class').indexOf('ng-hide-remove') > -1)) {
            if (ehd.isCurrentTabVisible(stc.isModalWindow, $li)) {
                if (stc.isNavPills) { // pills have a margin-left, tabs have no margin
                    totalMargin = parseInt($li.css('margin-left'), 10) + parseInt($li.css('margin-right'), 10);
                }

                stc.movableContainerWidth += ($li.outerWidth() + totalMargin);
            } 
          });

          stc.movableContainerWidth += 1;

          // if the tabs don't span the width of the page, force the
          // movable container width to full page width so the bottom
          // border spans the page width instead of just spanning the
          // width of the tabs
          if (stc.movableContainerWidth < stc.fixedContainerWidth) {
            stc.movableContainerWidth = stc.fixedContainerWidth;
          }
        }

        stc.$movableContainer.width(stc.movableContainerWidth);
      };

      p.setScrollArrowVisibility = function () {
        var ehd = this,
            stc = ehd.stc,
            shouldBeVisible = stc.movableContainerWidth > stc.fixedContainerWidth;
      
        if (shouldBeVisible && !stc.scrollArrowsVisible) {
          stc.$scrollArrows.show();
          stc.scrollArrowsVisible = true;
          ehd.setFixedContainerWidthForJustVisibleScrollArrows();
        } else if (!shouldBeVisible && stc.scrollArrowsVisible) {
          stc.$scrollArrows.hide();
          stc.scrollArrowsVisible = false;
          ehd.setFixedContainerWidthForJustHiddenScrollArrows();
        }
      };

  }(ElementsHandler.prototype));



  /* ***********************************************************************************
   * ScrollMovement - Class that each instance of ScrollingTabsControl will instantiate
   * **********************************************************************************/
  function ScrollMovement(scrollingTabsControl) {
    var smv = this;

    smv.stc = scrollingTabsControl;
  }

  // prototype methods
  (function (p) {

    p.continueScrollLeft = function () {
      var smv = this,
          stc = smv.stc;

      stc.$timeout(function() {
        if (stc.$leftScrollArrow.data(CONSTANTS.DATA_KEY_IS_MOUSEDOWN) && (stc.movableContainerLeftPos < 0)) {
          if (!smv.incrementScrollLeft()) { // scroll limit not reached, so keep scrolling
            smv.continueScrollLeft();
          }
        }
      }, CONSTANTS.CONTINUOUS_SCROLLING_TIMEOUT_INTERVAL);
    };

    p.continueScrollRight = function (minPos) {
      var smv = this,
          stc = smv.stc;

      stc.$timeout(function() {
        if (stc.$rightScrollArrow.data(CONSTANTS.DATA_KEY_IS_MOUSEDOWN) && (stc.movableContainerLeftPos > minPos)) {
          // slide tabs LEFT -> decrease movable container's left position
          // min value is (movableContainerWidth - $tabHeader width)
          if (!smv.incrementScrollRight(minPos)) {
            smv.continueScrollRight(minPos);
          }
        }
      }, CONSTANTS.CONTINUOUS_SCROLLING_TIMEOUT_INTERVAL);
    };

    p.decrementMovableContainerLeftPos = function (minPos) {
      var smv = this,
          stc = smv.stc;

      stc.movableContainerLeftPos -= (stc.fixedContainerWidth / CONSTANTS.SCROLL_OFFSET_FRACTION);
      if (stc.movableContainerLeftPos < minPos) {
        stc.movableContainerLeftPos = minPos;
      } else if (stc.scrollToTabEdge) {
        smv.setMovableContainerLeftPosToTabEdge('right');

        if (stc.movableContainerLeftPos < minPos) {
          stc.movableContainerLeftPos = minPos;
        }
      }
    };

    p.getMinPos = function () {
      var smv = this,
          stc = smv.stc;

      return stc.scrollArrowsVisible ? (stc.fixedContainerWidth - stc.movableContainerWidth - stc.scrollArrowsCombinedWidth) : 0;
    };

    p.getMovableContainerCssLeftVal = function () {
      var smv = this,
          stc = smv.stc;

      return (stc.movableContainerLeftPos === 0) ? '0' : stc.movableContainerLeftPos + 'px';
    };

    p.incrementScrollLeft = function () {
      var smv = this,
          stc = smv.stc;

      stc.movableContainerLeftPos += (stc.fixedContainerWidth / CONSTANTS.SCROLL_OFFSET_FRACTION);

      if (stc.movableContainerLeftPos > 0) {
        stc.movableContainerLeftPos = 0;
      } else if (stc.scrollToTabEdge) {
        smv.setMovableContainerLeftPosToTabEdge('left');

        if (stc.movableContainerLeftPos > 0) {
          stc.movableContainerLeftPos = 0;
        }
      }

      smv.slideMovableContainerToLeftPos();

      return (stc.movableContainerLeftPos === 0); // indicates scroll limit reached
    };

    p.incrementScrollRight = function (minPos) {
      var smv = this,
          stc = smv.stc;

      smv.decrementMovableContainerLeftPos(minPos);
      smv.slideMovableContainerToLeftPos();

      return (stc.movableContainerLeftPos === minPos);
    };

    p.scrollToActiveTab = function (options) {
      var smv = this,
          stc = smv.stc,
          $activeTab,
          activeTabWidth,
          activeTabLeftPos,
          rightArrowLeftPos,
          overlap;

      // if the active tab is not fully visible, scroll till it is
      if (!stc.scrollArrowsVisible) {
        return;
      }

      $activeTab = stc.$tabsUl.find('li.active');

      if (!$activeTab.length) {
        return;
      }

      activeTabWidth = $activeTab.outerWidth();
      activeTabLeftPos = $activeTab.offset().left;

      rightArrowLeftPos = stc.$rightScrollArrow.offset().left;
      overlap = activeTabLeftPos + activeTabWidth - rightArrowLeftPos;

      if (overlap > 0) {
        stc.movableContainerLeftPos = (options.isOnWindowResize || options.isOnTabsRefresh) ? (stc.movableContainerLeftPos - overlap) : -overlap;
        smv.slideMovableContainerToLeftPos();
      }
    };

    p.setMovableContainerLeftPosToTabEdge = function (scrollArrowClicked) {
      var smv = this,
          stc = smv.stc,
          offscreenWidth = -stc.movableContainerLeftPos,
          totalTabWidth = 0;

        // make sure LeftPos is set so that a tab edge will be against the
        // left scroll arrow so we won't have a partial, cut-off tab
        stc.$tabsLiCollection.each(function (index) {
          var tabWidth = $(this).width();

          totalTabWidth += tabWidth;

          if (totalTabWidth > offscreenWidth) {
            stc.movableContainerLeftPos = (scrollArrowClicked === 'left') ? -(totalTabWidth - tabWidth) : -totalTabWidth;
            return false; // exit .each() loop
          }

        });
    };

    p.slideMovableContainerToLeftPos = function () {
      var smv = this,
          stc = smv.stc,
          leftVal;

      stc.movableContainerLeftPos = stc.movableContainerLeftPos / 1;
      leftVal = smv.getMovableContainerCssLeftVal();

      stc.$movableContainer.stop().animate({ left: leftVal }, 'slow', function __slideAnimComplete() {
        var newMinPos = smv.getMinPos();

        // if we slid past the min pos--which can happen if you resize the window
        // quickly--move back into position
        if (stc.movableContainerLeftPos < newMinPos) {
          smv.decrementMovableContainerLeftPos(newMinPos);
          stc.$movableContainer.stop().animate({ left: smv.getMovableContainerCssLeftVal() }, 'fast');
        }
      });
    };

    p.startScrollLeft = function () {
      var smv = this,
          stc = smv.stc;

      stc.$leftScrollArrow.data(CONSTANTS.DATA_KEY_IS_MOUSEDOWN, true);
      smv.continueScrollLeft();
    };

    p.startScrollRight = function () {
      var smv = this,
          stc = smv.stc;

      stc.$rightScrollArrow.data(CONSTANTS.DATA_KEY_IS_MOUSEDOWN, true);
      smv.continueScrollRight(smv.getMinPos());
    };

    p.stopScrollLeft = function () {
      var smv = this,
          stc = smv.stc;

      stc.$leftScrollArrow.data(CONSTANTS.DATA_KEY_IS_MOUSEDOWN, false);
    };

    p.stopScrollRight = function () {
      var smv = this,
          stc = smv.stc;

      stc.$rightScrollArrow.data(CONSTANTS.DATA_KEY_IS_MOUSEDOWN, false);
    };

  }(ScrollMovement.prototype));



  /* **********************************************************************
   * ScrollingTabsControl - Class that each directive will instantiate
   * **********************************************************************/
  function ScrollingTabsControl($tabsContainer, $timeout) {
    var stc = this;

    stc.$tabsContainer = $tabsContainer;
    stc.$timeout = $timeout;

    stc.movableContainerLeftPos = 0;
    stc.scrollArrowsVisible = true;
    stc.scrollToTabEdge = false;

    stc.scrollMovement = new ScrollMovement(stc);
    stc.eventHandlers = new EventHandlers(stc);
    stc.elementsHandler = new ElementsHandler(stc);
  }

  // prototype methods
  (function (p) {
    p.initTabs = function (options) {
      var stc = this,
          elementsHandler = stc.elementsHandler,
          scrollMovement = stc.scrollMovement;

      if (options.scrollToTabEdge) {
        stc.scrollToTabEdge = true;
      }

      stc.$timeout(function __initTabsAfterTimeout() {
        var actionsTaken;

        elementsHandler.initElements(options);
        actionsTaken = elementsHandler.refreshAllElementSizes();

        if (!actionsTaken.didScrollToActiveTab) {
          scrollMovement.scrollToActiveTab({
            isOnTabsRefresh: options.isWatchingTabs
          });
        }


      }, 100);
    };

    p.removeTranscludedTabContentOutsideMovableContainer = function() {
      var stc = this,
          elementsHandler = stc.elementsHandler;

      elementsHandler.removeTranscludedTabContentOutsideMovableContainer();
    };


  }(ScrollingTabsControl.prototype));



  /* ********************************************************
   * scrolling-tabs Directive
   * ********************************************************/

  function scrollingTabsDirective($timeout, $sce) {

    function sanitize (html) {
      return $sce.trustAsHtml(html);
    }


    // ------------ Directive Object ---------------------------
    return {
      restrict: 'E',
      template: scrollingTabsTemplate,
      transclude: false,
      replace: true,
      scope: {
        tabs: '@',
        watchTabs: '=',
        propPaneId: '@',
        propTitle: '@',
        propActive: '@',
        propDisabled: '@',
        localTabClick: '&tabClick'
      },
      link: function(scope, element, attrs) {
        var scrollingTabsControl = new ScrollingTabsControl(element, $timeout),
            scrollToTabEdge = attrs.scrollToTabEdge && attrs.scrollToTabEdge.toLowerCase() === 'true';

        scope.tabsArr = scope.$eval(scope.tabs);
        scope.propPaneId = scope.propPaneId || 'paneId';
        scope.propTitle = scope.propTitle || 'title';
        scope.propActive = scope.propActive || 'active';
        scope.propDisabled = scope.propDisabled || 'disabled';
        scope.sanitize = sanitize;


        element.on('click.scrollingTabs', '.nav-tabs > li', function __handleClickOnTab(e) {
          var clickedTabElData = $(this).data();

          scope.localTabClick({
            $event: e,
            $index: clickedTabElData.index,
            tab: clickedTabElData.tab
          });

        });

        if (!attrs.watchTabs) {

          // we're not watching the tabs array for changes so just init
          // the tabs without adding a watch
          scrollingTabsControl.initTabs({
            isWrapperDirective: false,
            scrollToTabEdge: scrollToTabEdge
          });

          return;
        }

        // we're watching the tabs array for changes...
        scope.$watch('watchTabs', function (latestTabsArray, prevTabsArray) {
          var $activeTabLi,
              activeIndex;

          scope.tabsArr = scope.$eval(scope.tabs);

          if (latestTabsArray.length && latestTabsArray[latestTabsArray.length - 1].active) { // new tab should be active

            // the tab we just added should be active, so, after giving the
            // elements time to render (thus the $timeout), force a click on it so
            // bootstrap's built-in tab/pane activation can do its thing, otherwise
            // the tab will show as active but its content pane won't be
            $timeout(function () {

              element.find('ul.nav-tabs > li:last').removeClass('active').find('a[role="tab"]').click();

            }, 0);

          } else { // --------- preserve the currently active tab

            // we've replaced the nav-tabs so, to get the currently active tab
            // we need to get it from the DOM because clicking a tab doesn't update
            // the tabs array (Bootstrap's js just makes the clicked tab and its
            // corresponding tab-content pane active); then we need to update
            // the tabs array so it reflects the currently active tab before we
            // call initTabs() because initTabs() generates the tab elements based
            // on the array data.

            // get the index of the currently active tab
            $activeTabLi = element.find('.nav-tabs > li.active');

            if ($activeTabLi.length) {

              activeIndex = $activeTabLi.data('index');

              scope.tabsArr.some(function __forEachTabsArrItem(t) {
                if (t[scope.propActive]) {
                  t[scope.propActive] = false;
                  return true; // exit loop
                }
              });

              scope.tabsArr[activeIndex][scope.propActive] = true;
            }
          }

          scrollingTabsControl.initTabs({
            isWrapperDirective: false,
            isWatchingTabs: true,
            scrollToTabEdge: scrollToTabEdge
          });

        }, true);

      }

    };
  }




  /* ********************************************************
   * scrolling-tabs-wrapper Directive
   * ********************************************************/
  function scrollingTabsWrapperDirective($timeout) {
      // ------------ Directive Object ---------------------------
      return {
        restrict: 'A',
        template: scrollingTabsWrapperTemplate,
        transclude: true,
        replace: true,
        link: function(scope, element, attrs) {
          var scrollingTabsControl = new ScrollingTabsControl(element, $timeout),
              isWrappingAngularUITabset = element.find('tabset, uib-tabset').length > 0,
              scrollToTabEdge = attrs.scrollToTabEdge && attrs.scrollToTabEdge.toLowerCase() === 'true';

          if (!isWrappingAngularUITabset) {
            scrollingTabsControl.removeTranscludedTabContentOutsideMovableContainer();
          }

          if (!attrs.watchTabs) {
            // we don't need to watch the tabs for changes, so just
            // init the tabs control and return
            scrollingTabsControl.initTabs({
              isWrapperDirective: true,
              isWrappingAngularUITabset: isWrappingAngularUITabset,
              scrollToTabEdge: scrollToTabEdge
            });

            return;
          }


          // ----- watch the tabs DOM for changes --------------
          if (attrs.watchTabs.toLowerCase() === 'true') {

            if (isWrappingAngularUITabset) {
              scrollingTabsControl.removeTranscludedTabContentOutsideMovableContainer();
            }

            // we're watching the tabs html (rather than array) for changes,
            // so init them then set up a watch that watches for changes
            // to the number of tabs or to the active tab
            initTabsAsWrapperWatchingTabs();

            // give the DOM changes time to process, then set up our watch
            $timeout(watchForTabDomChanges, 10);

            return;
          }


          // ----- watch the tabs array for changes --------------
          // watch the tabs array for changes and refresh the tabs
          // control any time it changes (whether the change is a
          // new tab or just a change in which tab is selected)
          scope.$watch(attrs.watchTabs, function (latestTabsArray, prevTabsArray) {

            if (!isWrappingAngularUITabset) { // wrapping regular bootstrap nav-tabs
              // if we're wrapping regular bootstrap nav-tabs, we need to
              // manually track the active tab because, if a tab is clicked,
              // the tabs array doesn't update to reflect the new active tab;
              // so if we make each dynamically added tab the new active tab,
              // we need to deactivate whatever the currently active tab is,
              // and we have no way of knowing that from the state of the tabs
              // array--we need to check the tab elements on the page

              // listen for tab clicks and update our tabs array accordingly because
              // bootstrap doesn't do that
              if (latestTabsArray.length && latestTabsArray[latestTabsArray.length - 1].active) {

                // the tab we just added should be active, so, after giving the
                // elements time to render (thus the $timeout), force a click on it so
                // bootstrap's built-in tab/pane activation can do its thing, otherwise
                // the tab will show as active but its content pane won't be
                $timeout(function () {

                  element.find('ul.nav-tabs > li:last').removeClass('active').find('a[role="tab"]').click();

                }, 0);

              }

            }

            initTabsAsWrapperWatchingTabs();

          }, true);


          function initTabsAsWrapperWatchingTabs(options) {
            scrollingTabsControl.initTabs({
              isWrapperDirective: true,
              isWrappingAngularUITabset: isWrappingAngularUITabset,
              isWatchingTabs: true,
              scrollToTabEdge: scrollToTabEdge,
              isWatchingDom: options && options.isWatchingDom
            });
          }

          function watchForTabDomChanges() {
              var $navTabs = element.find('ul.nav-tabs'),
                  currActiveTabIdx,
                  showingActiveTabIdx;

              if (!$navTabs.length) {
                return;
              }

              // ---- watch for tabs being added or removed ----
              scope.$watch(function () {
                return $navTabs[0].childNodes.length;
              }, function (newVal, oldVal) {
                  if (newVal !== oldVal) {
                    initTabsAsWrapperWatchingTabs({
                      isWatchingDom: true
                    });
                  }
              });

              // ---- watch for a change in the active tab ----
              // we can't just use the built-in watch functionality
              // to check for a change in the active tab because the
              // function we pass to $watch sometimes executes before the
              // active class changes to the newly-clicked tab, so our watch
              // doesn't detect any change; to detect the change, we need
              // to perform the check after a timeout, so we just hook
              // into the $watch because we need to perform the check
              // when a digest occurs, but we don't use the $watch's
              // callback to make any changes, we just do it in our
              // timeout function.
              scope.$watch(function () {
                // pass false as 3rd arg so digest is not initiated,
                // otherwise we end up in infinite loop
                $timeout(checkForActiveTabChange, 0, false);
                return $navTabs.find('li.active').index();
              }, angular.noop);


              function checkForActiveTabChange() {
                currActiveTabIdx = $navTabs.find('li.active').index();

                if (currActiveTabIdx !== showingActiveTabIdx) {
                  showingActiveTabIdx = currActiveTabIdx;
                  initTabsAsWrapperWatchingTabs({
                    isWatchingDom: true
                  });
                }

                return false;
              }
          }

        }
      };

  }


  scrollingTabsDirective.$inject = ['$timeout', '$sce'];
  scrollingTabsWrapperDirective.$inject = ['$timeout'];

  scrollingTabsModule.directive('scrollingTabs', scrollingTabsDirective);
  scrollingTabsModule.directive('scrollingTabsWrapper', scrollingTabsWrapperDirective);

}());
