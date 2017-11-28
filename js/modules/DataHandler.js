/**
 * @author Karen.
 * Handle the Clusters 
 */

define(
  ["underscore",
   "dojo/_base/declare",
   "js/config",  
   "js/helpers/utils",
   "js/modules/GraphicsContent",
   "esri/geometry/Extent",
  ], function(
        _,
        declare,
        config,      
        util,
        GraphicsContent,
        Extent
  ){
        var dh =  declare("modules.DataHandler",null,{
            _map: null,
            _queryObject: null,
            _divObject: null,
            _rdCentroids: null, //results of Ranger District Centroids
            _rdKey: "",
            _fromReQuery: false,
            _singlePointMinExtent: 1000,
            fromGeneric: false,
            dataExtent: null, //Karen added to fix View All Results 
            
            constructor: function(/*Object*/args) {  
                this._fromReQuery = false;
                this.fromGeneric = false;
                this.dataExtent= null;
                if (args!=null)  {
                    this._map = args.map; 
                    this._queryObject = args.queryObject;
                    this._divObject = args.divObject;
                    this._fromReQuery = args.fromReQuery;
                    this._singlePointMinExtent = (args.singlePointMinExtent) ? args.singlePointMinExtent: 1000;
                    if (args.fromGeneric) {
                        this.fromGeneric = args.fromGeneric;
                    }
                    (args.rdCentroids) ?
                        this._rdCentroids = args.rdCentroids:
                        this._rdCentroids = null; 
                    (args.rdKey) ?
                        this._rdKey = args.rdKey:
                        this._rdKey = "";                        
                }  else {
                    alert("Arguments are required in the DataHandler.js constructor");
                }              
            },
            
            buildSummarizedClusterArray: function(layers) {
                var clusters = [];
                if (layers && layers.length > 0 && this._rdCentroids && this._rdKey.length > 0) {
                    _.each(layers, function(layer, i) {
                        if (layer && layer.features && layer.features.length > 0) {
                            var key = this._rdKey;                            
                            _.each(layer.features, function(feature) {                                
                                if (i == 0) {
                                    this.processSingleSummarizedObject(feature, key, clusters);                                 
                                } else {
                                    //this is where we add motorcyle trails onto motorcyle roads, for example
                                    //TODO: What if there's trails but not roads
                                    //console.log("DataHandler.js: buildSummarizedClusterArray i>0: feature= ", feature);
                                    var clusterFeature = _.find(clusters, function(cObj) {
                                        return (feature.attributes && feature.attributes[key] && cObj && cObj.attributes && cObj.attributes[key] && cObj.attributes[key] == feature.attributes[key]);
                                    });
                                    if (clusterFeature && clusterFeature.attributes.COUNT & feature.attributes.COUNT) {
                                        clusterFeature.attributes.COUNT += feature.attributes.COUNT;
                                    } else if (feature.attributes && feature.attributes.COUNT && feature.attributes.COUNT > 0 && feature.attributes[key]) {
                                        //No roads data, but may have trails data
                                        //console.log("DataHandler.js: buildSummarizedClusterArray i>0. We did not find anything in the cluster Array. feature=", feature);
                                        this.processSingleSummarizedObject(feature, key, clusters);
                                    }                                                                        
                                }                          
                            }, this);
                                                        
                        }
                    },this);
                }
                
                return clusters;
            },
            
            calculateFullDataExtent: function(clusterObj) {
                if (this.fromGeneric && clusterObj && this._map) {
                    if (!this.dataExtent) {
                        this.dataExtent= new Extent(clusterObj.x-this._singlePointMinExtent, clusterObj.y-this._singlePointMinExtent, clusterObj.x+this._singlePointMinExtent, clusterObj.y+this._singlePointMinExtent, this._map.spatialReference);
                    } else {
                        if (clusterObj.x < this.dataExtent.xmin) {
                            this.dataExtent.xmin = clusterObj.x;
                        } else if (clusterObj.x > this.dataExtent.xmax) {
                            this.dataExtent.xmax = clusterObj.x;
                        }
                        if (clusterObj.y < this.dataExtent.ymin) {
                            this.dataExtent.ymin = clusterObj.y;
                        } else if (clusterObj.y > this.dataExtent.ymax) {
                            this.dataExtent.ymax = clusterObj.y;
                        }                        
                    }
                }
            },

            getFeature: function(feature, id, lyrDefObj) {
                if (feature.geometry && feature.geometry.x && feature.geometry.y && this.verifyFeatureIsValid(feature, lyrDefObj)) {                                   
                    //var attrib = this.getAttributes(feature.attributes);
                    attrib = feature.attributes;
                    if (id) {
                        attrib[config.FeatureService.layerIdKey] = id;
                    }
                    return {
                        x : parseFloat(feature.geometry.x),
                        y : parseFloat(feature.geometry.y),
                        attributes : attrib
                    };                   
                }
                return null;                
            },
        
            getLayersOrFeatures: function(theJson) {
                if (theJson) {
                    if (theJson.RecordSet && theJson.RecordSet.features && theJson.RecordSet.features.length > 0) {
                        return [theJson.RecordSet.features];
                    } else if (this._divObject && this._divObject.isFeatured && theJson.features && theJson.features.length > 0)   {
                        return theJson.features;
                    } else if (theJson.features && theJson.features.length > 0)   {
                        return [theJson.features];                        
                    } else if (theJson.layers && theJson.layers.length > 0 ) {
                        return theJson.layers;
                    } else if (theJson.length > 0) {
                        return theJson;
                    }                             
                } 
                return null;
            },

            processFeaturedContent: function(graphics) {
                var rtnObj = {
                    worked : false,
                    graphicLayers: [],
                    dataArray: []
                }, 
                i = 0,
                fc = null; 

                var cnfgFeatObj = _.findWhere(config.SideBarLayers, {isFeatured: true});
                var options = {
                    map: this._map, 
                    configFeaturedObj: cnfgFeatObj,
                    configGLayer: this._queryObject
                };
                fc = new GraphicsContent(options);
                fc.setGraphics(graphics);
                rtnObj.graphicLayers = fc.getGraphicLayers();
                //TODO: Modify this to check if any of the graphics Layers has graphics
                if (rtnObj.graphicLayers && rtnObj.graphicLayers.length>0 && rtnObj.graphicLayers[0].graphics && rtnObj.graphicLayers[0].graphics.length > 0) {
                    rtnObj.worked = true;
                }
                    
                if (this._queryObject && this._queryObject.clusters && this._queryObject.clusters.doClustersAtStartup && fc) {
                    rtnObj.dataArray = fc.getDataArray();
                    if (rtnObj.dataArray && rtnObj.dataArray.length>0) {
                        rtnObj.worked = true;
                    }
                } 
                return rtnObj;                                                  
            },
                    
            processJson: function(theJson) {
                var graphics = [];
                //console.log("DataHandler.js processJson() theJson= ", theJson);
                var layers = this.getLayersOrFeatures(theJson);
                if (this._divObject && this._divObject.isFeatured) {
                    graphics = this.processFeaturedContent(layers); //graphics is an object, not array
                } else if (this._queryObject && this._queryObject.queryService && !this._fromReQuery) {
                    graphics = this.buildSummarizedClusterArray(layers);
                } else {
                    graphics = this.processLayers(layers);
                }
                //console.log("DataHandler.js processJson() graphics= ", graphics);
                return graphics;                     
            },
            
            processLayers: function(layers) {
                var graphics = [];
                if (layers && layers.length > 0) {
                    _.each(layers, function(layer) {
                        if (layer && layer.features) {
                            var id = (layer.id) ? layer.id : -1;
                            var lyrDefObj = null;
                            //TODO: Move this next chunk
                            if (this._queryObject && this._queryObject.featureService && this._queryObject.featureService.layerDefs) {
                                lyrDefObj = _.findWhere(this._queryObject.featureService.layerDefs, {layerId: id});
                            }
                            _.each(layer.features, function(feature) {
                                var cObj = this.getFeature(feature, id, lyrDefObj);
                                if (cObj) {
                                    graphics.push(cObj); 
                                }                                
                            }, this);
                        } 
                    }, this);
                }
                //console.log("DataHandler.js processJson() graphics= ", graphics);
                return graphics;                  
            },
            
            processSingleSummarizedObject: function(feature, key, clusters) {
                if (feature && feature.attributes && feature.attributes[key]) {
                    var rangDist = _.find(this._rdCentroids, function(rdObj) {
                        return (feature.attributes && feature.attributes[key] && rdObj && rdObj[key] && rdObj[key] == feature.attributes[key]);
                    });
                                    
                    if (rangDist && rangDist.x && rangDist.y) {
                        var clusterObj = {
                            x : parseFloat(rangDist.x),
                            y : parseFloat(rangDist.y),
                            attributes :  feature.attributes
                        };
                        clusters.push(clusterObj);
                        this.calculateFullDataExtent(clusterObj);                               
                    }                    
                }                
            },
            
            //for accessibility, verify the feaeture has actual data and is not just a <br>
            verifyFeatureIsValid: function(feature, lyrDefObj) {
                if (feature && feature.attributes && lyrDefObj && lyrDefObj.verifyHasDataField) {
                    var val = feature.attributes[lyrDefObj.verifyHasDataField];
                    //console.log("NavBarController.js: verifyFeatureIsValid() val= ", val);
                    if (!val || (val && val.trim().length == 0) || (val == "<br />")) {
                        return false;
                    } 
                }
                return true;
            } 
                                         
           });
        return dh;
    });
