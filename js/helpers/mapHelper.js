/**
 * @author Karen Robine
 */
//Param added query & queryTask,deferred & lang dependency class

(function () {
    'use strict';

    define([
        'angular',
        'underscore',        
        'js/config',
        'esri/geometry/Extent',
        'esri/geometry/Point',
        'esri/SpatialReference',
        'esri/geometry/webMercatorUtils',
        'esri/tasks/query',
        'esri/tasks/QueryTask',
        'dojo/Deferred',
        'dojo/_base/lang'
    ], function (angular, _, config, Extent, Point, SpatialReference, webMercatorUtils,Query, QueryTask,Deferred,lang) {
        return {            
            
            createMapPoint: function (x, y, wkid) {
                return new Point(x, y, new SpatialReference({ "wkid": wkid}));
            },
            
            getZoomCapability: function () {
                var bRtn=true;
                if (config.DisableMapNavigation!==null && config.DisableMapNavigation.EnableZoom!==null)  {
                    bRtn=config.DisableMapNavigation.EnableZoom; 
                }
                return bRtn;
            },
            
            //Returns true if the sublayer of a dynamic map service layer is currently visible
            isSubLayerIndexVisible: function(key, layerIndex, map) {               
                var lyr = map.getLayer(key);
                if (lyr && lyr.visible && lyr.visibleLayers && lyr.visibleLayers.length > 0 && lyr.visibleLayers.indexOf(layerIndex) > -1) {
                    return true;
                }
                return false;
            },
            
            isLayerWithinMapScale: function(layer, map) {
                var bRtn=false;
                if (layer!=null && layer.minScale!=null && layer.maxScale!=null) {
                    var scale = map.getScale();
                    if ((layer.minScale==0 && layer.maxScale <= scale) ||
                        (layer.maxScale <= scale && layer.minScale >= scale) ||
                        (layer.minScale==0 && layer.maxScale==0)){
                        bRtn = true;
                    }                    
                } 
                return bRtn;
            },
            
            isScaleWithinMapScale: function(minScale, maxScale, map) {
                var scale = map.getScale();
                if ((minScale == 0 && maxScale <= scale) ||
                    (maxScale <= scale && minScale >= scale) ||
                    (minScale == 0 && maxScale==0)){
                    return true;
                } else {
                    return false;
                }               
            },  
                      
            queryAndZoomToExtent: function(key, keyType, value, lyrURL, map, querySrvc) {
                querySrvc.getExtent(key, keyType, value, lyrURL, true, map.spatialReference)
                    .then(function(rtnObj){
                        //console.log("queryAndZoomToExtent rtnObj= ", rtnObj);
                        if (rtnObj && rtnObj.extent) {
                            //console.log("mapHelper.js: queryAndZoomToExtent rtnObj.extent= ", rtnObj.extent);
                            map.setExtent(rtnObj.extent, true);  //https://developers.arcgis.com/javascript/jsapi/map-amd.html#setextent                        
                        }
                    }, function(error) {
                        if (error && error.message) {
                            alert("mapHelper.js: queryAndZoomToExtent() Failure. Unable to query and zoom to the extent. Please check console for error details."); 
                        }                        
                    }
                );           
            },

            removeLayers: function (map, layers, doClear, doRemoveClusters) {
                var rtnLayers = [];
                if (map && layers && layers.length > 0) {
                    _.each(layers, function(lyr) {
                        //if (doClear && lyr && lyr.graphics && lyr.graphics.length > 0) {                        
                        var doRemove = (lyr && lyr._clusterTolerance && !doRemoveClusters) ? false : true;                        
                        if (doClear && lyr && lyr.graphics && lyr.graphics.length > 0) {
                            //console.log("mapHelper.js: removeLayers(): doClear==true (about to suspend, clear and hide): lyr.id= " + lyr.id + " lyr= ", lyr);
                            lyr.suspend();
                            lyr.clear();                           
                            lyr.hide();
                        }
                        if (doRemove && lyr.id && map.getLayer(lyr.id)) {
                            //console.log("mapHelper.js: removeLayers() about to remove layer with id= " + lyr.id + " lyr= ", lyr);
                            map.removeLayer(lyr);
                        } else {
                            //console.log("mapHelper.js: removeLayers() layer with id= " +  lyr.id + " was not removed.");
                            rtnLayers.push(lyr);
                        }                        
                    });
                }
                return rtnLayers;
            },
                        
            //Turns on and off sublayers of a DynamicMapService layer. 
            setDynamicLayerVisibility: function(bOn, key, lyrIndexes, map) {
                var lyr = map.getLayer(key);
                if (lyr) {
                    var vis = lyr.visibleLayers; //Gets the visible layers of the exported map. (Added at v1.2): Number[]
                    var bChange = false;
                    if (vis && vis.length > 0) {
                        _.each(lyrIndexes, function(lyrIndex) {
                            var bHasIt = _.contains(vis, lyrIndex);
                            var ind = _.sortedIndex(vis, lyrIndex);
                            if (bOn && !bHasIt) {
                                //add the value . ind=0                          
                                vis.splice(ind, 0, lyrIndex);
                                bChange = true;
                            } else if (!bOn && bHasIt) {
                                //remove the value
                                vis.splice(ind, 1);
                                bChange = true;
                            }              
                        });                          
                    }

                    if (bChange) {
                        lyr.setVisibleLayers(vis, false);  //https://developers.arcgis.com/javascript/jsapi/arcgisdynamicmapservicelayer-amd.html#setvisiblelayers
                    }                                 
                }                
            },

            setKeyboardNavigation: function(map, bEnable) { 
                if (bEnable && !map.isKeyboardNavigation) {
                    map.enableKeyboardNavigation();
                    map.enableScrollWheelZoom();                        
                } else if (!bEnable && map.isKeyboardNavigation){
                    map.disableKeyboardNavigation();
                    map.disableScrollWheelZoom();                        
                }

            },
                
            setLayersVisibility: function (layers, bOn) {
                if (layers && layers.length > 0) {
                    _.each(layers, function(lyr) {
                        (bOn) ?
                            lyr.show():
                            lyr.hide();
                    });
                }
            },
                        
            zoomToExtent: function(minx, miny, maxx, maxy, map) {
                var extent = new Extent(minx, miny, maxx, maxy, map.spatialReference);
                map.setExtent(extent);
            },

            zoomToExtentUsingDistance: function(lat, lng, dist, map) {          
                var mapPoint = webMercatorUtils.geographicToWebMercator(new Point(lng, lat, new esri.SpatialReference({ wkid: 4326 })));
                var extent = new Extent((mapPoint.x - dist), (mapPoint.y - dist), (mapPoint.x + dist), (mapPoint.y + dist), map.spatialReference);
                map.setExtent(extent);
            },
                
            zoomToPoint: function(lat, long, scale, wkid, map) {
                //Karen: note that I dont need to convert to web mercator for this to work. But if so, we could use webmercatorutils.
                //also maybe something good to add to mapUtils
                var point = new Point(long, lat, new SpatialReference({ "wkid": wkid}));           
                map.centerAndZoom(point, scale);
                return point;
            },
            queryAndZoomToPoint: function(key, keyType, lyrURL, zoomlevel, value,map) {
                 this.getPointExtent(key, keyType, value, lyrURL, true, map.spatialReference)
                    .then(function(rtnObj){
                              if (rtnObj) {
                                if (rtnObj.features.length > 0){
                                    for (var x = 0; x < rtnObj.features.length; x++) {
                                        var long=rtnObj.features[x].geometry.x;
                                        var lat=rtnObj.features[x].geometry.y;
                                    }
                                    var point = new Point(long, lat, new SpatialReference({ "wkid": 102100}));
                                    map.centerAndZoom(point, zoomlevel);
                                }
                            }
                        }, function(error) {
                            if (error && error.message) {
                                alert("Unable to query and zoom to the extent. Please verify the url parameter values are correct.");
                            }
                        }
                    );
            },
            getPointExtent: function (key, keyType, value, url, returnGeom, sr) {
                var queryString = (keyType == "string") ? [key, " = '", value, "'"].join('') : [key, " = ", value].join('');
                var query = new Query();
                var resultDef = new Deferred();
                var queryTask = new QueryTask( url);
                query.where = queryString;
                query.outSpatialReference = {wkid:102100};
                query.returnGeometry = returnGeom;
                query.outFields = [key];
                queryTask.execute(query).then(lang.hitch(this, function(response){
                    var features = response.features;
                    resultDef.resolve({
                        features: features
                    });
                }), lang.hitch(this, function(err){
                    resultDef.reject(err);
                }));
                return resultDef;
            }
        };
    });

}).call(this);


//Param added queryAndZoomToPoint & getPointExtent methods