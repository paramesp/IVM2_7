/**
 * @author Karen Robine
 */

(function() {"use strict";

    define(['angular', 
            'js/config',            
            'js/helpers/utils',
            'js/errorMsgs'             
            ], function(angular, config, utils, errorMsgs) {

        //************************************************************************
        //  PDF Controller
        //************************************************************************
        
        function PDFController($scope, $log, $modalInstance, $window, $sce, modalObject, PrintSrvc) {

            $scope.modalObject = modalObject;
            $scope.modalObject.type = "pdf";
            
            if (!$scope.modalObject.printObject) {
                $scope.modalObject.printObject = {
                    currentStatus: utils.getObjectUsingKey("go", config.Print.statusList),
                    resultURL: "",
                    errorMessage: "",
                    errorMessageAlert: "",
                    title: "",
                    notes: "",
                    printTask: null,
                    jobId: ""                   
                };
            }

            //$log.info("PDFController.js: $scope.printObject= ", $scope.printObject);
            $scope.$on('modal.closing', function(event, reason, closed) {
                //handle escape key closing, or clicking on a map
                if (typeof reason != 'undefined' && typeof reason == 'string' && (reason.indexOf("escape") > -1 || reason.indexOf("backdrop") > -1)) {
                    event.preventDefault();
                    $modalInstance.close($scope.modalObject); //passes data back                        
                }
            });
            
            //I dont think cancel should reset.
            $scope.cancel = function () {
                $modalInstance.close($scope.modalObject);
            };
            
            $scope.clearPrintTask = function() {
                if ($scope.modalObject.printObject) {
                    $scope.modalObject.printObject.printTask = null;
                    $scope.modalObject.printObject.jobId = "";
                }
            };
            
            $scope.doPrint = function() {                               
                $scope.modalObject.printObject.printTask = PrintSrvc.getPrintTask();                
                PrintSrvc.submitJob($scope.modalObject.printObject.title, $scope.modalObject.printObject.notes, $scope.modalObject.map, $scope.modalObject.printObject.printTask, $scope.modalObject.selItem, $scope.modalObject.searchData)
                    .then(function(results){
                        if (results && $scope.modalObject.printObject.currentStatus && $scope.modalObject.printObject.currentStatus.key != "go") {
                            $log.info("PDFController.js: doPrint() We have PDF Results. Another request will need to be made to obtain the actual PDF: = ", results);
                            PrintSrvc.getResultData($scope.modalObject.printObject.printTask, results)
                                .then(function(outputFile) {
                                    $log.info("PDFController.js: doPrint(): We should have the actual PDF available for download: ", outputFile);
                                    if (outputFile && outputFile.value && outputFile.value.url) {
                                        $scope.modalObject.printObject.resultURL = outputFile.value.url;
                                        $scope.modalObject.printObject.currentStatus = utils.getObjectUsingKey("success", config.Print.statusList);
                                        $scope.openWindow(); 
                                        $scope.clearPrintTask();   
                                    }                                    
                                }, function(err) {
                                    $log.error("PDFController.js: doPrint() Problem accessing generated PDF: ERROR= ", err);
                                    if (err && err.message) {                                        
                                        $scope.modalObject.printObject.errorMessage = $scope.modalObject.printObject.errorMessageAlert = err.message;
                                        $scope.modalObject.printObject.currentStatus = utils.getObjectUsingKey("error", config.Print.statusList);
                                        $scope.clearPrintTask();                                        
                                    }                                    
                                });
                        }
                    }, function(error) {
                        $log.error("PDFController.js: doPrint() Problem generating PDF: ERROR= ", error);
                        if (error && error.message) {                             
                            $scope.modalObject.printObject.errorMessage = errorMsgs.Print.getError;
                            $scope.modalObject.printObject.errorMessageAlert = errorMsgs.DataError;
                            $scope.modalObject.printObject.currentStatus = utils.getObjectUsingKey("error", config.Print.statusList);
                            $scope.clearPrintTask();  
                        }                        
                    }, function(status) {
                        //$log.info("PDFController.js: doPrint() status= ", status);
                        if (status && status.jobStatus == "esriJobExecuting" && status.jobId && $scope.modalObject.printObject.jobId.length == 0) {
                            $scope.modalObject.printObject.jobId = status.jobId;
                        }
                    }                    
                );                                                            
            };
            
            $scope.ok = function () {
                if ($scope.modalObject.printObject.currentStatus.key=="success") {
                    $scope.openWindow();
                } else if ($scope.modalObject.printObject.currentStatus.key == "go") {
                    $scope.modalObject.printObject.currentStatus = utils.getObjectUsingKey("processing", config.Print.statusList);
                    $scope.doPrint();                     
                } else if ($scope.modalObject.printObject.currentStatus.key == "processing")  {
                    alert(errorMsgs.Print.PDFBeingGenerated);    
                } else if ($scope.modalObject.printObject.currentStatus.key == "error") {
                    alert($scope.modalObject.printObject.errorMessageAlert);
                }
            };
            
            $scope.openWindow = function() {
                if ($scope.modalObject.printObject.resultURL && $scope.modalObject.printObject.resultURL.length > 0) {
                    $window.open($scope.modalObject.printObject.resultURL, "_blank");
                }                   
            };
           
            $scope.reset = function() {
                $scope.modalObject.printObject.currentStatus = utils.getObjectUsingKey("go", config.Print.statusList);
                $scope.modalObject.printObject.resultURL = $scope.modalObject.printObject.errorMessage = $scope.modalObject.printObject.errorMessageAlert = $scope.modalObject.printObject.title = $scope.modalObject.printObject.notes = "";
                if ($scope.modalObject.printObject.printTask && $scope.modalObject.printObject.jobId && $scope.modalObject.printObject.jobId.length > 0) {
                    PrintSrvc.cancelJob($scope.modalObject.printObject.printTask, $scope.modalObject.printObject.jobId)
                        .then(function(info) {
                            $log.info("PDFController.js: reset(). The job has been cancelled: jobStatus= ", info); 
                            $scope.modalObject.printObject.printTask = null;                               
                        }, function(err) {
                            //dont do anything. we couldnt cancel the job
                            $scope.modalObject.printObject.printTask = null;                                   
                        });                    
                }
            };
            
            $scope.toTrusted = function (value) {
                return $sce.trustAsHtml(value);
            };           
        }

        function init(App) {
            App.controller('PDFCtrl', ['$scope', '$log', '$modalInstance', '$window', '$sce', 'modalObject', 'PrintSrvc', PDFController]);
            return PDFController;
        }

        return {
            start : init
        };

    });

}).call(this); 