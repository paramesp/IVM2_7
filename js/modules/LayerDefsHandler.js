/**
 * @author Karen.
 * Handle the Layer Definitions
 * Was originally being used to generate a big getter request.
 * but may instead be used to generate a queryTask 
 */

define(
  ["underscore",
   "dojo/_base/declare",  
   "js/helpers/utils"
  ], function(
        _,
        declare,            
        utils
  ){
        var ldh =  declare("modules.LayerDefsHandler",null,{
            _url: null,
            _query: null,
            _params: null,
            _map: null,
            _doExtent: false,
            
            constructor: function(/*Object*/args) {  
                this._map = null;
                this._doExtent = false;
                
                if (args!=null)  {
                    this._url = args.url; 
                    this._query = args.query;
                    this._params = args.params;
                    this._map = args.map;
                    this.doExtent = args.doExtent;
                }  else {
                    alert("Arguments are required in the LayerDefsHandler.js constructor");
                }              
            },

            buildLayerDefs: function(queries) {
                var ld = [];
                _.each(queries, function(query) {
                    ld.push({
                       layerId: query.layerId,
                       where: (query.queryObject && query.queryObject.where) ? query.queryObject.where : query.where,
                       outFields: (query.queryObject && query.queryObject.outFields) ? query.queryObject.outFields.join() : query.outFields 
                    });
                },this);
                return ld;
            },
            
            getExtent: function() {
                return "{xmin:" + this._map.extent.xmin + ", ymin: " + this._map.extent.ymin + ", xmax: "+ this._map.extent.xmax + ", ymax:" + this._map.extent.ymax + "}";
            },
            
            //Used for Getter request
            getLayerDefs: function(searchString) {
                var defs = (this._query.layerDefs) ? this._query.layerDefs: this._query.queries;
                if (this._query.layerDefs) {
                    return utils.stringFormat(JSON.stringify(this.buildLayerDefs(this._query.layerDefs)), searchString);
                } else if (this._query.queries) {
                    return JSON.stringify(this.buildLayerDefs(this._query.queries));
                }
                return "";
            },            
                        
            //Used for Getter request
            getQueryString: function(searchString) {
                //http://stackoverflow.com/questions/3441195/sending-ampersand-in-get
                var queryString = this.getLayerDefs(searchString);
                queryString = utils.sanitizeTheJavascript(queryString);
                //console.log("LayerDefsHandler.js: getQueryString() before encodeURI: queryString= ", queryString);
                queryString = encodeURI(queryString);
                //console.log("LayerDefsHandler.js: getQueryString() after encodeURI: queryString= ", queryString);
                return queryString;
            },          
            
            //Used for Getter request
            getURL: function(val) {
                //var url = config.GenericSearch.url + "query?layerDefs=[" + qStr + "]&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&time=&outSR=&gdbVersion=&returnDistinctValues=false&returnGeometry=true&maxAllowableOffset=&returnIdsOnly=false&returnCountOnly=false&returnZ=false&returnM=false&geometryPrecision=&multipatchOption=&returnTrueCurves=false&resultOffset=&resultRecordCount=&f=pjson";            
                //var qStr = this.getQueryString(val);
                var extent = "&geometry=";
                if (this._map && this.doExtent) {
                    extent += this.getExtent();
                }
                                
                var url = this._url + "query?layerDefs=" + this.getQueryString(val) + extent + this._params;
                //console.log("LayerDefsHandler: getURL(): url= " + url);
                return url;
            }
                                         
           });
        return ldh;
    });
