/**
 * @author Karen Robine
 * @email karen@robinegis.com
 */

define(
  ["dojo/_base/declare",
   "dojo/on",
   "underscore",
   "js/config", 
   "esri/graphic",
   "esri/geometry/mathUtils",
   "esri/geometry/Point",
   "esri/SpatialReference",
   "esri/layers/GraphicsLayer",
   "esri/symbols/SimpleMarkerSymbol",
   "esri/symbols/PictureMarkerSymbol",
   "esri/renderers/SimpleRenderer",
   "helpers/utils"
  ], function(
        declare,
        on,
        _,
        config,
        Graphic,
        mathUtils,
        Point,
        SpatialReference,
        GraphicsLayer,
        SimpleMarkerSymbol,
        PictureMarkerSymbol,
        SimpleRenderer,
        utils
  ){
        var lyrs =  declare("modules.GraphicsContent",null,{
            _map: null,
            _graphicsLayers: [],
            _icon: null,
            _graphicObjs: [],
            _dataArray: [], 
            _configGLayer: null,
            _configFeaturedObj: null, 
            
            constructor: function(/*Object*/args) { 
                this._graphicObjs = [];
                this._graphicsLayers = [];
                this._dataArray = [];
                this._map = args.map; 
                this._configFeaturedObj = args.configFeaturedObj;
                this._configGLayer = (args.configGLayer != null) ? args.configGLayer : null;               
                this.setGraphicLayers(args); 
                this.setIcon();                                             
            },

            getAttribute: function(keyValArr, graphic) {
                var attribute = {};
                _.each(keyValArr, function(keyValObj) {                    

                    var val = this.getGraphicValue(keyValObj, graphic);
                    if (val) {
                        if (keyValObj.doAnchor) {
                            val = utils.convertTextToAnchor(val);                      
                        } else if (keyValObj.doDate) {
                            val = utils.convertTextToDateFormat(val); 
                        }                        
                    }
                    if (keyValObj.addStyle) {
                        (!val || val.length == 0) ?
                            attribute[keyValObj.addStyle.keyName] = keyValObj.addStyle.noStyleName:
                            attribute[keyValObj.addStyle.keyName] = keyValObj.addStyle.styleName;
                    }
                    attribute[keyValObj.key] = val;
                },this);
                return attribute;   
            },             
            
            getDataArray: function() {
                return this._dataArray;
            },
            
            getGraphicLayers: function() {
                return this._graphicsLayers;
            },            

            getGraphicValue: function(keyValObj, graphicObj) {
                //{key: "longitude", value: "coordinates", parentKey: "", parentKeys: ["geometry"], type: "array", arrayIndex: 0},
                var rValue = "";
                //console.log("getGraphicValue graphicObj= ", graphicObj);               
                if (graphicObj && graphicObj[keyValObj.value]) {
                    rValue = graphicObj[keyValObj.value];                
                } else if (keyValObj.parentKeys != null && keyValObj.parentKeys.length > 0) {
                    var fObj = graphicObj;
                    _.each(keyValObj.parentKeys, function(pKey) {                       
                        if (fObj != null && fObj[pKey] != null) {
                            fObj = fObj[pKey];
                        }
                    });
                    
                    if (typeof fObj == 'object' && fObj != null) {
                        if (typeof(fObj[keyValObj.value]) != 'undefined') {
                            (keyValObj.type == "array" && keyValObj.arrayIndex != null) ?
                                rValue = fObj[keyValObj.value][keyValObj.arrayIndex] :
                                rValue = fObj[keyValObj.value];
                        } else if (keyValObj.type == "array" && fObj[0] != null && typeof fObj[0] == 'object' &&  typeof(fObj[0][keyValObj.value]) != 'undefined') {
                            //twitters extended_entities media_url for example
                            rValue = fObj[0][keyValObj.value];
                        }                        
                    }

                }
                return rValue;
            },
                 
            isOnePlacePerArea: function(dist, graphic, gLayer) {
                var xy = utils.convertLongLatToXY([parseFloat(graphic["longitude"]), parseFloat(graphic["latitude"])]);
                var mapPoint = new Point(xy[0],
                                xy[1],
                                new SpatialReference ( {wkid: 102100})
                );
                var distShorter = _.find(this._graphicObjs, function(gra) {
                    return (mathUtils.getLength(gra.geometry, mapPoint) < dist);
                });                

                if (distShorter) {
                    return false;
                } 
                return true; 
            },
            
            
            isValidYonder: function(experience) {
                if (experience["isInappropriate"] == false && experience["latitude"] != null && experience["longitude"] != null && isNaN(experience["latitude"]) == false && isNaN(experience["longitude"]) == false) {
                    return true;
                } 
                return false;                                  
            },
            
            setGraphics: function(graphics) {
                if (graphics && graphics.length > 0) {
                    _.each(graphics, function(graphic) {
                        if (this._configGLayer && (!this._configGLayer.isYonder || (this._configGLayer.isYonder==true && this.isValidYonder(graphic)))) {
                            var attrib = this.getAttribute(this._configGLayer.attributeKeyValues, graphic);
                            if (!attrib.userURL || attrib.userURL.length == 0) {
                                attrib.userURL = this._configGLayer.userURLNoAvatar;
                            }
                            attrib.key = (this._configGLayer.key) ? this._configGLayer.key: "";
                            //console.log("GraphicsContent.js: graphic= ", graphic);
                            //console.log("GraphicsContent.js: attrib= ", attrib);
                            var xy = utils.convertLongLatToXY([parseFloat(attrib["longitude"]), parseFloat(attrib["latitude"])]);
                            var graphicObj = {
                                geometry : {
                                    x : xy[0],
                                    y : xy[1],
                                    spatialReference : {
                                        wkid : 102100
                                    }
                                },
                                x: xy[0],
                                y: xy[1],
                                attributes : attrib
                            };
                            if (this._configGLayer.clusters != null && this._configGLayer.clusters.doClustersAtStartup) {
                                this._dataArray.push(graphicObj);
                            }
                            
                            if (attrib["thumbnail"] != null && attrib["thumbnail"].length > 0) {
                                //Only do Featured Content if we have a thumbnail
                                //orange background marker symbol
                                var graphic1 = new Graphic(graphicObj);
                            
                                //picture
                                //var picMark1 = new PictureMarkerSymbol(mediaObj[attributes.pictures.thumbnail], config.GraphicsContent.imageSize, config.GraphicsContent.imageSize);
                                var picMark1 = new PictureMarkerSymbol(attrib["thumbnail"], this._configFeaturedObj.imageSize, this._configFeaturedObj.imageSize);
                                var graphic2 = new Graphic(graphicObj);
                                graphic2.setSymbol(picMark1);

                                //little icon yonder marker
                                var graphic3 = new Graphic(graphicObj);
                                graphic3.setSymbol(this._icon);
                            
                                /* ESRI Bug:  Seems like if same graphic in more then one graphic layer, it has problems drawing in both of them. Therefore, i can only place em in one of the layers */
                                var bDidIt = false;
                                _.each(this._graphicsLayers, function(gLayer) {
                                    var cnfgObj = _.find(this._configFeaturedObj.layers, function(layer) {
                                        return (layer.key == gLayer.id);
                                    }, this);
                                    //if (cnfgObj && (bDidIt || (gLayer.graphics.length < cnfgObj.count)) && (bDidIt || this.isOnePlacePerArea(cnfgObj.distance, graphic, gLayer))) {
                                    if (cnfgObj && !bDidIt && (gLayer.graphics.length < cnfgObj.count) && this.isOnePlacePerArea(cnfgObj.distance, graphic, gLayer)) {
                                        gLayer.add(graphic1);
                                        gLayer.add(graphic2);
                                        gLayer.add(graphic3);
                                        this._graphicObjs.push(graphicObj);
                                        bDidIt=true; //if graphics in first layer, they need to be in second layer (when zoom in)
                                    }
                                }, this);                                  
                            }                                                                                    
                        }
                    }, this);                    
                }
            },
            
            setGraphicLayers: function(args) {
                _.each(this._configFeaturedObj.layers, function(layer) {
                    var glayer = this._map.getLayer(layer.key);
                    if (glayer) {
                        this._graphicsLayers.push(glayer);  
                    } else {
                        glayer = new GraphicsLayer(layer.options);
                        if (args.infoTemplate) {
                            glayer.setInfoTemplate(args.infoTemplate);
                        }
                        if (this._configFeaturedObj && this._configFeaturedObj.backgroundMarkerSymbol) {
                            var rend = new SimpleRenderer(new SimpleMarkerSymbol(this._configFeaturedObj.backgroundMarkerSymbol));
                            glayer.setRenderer(rend);
                        } 
                        this._graphicsLayers.push(glayer);                         
                    }
                 
                }, this); 
            },
            
            setIcon: function() {
                this._icon = new PictureMarkerSymbol(this._configGLayer.imageName, this._configFeaturedObj.icons.size, this._configFeaturedObj.icons.size).setOffset(this._configFeaturedObj.icons.offset.x, this._configFeaturedObj.icons.offset.y);
            }         
                                   
           });
        return lyrs;
    });