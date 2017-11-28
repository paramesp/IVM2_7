/*  Handle the Details button on the Search Results to open and close the child nodes */
define(
  ["dojo/_base/declare",
   "underscore",
   "esri/symbols/SimpleLineSymbol",
   "esri/symbols/SimpleFillSymbol",
   "esri/symbols/SimpleMarkerSymbol"   
  ], function(
        declare, 
        _,
        SimpleLineSymbol,
        SimpleFillSymbol,
        SimpleMarkerSymbol        
  ){
        var ar =  declare("modules.Graphics",null,{

 			_graphicsLayer: null,
 			
            constructor: function(/*Object*/args){
            	if (args!=null) {
			         this._graphicsLayer = args.graphicsLayer;    		
            	}
            },
            
            addGraphicToGraphicLayer: function(geom, symbol, attributes) {
                //console.log("graphicsUtils.js addGraphicToGraphicLayer(). beginning");
                var graphic = null; 
                if (this._graphicsLayer!=null && geom!=null && symbol!=null) {
                    graphic = (attributes!=null) ? new esri.Graphic(geom, symbol, attributes): new esri.Graphic(geom, symbol);
                    //console.log("graphicsUtils.js this._graphicsLayer(). about to add highlightGraphic. this._graphicsLayer.id= " + this._graphicsLayer.id);  
                    this._graphicsLayer.add(graphic); //I wonder if, instead, we can just add em all                  
                }
                return graphic; 
            },

            addGraphicToGraphicLayerJson: function(json) {
                //console.log("graphicsUtils.js addGraphicToGraphicLayer(). beginning");
                var graphic = null; 
                if (this._graphicsLayer != null && json != null ) {
                    graphic = new esri.Graphic(json);                   
                    this._graphicsLayer.add(graphic);                   
                }
                return graphic; 
            },
                        
            //clearGraphicsLayer: if iClearValue==0, Clear Everything; iClearValue==1, Clear first polygon; iClearValue==2, Clear first point
            clearGraphicsLayer: function(iClearValue, attribID) { 
                if (this._graphicsLayer!=null) {
                    //console.log("ClearGraphicsLayer() iClearValue=" + iClearValue + " attribID=" + attribID + " graphicsLayer.id=" + this._graphicsLayer.id);
                    if (iClearValue==null || iClearValue==0) {
                        //alert("ClearGraphicsLayer() iClearValue=" + iClearValue + " attribID=" + attribID);
                        if (attribID==null || attribID.length==0) {
                            //alert("ClearGraphicsLayer() clear everything from the graphicsLayer, " + this._graphicsLayer.id);
                            this._graphicsLayer.clear(); //clear everything
                        } else {
                            //console.log("clearGraphicsLayer() about to removeGraphicFromGraphicLayer iClearValue= " + iClearValue);
                            this.removeGraphicFromGraphicLayer(iClearValue, attribID); 
                        }               
                    } else if (iClearValue==1 || iClearValue==2 || iClearValue==3){ 
                        //console.log("clearGraphicsLayer() next. about to removeGraphicFromGraphicLayer iClearValue= " + iClearValue);        
                        this.removeGraphicFromGraphicLayer(iClearValue, attribID); //clear first point, polygon or line only
                    }                           
                }   
            },

            convertStringToObject: function(sValue) {
                return eval(sValue);
            },
                        
            removeGraphicFromGraphicLayer: function(iClearValue, attribID) {
                //console.log("RemoveGraphicFromGraphicLayer() iClearValue=" + iClearValue + " attribID=" + attribID);
                if (this._graphicsLayer) {
                    //array.forEach(this._graphicsLayer.graphics, function(graphic){
                      _.each(this._graphicsLayer.graphics, function(graphic){
                            if (this._graphicsLayer!=null && graphic!=null && graphic.geometry!=null) {
                              var type = graphic.geometry.type;
                              if ((iClearValue==1 && type=="polygon") || (iClearValue==2 && type=="point") || (iClearValue==3 && type=="polyline")){
                                this._graphicsLayer.remove(graphic);
                                return false;
                              } else if (iClearValue==0 && attribID!=null && graphic.attributes!=null && graphic.attributes.id!=null &&
                                graphic.attributes.id==attribID) {      
                                    //alert("RemoveGraphicFromGraphicLayer() remove from the graphicsLayer graphic.attributes where id=" + attribID);
                                    this._graphicsLayer.remove(graphic); //removes previous identify Or MapIt point only.
                                    return false;
                              }     
                            }
                            return true;
                      }, this);                     
                }
  
            }            			
           });
        return ar;
    });

