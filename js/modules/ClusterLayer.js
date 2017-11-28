define([
  "dojo/_base/declare",
  "dojo/_base/array",
  "dojo/_base/connect",
  "esri/Color",
  "esri/SpatialReference",
  "esri/geometry/Point",
  "esri/geometry/Extent",
  "esri/graphic",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/TextSymbol",
  "esri/symbols/Font",
  "esri/symbols/PictureMarkerSymbol",
  "esri/layers/GraphicsLayer",
  "js/config",
  "js/helpers/mapHelper",
  "js/helpers/utils"
], function (
    declare, 
    arrayUtils,
    connect, 
    Color,  
    SpatialReference, 
    Point, 
    Extent, 
    Graphic, 
    SimpleMarkerSymbol, 
    TextSymbol,
    Font,
    PictureMarkerSymbol, 
    GraphicsLayer, 
    config, 
    mapHelper, 
    utils
) {
  return declare([GraphicsLayer], {
    constructor: function(options) {
      // options:
      //   clusterOptions: object?
      //     the clusterOptions from the graphics Object. I think i should remove some of the items below
      //   data:  Object[]
      //     Array of objects. Required. Object are required to have properties named x, y and attributes. The x and y coordinates have to be numbers that represent a points coordinates.
      //   distance:  Number?
      //     Optional. The max number of pixels between points to group points in the same cluster. Default value is 50.
      //   labelColor:  String?
      //     Optional. Hex string or array of rgba values used as the color for cluster labels. Default value is #fff (white).
      //   _clusterOptions.labelOffset:  String?
      //     Optional. Number of pixels to shift a cluster label vertically. Defaults to -5 to align labels with circle symbols. Does not work in IE.
      //   labelFont: String?
      //     Optional: karen added to set the font using a FontObject from ArcGis Server API Rest
      //   resolution:  Number
      //     Required. Width of a pixel in map coordinates. Example of how to calculate: 
      //     map.extent.getWidth() / map.width
      //   _clusterOptions.showSingles:  Boolean?
      //     Optional. Whether or graphics should be displayed when a cluster graphic is clicked. Default is true.
      //   singleSymbol:  MarkerSymbol?
      //     Marker Symbol (picture or simple). Optional. Symbol to use for graphics that represent single points. Default is a small gray SimpleMarkerSymbol.
      //   singleTemplate:  PopupTemplate for Identify
      //     PopupTemplate</a>. Optional. Popup template used to format attributes for graphics that represent single points. Default shows all attributes as "attribute = value" (not recommended).
      //   singleClusterSymbol: PictureSymbol?
      //     Special symbol for a cluster graphic if there's just one
      //   maxSingles:  Number?
      //     Optional. Threshold for whether or not to show graphics for points in a cluster. Default is 1000.
      //   webmap:  Boolean?
      //     Optional. Whether or not the map is from an ArcGIS.com webmap. Default is false.
      //   spatialReference:  SpatialReference?
      //     Optional. Spatial reference for all graphics in the layer. This has to match the spatial reference of the map. Default is 102100. Omit this if the map uses basemaps in web mercator.
      //   zoomOnClick:  Boolean?  
      //     Optional. Will zoom the map when a cluster graphic is clicked. Default is true.
      //   zoomLevel:  Number
      //     Optional:  Zoom in this number of times when clicked (zoomLevel)
      //   _clusterOptions.zoomToExtent:  Boolean?  
      //     Optional. Will zoom the map to the extent of all the graphics in the current cluster
      //   _clusterOptions.scaleToOpenMultiple: Number
      //     Optional: Scale at which Cluster will no longer zoom in, but instead, force identify
      //   _clusterOptions.openIdentifyDistance: Number
      //     Optional:  Instead of scaleToOpenMultiple, uses openIdentifyDistance to force Identify (if extent of cluster is smaller then this value)
      //   deviceIsBrowser: boolean
      //     Optional: Device that was previously calculated at startup
      //   _markerData: Activities.json file
      //   _markerDataField; Field to query on MarkerType.json 
      //  _queryObject: the query object such as Accessibile Info, from config file
      //******************************************
      this._clusters = [];
      this._zoomEnd = null;
      
      this._clusterOptions = options;
            
      this._clusterTolerance = options.hasOwnProperty('distance') ? options.distance : 50;
      this._clusterData = options.hasOwnProperty('data') ? options.data : [];
                
      this._clusterLabelColor = (options.labelColor) ? new Color(this._clusterOptions.labelColor) :  new Color("#000");     
      this._clusterLabelOffset = (options.hasOwnProperty("labelOffset")) ? options.labelOffset : -5;  // labelOffset can be zero so handle it differently
      
      // graphics that represent a single point
      this._singles = []; // populated when a graphic is clicked. TODO: Remove it.  Lots of code and were not using it.
      
      this._zoomOnClick = options.hasOwnProperty('zoomOnClick') ? options.zoomOnClick : true;
      this._zoomLevel = options.hasOwnProperty('zoomLevel') ? options.zoomLevel : 1;
      this._deviceIsBrowser = options.hasOwnProperty('deviceIsBrowser') ? options.deviceIsBrowser: false;
      
      this._multipleClusterSym = options.hasOwnProperty('multipleClusterSymbol') ? options.multipleClusterSymbol : null;
      this._multipleSymbolChar = options.hasOwnProperty('multipleSymbolCharacter') ? options.multipleSymbolCharacter : null;
      
      // symbol for single graphics
      var SMS = SimpleMarkerSymbol;
      this._singleSym = options.hasOwnProperty('singleSymbol') ? options.singleSymbol : new SMS("circle", 6, null, new Color("#888"));
      this._singleClusterSym = options.hasOwnProperty('singleClusterSymbol') ? options.singleClusterSymbol : null;
      this._singleTemplate = options.hasOwnProperty('singleTemplate') ? options.singleTemplate : null; //Karen modified
      this._maxSingles = options.hasOwnProperty('maxSingles') ? options.maxSingles : 1000;
      
      this._webmap = options.hasOwnProperty("webmap") ? options.webmap : false;
      this._sr = options.hasOwnProperty('spatialReference') ? options.spatialReference : new SpatialReference({ "wkid": 102100 });      
      this._queryObject = options.hasOwnProperty('queryObject') ? options.queryObject : null;
      this._markerData = options.hasOwnProperty('markerData') ? options.markerData : null;
      this._markerDataField = options.hasOwnProperty('markerDataField') ? options.markerDataField : null;
      this._clusterType = (this._queryObject && this._queryObject.queryService && this._queryObject.queryService.type) ? this._queryObject.queryService.type: ""; //if clusterType is set to summary, the label will change (ie. motorcyle when zoomed out summarizes based on Ranger District)
    },

    //********************
    // override esri/layers/GraphicsLayer methods 
    //********************
    _setMap: function(map, surface) {
        //console.log("ClusterLayer.js: _setMap() map= ", map);
        // calculate and set the initial resolution
        this._clusterResolution = map.extent.getWidth() / map.width; // probably a bad default...
        this._clusterGraphics();

        // connect to onZoomEnd so data is re-clustered when zoom level changes
        this._zoomEnd = connect.connect(map, "onZoomEnd", this, function() {
            // update resolution
            this._clusterResolution = this._map.extent.getWidth() / this._map.width;
            this.clear();
            this._clusterGraphics();
        });

        // GraphicsLayer will add its own listener here
        var div = this.inherited(arguments);
        //console.log("ClusterLayer.js: _setMap() div= ", div);
        return div;
    },


    _unsetMap: function() {
        //https://geonet.esri.com/thread/175513
        this.inherited(arguments);
        connect.disconnect(this._zoomEnd);      
    },


    //********************
    // public ClusterLayer methods
    //********************
    add: function(p) {
        // Summary:  The argument is a data point to be added to an existing cluster. If the data point falls within an existing cluster, it is added to that cluster and the cluster's label is updated. If the new point does not fall within an existing cluster, a new cluster is created.
        //
        // if passed a graphic, use the GraphicsLayer's add method
        if ( p.declaredClass ) {
            this.inherited(arguments);
            return;
        }

        // add the new data to _clusterData so that it's included in clusters
        // when the map level changes
        this._clusterData.push(p);
        var clustered = false,
            i = 0;
        // look for an existing cluster for the new point
        for (i = 0; i < this._clusters.length; i++ ) {
            var c = this._clusters[i];
            if ( this._clusterTest(p, c) ) {
                // add the point to an existing cluster
                this._clusterAddPoint(p, c);
                // update the cluster's geometry
                this._updateClusterGeometry(c);
                // update the label
                this._updateLabel(c);
                clustered = true;
                break;
            }
        }

        if ( ! clustered ) {                
            this._clusterCreate(p);
            p.attributes.clusterCount = 1;
            //console.log("ClusterLayer.js: add() We should have a cluster of one graphic p= ", p);
            this._showCluster(p);
        }
    },

    clear: function() {
        // Summary:  Remove all clusters and data points.
        this.inherited(arguments);
        this._clusters.length = 0;
    },

    clearSingles: function(singles) {
        // Summary:  Remove graphics that represent individual data points.
        var s = singles || this._singles;
        arrayUtils.forEach(s, function(g) {
            this.remove(g);
        }, this);
        this._singles.length = 0;
    },

    onClick: function(e) {
        //Karen lots of changes here
        //var bInScale = ((this._clusterOptions.scaleToOpenMultiple && this._clusterOptions.scaleToOpenMultiple == 0) || (this._clusterOptions.scaleToOpenMultiple && this._clusterOptions.scaleToOpenMultiple > 0 && this._map.getScale() > this._clusterOptions.scaleToOpenMultiple)) ? true : false;
        var bGrapSameLoc = (this._clusterOptions.openIdentifyDistance && this._clusterOptions.openIdentifyDistance > 0 && e.graphic.attributes.extent && e.graphic.attributes.extent.length == 4) ? 
            utils.isExtentWithinDistance(e.graphic.attributes.extent[0], e.graphic.attributes.extent[1], e.graphic.attributes.extent[2], e.graphic.attributes.extent[3], this._clusterOptions.openIdentifyDistance) :
            false;

        //console.log("ClusterLayer.js: onClick() scale= " + this._map.getScale() + " this._map.getZoom()= " + this._map.getZoom() + " this._map.getMaxZoom()= " + this._map.getMaxZoom() +  " bGrapSameLoc=" + bGrapSameLoc + " e.graphic= ", e.graphic);
        //console.log("ClusterLayer.js; onClick() e.graphic = ", e.graphic); 
        if (this._clusterOptions.zoomToExtent &&
            e.graphic.attributes.clusterCount > 1 &&
            e.graphic.attributes.extent && 
            e.graphic.attributes.extent.length == 4 &&
            !bGrapSameLoc)  {          
            var ext = new Extent(e.graphic.attributes.extent[0], e.graphic.attributes.extent[1], e.graphic.attributes.extent[2], e.graphic.attributes.extent[3], this._map.spatialReference);        
            
            if (utils.isExtentAPoint(ext) && this._zoomLevel) {
                //TODO: we need to find out why this is happening
                //Possibly a funky case where 2 Ranger Districts show up with same Centroids forcing extent of them combined to be the same?
                //console.log("ClusterLayer. onClick() this._zoomLevel= ", this._zoomLevel);
                this._map.centerAndZoom(
                    e.graphic.geometry,
                    this._map.getZoom() + this._zoomLevel
                );                
            } else {
                this._map.setExtent(ext, true);
            }                   
        } else if(this._zoomOnClick &&
            e.graphic.attributes.clusterCount > 1 &&
                this._map.getZoom() !== this._map.getMaxZoom() &&
                !bGrapSameLoc) {
            this._map.centerAndZoom(
                e.graphic.geometry,
                this._map.getZoom() + this._zoomLevel
            );
        } else if (this._isSummaryData() && e.graphic.attributes.displayVal && e.graphic.attributes.displayVal > 0) {
            //when doing motorized, for example, we have a clusterType=summary and we use displayVal on the screen instead of clusterCount. So we need to make sure for that case, we still zoom to extent
            //also if cluster of 1, we need to zoom
            //console.log("ClusterLayer.js: onClick() Param-Karens code to execute here. and just zoom in a bit this._zoomLevel= " + this._zoomLevel);
            var lvl = this._map.getLevel();
            this._map.centerAndZoom(e.graphic.geometry, lvl + this._zoomLevel); //Param says this is problematic. not seeing the issue he mentioned yet.               
        } else {
            // remove any previously showing single features
            this.clearSingles(this._singles);

            // find single graphics that make up the cluster that was clicked
            // would be nice to use filter but performance tanks with large arrays in IE
            var singles = [],
                i = 0;
            for (i = 0, il = this._clusterData.length; i < il; i++) {
                if ( e.graphic.attributes.clusterId == this._clusterData[i].attributes.clusterId ) {
                    singles.push(this._clusterData[i]);
                }
            }
            if ( singles.length > this._maxSingles ) {
                alert("Sorry, that cluster contains more than " + this._maxSingles + " points. Zoom in for more detail.");
                return;
            } else {                   
                this._addSingles(singles);
            
                //the following sets up an Identify when the user clicks Enter on a graphic 
                if (this._deviceIsBrowser) {
                    if (!(e instanceof MouseEvent)){
                        e.mapPoint = e.graphic.geometry;
                        e.screenPoint = {
                            spatialReference: undefined,
                            type: "point",
                            x: e.node.x.baseVal.value,
                            y: e.node.y.baseVal.value
                    };
                    //console.log("ClusterLayer.js deviceIsBrowser: Params Code e= ", e);
                    this._map.onClick(e);
                }                 
            }                               
        }          
      }
    },
    
    regenerateClusters: function(clusterData, type) {
       this.clear();
       this._clusterType = type;
       this._clusterData = clusterData;
       this._clusterGraphics(); 
    },
    
    setOptions: function(options) {
        //Note; This code is not properly tested. Calls this if layer already exists but we modify it with new scales, and cluster types
        this.clear();
        this._clusters = [];
        this._clusterOptions = options;
        this._clusterData = options.hasOwnProperty('data') ? options.data : [];
        this._queryObject = options.hasOwnProperty('queryObject') ? options.queryObject : null;
        this._markerData = options.hasOwnProperty('markerData') ? options.markerData : null;
        this._markerDataField = options.hasOwnProperty('markerDataField') ? options.markerDataField : null;
        this._clusterType = (this._queryObject && this._queryObject.queryService && this._queryObject.queryService.type) ? this._queryObject.queryService.type: "";
        this._clusterGraphics(); 
    },
    

    //********************
    // internal methods
    //********************
     
    _clusterGraphics: function() {
        // first time through, loop through the points
        var j = 0,
            j1;
        for (j = 0, jl = this._clusterData.length; j < jl; j++ ) {
            // see if the current feature should be added to a cluster
            var point = this._clusterData[j],
                clustered = false,
                numClusters = this._clusters.length,
                i = 0;
            for (i = 0; i < this._clusters.length; i++ ) {
                var c = this._clusters[i];
                if ( this._clusterTest(point, c) ) {
                    this._clusterAddPoint(point, c);
                    clustered = true;
                    break;
                }
            }

            if ( ! clustered ) {
                this._clusterCreate(point);
            }
        }
        this._showAllClusters();
    },

    _clusterTest: function(p, cluster) {
        var distance = (
            Math.sqrt(
                Math.pow((cluster.x - p.x), 2) + Math.pow((cluster.y - p.y), 2)
            ) / this._clusterResolution
        );
        return (distance <= this._clusterTolerance);
    },

    // points passed to clusterAddPoint should be included 
    // in an existing cluster
    // also give the point an attribute called clusterId 
    // that corresponds to its cluster
    _clusterAddPoint: function(p, cluster) {
        // average in the new point to the cluster geometry
        var count, x, y;
        count = cluster.attributes.clusterCount;
        x = (p.x + (cluster.x * count)) / (count + 1);
        y = (p.y + (cluster.y * count)) / (count + 1);
        cluster.x = x;
        cluster.y = y;

        //if (p.attributes.COUNT == 1) {
            //there are several ranger districts that ONLY have one trail in them: ie., Republic Ranger District
        //    console.log("_clusterAddPoint() p.attributes.COUNT = 1:  p = ", p.attributes);
        //    console.log("_clusterAddPoint() p.attributes.COUNT = 1:  cluster = ", cluster);
        //}
        
        // build an extent that includes all points in a cluster
        // extents are for debug/testing only...not used by the layer
        if ( p.x < cluster.attributes.extent[0] ) {
            cluster.attributes.extent[0] = p.x;
        } else if ( p.x > cluster.attributes.extent[2] ) {
            cluster.attributes.extent[2] = p.x;
        }
        if ( p.y < cluster.attributes.extent[1] ) {
            cluster.attributes.extent[1] = p.y;
        } else if ( p.y > cluster.attributes.extent[3] ) {
            cluster.attributes.extent[3] = p.y;
        }

        // increment the count
        cluster.attributes.clusterCount++;
      
        if (p.attributes.COUNT && this._isSummaryData()) {
            (cluster.attributes.displayVal) ?
                cluster.attributes.displayVal += p.attributes.COUNT:
                cluster.attributes.displayVal = p.attributes.COUNT;
        }
        // attributes might not exist
        if ( ! p.hasOwnProperty("attributes") ) {
            p.attributes = {};
        }
        // give the graphic a cluster id
        p.attributes.clusterId = cluster.attributes.clusterId;
    },

    // point passed to clusterCreate isn't within the 
    // clustering distance specified for the layer so
    // create a new cluster for it
    _clusterCreate: function(p) {
        var clusterId = this._clusters.length + 1;
        //console.log("ClusterLayer.js; _clusterCreate(), id is: " + clusterId + " p=" , p);
        // p.attributes might be undefined
        if ( ! p.attributes ) {
            p.attributes = {};
        }
        p.attributes.clusterId = clusterId;
        
        // create the cluster
        var cluster = { 
            "x": p.x,
            "y": p.y,
            "attributes" : {
                "clusterCount": 1,
                "clusterId": clusterId,
                "extent": [ p.x, p.y, p.x, p.y ],
                "displayVal":p.attributes.COUNT,
                "attrib": p.attributes //Karen added this
            }
        };

        this._clusters.push(cluster);
    },    
    

    _isSummaryData: function() {
        if (this._clusterType && this._clusterType == "summary") {
            return true;
        }
        return false;
    },
   
    _showAllClusters: function() {
        var i = 0,
            i1;
        for (i = 0, il = this._clusters.length; i < il; i++ ) {
            var c = this._clusters[i];
            this._showCluster(c);
        }
    },

    _showCluster: function(c) {
        var point = new Point(c.x, c.y, this._sr);
        var graphic;
        var doLabel = false;
              
        // code below is used to determine how to symbolize marker (it would override graphicLayers symbol)
        if ((!this._isSummaryData() && c.attributes.clusterCount == 1) || (this._isSummaryData() && c.attributes.displayVal && c.attributes.displayVal == 1)) {
            if ((this._markerData && this._markerDataField) || 
                (this._queryObject && this._queryObject.featureService && this._queryObject.featureService.layerDefs) ||
                (this._queryObject && this._queryObject.queryService && this._queryObject.queryService.queries)) {
                //console.log("ClusterLayer.js: _showCluster() we have a single cluster graphic with activity Info c= ", c);
                var defs = null;
                if (this._queryObject && this._queryObject.featureService && this._queryObject.featureService.layerDefs) {
                    defs = this._queryObject.featureService.layerDefs;
                }  else if (this._queryObject && this._queryObject.queryService && this._queryObject.queryService.queries) {
                    defs = this._queryObject.queryService.queries;
                }
                //var singleImages = (this._divObject && this._divObject.singleImages) ? this._divObject.singleImages : null;
                //var singleImages = config.queryPanels.clusterOptions.singleImages;
                var sym = utils.getSingleMarkerSymbol(c.attributes, this._singleClusterSym, defs, this._markerDataField, this._markerData, config.queryPanels.clusterOptions.singleImages);
                graphic = new Graphic(point, sym, c.attributes); //special symbol if only one graphic in cluster
                if (!sym) {
                    doLabel = true;
                }
            } else if (this._singleClusterSym) {
                graphic = new Graphic(point, this._singleClusterSym, c.attributes); //special symbol if only one graphic in cluster
            } else {
               graphic = new Graphic(point, null, c.attributes);
               doLabel = true; 
            }          
            //console.log("ClusterLayer.js: _showCluster() c.attributes (should be one)= this._singleClusterSym=  ", this._singleClusterSym);
        } else {
            graphic = new Graphic(point, null, c.attributes);                  
            doLabel = true;          
        }
        this.add(graphic);
      
        if (doLabel) {
            //Fix for PrintTask - Font object type needs to be of esri font object type
            //TODO: Karen, eventually get the Font working in Config so we dont need to do this. The JSON Font setting is NOT working
            var clusterFont = new Font();
            clusterFont.decoration = this._clusterOptions.labelFont.decoration;
            clusterFont.family = this._clusterOptions.labelFont.family;
            clusterFont.size = this._clusterOptions.labelFont.size;
            clusterFont.style = this._clusterOptions.labelFont.style;
            clusterFont.weight = this._clusterOptions.labelFont.weight;          
          
            var displayText = (this._isSummaryData() && c.attributes.displayVal) ?
                c.attributes.displayVal:
                c.attributes.clusterCount;
                           
            // show number of points in the cluster
            var label = new TextSymbol(displayText)
                .setColor(this._clusterLabelColor)
                .setOffset(0, this._clusterLabelOffset)
                .setFont(clusterFont);

            this.add(
                new Graphic(
                    point,
                    label,
                    c.attributes
                )
            );          
        }
           
        if (this._multipleClusterSym && this._multipleSymbolChar) {
            //https://developers.arcgis.com/javascript/jsapi/textsymbol-amd.html
            var sym = new TextSymbol(this._multipleClusterSym);                    
            sym.setText(this._multipleSymbolChar);  //fix this after tony gives me this 
            this.add(
                    new Graphic(
                    point,
                    sym,
                    c.attributes
                )
            );            
        }     
    },

    _addSingles: function(singles) {
        // add single graphics to the map
        arrayUtils.forEach(singles, function(p) {
            var g = new Graphic(
                new Point(p.x, p.y, this._sr),
                this._singleSym,
                p.attributes,
                this._singleTemplate
            );
            this._singles.push(g);
            if ( this._clusterOptions.showSingles ) {
                this.add(g);
            }
        }, this);
        //this._map.infoWindow.setFeatures(this._singles); //Karen removed this
    },
    
    _updateClusterGeometry: function(c) {
        // find the cluster graphic
        var cg = arrayUtils.filter(this.graphics, function(g) {
            return ! g.symbol &&
               g.attributes.clusterId == c.attributes.clusterId;
        });
        if ( cg.length == 1 ) {
            cg[0].geometry.update(c.x, c.y);
        } else {
            console.log("didn't find exactly one cluster geometry to update: ", cg);
        }
    },

    _updateLabel: function(c) {
        // find the existing label
        var label = arrayUtils.filter(this.graphics, function(g) {
            return g.symbol && 
                g.symbol.declaredClass == "esri.symbol.TextSymbol" &&
                g.attributes.clusterId == c.attributes.clusterId;
        });
        if ( label.length == 1 ) {
            // console.log("update label...found: ", label);
            this.remove(label[0]);
            var newLabel = new TextSymbol(c.attributes.clusterCount)
                .setColor(this._clusterLabelColor)
                .setOffset(0, this._clusterLabelOffset);
            this.add(
                new Graphic(
                    new Point(c.x, c.y, this._sr),
                    newLabel,
                    c.attributes
                )
            );
            // console.log("updated the label");
        } else {
            console.log("didn't find exactly one label: ", label);
        }
    },

    // debug only...never called by the layer
    _clusterMeta: function() {
        // print total number of features
        console.log("Total:  ", this._clusterData.length);

        // add up counts and print it
        var count = 0;
        arrayUtils.forEach(this._clusters, function(c) {
            count += c.attributes.clusterCount;
        });
        console.log("In clusters:  ", count);
    }

  });
});

