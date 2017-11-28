/**
 * @author Karen Robine
 */

(function () {
    "use strict";

    define([
        'angular',
        'underscore',
        'esri/tasks/PrintTask',
        'esri/tasks/PrintParameters',
        'esri/tasks/PrintTemplate',        
        'js/config',
        'js/errorMsgs',
        'js/helpers/utils'
    ], function (angular, _, PrintTask, PrintParameters, PrintTemplate, config, errorMsgs, utils) {
 
        function getClusterGraphicLayerIds() {
            var arrG = [];
            _.each(config.SideBarLayers, function(layer) {               
                if (layer && layer.clusterOptions && layer.clusterOptions.id) {                    
                    arrG.push(layer.clusterOptions.id);
                } else if (layer && layer.key && layer.excludeInPDF) {
                    arrG.push(layer.key);
                }             
            });
            var featContent = _.findWhere(config.SideBarLayers, {isFeatured: true});
            if (featContent && featContent.layers) {
                _.each(featContent.layers, function(layer) {
                    if (layer.options && layer.options.id && arrG.indexOf(layer.options.id) < 0) {                       
                        arrG.push(layer.options.id);
                    }                   
                });                
            }
            _.each(config.queryPanels.activityOptionsArray, function(activity) {
                 _.each(activity.layers, function(layer) {  
                        if (layer && layer.key && arrG.indexOf(layer.key) < 0) {
                            arrG.push(layer.key);
                        } 
                 });               
            });
                        
            return arrG;            
        }
        
        function getExtraParameters(title, notes, selItem, map, searchData) {
            var legendInfo = "";
            if (selItem && typeof selItem.pdfLegendKey == 'number' && selItem.pdfLegendKey > -1 && map.getLevel() > config.Print.routeActivityMapLevel){
                legendInfo = selItem.pdfLegendKey.toString() + ":" + selItem.title + ";";
            } 
            //TODO: Possibly add in the future.
            //if (searchData && searchData.searchText && searchData.searchText.length > 0) {
            //    legendInfo += config.GenericSearch.pdfLegendKey.toString() + ":" + searchData.searchText + ";";  //add any generic searches
            //}
            return {
                Notes: notes, 
                Map_Title: title,
                Legend: legendInfo
            };
        } 

        function getPrintTask() {
            var pt = (config.Print.isAsync) ? new PrintTask(config.Print.URL, true) : new PrintTask(config.Print.URL);
            return pt;
        }
        
        function getPrintParameters(title, notes, map, selItem, searchData) {
            var param = new PrintParameters();
            param.map = map;
            param.template = getPrintTemplate();
            param.extraParameters = getExtraParameters(title, notes, selItem, map, searchData); 
            return param;
        }
        
        function getPrintTemplate() {
            var template = new PrintTemplate();
            template.format = config.Print.format;
            template.layout = config.Print.layout;
            return template;
        }      
        
        function removeAllGraphics(map, params, printTask) {
           var printDef = printTask._getPrintDefinition(map, params);
           var gLayers = getClusterGraphicLayerIds();
           if (printDef.operationalLayers && printDef.operationalLayers.length > 0 && gLayers && gLayers.length > 0) {
                _.each(gLayers, function(id) {
                    if (id && id.length > 0) {
                        var ol = printDef.operationalLayers;
                        _.find(ol, function(item, index) {
                            if (item && index > -1 && item.id && item.id == id) {
                                printDef.operationalLayers.splice(index, 1);                         
                            }
                        });                        
                    }   
                });                
           }              
           printDef.mapOptions['scale'] = map.getScale();
           printDef['exportOptions'] = {
                "dpi" : config.Print.dpi,
                "outputSize" :  config.Print.outputSize
           };              
           return printDef;              
        }

                       
        function PrintService($q, $log) {

            return {

                cancelJob: function(pTask, jobId) {
                    var deferred = $q.defer();                  
                    //https://developers.arcgis.com/javascript/jsapi/geoprocessor-amd.html#canceljob
                    pTask.printGp.cancelJob(jobId).then(
                        function (results) {
                            deferred.resolve(results);
                        },
                        function (error) {
                            $log.error("PrintService.js: cancelJob() Error follows: ", error);
                            deferred.reject(error);
                        });
                    return deferred.promise;                                     
                },
                                
                //executePrint is used for synchronous processing
                executePrint: function(title, notes, map) {
                    var deferred = $q.defer();
                    var param = getPrintParameters(title, notes, map);
                    var pTask = getPrintTask();
                    if (!config.Print.doGraphics) {
                        var printDef = removeAllGraphics(map, param, pTask);
                        param.extraParameters.Web_Map_as_JSON = JSON.stringify(printDef);            
                    }                    
                    pTask.execute(param).then(
                        function (results) {
                            deferred.resolve(results);
                        },
                        function (error) {
                            $log.error("PrintService.js: executePrint() Error follows: ", error);
                            deferred.reject(error);
                        });
                    return deferred.promise;                    
                },
                                
                getPrintTask: function() {
                    return getPrintTask();
                },
                
                getResultData: function(pTask, result) {
                    var deferred = $q.defer();                  
                    //https://developers.arcgis.com/javascript/jsapi/geoprocessor-amd.html#getresultdata
                    pTask.printGp.getResultData(result.jobId, "Output_File").then(
                        function (results) {
                            deferred.resolve(results);
                        },
                        function (error) {
                            //$log.error("PrintService.js: getResultData() Error follows: ", error);
                            deferred.reject(error);
                        });
                    return deferred.promise;                                     
                },
                
                //https://developers.arcgis.com/javascript/jsapi/geoprocessor-amd.html#submitjob
                submitJob: function(title, notes, map, pTask, selItem, searchData) {
                    var deferred = $q.defer();
                    var param = getPrintParameters(title, notes, map, selItem, searchData);

                    if (!config.Print.doGraphics) {
                        var printDef = removeAllGraphics(map, param, pTask);
                        param.extraParameters.Web_Map_as_JSON = JSON.stringify(printDef);            
                    }
                    if (config.Print.updateDelay) {
                        pTask.printGp.setUpdateDelay(config.Print.updateDelay); //https://developers.arcgis.com/javascript/3/jsapi/geoprocessor-amd.html#setupdatedelay
                    }
                                        
                    pTask.printGp.submitJob(param.extraParameters).then(
                        function (results) {
                            //$log.info("PrintService: submitJob() results= ", results);
                            deferred.resolve(results);
                        },
                        function (error) {
                            //$log.error("PrintService: submitJob() error= ", error);
                            deferred.reject(error);
                        },
                        function (status) {
                            //$log.info("PrintService.js: submitJob() status follows: ", status); //this happens alot
                            deferred.notify(status);
                        });
                    return deferred.promise;                    
                }                
            };               
        }

        function init(App) {
            App.factory('PrintSrvc', ['$q', '$log', PrintService]);
            return PrintService;
        }

        return { start: init };

    });

}).call(this);