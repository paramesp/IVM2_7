/**
 * @author Karen.
 * Handle the QueryTasks
 * is used to generate a queryTask, or promiseArray 
 */

define(
  ["angular",
   "underscore",
   "dojo/_base/declare",
   "dojo/_base/lang",
   "dojo/_base/array",
   "esri/tasks/query",     
   "esri/tasks/QueryTask",
   "esri/tasks/StatisticDefinition",
   "esri/geometry/Extent",
   "js/config",  
   "js/helpers/utils",
   "js/helpers/mapHelper"
  ], function(
        angular,
        _,
        declare,
        lang,
        array,   
        esriQuery,
        esriQueryTask, 
        StatisticDefinition, 
        Extent, 
        config,         
        utils,
        mapHelper
  ){
        var ldh =  declare("modules.QueryTaskHandler",null,{
            _url: null,
            _promiseArray: [],
            _taskObjectArray: [],
            _map: null,
            _extent: null,
            _fromReQuery: false,
            _doIdentify: false,
            _layerData: null,
            _currentLayerArray: [],
               
            constructor: function(/*Object*/args) {  
                this._promiseArray = [];
                this._taskObjectArray = [];
                this._map = null;
                this._extent = null;
                this._fromReQuery = false;
                this._doIdentify = false;
                this._layerData = null;
                this._url = null;
                this._currentLayerArray = [];
                
                if (args!=null)  {
                    this._url = args.url;
                    this._map = args.map; 
                    
                    if (args.doIdentify) {
                        this._doIdentify = args.doIdentify;
                        this._layerData = args.layerData;
                        this._extent = args.extent;
                    } else if (args.fromReQuery) {
                        this._fromReQuery = args.fromReQuery;
                    }
                }  else {
                    alert("Arguments are required in the QueryTaskHandler.js constructor");
                }              
            },

            //https://developers.arcgis.com/javascript/jsapi/query-amd.html
            buildEsriQueryParameters: function(queryObj) {
                if (queryObj.queryObject) {
                    if (this._fromReQuery && this._map) {
                        queryObj.queryObject.returnGeometry = true;
                        queryObj.queryObject.outSpatialReference = this._map.spatialReference;
                        queryObj.queryObject.geometry = this.getExtent();
                        queryObj.queryObject.groupByFieldsForStatistics = [];
                        queryObj.queryObject.outStatistics = [];
                        alert("QueryTaskHandler.js:  buildEsriQueryParamters() This doesnt work right now");
                    } else if (!this._fromReQuery && queryObj.queryObject.outStatistics) {
                       queryObj.queryObject.outStatistics = this.getStatisticDefinitionArray(queryObj.queryObject.outStatistics); 
                    }
                    return this.queryGen(queryObj.queryObject);
                }
                return queryObj;                
            },

            buildEsriQueryParametersForIdentify: function(where, outFields, spatialRef, queryObject) {
                var geomPrecision = 0,                     
                    doReturnGeom = false;
                    maxAllowOffset =  this.getMaxAllowableOffset();
                    
                if (queryObject.ReturnGeometry) {
                    doReturnGeom = queryObject.ReturnGeometry;
                }
                if (queryObject.GeometryPrecision) {
                    geomPrecision = queryObject.GeometryPrecision;
                }
                return this.queryGen({
                    where: where,
                    outFields: outFields,
                    returnGeometry: doReturnGeom,
                    geometry: this._extent,
                    geometryPrecision: geomPrecision,
                    maxAllowableOffset: maxAllowOffset,
                    outSpatialReference: spatialRef,
                    spatialRelationship : esri.tasks.Query.SPATIAL_REL_INTERSECTS
                });                
            }, 
                       
            buildQueryTaskObject: function(queryObj, i) {
                var url = this.getURL(queryObj, i);
                if (url && url.length > 0) {
                    if (!this._doIdentify) {
                        return {
                            queryTask: new esriQueryTask(url),
                            query: this.buildEsriQueryParameters(queryObj),
                            layer: queryObj
                        };                            
                    } else {
                        var where = this.getWhereClause(queryObj);
                        return {
                            queryTask: new esriQueryTask(url),
                            query: this.buildEsriQueryParametersForIdentify(where, queryObj.outFields, this._map.spatialReference, queryObj),
                            layer: queryObj
                        };                         
                    }
                
                } 
                return null;
            },
            
            getCurrentLayerArray: function() {
                return this._currentLayerArray;
            },
            
            getExtent: function() {
               if (this._map) {
                   return this._map.extent;
               } 
            },

            getMaxAllowableOffset: function() {
                return Math.floor(this._map.extent.getWidth() / this._map.width);
            },
            
            getOutFields: function(layer) {
                var rtnFields = [];
                if (layer && layer.Attributes && layer.Attributes.length>0) {
                    _.each(layer.Attributes, function(result) {
                        if (result.name) {
                            rtnFields.push(result.name);
                        }
                    }); 
                }
                return rtnFields;
            },
            getPromiseArray: function() {                            
                _.each(this._taskObjectArray, function(taskObj) {
                    if (taskObj && taskObj.queryTask && taskObj.query && taskObj.layer) {
                        //console.log("QueryTaskHandler.js: getPromiseArray() taskObj.query = ", taskObj.query);
                        //console.log("QueryTaskHandler.js: getPromiseArray() taskObj.queryTask = ", taskObj.queryTask);
                        this._promiseArray.push(taskObj.queryTask.execute(taskObj.query));
                        //console.log("getPromiseArray this._promiseArray= ", this._promiseArray);                       
                    }
       
                }, this); 
                return this._promiseArray;                                                                             
            },
                        
            //Used for building a promise array of Query Tasks 
            //https://developers.arcgis.com/javascript/jsapi/query-amd.html
            getQueryTaskPromiseArray: function(queries) {
                this.prepareQueryTasks(queries);
                return this.getPromiseArray();
            },
            
            //https://developers.arcgis.com/javascript/jsapi/statisticdefinition-amd.html
            getStatisticDefinitionArray: function(statsArr) {
                var stats = [];
                _.each(statsArr, function(statsObj) {
                    if (statsObj.onStatisticField && statsObj.outStatisticFieldName && statsObj.statisticType) {
                        var stat = new StatisticDefinition();
                        stat.onStatisticField = statsObj.onStatisticField;
                        stat.outStatisticFieldName = statsObj.outStatisticFieldName;
                        stat.statisticType = statsObj.statisticType;
                        stats.push(stat);                        
                    }
                });
                return stats;     
            },            

            getURL: function(layer, i) {
               if (!this._doIdentify && layer.layerId) {
                   return this._url + layer.layerId.toString();
               } else if (this._doIdentify) {
                    if (mapHelper.isLayerWithinMapScale(layer, this._map) || (this._layerData && this._layerData.key  && this._layerData.key == layer.key)) {
                        return layer.urls[i]; 
                    } else if (layer.altQueryLayer && 
                        mapHelper.isScaleWithinMapScale(layer.altQueryLayer.minScale, layer.altQueryLayer.maxScale, this._map) &&                        
                        mapHelper.isSubLayerIndexVisible(layer.altQueryLayer.key, layer.altQueryLayer.layerIndex, this._map)) {
                            //ie., wildernessPts
                            if (layer.altQueryLayer.identifyURL && layer.altQueryLayer.identifyURL.length > 0) {
                               return layer.altQueryLayer.identifyURL;
                            } else {
                               return utils.replaceURL(layer.altQueryLayer.layerIndex, layer.urls[i]); 
                            }                        
                    }                   
               } 
               return this._url;               
            },

            getWhereClause: function(layer) {
                if (this._layerData && this._layerData.attributes && this._layerData.key && this._layerData.key == layer.key) {
                    //console.log("QueryTaskHandler.js: getWhereClause() this._layerData.attributes", this._layerData.attributes);
                    //console.log("QueryTaskHandler.js: getWhereClause() layer", layer);
                    var fieldObj = _.find(layer.fields, function(fObj) {
                        return (fObj &&  fObj.UseForUniqueValue == true);
                    });
                    if (fieldObj && fieldObj.FieldName && this._layerData.attributes[fieldObj.FieldName]) {
                        var where = (fieldObj.DataType && fieldObj.DataType == "string") ?
                            fieldObj.FieldName + " = '" + this._layerData.attributes[fieldObj.FieldName] + "'":
                            fieldObj.FieldName + " = " + this._layerData.attributes[fieldObj.FieldName];
                        //console.log("QueryTaskHandler.js: getWhereClause() where= ", where);
                        return where;
                    }                     
                }
                return "";
            },                          
            
            
            prepareQueryTasks: function(queries) {                
                //console.log("QueryTaskHandler.js: prepareQueryTasks() queries= ", queries);
                _.each(queries, function(queryObj) {
                    //console.log("QueryTaskHandler.js: prepareQueryTasks() queryObj= ", queryObj);
                    if (this._doIdentify && queryObj.urls && queryObj.urls.length > 0) {
                        var i = 0;
                        for (i = 0; i < queryObj.urls.length; i++) {
                            if (this.verifyLayersAreVisible(queryObj,i)) {
                                this.setTaskObjectAndLayerArray(queryObj, i);
                            }                                                       
                        }
                    } else if (!this._doIdentify) {
                        this.setTaskObjectAndLayerArray(queryObj, 0);
                    }
                           
                }, this);                                                      
            },
            
            replaceQueries: function(val, queries) {
                _.each(queries, function(queryObj) {
                    if (queryObj.queryObject && queryObj.queryObject.where) {
                        queryObj.queryObject.where = utils.stringFormat(queryObj.queryObject.where, val);
                    }                    
                });
                return queries;
            }, 
            
            setTaskObjectAndLayerArray: function (queryObj, i) {
                var taskObj =  this.buildQueryTaskObject(queryObj, i); 
                if (taskObj) {
                    //console.log("QueryTaskHandler.js: prepareQueryTask() taskObj= ", taskObj);
                    this._taskObjectArray.push(taskObj);
                    this._currentLayerArray.push(taskObj.layer);
                }                  
            },

            queryGen: function(params) {
                return lang.mixin(new esriQuery(), params);                
            },
            
            verifyLayersAreVisible: function(queryObj, i) {
                if (queryObj && queryObj.verifyLayersAreVisible && queryObj.verifyLayersAreVisible.length == queryObj.urls.length) {
                    var keyO = queryObj.verifyLayersAreVisible[i];
                    if (keyO && keyO.key) {
                        var lyrO = this._map.getLayer(keyO.key);
                        if (lyrO && lyrO.visible) {
                            //TODO: Should I check and make sure the actual sublayer is also visible?
                            return true;
                        }
                    }
                    return false;
                }
                return true;
            }
                                                     
           });
        return ldh;
    });
