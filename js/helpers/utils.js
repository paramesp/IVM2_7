/**
 * @author Karen Robine
 */
(function () {
    'use strict';

    define([
        'angular',
        'underscore',
        'js/config',
        'esri/geometry/webMercatorUtils',
        'esri/symbols/PictureMarkerSymbol',
    ], function (angular, _, config, webMercatorUtils, PictureMarkerSymbol) {
        return {
            convertLongLatToXY: function(arrLngLat) {
                if (arrLngLat && arrLngLat.length == 2) {
                    return webMercatorUtils.lngLatToXY(arrLngLat[0], arrLngLat[1]);
                }
                return null;
            },
            
            convertTextToAnchor: function(text) {
                //http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
                var exp = /(\b((https?|ftp|file):\/\/|(www))[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]*)/ig; 
                return text.replace(exp,"<a href='$1' class='a' target='_blank'>$1</a>");      
            },
            
            convertTextToDateFormat: function(text) {
                //created_at: "Thu Nov 05 18:22:31 +0000 2015",
                //http://jsfiddle.net/tchatel/4FNeB/
                //https://docs.angularjs.org/api/ng/filter/date
                //var dt = Date.parse(text);
                var arr = text.split(' ');
                if (arr && arr.length > 4) {
                   return [arr[2], arr[1], arr[arr.length-1]].join(' ');  //ie., 05 Dec 2015
                } else {
                    return text;
                }
            },

            clearReQueryEvents: function(reQueryEvents) {
                if (reQueryEvents && reQueryEvents.panEvent) {
                    reQueryEvents.panEvent.remove();
                    reQueryEvents.zoomEvent.remove();
                    reQueryEvents.panEvent = null;
                    reQueryEvents.zoomEvent = null;              
                }          
            },
            
            //gets the url of the website (including index.html) ie. www.fs.fed.us/ivm/index.html     
            getAbsoluteURL: function(location) {
                var url = location.toString();
                if (url.indexOf("?") > 0) {
                    return (url.substring(0, url.indexOf("?")));
                }
                else if (url.indexOf("index.html") > 0) {
                    return url;
                } else {
                    (url.lastIndexOf("/") == (url.length-1)) ?
                        url += "index.html":
                        url += "/index.html";
                }
                return url;
            },
        
            getAttributeValue: function(key, attributes) {
                var val = attributes[key];
                if (!val && attributes.attrib) {
                    val = attributes.attrib[key];
                }
                return val;
            },
                        
            /*
            getDeviceKey: function(userAgent) {
                if (userAgent.indexOf("iPad") >= 0) {
                    return "tablet"; //this is different then ivm1. may cause problems.
                } else if (userAgent.indexOf("Android") >= 0 || userAgent.indexOf("iPhone") >= 0 ||
                        userAgent.indexOf("BlackBerry") >= 0 || userAgent.indexOf("Opera Mobi") >= 0) {
                    return "mobile";
                } else {
                    return "browser";
                }                
            },
            */
                       
            getForestArray: function(value, stateForestArray, forestArray) {
                if (value == null || value == "") {
                    return forestArray;  //user clicked Select a State
                } else {
                    var arr =  _.where(stateForestArray, {StateCode: value});
                    if (arr && arr.length > 1) {
                        arr = _.sortBy(arr, 'Name');
                    }
                    return arr;
                }
            },

            getIdentifyTolerance: function(map, bDoGraphics, deviceIsBrowser) {
                var scale = map.getScale(),
                    rtnTolerance = 800;
                
                if (config.Identify.identifyTolerances != null && config.Identify.identifyTolerances.length > 0) {
                    var tolr = _.find(config.Identify.identifyTolerances, function(tol) {
                        return (tol.MaxScale <= scale && scale <= tol.MinScale);
                    });
                    if (tolr) {
                        if (bDoGraphics) {
                            rtnTolerance = (deviceIsBrowser) ? tolr.ToleranceGraphicsBrowser : tolr.ToleranceGraphicsMobile;
                        } else {
                            rtnTolerance = (deviceIsBrowser) ? tolr.ToleranceBrowser : tolr.ToleranceMobile;
                        }                        
                    }      
                }
                //if (!bDoGraphics) {
                    //alert("utils.js: GetIdentifyTolerance(): scale=" + scale + "  rtnTolerance= " + rtnTolerance + " bDoGraphics= " + bDoGraphics); 
                    //console.log("utils.js: GetIdentifyTolerance(): scale=" + scale + "  rtnTolerance= " + rtnTolerance + " device= ", deviceIsBrowser); 
                //}             
                return rtnTolerance;                    
            },
            
            getJSONFileLocation: function(loc, fileName) {
                return loc + fileName;
            },
                 
            getObjectUsingKey: function(keyValue, arrObj) {
                return (_.findWhere(arrObj, {key: keyValue}));
            },

            getObjectUsingType: function(keyValue, arrObj) {
                return (_.findWhere(arrObj, {type: keyValue}));
            },
            
            getShareObject: function(location) {                
                return {
                    urlObject: {
                       urlNormal: this.getAbsoluteURL(location),
                       urlExtent: null
                    },
                    shareListNormal: config.Share.shareListNormal,
                    shareListExtent: config.Share.shareListExtent               
                };                
            },
            
            getShareObjectExtent: function(urlExtent, shareObject, map) {
                var ext = this.getURLExtent(urlExtent, map);
               
                if (shareObject) {
                    return (shareObject.urlObject.urlNormal + ext);
                }
                return ext;    
            },

            //For some of our data (ie. Accessibility), we need to create unique symbols for each of the graphics (ie., Trailhead) rather then using a generic symbol
            //this is also called for single roads and trails markers from ClusterLayer and LayerMaker
            getSingleMarkerSymbol: function(attributes, symbol, defs, markerDataField, markerData, singleImages) {
                if (markerDataField && markerData && markerData.length > 0 && attributes)  {
                    //console.log("utils.js: getSingleMarkerSymbol() markerData=", markerData);
                    var val = this.getAttributeValue(markerDataField, attributes);           
                    if (val) { 
                        //console.log("utils.js: getSingleMarkerSymbol() markerData=", markerData);           
                        var actObj = _.find(markerData, function(md) {
                            return (md[markerDataField] == val);
                        });
                        if (actObj && actObj.ICON) {
                            var sym =  new PictureMarkerSymbol(actObj.ICON, config.queryPanels.clusterOptions.singleImageSize, config.queryPanels.clusterOptions.singleImageSize);
                            return sym;
                        }
                    }
                }
                
                if (defs) {
                    var lyrId = this.getAttributeValue(config.FeatureService.layerIdKey, attributes); 
                    if (lyrId) {
                        var lyrObj = _.findWhere(defs, {layerId: lyrId});
                        if (lyrObj && (lyrObj.singleImage || (lyrObj.singleImageName && lyrObj.singleImageSize))) {
                            var sym = (lyrObj.singleImage) ?
                                new PictureMarkerSymbol(lyrObj.singleImage):
                                new PictureMarkerSymbol(lyrObj.singleImageName, lyrObj.singleImageSize, lyrObj.singleImageSize);
                            return sym;
                        }
                        if (singleImages) {
                            var lObj = _.findWhere(singleImages, {layerId: lyrId});
                            if (lObj && lObj.singleImage) {
                                return (new PictureMarkerSymbol(lObj.singleImage));
                            }
                        }                 
                    }             
                } 
                //if (attributes && !attributes.attrib ) {
                //   console.log("utils.js: getSingleMarkerSymbol() It didnt get the proper Marker Activity attribute (possible missing value in MarkerTypes.json): attributes=", attributes); 
                //}
                
                return symbol;
            },

            getURLExtent: function(url, map) {
                return this.stringFormat(url, map.extent.xmin.toFixed(0), map.extent.ymin.toFixed(0), map.extent.xmax.toFixed(0), map.extent.ymax.toFixed(0));
            },
                      
            isExtentAPoint: function(extent) {
               if (extent) {
                   if (extent.xmin == extent.xmax && extent.ymin == extent.ymax) {
                       return true;
                   }
               }
               return false; 
            },
                        
            isExtentWithinDistance: function(x1, y1, x2, y2, distance) {
                //alert("utils.js: isExtentWithinDistance() current distance= " + parseInt(Math.sqrt( Math.abs(x2-x1)*x2 + Math.abs(y2-y1)*y2 )) + " open identify Distance = " + distance);
                var a = Math.abs(x2-x1);
                var b = Math.abs(y2-y1);
                if (Math.sqrt( (x2-=x1)*x2 + (y2-=y1)*y2 )  < distance) {
                    return true;
                } else {
                    return false;
                }
            },
            
            isLegalLatLongValue: function(lat, long) {
                //TODO: Test is for US generally, but could adjust values to bring it closer
                if (lat!=null && long !=null && isNaN(lat) == false && isNaN(long) == false && lat > 0 && lat < 90 && long > -180 && long < 0) {
                    return true;
                } else {
                    return false;
                }
            },           
            
            replaceURL: function(index, url) {
                return url.substring(0, url.lastIndexOf("/") + 1) + index;
            },

            //https://github.com/gbirke/Sanitize.js/blob/master/README.md
            //http://www.javascriptkit.com/script/script2/removehtml.shtml            
            sanitizeTheJavascript: function(value) {
                var re= /<\S[^><]*>/g;
                return value.replace(re, "");
            },  
                                
            stringFormat: function (input) {
                //https://gist.github.com/litera/9634958
                var args = arguments;
                return input.replace(/\{(\d+)\}/g, function (match, capture) {
                    return args[1*capture + 1];
                });                
            },
            
            toProperCase: function(theText, opt_lowerCaseTheRest) {
                return (opt_lowerCaseTheRest ? theText.toLowerCase() : theText)
                    .replace(/(^|[\s\xA0])[^\s\xA0]/g, function(s){ return s.toUpperCase(); });
            }
           
        };
    });

}).call(this);