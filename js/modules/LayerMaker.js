/**
 * @author Karen Robine
 * @email karen@robinegis.com
 */

define(
  ["dojo/_base/declare",
   "angular",
   "js/config",
   "js/helpers/utils",
   "helpers/mapHelper", 
   "esri/layers/ArcGISDynamicMapServiceLayer",
   "esri/layers/ArcGISTiledMapServiceLayer",
   //"esri/layers/FeatureLayer",
   "esri/layers/GeoRSSLayer",
   "esri/layers/GraphicsLayer",
   "esri/layers/ImageParameters",
   "js/modules/ClusterLayer",
   "esri/symbols/SimpleMarkerSymbol",
   "esri/symbols/PictureMarkerSymbol",
   "esri/renderers/ClassBreaksRenderer",
   "esri/renderers/SimpleRenderer",
   "esri/geometry/Extent",
   "esri/graphic",
   "esri/geometry/Point",
   "esri/SpatialReference",
   "esri/InfoTemplate"
  // "esri/layers/LabelClass",
   //"esri/Color",
   //"esri/symbols/TextSymbol"
  ], function(
        declare,
        angular,
        config,
        utils,
        mapHelper,
        ArcGISDynamicMapServiceLayer,
        ArcGISTiledMapServiceLayer,
       // FeatureLayer,
        GeoRSSLayer,
        GraphicsLayer,
        ImageParameters,
        ClusterLayer,
        SimpleMarkerSymbol,
        PictureMarkerSymbol,
        ClassBreaksRenderer,
        SimpleRenderer,
        Extent,
        Graphic,
        Point,
        SpatialReference,
        InfoTemplate
       // LabelClass,
       // Color,
      //  TextSymbol
  ){
        var lyrs =  declare("modules.LayerMaker",null,{
            _layers: null,
            _actualLayers: [], 
            _map: null,
            _graphicLayer: null,
            _clusterLayer: null,
            _deviceIsBrowser: null,
            _isStartup: false,
            _markerData: null,
            _markerDataField: null,
            _queryObject: null,
            //_activityObj: null,
            _reQueryObject: null,
            _doReorderGraphicLayer: false,
            
            constructor: function(/*Object*/args) { 
                this._deviceIsBrowser = true;
                this._actualLayers = []; //set when layers are defined at startup
                this._isStartup = false;
                this._markerData = null;
                this._markerDataField = null;
                this._queryObject = null;
                //this._activityObj = null;
                this._reQueryObject = null;
                this._doReorderGraphicLayer = false;
                
                if (args!=null)  {
                    this._map = args.map;
                    if (args.deviceIsBrowser) {
                        this._deviceIsBrowser = args.deviceIsBrowser;
                    }
                    if (args.doReorderGraphicLayer) {
                        this._doReorderGraphicLayer = args.doReorderGraphicLayer;
                    }
                    if (args.isStartup) {
                        this._isStartup = args.isStartup;
                    }
                    if (args.markerData) {
                        this._markerData = args.markerData; 
                        this._markerDataField = args.markerDataField;
                    }                        
                    
                    if (args.queryObject) {
                        this._queryObject = args.queryObject;
                    }
                    //if (args.activityObj) {
                    //    this._activityObj = args.activityObj;
                    //}
                    if (args.reQueryObject) {
                        this._reQueryObject = args.reQueryObject;
                    }
                    if (args.doLayers) {
                        this.setLayers();
                    }
                }                                               
            },

            addDynamicMapServiceLayerToMap: function(lyr) {
                var dLayer = null;
                if (lyr!=null) {
                   dLayer = this.createDynamicMapServiceLayer(lyr);
                   if (dLayer!=null && this._isStartup) { 
                       this._map.addLayer(dLayer);                                                                                                                    
                   }
                }
                return dLayer;                
            },
            //Param uncommented the addFeatureLayerToMap method-it was orginally commmented
            /**
            addFeatureLayerToMap: function(lyr) {
                if (lyr!=null) {
                   var fLayer = this.createFeatureLayer(lyr); 
                   if (fLayer!=null) {
                       this.addLabel(fLayer);
                       this._map.addLayer(fLayer);
                       
                   }
                }
            },
            addLabel:function(fLayer){
                var lblColor = new Color("#666");
                var lyrLabel = new TextSymbol().setColor(lblColor);
                lyrLabel.font.setSize("8pt");
                lyrLabel.font.setFamily("arial");
                var json = {
                     "labelExpressionInfo": {"value": "{Name}"}
                    };
                var labelClass = new LabelClass(json); 
                labelClass.symbol = lyrLabel; 
                fLayer.setLabelingInfo([ labelClass ]);  
            },
            */   
            addGraphicsLayerToMap: function(lyr, index) {
                var gLayer = null;
                if (lyr!==null) {
                   gLayer = this.createGraphicsLayer(lyr); 
                   if (gLayer!==null && (index || this._isStartup)) { 
                       this._map.addLayer(gLayer, index);                  
                       //(index) ? this._map.addLayer(gLayer, index): this._map.addLayer(gLayer);
                   }
                } 
                return gLayer;               
            }, 
            
            addLayer: function(index, layer) {
                if (this._map && layer) {
                    this._map.addLayer(layer, index); 
                }
            },           

            //Adds an array of layers to the map at the specified index, or at the end.
            addLayers: function (layers, index) {
                if (this._map && layers && layers.length > 0) {
                    _.each(layers, function(lyr) {
                        if (!this._map.getLayer(lyr.id)) {
                            (index) ?
                                this._map.addLayer(lyr, index):
                                this._map.addLayer(lyr);
                        } else {
                            lyr.resume();
                            lyr.show();
                        }
                    }, this);                            
                        
                    if (this._doReorderGraphicLayer) {
                        this.reorderGraphicsLayer();
                    }
                }
            },
                        
            //Adds dynamic Map Service, and Graphics layers to the map around startup (or when Explore window closes)
            addLayersToMap: function() {               
                if (this._layers!=null && this._layers.length>0 && this._map!=null) {                   
                    var i = 0;
                    for (i = 0; i < this._layers.length; i++) {
                        if (this._layers[i] != null) {
                            if (this._layers[i].isGraphicsLayer && this._isStartup == this._layers[i].addLayerAtStartup) {
                                this._graphicLayer = this.addGraphicsLayerToMap(this._layers[i]);
                                this._actualLayers.push(this._graphicLayer);
                            } else if (this._layers[i].isDynamicMapService && this._isStartup == this._layers[i].addLayerAtStartup) {
                                var dLayer = this.addDynamicMapServiceLayerToMap(this._layers[i]);
                                this._actualLayers.push(dLayer);                       
                            } else if (this._layers[i].isFeatureLayer && this._isStartup == this._layers[i].addLayerAtStartup) {
                                alert("LayerMaker.js: Currently, Feature Layer types of layers are unsupported.");
                                //this.addFeatureLayerToMap(this._layers[i]);
                            }                            
                        }
                    }                                    
                }
            },

            //TODO: Added by Param. Do we use this? I'm also thinking that we can merge this with  createDynamicMapServiceLayer
            
            addSecuredLayerToMap: function(lyr) {
                var sLayer = null;
                if (lyr!=null) {
                    var imageParams = new ImageParameters();
                    if (lyr.pngType) {
                        imageParams.format = lyr.pngType;
                    }
                    var options = {
                       id: (lyr.Key) ? lyr.Key : lyr.key,
                       visible: lyr.isVisible,
                       imageParameters: imageParams,
                       opacity: lyr.opacity,
                       minScale: (lyr.minScale) ? lyr.minScale : 0,
                       maxScale: (lyr.maxScale) ? lyr.maxScale : 0
                    };                                     
                   sLayer = (lyr.ServiceURL) ?
                        new ArcGISDynamicMapServiceLayer(lyr.ServiceURL, options):
                        new ArcGISDynamicMapServiceLayer(lyr.url, options);
                                      
                   
                   if (typeof lyr.visibleLyrs != 'undefined') {
                       sLayer.setVisibleLayers(lyr.visibleLyrs);
                   } 
                   if (sLayer !=null) { 
                       //this._map.addLayer(sLayer);                                                                                                                  
                   }
                }
                return sLayer;                
            },
            
                        
            createAndAddPointGraphics: function(data, gLayer, symbol, isCluster1) {
                if (data && data.length > 0 && gLayer) {
                    _.each(data, function(dObj) {
                        var pt = new Point(dObj.x, dObj.y, new SpatialReference({ "wkid": 102100 }));
                        if (isCluster1) {
                           dObj.attributes["clusterCount"] = 1; //so Identify knows its part of a cluster 
                        }

                        if ((this._markerDataField && this._markerData && dObj.attributes) || 
                            (this._queryObject && this._queryObject.featureService && this._queryObject.featureService.layerDefs) || 
                            (this._queryObject && this._queryObject.queryService && this._queryObject.queryService.queries)) {
                            //Accessibility data needs appropriate  markerSymbol(dObj.attributes, symbol) new method
                            var defs = null;
                            if (this._queryObject && this._queryObject.featureService && this._queryObject.featureService.layerDefs) {
                                defs = this._queryObject.featureService.layerDefs;
                            } else if (this._queryObject && this._queryObject.queryService && this._queryObject.queryService.queries) {
                                defs = this._queryObject.queryService.queries;
                            }
                          
                            gLayer.add(new Graphic(pt, utils.getSingleMarkerSymbol(dObj.attributes, symbol, defs, this._markerDataField, this._markerData, config.queryPanels.clusterOptions.singleImages), dObj.attributes));
                        } else {
                            gLayer.add(new Graphic(pt, symbol, dObj.attributes));
                        }                       
                        
                    }, this);
                }
                //console.log("LayerMaker.js: createAndAddPointGraphics() gLayer= ", gLayer);
            },

            createClusterLayer: function(visible, options, minScale, maxScale) {                                  
                var clusterLayer = null;
                if (this._markerDataField && this._markerData) {
                    options.markerData = this._markerData;
                    options.markerDataField = this._markerDataField;
                }
                if (this._map && options.id && this._map.getLayer(options.id)) {
                    clusterLayer = this._map.getLayer(options.id);
                    clusterLayer.setOptions(options);
                } else {
                    clusterLayer = new ClusterLayer(options);
                }
                              
                //console.log("LayerMaker.js createClusterLayer() options= ", options);                
                //console.log("LayerMaker.js: createClusterLayer() clusterLayer created: clusterLayer= ", clusterLayer);              
                var imageSize = (options.imageSize) ? options.imageSize : 40;
                var sym= (options.imageName && options.imageName.length > 0) ?
                    new PictureMarkerSymbol(options.imageName, imageSize, imageSize).setOffset(0, 15):  
                    new SimpleMarkerSymbol(options.markerSymbolJson);                         
                clusterLayer.setRenderer(new SimpleRenderer(sym));                               
                clusterLayer.setVisibility(visible); 
                if (minScale) {
                    clusterLayer.setMinScale(minScale);
                }
                if (maxScale) {
                    clusterLayer.setMaxScale(maxScale);
                }

                if (this._deviceIsBrowser) {
                    this.graphicNodeAddEvent(clusterLayer);                                     
                }
                
                this._clusterLayer = clusterLayer;         
                return clusterLayer;                    
            },
          
            createDynamicMapServiceLayer: function(lyr) {                
                var imageParams = new ImageParameters();
                imageParams.format = lyr.pngType; //added on 03-04-13.  png32 is not documented?  
                //https://developers.arcgis.com/javascript/jsapi/arcgisdynamicmapservicelayer-amd.html
                var key = (lyr.Key) ? lyr.Key : lyr.key;
                var url = (lyr.ServiceURL) ? lyr.ServiceURL: lyr.url;
                if (key && url) {
                    return new ArcGISDynamicMapServiceLayer(url, {
                        id: key,
                        visible: lyr.isVisible,
                        imageParameters: imageParams,
                        opacity: lyr.opacity,
                        minScale: (lyr.minScale) ? lyr.minScale : 0,
                        maxScale: (lyr.maxScale) ? lyr.maxScale : 0                    
                    });                      
                } 
                return null;   
            },
            
            //Param uncommented the addFeatureLayerToMap method-it was orginally commmented
            /**
            createFeatureLayer: function(lyr) {               
                return new FeatureLayer(lyr.ServiceURL, {
                    //mode: FeatureLayer.MODE_ONDEMAND,
                    outFields: ["*"],
                    id: lyr.Key
                });              
            },
            */

            //https://developers.arcgis.com/javascript/3/jsapi/georsslayer-amd.html#georsslayer1
            createGeoRSSLayer: function(lyr) {
                var georss = null,
                    options = {};
                if (lyr) {
                   if (lyr.imageName && lyr.imageSize) {
                        var sym = new PictureMarkerSymbol(lyr.imageName, lyr.imageSize, lyr.imageSize);                   
                        //var inf = new InfoTemplate(); //this messes up our format for our current infoTemplate
                        //Also, it wont work on our smartphone device as we dont use infoTemplates there                                                
                        options = {pointSymbol: sym, infoTemplate: null};                       
                   }                    
                   georss = (lyr.url) ?
                        new GeoRSSLayer(lyr.url, options):
                        new GeoRSSLayer(lyr.ServiceURL, options);
                   georss.id = lyr.key; 
                   georss.showAttribution = true; //default is true so this is unnecesary 
                }
                return georss;                
            }, 
                       
            createGraphicsLayer: function(lyr) {
                var gLayer = new GraphicsLayer();
                gLayer.id = lyr.Key;
                this._graphicLayer = gLayer;
                //console.log("layerstarter.js: createGraphicsLayer()");
                return gLayer;                 
            }, 

            createGraphicsLayerForClustering: function(visible, minScale, maxScale, options) {                                  
                var gLayer = new GraphicsLayer(); 
                gLayer.id = options.id;
                                                    
                if (options.singleClusterSymbol && options.singleClusterSymbol.url) {
                    var sym = new PictureMarkerSymbol(options.singleClusterSymbol.url, options.singleClusterSymbol.width, options.singleClusterSymbol.height);                
                    gLayer.setRenderer(new SimpleRenderer(sym));                     
                }
                              
                gLayer.setVisibility(visible); 
                if (minScale) {
                    gLayer.setMinScale(minScale);
                }
                if (maxScale) {
                    gLayer.setMaxScale(maxScale);
                }

                if (this._deviceIsBrowser) {
                    this.graphicNodeAddEvent(gLayer);
                    this.graphicLayerOnClickEvent(gLayer);                  
                }

                if (options.data && !this._reQueryObject) {
                    this.createAndAddPointGraphics(options.data, gLayer, sym, true); //options.data will be full extent type of data
                }
                                    
                return gLayer;                    
            },
                         
            createTiledMapLayer: function(layerId, url, isVisible) {
                //console.log("layerMaker.js:  createTiledMapLayer() layerId=" + layerId);
                return (new ArcGISTiledMapServiceLayer(url, { id: layerId, visible: isVisible }));
            },
            
            /* TODO: Karen removed all of the code related to WMS for now, so we wouldnt take the hit on downloading 
            createWMSLayer: function(lyr) {
                //version 1.1.1
                var url = "http://nowcoast.noaa.gov:80/wms/com.esri.wms.Esrimap/obs";
                var layer1 = new WMSLayerInfo({name: "RAS_RIDGE_NEXRAD", title: "RAS_RIDGE_NEXRAD"});
                var layer2 = new WMSLayerInfo({name: "RAS_GOES_I4", title: "RAS_GOES_I4"});
                var layer3 = new WMSLayerInfo({name: "RAS_GOES", title: "RAS_GOES"});
                var resInfo = {
                    extent: new Extent(-180,-90,180,90,{wkid: 4326}),
                    layerInfos: [layer1, layer2, layer3]
                };
                var options = {format: "png",
                               resourceInfo: resInfo,
                               version: "1.1.1",
                               visibleLayers: ["RAS_RIDGE_NEXRAD"]
                    };

                var wLayer = new WMSLayer(url, options);
                wLayer.id = lyr.Key;
                if (!lyr.isVisible) {
                    wLayer.setVisibility(false);
                }
                if (lyr.opacity) {
                    wLayer.setOpacity(lyr.opacity);
                }
                
                //console.log("layerstarter.js: createWMSLayer()");
                return wLayer;                 
            }, 
            */

            getActualLayers: function() {
                return this._actualLayers;
            },

            getFirstLayerIndex: function (arrKeys) {
                var i = 0;
                for (i=0; i < arrKeys.length; i++) {
                    var ind = this.getLayerIndex(arrKeys[i]);
                    if (ind > -1) {
                        return ind;
                    }
                }
                return -1;
            },
            
            getGraphicLayer: function() {
                return this._graphicLayer;
            },
            
            //Layer index for the graphics layer that contains the identify X
            getGraphicLayerIndex: function() {
                var gLyr = _.findWhere(config.Layers, {isGraphicsLayer: true});
                if (gLyr && gLyr.Key) {
                    var ind = this._map.graphicsLayerIds.indexOf(gLyr.Key);
                    this._graphicLayer = this._map.getLayer(gLyr.Key);
                    if (ind > -1 && this._graphicLayer != null) {
                        return ind;
                    }
                }
                return -1;                
            },

            //Layer index for the dynamic layer (or tiled) that contains the key
            getLayerIndex: function(key) {
                if (key && key.length > 0 && this._map.layerIds) {
                    return (this._map.layerIds.indexOf(key));
                }
                return -1;                
            },
                                   
            getMapLayer: function(key) {
                return this._map.getLayer(key);
            },

            graphicLayerOnClickEvent: function(gLayer) {
                gLayer.on("click", function onClick(e) {
                    if (!(e instanceof MouseEvent)) {
                        e.mapPoint = e.graphic.geometry;
                        e.screenPoint = {
                            spatialReference: undefined,
                            type: "point",
                            x: e.node.x.baseVal.value,
                            y: e.node.y.baseVal.value
                        };
                        //console.log("LayerMaker.js graphicLayerOnClicEvent() gLayer.id= " + gLayer.id + "  e= ", e);
                        this._map.onClick(e);
                    }
                }, this);                  
            },
                        
            graphicNodeAddEvent: function(gLayer) {
                gLayer.on("graphic-node-add", function addTab(eventObj) {
                    if (eventObj.node.tagName == "image") {
                        //console.log("LayerMaker.js: graphicNodeAddEvent() gLayer.id= " + gLayer.id);
                        eventObj.node.setAttribute("focusable", true);
                        eventObj.node.tabIndex = 1; //TabIndex must be greater then 0 so that it doesnt interfere with identify tabbing
                        eventObj.node.addEventListener("keypress",function() {
                            gLayer.onClick(eventObj);
                        }, false);
                    }
                });                  
            },

                             
            hideMapLayers: function(arrLayers) {
                var map = this._map;
                angular.forEach(arrLayers, function(layer) {
                    //TODO: Fix this for streets
                    var lyr = map.getLayer(layer.key);
                    //console.log("hideMapLayers layer.key=" + layer.key + "lyr=", lyr);
                    if (lyr) {                    
                        lyr.hide();
                    }
                });               
            }, 
            
            //We always need the Graphics Layer to be at the end of the graphicLayerIds so that it ALWAYS draws on top
            //TODO: we might want to wait to call this till after the final addLayer has completed?
            reorderGraphicsLayer: function() {
                //console.log("LayerMaker.js: reorderGraphicsLayer() this._map.graphicsLayerIds= ", this._map.graphicsLayerIds);
                var ind = this.getGraphicLayerIndex();
                if (ind > -1 && ind < this._map.graphicsLayerIds.length - 1 && this._graphicLayer) {
                    //do reorder                                            
                    ind = this._map.layerIds.length + this._map.graphicsLayerIds.length;
                    //console.log("LayerMaker.js: reorderGraphicsLayer()  Need to do reorder.. this._map.layerIds= " + this._map.layerIds.length + " this._map.graphicsLayerIds.length= " + this._map.graphicsLayerIds.length + " ind= " + ind + "  this._map.graphicsLayerIds= ", this._map.graphicsLayerIds);  
                    this._map.reorderLayer(this._graphicLayer, (ind - 1)); 
                    return true;                                         
                }
                return false;
            }, 
                                     
            setLayers: function() {               
                this._layers = config.Layers;                
            },
            
            setMap: function(map) {
                this._map = map;
            },
            
            setVisibleSubLayers: function(layerKey, layerArray) {
                var lyr = this._map.getLayer(layerKey);
                if (lyr) {
                    lyr.setVisibleLayers(layerArray);
                }
            },
            
            showMapLayer: function(layer) {
                var bRtn=false;
                if (layer) {
                    layer.show();
                    bRtn = true;
                }
                return bRtn;
            }             
                                   
           });
        return lyrs;
    });