define(
  ["dojo/_base/declare",
   "angular",
   "js/config",
   "js/helpers/utils",
   "esri/layers/FeatureLayer",
   "esri/layers/LabelClass",
   "esri/Color",
   "esri/symbols/TextSymbol"
  ], function(
        declare,
        angular,
        config,
        utils,
        FeatureLayer,
        LabelClass,
        Color,
        TextSymbol
  ){
        var lyrs =  declare("modules.Eclipse2017",null,{            
        
            constructor: function(/*Object*/args) { 
               this._map=args.map                                               
            },     
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
                lyrLabel.font.setSize("10pt");
                lyrLabel.font.setFamily("arial");
                var json = {
                     "labelExpressionInfo": {"value": "{Name}"}
                    };
                var labelClass = new LabelClass(json); 
                labelClass.symbol = lyrLabel; 
                fLayer.setLabelingInfo([ labelClass ]);  
            },          
            createFeatureLayer: function(lyr) {               
                return new FeatureLayer(lyr.ServiceURL, {
                    //mode: FeatureLayer.MODE_ONDEMAND,
                    outFields: ["*"],
                    id: lyr.id
                });              
            },                                
           });
        return lyrs;
    });