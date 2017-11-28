/**
 * @author Karen.
 * Handle the IdentifyResults. 
 */

define(
  ["angular",
   "underscore",
   "dojo/_base/declare",  
   "js/config",
   'helpers/utils'
  ], function(
       angular,
        _,
        declare,      
        config,
        utils
  ){
        var qry =  declare("modules.IdentifyResultsHandler",null,{
            _currentMapPoint: null,
            _map: null,
            _currentLayerArray: [],
            _forestArray: [],
            _activityData: null,
 
            constructor: function(/*Object*/args) { 
                this._currentLayerArray = [];
                this._forestArray = []; //pass in the json
                this._activityData = null; //the Activities.json file contents
                if (args!=null)  {
                    this._currentMapPoint = args.mapPoint; 
                    this._map = args.map;
                    this._currentLayerArray = args.currentLayerArray; 
                    this._forestArray = args.forestArray;
                    this._activityData = args.activityData;              
                }                 
            },
            
            appendFieldWithPreviousField: function(value, field, feature, lyrConfig) {
                if (field.AppendFieldWithPreviousField && field.AppendFieldWithPreviousField.length > 0) {
                    var splitter = (field.FieldAppender) ? field.FieldAppender: " | ";
                    var fld = this.getFieldFromFieldName(field.AppendFieldWithPreviousField, lyrConfig.fields);
                    var objR =  this.getValueHeaderObject(fld, feature, lyrConfig);
                    if (objR.value) {
                        value = objR.value + splitter + value; 
                    }                                      
                }
                return value;
            },

            combineValuesIntoOne: function(value, combine) {
                if (value!=null && combine.CombinedValues && combine.NewValue && combine.CombinedValues.length>0 && combine.StartsWith ) {
                    _.each(combine.CombinedValues, function(cV) {
                        if (cV != null  && value.substring(0,1) == cV) {
                            value = combine.NewValue;
                        }
                    });                                   
                }
                return value;
            },  

            convertValueToTitleCase: function(value) {
                if (value && value.length>0) {
                    return utils.toProperCase(value.trim(), true);
                } 
                return value;        
            },
            convertValueToNull:function(value) {
                if (value) {
                    if (value.toLowerCase() ==="none" || value.toLowerCase() ==="unknown" || value.toLowerCase() ==="null"){
                        value=null;
                    }
                } 
                return value;        
            },
            fixDataFieldOrder: function(lyrConfig, data) {
                var rtnData = [];
                _.each(lyrConfig.fields, function(field) {
                    var val = utils.getObjectUsingKey(field.FieldName, data);
                    if (val) {
                        rtnData.push(val);
                    }
                });
                return rtnData;
            },
            
            fixRoadAndTrailForestName: function(identData, name) {
                _.each(config.QueryLayers, function(qLayer) {
                    var fld = _.findWhere(qLayer.fields, {ConvertToForest: true});
                    if (fld && fld.FieldName) {
                        var tab = utils.getObjectUsingKey(qLayer.key, identData.tabs);
                        if (tab && tab.dataObject && tab.dataObject.data && tab.dataObject.data.length > 0) {
                            var fldObj = utils.getObjectUsingKey(fld.FieldName, tab.dataObject.data);
                            if (fldObj) {
                                fldObj.value = name;
                            }
                        }
                    }
                });
                
            },
            displayDescHeader: function(showhide) {
                _.each(config.QueryLayers, function(qLayer) {
                    var fld = _.findWhere(qLayer.fields, {FieldName: "RECAREADESCRIPTION"});
                    if (fld && fld.FieldName) {
                      fld.IncludeFieldNameInIdentify=showhide;  
                    }
                });
                
            },      
            getActivities: function(lyrConfig, features) {
                // {src: "images/activities/act_list_020_new.png", title: "Backpacking"},
                var field = _.findWhere(lyrConfig.fields, {IsActivities: true});
                if (this._activityData && field && features && features.length > 0) {                    
                    var arrRtn = [],
                        uniqueID = null;
                    _.each(features, function(feature) {
                        if (feature.attributes[field.FieldName] != null) {
                            var val = parseInt(feature.attributes[field.FieldName]).toString();

                            if (uniqueID == null && feature.attributes[field.UniqueValue] != null) {
                                uniqueID = feature.attributes[field.UniqueValue];
                            }
                            
                            if (feature.attributes[field.UniqueValue] != null && uniqueID == feature.attributes[field.UniqueValue]) {
                                //ie., Only allow activities from the first Rec Site.
                                var actObj = _.findWhere(this._activityData.RecreationSiteActivities, {ActivityID: val});
                                //var actObj = (lyrConfig.isRecSites) ?
                                //    _.findWhere(this._activityData.RecreationSiteActivities, {ActivityID: val}):
                                //    _.findWhere(this._activityData.TrailActivities, {ActivityID: val});
                                    
                                if (actObj) {
                                    arrRtn.push({
                                        src: "images/activities/" + actObj.Icon,
                                        title: actObj.ActivityName,
                                        id: actObj.ActivityID
                                    });
                                }                                
                            }
                        }
                    }, this);
                    return arrRtn;                    
                } else {
                    return [];
                }
            },

            getFieldFromFieldName: function(fieldName, curFields) {
                var rtnField = null;
                if (fieldName && curFields && curFields.length>0) {
                    rtnField = _.find(curFields, function(field) {
                        return (field.FieldName && field.FieldName.indexOf(fieldName)>=0);
                    });            
                }
                return rtnField;        
            },
                                 
            //in cases where we have more then 1 URL, it gets the feature of the second object that matches the first featuure unique value
            getFeature: function(lyrConfig, features, identData) {
                var tab = utils.getObjectUsingKey(lyrConfig.key, identData.tabs); 
                var field = _.findWhere(lyrConfig.fields, {UseForUniqueValue: true});
                if (tab && field && tab.dataObject && tab.dataObject.data && tab.dataObject.data.length > 0 && tab.dataObject.value) {
                    var feature = _.find(features, function(fObj) {
                        return (fObj && fObj.attributes && fObj.attributes[field.FieldName] == tab.dataObject.value);
                    });                    
                    if (feature) {
                        return feature;
                    }
                }
                return null; //couldnt actually find a matching feature
            },
                                             
            getFeatureValuesObject: function(lyrConfig, feature) {
                var fieldValueArray = [];
                var idObj = {
                    value: "",
                    title: "",
                    numberValues: 0,
                    dataArray: []
                };
                _.each(lyrConfig.fields, function(field) {
                    var val = feature.attributes[field.FieldName];

                    if (field.DisplayText != null && !field.AppendFieldWithNextField && field.ShowFieldInIdentify && 
                         this.verifyFieldCanBeDisplayed(field, feature, lyrConfig.fields, lyrConfig)) { 

                        var objR =  this.getValueHeaderObject(field, feature, lyrConfig);
                        if (objR && !objR.value && field.AppendFieldWithPreviousField) {
                            //in this case, for example, we possibly have a trail number but not a trail name
                            var fld = _.findWhere(lyrConfig.fields, {FieldName: field.AppendFieldWithPreviousField});
                            if (fld) {
                                objR =  this.getValueHeaderObject(fld, feature, lyrConfig);
                                if (this.verifyFieldAndHeader(objR, fld)) {
                                    idObj.dataArray.push(objR);
                                }
                            }
                        } else if (this.verifyFieldAndHeader(objR, field)) {
                            idObj.dataArray.push(objR); 
                        }
                        if (objR) {
                           val = objR.value; 
                        }                                                                                                                       
                    } 

                    if (field.UseForUniqueValue) {
                        idObj.value = feature.attributes[field.FieldName];
                    } else if (field.UseForTitle) {
                        idObj.title = val;
                    }

                }, this);

                return idObj; 
            },

            getValueHeaderObject: function(field, feature, layerInfo) {
                var value=null,
                    objR = {
                            label: field.DisplayText,
                            key: field.FieldName,
                            dataType: field.DataType,
                            value: null,
                            image: null,
                            isHTML: (field.IsHTML) ? true : false,
                            isHomePage: (field.IsHomePage) ? true : false,
                            anchorObject: (field.AnchorObject) ? field.AnchorObject: null,
                            isActivities: (field.IsActivities) ? true : false,
                            excludeHeaderIfNullVal: false
                    };                  

                if ((feature.attributes[field.FieldName]) || (feature.attributes[field.Fieldname] == null && (field.SetNullValue || field.ShowDateIfNullHandler))) {
                    if (field.IsHomePage && field.URL) {
                        value = this.getURL(feature.attributes[field.FieldName], field.URL); //wilderness
                    } else if (field.IsImage) {
                        objR.image = feature.attributes[field.FieldName]; //ie., wilderness
                    } else if (field.DataType == "double") {
                        value = feature.attributes[field.FieldName].toFixed(2);
                    } else {
                        (feature.attributes[field.FieldName]) ? value = feature.attributes[field.FieldName].toString().trim(): value = "";  
                        
                        if (field.CombineValuesIntoOne) {
                            value = this.combineValuesIntoOne(value, field.CombineValuesIntoOne);
                        }
                        if (field.RemoveValueBeforeAfterSymbol) {
                            value = this.removeValueBeforeAfterSymbol(value, field.RemoveValueBeforeAfterSymbol);
                        }
                        if (field.RemoveFirstCharacter  && field.RemoveFirstCharacter.length>0) {                       
                            value = this.removeFirstCharacter(value, field.RemoveFirstCharacter);
                        }
                        if (typeof field.SetNullValue != 'undefined' && field.SetNullValue && field.SetNullValue.value && (!value || value == "")) {
                            value = field.SetNullValue.value;
                            objR.excludeHeaderIfNullVal = field.SetNullValue.excludeHeaderIfNullVal;
                        }
                        if (field.ReplaceFieldValues) {
                            value = this.replaceFieldValue(value, field.ReplaceFieldValues);
                        }
                        if (field.ReplaceFullFieldValue) {
                            value = this.replaceFullFieldValue(value, field.ReplaceFullFieldValue);
                        }
                        if (field.ReplacePartialString) {
                            value = this.replacePartialStrings(value, ",", field.ReplacePartialString);
                        }
                        if (field.AppendFieldWithPreviousField) {
                            value = this.appendFieldWithPreviousField(value, field, feature, layerInfo);
                        }
                        if (field.ShowSeasonalDates || field.SymbolCodeHandler) {
                            value = this.showSeasonalDatesOrValue(value, field.ShowSeasonalDates, feature, field.SymbolCodeHandler);
                        } 
                        if (field.ShowDateIfNullHandler) {
                            value = this.showDateIfNullValues(value, feature, field.ShowDateIfNullHandler);
                        }
                        if (field.ConvertToTitleCase) {
                            value = this.convertValueToTitleCase(value);
                        } 

                    }
                    if (field.AddToResult!=null && field.AddToResult.length>0) {
                        value += field.AddToResult;
                    }
                    //Param added the below code
                     if (field.ConvertNoneToNull) {
                        value = this.convertValueToNull(value);
                        if (value) {
                            this.displayDescHeader(true);
                        }else{
                             this.displayDescHeader(false);
                        }
                     }                                       
                    //console.log("IdentifyResultsHandler.js: getValueHeaderObject() value= " + value);             

                } 
                objR.value = value;
                return objR;
            },

            getURL: function(value, url) {
                if (value && url) {
                    return url + value;
                } else if (url) {
                    return url;
                }  
                return "";            
            }, 
            
            //code currently only handles 1 GeoRSS layer in the application
            processGeoRSSData: function(identObj) {
                var queryObj =  _.findWhere(config.QueryLayers, {isGeoRSS: true}); //config.QueryLayers  isGeoRSS
                if (queryObj && queryObj.key) {
                    var tab = utils.getObjectUsingKey(queryObj.key, identObj.tabs);
                    if (tab && tab.dataObject && tab.dataObject.graphic && tab.dataObject.data) {
                         //console.log("IdentifyResultsHandler.js: processGeoRSSData() We have data", tab);
                         var idObj = this.getFeatureValuesObject(queryObj, tab.dataObject.graphic);
                         if (idObj) {
                             this.setIdentifyDataObject(identObj, queryObj, idObj, null, false);
                         }          
                    } 
                }                
            },
                                                                        
            processQueryResults: function(map, results, identObj, hasGData) {
                //console.log("IdentifyResultsHandler.js: processQueryResult() beginning ", results);
                identObj.hasData = (hasGData) ? true : false;  //could have graphics data such as yonder
                
                if (results && results.length > 0 && this._currentLayerArray.length == results.length) {                   
                    var keys = [];
                    
                    //Good use of an underscore method here
                    _.each(results, function(result, i) {
                        var lyrConfig = this._currentLayerArray[i],
                            idObj = {},
                            feature = null,
                            secondFeature = false;
                            
                        if (result.features && result.features.length > 0) {
                            if (!identObj.hasData) {
                                identObj.hasData = true;
                            }
                            if (keys.indexOf(lyrConfig.key) > -1) {
                               feature = this.getFeature(lyrConfig, result.features, identObj); 
                               secondFeature = true;
                            } else {
                                keys.push(lyrConfig.key);
                                feature = result.features[0];
                            }                            
                            if (feature) {
                                idObj = this.getFeatureValuesObject(lyrConfig, feature); //we are only processing one feature
                            }                            
                        } 
                        if (feature && idObj) {
                            this.setIdentifyDataObject(identObj, lyrConfig, idObj, result.features, secondFeature); 
                        }                                               
                    }, this);                   
                }
                if (identObj.hasData) {
                    this.processGeoRSSData(identObj);
                }          
            },

            removeFirstCharacter: function(value, remove) {
                if (value!=null &&  remove!=null && remove.length>0) {
                    //alert("removeFirstCharacter() value before = " + value);
                    _.each(remove, function(cV) {                    
                        if (cV!=null  && value.substring(0,1)==cV) {
                            value = value.substring(1);
                        }
                    });                 
                }
                return value;
            }, 

            removeValueBeforeAfterSymbol: function(value, remove) {
                if (value!=null &&  remove!=null && remove.length>0) {
                    _.each(remove, function(cV) {                    
                        if (cV!=null && cV.Symbol && value.indexOf(cV.Symbol)>=0) {
                            (cV.RemoveBefore) ? value = value.substring(value.indexOf(cV.Symbol)+1, value.length).trim(): value = value.substring(0, value.indexOf(cV.Symbol)).trim();
                        }
                    }); 
                }
                return value;
            },

            replaceFullFieldValue: function(value, arrValues) {
                if (value != null && arrValues != null && arrValues.length > 0) {
                    var arrObj = utils.getObjectUsingKey(value, arrValues);
                    if (arrObj) {
                        return arrObj.value;
                    }
                }
                return value;
            },
                             
            //TODO: I think we might want to replace this with replaceFullFieldValue. once we switch config to using array of objects instead.
            replaceFieldValue: function(value, replaceFieldValue) {
                if (value != null && replaceFieldValue != null && replaceFieldValue.length > 0) {
                    _.each(replaceFieldValue, function(fV) {
                        if (fV != null && fV.length == 2) {
                            value = value.replace(fV[0], fV[1]);
                        }
                    });                 
                }
                return value;
            },
            
            replacePartialStrings: function(value, splitter, arrStrings) {
                if (arrStrings && arrStrings.length > 0) {
                    _.each(arrStrings, function(arrVal) {
                        if (arrVal && arrVal.length == 2) {
                            if (value.indexOf(arrVal[0]) > -1) {
                                value = value.replace(arrVal[0], arrVal[1]);
                            }
                        } 
                    });
                }
                return value;
            },
                                
            setIdentifyDataObject: function(identData, lyrConfig, idObj, features, secondFeature) {
                var tab = utils.getObjectUsingKey(lyrConfig.key, identData.tabs);
                 
                if (tab && tab.dataObject && idObj && idObj.dataArray) {
                    if (!secondFeature) {
                        tab.dataObject.data = [];
                    }

                    if (idObj.dataArray.length > 0) {
                        _.each(idObj.dataArray, function(dO) {
                            if (!secondFeature || (secondFeature && dO.label && !_.findWhere(tab.dataObject.data, {label: dO.label}))) {
                                tab.dataObject.data.push(dO);                              
                            }                            
                        });
                        tab.dataObject.numberValues = tab.dataObject.data.length;                        
                    }
                    if (!secondFeature) {
                        tab.dataObject.title = idObj.title;
                        tab.dataObject.value = idObj.value;                        
                    } else {
                        tab.dataObject.data = this.fixDataFieldOrder(lyrConfig, tab.dataObject.data);
                    }
                    if (lyrConfig.isRecSites) {
                        //setup the activities
                        tab.dataObject.activities = this.getActivities(lyrConfig, features);
                    } else if (lyrConfig.isForest) {                       
                        this.fixRoadAndTrailForestName(identData, idObj.title);
                    }
                } 
                //console.log("IdentifyResultsHandler.js: setIdentifyDataObject() lyrConfig.key= " + lyrConfig.key + " tab=", tab);               
            },
            
            //For non-motorized trails, our Open values need to be set to 01/01-12/31 if the restricted and managed fields are null
            //and of course, our dataReadinessLevel is set to "TrailNFS_MGMT
            showDateIfNullValues: function(value, feature, showDateIfNullHandler) {
                if (showDateIfNullHandler.nullFields && showDateIfNullHandler.nullFields.length > 0 && (!value || (value && value.toString().trim().length == 0))) {
                    var rtnValue = _.find(showDateIfNullHandler.nullFields, function(field) {
                        var val = feature.attributes[field];
                        return (val && val.toString().trim().length > 0);
                    });
                    if (typeof rtnValue == 'undefined' || !rtnValue) {
                       return showDateIfNullHandler.date; 
                    }                      
                }
                return value;
            },
            
            showSeasonalDatesOrValue: function(value, bDoSeasonal, feature, symbolCodeHandler) {
                if (value && value.toString().trim().length > 0) {
                    if (typeof symbolCodeHandler != 'undefined' && symbolCodeHandler && symbolCodeHandler.codes && symbolCodeHandler.field) {
                        var symb = feature.attributes[symbolCodeHandler.field];
                        if (symb && symbolCodeHandler.codes.indexOf(symb) > -1) {
                            //we have one of our codes => must show
                            return value; 
                        }
                    }
                    
                    //otherwise, handle the seasonal dates
                    if (typeof bDoSeasonal != 'undefined' && bDoSeasonal && value && value == "01/01-12/31") {
                        return "";
                    }                     
                }

                return value;
            },
                     
                  
            verifyDataReadiness: function(field, feature, curFields, layerInfo) {
                var doField = (field.DataReadinessLevel && layerInfo.DataReadinessObject && layerInfo.DataReadinessObject.FieldName) ? false: true;
                if (!doField) {
                    //For Trails, we have to check the data readiness level to make sure
                    var featReadiness = feature.attributes[layerInfo.DataReadinessObject.FieldName];
                    if (featReadiness) {
                        doField = this.verifyDataReadinessValue(featReadiness, field.DataReadinessLevel, layerInfo.DataReadinessObject.Levels);
                    } else {
                        doField = true;
                    }               
                }           
                return doField;
            },
        
            //for trails, we need to make sure the field readiness value is ATLEAST set to the feature readiness value
            verifyDataReadinessValue: function(featReadiness, fieldReadiness, arrLevels) {
                var doField = (featReadiness && fieldReadiness && arrLevels &&  arrLevels.length > 0) ? false : true;
                if (!doField && featReadiness.toLowerCase() == fieldReadiness.toLowerCase()) {
                    doField = true; //current field is at feature field=> skip array
                }
                if (!doField) {
                    var featInd = -1,
                        fieldInd = -1,
                        i = 0;
                    for (i = 0; i < arrLevels.length; i++) {
                        if (featReadiness.toLowerCase()==arrLevels[i].toLowerCase()) {
                            featInd = i;
                        }
                        if (fieldReadiness.toLowerCase()==arrLevels[i].toLowerCase()) {
                            fieldInd = i;
                        }
                        if (featInd >= 0 && fieldInd >= 0) {
                            if (fieldInd <= featInd) {
                                doField = true; //field readiness lt feat readiness
                            }
                            break;
                        }                   
                    }   
                }
                return doField;
            },
            
            //occasionally we want to include the header if no data
            //Or make the Header the actual Value (Weather event)
            //I also handle the images here too (ie., Wilderness images)
            verifyFieldAndHeader: function(objR, field) {
               if ((objR && objR.value && objR.value.toString() != "")  || ((objR && (!objR.value || objR.value == "")) && field.IncludeHeaderIfNoData)) {
                   if ((!field.IncludeFieldNameInIdentify) || (field.SetNullValue && objR.excludeHeaderIfNullVal)) {
                       objR.label = ""; //ie. ACCESSIBILITY in Trails
                   }  else if (field.ApplyFieldValueToHeader && objR.value && objR.value.toString() != "") {
                       objR.label = objR.value ; //ie. Weather event.
                       objR.value = "";
                   }                                   
                   return true;
               } else if (objR && objR.image && field.IsImage) {
                   return true;
               } else {
                   return false;
               }
            },             

            verifyFieldCanBeDisplayed: function(field, feature, curFields, layerInfo) {           
                var doField = this.verifyDataReadiness(field, feature, curFields, layerInfo); //for trails specifically
                if (doField) {
                    if (field.OnlyShowIfFieldIsSet && field.OnlyShowIfFieldIsSet.Field && field.OnlyShowIfFieldIsSet.Value) {
                        //ie., if Accessibility_Status is set to Accessible, then we show the current field value
                        doField = false;
                        var fld = this.getFieldFromFieldName(field.OnlyShowIfFieldIsSet.Field, curFields);
                        if (fld) {
                            var valueObj = this.getValueHeaderObject(fld, feature, layerInfo);
                            //console.log("IdentifyResultsHandler.js: verifyFieldCanBeDisplayed() value=" + value + " field.OnlyShowIfFieldIsSet.Value=" + field.OnlyShowIfFieldIsSet.Value);
                            if (valueObj && valueObj.value && valueObj.value == field.OnlyShowIfFieldIsSet.Value) {
                                //console.log("IdentifyResultsHandler.js: verifyFieldCanBeDisplayed() valueObj.value=" + valueObj.value + " doField=true");
                                doField = true;
                            }
                        }               
                    }               
                }   
                return doField;
            }
                                         
           });
        return qry;
    });
