/**
 * @author Karen Robine
 * Handle part of the Map OnClick event. Called from IdentifyController.js
 * This calls QueryTaskHandler for the rest of the functionality to obtain the data results
 */

define(
  ["angular",
   "underscore",
   "dojo/_base/declare", 
   "dojo/_base/lang",
   "dojo/_base/array",
   "esri/geometry/Extent",
   "esri/geometry/Point",
   "js/config",
   "helpers/utils",
   "modules/Graphics",
   "modules/QueryTaskHandler"
  ], function(
        angular,
        _,
        declare,
        lang, 
        array,      
        extent,
        point,
        config,
        utils,
        Graphics,
        QueryTaskHandler
  ){
        var qry =  declare("modules.MapClickHandler",null,{
            _currentMapPoint: null,
            _map: null,
            _extent: null,
            _currentLayerArray: [],
            _layerData: null,
            _queryTaskHandler: null,
 
            constructor: function(/*Object*/args) { 
                this._currentLayerArray = [];
                this._extent = null;
                this._layerData = null;
                if (args != null)  {
                    this._currentMapPoint = args.mapPoint; 
                    this._map = args.map;
                    this._layerData = args.layerData;                   
                    if (this._map) {
                        var tol = utils.getIdentifyTolerance(args.map, false, args.deviceIsBrowser);
                        this._extent = this.getExtentFromPoint(tol); 
                    }
                    this._queryTaskHandler = this.getQueryTaskHandler();                                    
                }              
            },

            addIdentifyClickLocation: function() {                
                var graphicsLayer = this._map.getLayer(config.Identify.layerId);
                var graphic = null;           
                if (this._currentMapPoint != null && graphicsLayer != null) {
                    var gra = new Graphics({graphicsLayer: graphicsLayer});
                    gra.clearGraphicsLayer(0, config.Identify.graphicsId);  
                    //https://developers.arcgis.com/javascript/jsapi/graphic-amd.html#graphic2
                    var gJson = {
                        "geometry": {"x": this._currentMapPoint.x, "y": this._currentMapPoint.y, "spatialReference": {"wkid": 102100}},
                        "symbol": config.Identify.markerSymbol,
                        "attributes": {"id": config.Identify.graphicsId}
                    };
                    gra.addGraphicToGraphicLayerJson(gJson);                    
                }
                return graphic;         
            },
                  
            getCurrentLayerArray: function() {
                if (this._queryTaskHandler) {
                    return this._queryTaskHandler.getCurrentLayerArray();
                }
                return [];
            },
            
            getExtentFromPoint: function(tolerance) {
                //alert("utils.js: ExtentFromPoint(): point.x=" + point.x + " point.y= " + point.y + " point.spatialReference.wkid= " + point.spatialReference.wkid);
                var mapPoint1 = new point(this._currentMapPoint.x - tolerance, this._currentMapPoint.y - tolerance, this._map.spatialReference);
                var mapPoint2 = new point(this._currentMapPoint.x + tolerance, this._currentMapPoint.y + tolerance, this._map.spatialReference);
                //alert("MapClickHandler.js: getExtentFromPointt(): identifyTolerance= tolerance=" + tolerance + "  -x=" + mapPoint1.x + " -y=" + mapPoint1.y + " +x=" + mapPoint2.x + " +y=" + mapPoint2.y + " SpatialReference=" + this._map.spatialReference.wkid);
                return new extent(mapPoint1.x, mapPoint1.y, mapPoint2.x, mapPoint2.y, this._map.spatialReference);
            }, 
                      
            getMaxAllowableOffset: function() {
                return Math.floor(this._map.extent.getWidth() / this._map.width);
            },
                       
            getIdentifyPromiseArray: function() {
                if (this._queryTaskHandler) {
                    return this._queryTaskHandler.getQueryTaskPromiseArray(config.QueryLayers);
                }
                return [];
            },
                       
            getQueryTaskHandler: function() {
                return (new QueryTaskHandler({
                    doIdentify: true,
                    map: this._map,
                    extent: this._extent,
                    layerData: this._layerData
                }));                
            }
                                       
           });
        return qry;
    });
