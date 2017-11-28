/**
 * @author Karen.
 * Handle the Clusters 
 */

define(
  ["underscore",
   "dojo/_base/declare", 
   "dojo/_base/lang", 
   "js/config",
   'helpers/utils',
   'helpers/mapHelper',
   'js/modules/LayerMaker',
   'esri/symbols/PictureMarkerSymbol'
  ], function(
        _,
        declare,
        lang,      
        config,
        utils,
        mapHelper,
        LayerMaker,
        PictureMarkerSymbol
  ){
        var clstr =  declare("modules.ClusterHandler",null,{
            _deviceIsBrowser: null,
            _map: null,
            _layerMaker: null,
            _clusterOptions: null,
            _activityObj: null,
            _queryObject: null,
            _queryService: null,
 
            constructor: function(/*Object*/args) { 
                this._layerMaker = null;
                this._clusterOptions = null;
                this._activityObj = null;
                this._queryObject = null;
                this._queryService = null;
                if (args!=null)  {
                    this._deviceIsBrowser = args.deviceIsBrowser; 
                    this._map = args.map;
                    this._layerMaker = args.layerMaker;
                    if (args.clusterOptions) {
                        this._clusterOptions = lang.clone(args.clusterOptions); 
                    }                    
                    if (args.activityObj) {
                        this._activityObj = args.activityObj;
                    }
                    if (args.queryObject) {
                        this._queryObject = args.queryObject;
                    }
                    if (args.queryService) {
                        this._queryService = args.queryService;
                    }
                }                 
            },
            
            addLayersToMap: function(layers) {
                if (this._layerMaker && layers.length > 0) {
                    //TODO: This is a work in progress. I am not 100% sure this will work every time. will need more mucking               
                    var ind = this._layerMaker.getGraphicLayerIndex();
                    if (ind < 0) {
                        ind = 0;
                    } 
                    //console.log("ClusterHandler processClusters() about to add layers at index = " + ind + " : map.graphicsLayerIds= ", this._map.graphicsLayerIds);
                    this._layerMaker.addLayers(layers, ind);
                }                  
            },
            
            createClusterLayers: function(dataArray, id, layer) {
                var layers = [];
                if (this._activityObj && this._activityObj.layers && this._activityObj.layers.length > 0) { 
                    //console.log("ClusterHandler.js: createClusterLayers() is being called");                 
                    _.each(this._activityObj.layers, function(lyr) {
                        layers.push(this.createClusterOrGraphicsLayer(dataArray, lyr.minScale, lyr.maxScale, lyr.key, lyr.isClustered));
                    }, this);                    
                } else {
                    var minScale = (layer.clusters && layer.clusters.minScale) ? layer.clusters.minScale : layer.minScale;
                    var maxScale = (layer.clusters && layer.clusters.maxScale) ? layer.clusters.maxScale : layer.maxScale;
                    layers.push(this.createClusterOrGraphicsLayer(dataArray, minScale, maxScale, id, true));
                } 
                return layers;                
            },

            createClusterOrGraphicsLayer: function(dataArray, minScale, maxScale, id, isClustered) {
                var layer = null;
                var mapRes = this._map.extent.getWidth() / this._map.width;
                
                var options = this.getClusterOptions(dataArray, mapRes, id);
                if (isClustered) {
                     layer = this._layerMaker.createClusterLayer(true, options, minScale, maxScale);
                } else {
                     layer = this._layerMaker.createGraphicsLayerForClustering(true, minScale, maxScale, options); 
                }                
                return layer;                
            },

            getClusterOptions: function(dataArray, mapResolution, id) {
                var options = this._clusterOptions;            
                options.data = dataArray;
                options.resolution = mapResolution;

                if (typeof id != 'undefined' && typeof id == 'string' && id != null) {
                    options.id = id;
                }
                        
                if (this._clusterOptions.singleImage) {
                    options.singleClusterSymbol = new PictureMarkerSymbol(this._clusterOptions.singleImage);
                } else if (this._clusterOptions.singleImageSize) {
                    if (this._clusterOptions.singleImageName) {
                        options.singleClusterSymbol = new PictureMarkerSymbol(this._clusterOptions.singleImageName, this._clusterOptions.singleImageSize, this._clusterOptions.singleImageSize);
                    }  else if (!this._clusterOptions.singleImageName && this._queryObject && this._queryObject.singleImageName) {
                       options.singleClusterSymbol = new PictureMarkerSymbol(this._queryObject.singleImageName, this._clusterOptions.singleImageSize, this._clusterOptions.singleImageSize); 
                    }                   
                } 
               
                if (this._clusterOptions.markerSymbolJson) {
                    options.markerSymbolJson = this._clusterOptions.markerSymbolJson;
                }
                
                if (this._queryObject) {
                    options.queryObject = this._queryObject;
                    if (this._queryObject.imageName) {
                        options.imageName = this._queryObject.imageName;
                    }
                    if (this._queryObject.queryService && this._queryObject.queryService.type) {
                        options.clusterType = this._queryObject.queryService.type;
                    }                   
                }
                            
                if (this._queryObject && this._queryObject.textSymbolCharacter && this._clusterOptions.textSymbolJson) { 
                    options.multipleClusterSymbol = config.queryPanels.clusterOptions.textSymbolJson;
                    options.multipleSymbolCharacter = this._queryObject.textSymbolCharacter;
                } 

                options.deviceIsBrowser = this._deviceIsBrowser;  
                return options;              
            },
            
            isLayerNonClustered: function(layer) {
                if (this._activityObj && this._activityObj.layers && this._activityObj.layers.length) {
                   var nonClust = _.findWhere(this._activityObj.layers, {isClustered: false}); 
                   if (nonClust && nonClust.key == layer.id) {
                       return true;
                   }
                }
                return false;
            },

            
            //returns newly generated clusterLayers
            processClusters: function(dataArray, layer, doAddLayers, id, doGLayerReorder) {               
                if (this._layerMaker == null) {
                    //this happens at startup when its dealing with the featured content
                    this._layerMaker = new LayerMaker({
                        map : this._map,
                        doLayers: false,
                        deviceIsBrowser: this._deviceIsBrowser,
                        doReorderGraphicLayer: (doGLayerReorder) ? doGLayerReorder : false
                    });                    
                }                
                var layers = this.createClusterLayers(dataArray, id, layer);                     
                if (doAddLayers && this._layerMaker) {
                    this.addLayersToMap(layers);
                }  
                return layers;
            },
            
            regenerateClusters: function(type, dataArray, clusterLayers) {
                if (!this._queryObject || !this._queryObject.queryService || !this._queryObject.queryService.type) {
                    return clusterLayers;
                } else if (!clusterLayers || clusterLayers.length == 0) {
                    //this happens if already did a moto-non-moto type when zoomed in. then switch to rec site cluster. then back to that same moto-non-moto type        
                    clusterLayers = this.createClusterLayers(dataArray);
                    this.addLayersToMap(clusterLayers);
                }                
                _.each(clusterLayers, function(lyr) {
                    if (lyr && lyr._clusterOptions) {
                        if (type == this._queryObject.queryService.type) {
                            if (this._queryObject && this._queryObject.data && lyr._clusterType != this._queryObject.queryService.type) {
                                lyr.regenerateClusters(this._queryObject.data, type); //Clusterlayer regenerateClusters
                            }
                        } else {
                            lyr.regenerateClusters(dataArray, type); 
                        }                            
                    } else if (this.isLayerNonClustered(lyr) && this._activityObj && this._activityObj.reQueryObject){                                                  
                        if (dataArray && dataArray.length > 0 && this._layerMaker) {
                            //console.log("ClusterHandler.js: regenerateClusters() Number of single point Features = " + dataArray.length );
                            if (mapHelper.isScaleWithinMapScale(lyr.minScale, lyr.maxScale, this._map)) {
                                this._layerMaker.createAndAddPointGraphics(dataArray, lyr, null, true);
                            } else if (lyr.graphics && lyr.graphics.length > 0) {
                                lyr.clear();
                            }
                        }                           
                    }
                }, this);                                
                //console.log("ClusterHandler.js: regenerateClusters() clusterLayers= ", clusterLayers); 
                return clusterLayers;
            }              
                                         
           });
        return clstr;
    });
