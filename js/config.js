/**
 * @author karen@robinegis.com (Karen Robine)
 */
    
define(['angular'
], function (angular) {             
        'use strict'; 
                   
        return {
            //called from NavBarController after it retrieves the json file
            replaceURLs: function(location) {
               this.doReplace(this, "$$$", location);
            },
            
            //uses recursion to replace the $$$ with the actual service location
            doReplace: function(confObj, symbol, replaceSt) {
                //http://stackoverflow.com/questions/31964563/updating-outer-variable-inside-angular-foreach
                angular.forEach(confObj, function(value, key) {
                    if (typeof value != 'undefined') {
                        if (typeof value == 'string' && value.indexOf(symbol) > -1) {
                            confObj[key] = value.replace(symbol, replaceSt);
                        } else if (typeof value == 'object') {
                            this.doReplace(value, symbol, replaceSt);
                        } 
                    } 
                }, this);                
            },
            
            DefaultExtent: "-19495124,4041894,-5054029,8522938",  //"-19627207,-11549544,20682623,14358327"
            DisableMapNavigation: {EnablePan: true, EnableZoom: true, EnableClick: false},                           
            AddScalebar: true,
            Windows: [
                {
                    key: "help",
                    URL: "//www.fs.fed.us/visit/about-visitor-map"
                },
                {
                    key: "helpFeedback",
                    URL: "//www.fs.fed.us/visit/ivm-feedback"
                },
                {
                    key: "survey",
                    URL: "https://preview-survey.foresee.com/f/nhDWm8h6Ie"
                }               
            ], 
            DeviceTypes: {
                smartPhoneMaxWidth: 767               
            },            
            JsonFileLocations: [ /* set up file location of JSON file depending upon the domain. Necessary since im running this on various machines */
                {key: "www.fs.fed.us", location: "//www.fs.fed.us//ivm//json//"},
                {key: "staging-www.fs.fed.us", location: "//staging-www.fs.fed.us//ivm//json//"},
                {key: "originwww.fs.fed.us", location: "//originwww.fs.fed.us//ivm//json//"},
                {key:"origin-fs.fs.usda.gov",location: "//www.fs.fed.us//ivm//json//"},
                {key:"ppdfs3.ess.usda.gov",location: "//www.fs.fed.us//ivm//json//"},
                {key:"devfs3.ess.usda.gov",location: "//www.fs.fed.us//ivm//json//"},
                {key: "localhost", location: "json//"},
                {key: "127.0.0.1", location: "json//"}
            ],
            CorsServers: ["apps.fs.usda.gov","origin-fs.fs.usda.gov","ppdfs3.ess.usda.gov","devfs3.ess.usda.gov","localhost"], //apps.fs.fed.us
            MapServices: {
                fileName: "MapSource.json",
                folderName: {
                    oldFolder: "json",
                    newFolder: "json-instant"
                },
                initialKey: "arcx", //if problems with fileName, use this
                mapServiceDomains: [ //array of possible domain-service names. This is concatenated to service names listed below
                    {key: "arcx", location: "https://apps.fs.usda.gov/arcx"},
                    {key: "fsgisx02", location: "https://apps.fs.usda.gov/fsgisx02"},
                    {key: "ags", location: "https://ags.usfs-poc.com/arcgis"}
                    //{key: "test", location: "https://apps.fs.usda.gov/junk"}
                ]               
            },                       
            Proxy: {
                urlPrefix: "livefeeds.arcgis.com", 
                //proxyUrl: "//www.fs.fed.us/ivm/rp/proxy.php"  //http://sxgstcgis001.ds.fs.fed.us/IVMProxy/proxy.jsp  http://staging-www.fs.fed.us/ivm/rp/proxy.php
                proxyUrl: "{0}/ivm/rp/proxy.php",
                proxyLocs: [
                    {key: "originwww.fs.fed.us", location: "//www.fs.fed.us"},
                    {key: "staging-www.fs.fed.us", location: "//originwww.fs.fed.us"}
                ],
                defaultProxyLoc: "//www.fs.fed.us"
            },                                     
            StateForestQuery: {
                fileName: "StateAndForestsExtents.json", 
                stateKey: "States",
                forestKey: "NationalForests",
                stateForestKey: "StateForests",               
                forestMessage: {
                    hasData: "Select a Forest",
                    noData:"No forests within the State"
                }
            },

            //IdentifyTolerance;  Builds an extent around the mappoint the tolerance distance. used for Identify
            //ToleranceMobile:  Uses bigger tolerance cause hard to hit the Rec Sites On Mobile devices
            //Tolerance looks to see if the Min and Max Scales are between (inclusive) current map scale. Uses either browser or mobile version if so
            Identify: {
                layerId: "gLayer", 
                graphicsId: "identify",
                size: [280,400],
                activityJSON: "Activities.json",              
                markerSymbol:     /*   http://help.arcgis.com/en/arcgisserver/10.0/apis/rest/symbol.html#sms */
                    {
                        type: "esriSMS",
                        style: "esriSMSCross",
                        color: [0,20,255,180],  
                        size: 12,
                        outline: {
                            color: [0,20,255,180],
                            width: 2
                        }
                    },             
                identifyTolerances:
                    [
                        {
                            MinScale: 150000000,
                            MaxScale: 36978595,
                            ToleranceMobile: 50000,
                            ToleranceBrowser: 45000,
                            ToleranceGraphicsBrowser: 50000, 
                            ToleranceGraphicsMobile: 50000 
                        },
                        {
                            MinScale: 36978595,
                            MaxScale: 18489297,
                            ToleranceMobile: 35000, /* was 35000 */
                            ToleranceBrowser: 29000,
                            ToleranceGraphicsBrowser: 50000, 
                            ToleranceGraphicsMobile: 50000 
                        },                        
                        {
                            MinScale: 18489297,
                            MaxScale: 9244648,
                            ToleranceMobile: 18000,
                            ToleranceBrowser: 10000, //15000: Lake Tahoe Management. but hard to click on wilderness points
                            ToleranceGraphicsBrowser: 20000,
                            ToleranceGraphicsMobile: 30000  /* was 10000 */
                        },  
                        {
                            MinScale: 9244648,
                            MaxScale: 4622324,
                            ToleranceMobile: 8500,
                            ToleranceBrowser: 4500,  //7500: Lake Tahoe Management but hard to click on wilderness points
                            ToleranceGraphicsBrowser: 10000, /* Tongass and Chugach */
                            ToleranceGraphicsMobile: 10000  /* changed 1022 */
                        },                                                
                        {
                            MinScale: 4622324,
                            MaxScale: 1155582,
                            ToleranceMobile: 4500,
                            ToleranceBrowser: 4000, /* Last wilderness points extent */
                            ToleranceGraphicsBrowser: 4000,
                            ToleranceGraphicsMobile: 5300 /* changed 1022 */
                        }, 
                        {
                            MinScale: 1155582,
                            MaxScale: 578791,
                            ToleranceMobile: 1200,
                            ToleranceBrowser: 800,
                            ToleranceGraphicsBrowser: 3000,
                            ToleranceGraphicsMobile: 3500 /* added 1023 */
                        },                                                            
                        {
                            MinScale: 578791,
                            MaxScale: 288894,
                            ToleranceMobile: 1200, /* first scale that rec sites show up. this was hard to select on an ipad: updated 1023 */
                            ToleranceBrowser: 700,
                            ToleranceGraphicsBrowser: 1200,
                            ToleranceGraphicsMobile: 1400
                        },
                        {
                            MinScale: 288894,
                            MaxScale: 72224,
                            ToleranceMobile: 500,
                            ToleranceBrowser: 300,
                            ToleranceGraphicsBrowser: 500,
                            ToleranceGraphicsMobile: 500
                        },
                        {
                            MinScale: 72224,
                            MaxScale: 36112,
                            ToleranceMobile: 230,
                            ToleranceBrowser: 200,
                            ToleranceGraphicsBrowser: 360,
                            ToleranceGraphicsMobile: 360
                        },                                                  
                        {
                            MinScale: 36112,
                            MaxScale: 18056,
                            ToleranceMobile: 200,
                            ToleranceBrowser: 100,
                            ToleranceGraphicsBrowser: 250, /* made this slightly higher cause could click on cluster and have yonder items at same loc. */
                            ToleranceGraphicsMobile: 250
                        },
                        {
                            MinScale: 18056,
                            MaxScale: 9028,
                            ToleranceMobile: 100,
                            ToleranceBrowser: 50,
                            ToleranceGraphicsBrowser: 50,
                            ToleranceGraphicsMobile: 50
                        },                  
                        {
                            MinScale: 9028,
                            MaxScale: 1129,
                            ToleranceMobile: 40,
                            ToleranceBrowser: 20,
                            ToleranceGraphicsBrowser: 40,
                            ToleranceGraphicsMobile: 40
                        },
                        {
                            MinScale: 1129,
                            MaxScale: 0,
                            ToleranceMobile: 40,
                            ToleranceBrowser: 20,
                            ToleranceGraphicsBrowser: 10,
                            ToleranceGraphicsMobile: 10
                        }                                                       
                    ]                
            },

            Print: {
                URL: "$$$/rest/services/wo_nfs_gstc/GSTC_IVMPrintGeoPDF_Asynchronous_01/GPServer/IVMPrintGeoPDF",  
                isAsync: true,
                format: "PDF",
                layout: "8.5x11",
                doGraphics: false,
                updateDelay: 5000,
                statusList: [
                    {key: "go", buttonClass: "btn-exploreGo", iconClass: "tk-caret-right", text: "Go!", showClear: false, titleMsg: "Click the Go button to generate a PDF"},
                    {key: "processing", buttonClass: "btn-exploreGo btn-warning", iconClass: "", text: "Processing", showClear: true, titleMsg: "A PDF is being generated"},
                    {key: "success", buttonClass: "btn-exploreGo btn-success", iconClass: "tk-check", text: "View PDF", showClear: true, titleMsg: "Click the View PDF button to open the generated PDF"},
                    {key: "error", buttonClass: "btn-exploreGo btn-danger", iconClass: "tk-alert-fill", text: "Error!", showClear: true, titleMsg: "There was an error when generating the PDF"}                   
                ],
                dpi: 96,
                outputSize: [800, 1100],
                routeActivityMapLevel: 10
            },
            
            Share: {
                //http://stackoverflow.com/questions/9403442/how-to-use-keywords-include-ampersand-in-facebook-search-api
                URLExt: "?minx={0}%26miny={1}%26maxx={2}%26maxy={3}%26exploremenu=no",
                URLExtTextbox: "?minx={0}&miny={1}&maxx={2}&maxy={3}&exploremenu=no",
                URLExtAddin:"%26activity=",
                URLExtAddinTextBox:"&activity=",
             
                shareListNormal: [
                    {key: "facebook",
                     text: "FACEBOOK",
                     url: "https://facebook.com/sharer.php?u={0}",
                     icon: "tk-facebook facebook activity",
                     isMail: false
                    },
                    {key: "twitter",
                     text: "TWITTER",
                     url: "http://twitter.com/share?text=Interactive%20Visitor%20Map%20&via=USFS&url={0}",
                     icon: "tk-twitter twitter activity",
                     isMail: false
                    },
                    {key: "email",  //http://stackoverflow.com/questions/19493759/how-to-invoke-mailto-in-angularjs-controller
                     text: "EMAIL",
                     url: "mailto:%20?subject=Interactive%20Visitor%20Map&body={0}",
                     icon: "tk-email fsbrown activity",
                     isMail: true
                    }                                                          
                ],
                shareListExtent: [
                    {key: "facebookext",
                     text: "FACEBOOK",
                     url: "https://facebook.com/sharer.php?u={0}",
                     icon: "tk-facebook facebook activity",
                     isMail: false
                    }, 
                    {key: "twitterext",
                     text: "TWITTER",
                     url: "http://twitter.com/share?text=Interactive%20Visitor%20Map%20&via=USFS&url={0}",
                     icon: "tk-twitter twitter activity",
                     isMail: false
                    },
                    {key: "emailext",  //http://stackoverflow.com/questions/19493759/how-to-invoke-mailto-in-angularjs-controller
                     text: "EMAIL",
                     url: "mailto:%20?subject=Interactive%20Visitor%20Map&body={0}",
                     icon: "tk-email fsbrown activity",
                     isMail: true
                    }                                                           
                ]              
            },
            
            LocateMe: {
                key: "gLayer",
                geolocatedImage: "images//marker-red.svg",
                size: 40
            }, 
                       
            GenericSearch: {                 
                type: "roadsQuery", 
                pdfLegendKey: 8,               
                data: null, //full data (zoomed out)
                geocodeParameters: {
                   typeaheadMinLength: 1,
                   pointZoomScale: 12,
                   extentDistance: 5000,
                   singlePointMinExtent: 10000,
                   viewAllResults: {
                       text: "<strong>View All Results</strong>",
                       textNonHtml: "View All Results",
                       didTrustAsHtml: false,
                       image: "images//icn-showAll.png",
                       addViewAllResults : true
                   }
                },
                geocodeGraphicLayer: {
                        id: "geocodeGLayer", 
                        minScale: 288896,
                        maxScale: 0,
                        isClustered: false
                },
                geocodeLayers: [
                    {
                        url: "https://apps.fs.usda.gov/arcx/rest/services/wo_nfs_gstc/USFSRecreationOpportunitiesLocator/GeocodeServer/", //https://apps.fs.usda.gov/arcx/rest/services/wo_nfs_gstc/USFSRecreationOpportunitiesLocator/GeocodeServer/
                        parameters: "suggest?f=json&text={0}&maxSuggestions={1}",
                        paramGetAddress: "findAddressCandidates?SingleLine={0}&magicKey={1}&f=json&outSR=%7B%22wkid%22%3A102100%7D&maxLocations=1",
                        maxSuggestions: 3,
                        image: "images//icn-recSite.png",
                        zoomType: "point",
                        markerSymbol:     
                            {
                                type: "esriPMS",
                                url: "images//recSiteMarker.svg",
                                height: 19,
                                width: 19,
                                yoffset: 0,
                                angle: 0
                            }                                               
                    },
                    {
                        url: "https://apps.fs.usda.gov/arcx/rest/services/wo_nfs_gstc/USFSTrailsLocator/GeocodeServer/",
                        parameters: "suggest?f=json&text={0}&maxSuggestions={1}",
                        paramGetAddress: "findAddressCandidates?SingleLine={0}&magicKey={1}&f=json&outSR=%7B%22wkid%22%3A102100%7D&maxLocations=1",
                        maxSuggestions: 3,
                        image: "images//icn-trail.png",
                        zoomType: "point",
                        markerSymbol:     
                            { //http://help.arcgis.com/en/arcgisserver/10.0/apis/rest/symbol.html#pms
                                type: "esriPMS",
                                url: "images//trail-marker.svg",
                                height: 19,
                                width: 19,
                                yoffset: 9,
                                angle: 0
                            }                                                 
                    }, 
                    {
                        url: "https://apps.fs.usda.gov/arcx/rest/services/wo_nfs_gstc/USFSRoadsLocator/GeocodeServer/",               
                        parameters: "suggest?f=json&text={0}&maxSuggestions={1}",
                        paramGetAddress: "findAddressCandidates?SingleLine={0}&magicKey={1}&f=json&outSR=%7B%22wkid%22%3A102100%7D&maxLocations=1",
                        maxSuggestions: 3,
                        addViewAllResults: true,
                        image: "images//icn-road.png",
                        zoomType: "point",
                        markerSymbol:     
                            { 
                                type: "esriPMS",
                                url: "images//road-marker.svg",
                                height: 19,  //22
                                width: 19,
                                yoffset: 9,
                                angle: 0
                            }                                                  
                    },                                                           
                    {
                        url: "https://apps.fs.usda.gov/arcx/rest/services/wo_nfs_gstc/USFSWildernessLocator/GeocodeServer/",
                        parameters: "suggest?f=json&text={0}&maxSuggestions={1}",
                        paramGetAddress: "findAddressCandidates?SingleLine={0}&magicKey={1}&f=json&outSR=%7B%22wkid%22%3A102100%7D&maxLocations=1",
                        maxSuggestions: 3,
                        image: "images//icn-wilderness.png",
                        zoomType: "extent",                                              
                    }, 
                    {
                        url: "https://apps.fs.usda.gov/arcx/rest/services/wo_nfs_gstc/USFSCommonNamesLocator/GeocodeServer/",
                        parameters: "suggest?f=json&text={0}&maxSuggestions={1}",
                        paramGetAddress: "findAddressCandidates?SingleLine={0}&magicKey={1}&f=json&outSR=%7B%22wkid%22%3A102100%7D&maxLocations=10",
                        maxSuggestions: 3,
                        image: "images//icn-forest.png",
                        zoomType: "extent",                                              
                    },
                    {
                        url: "https://apps.fs.usda.gov/arcx/rest/services/wo_nfs_gstc/USFSStatesLocator/GeocodeServer/",
                        parameters: "suggest?f=json&text={0}&maxSuggestions={1}",
                        paramGetAddress: "findAddressCandidates?SingleLine={0}&magicKey={1}&f=json&outSR=%7B%22wkid%22%3A102100%7D&maxLocations=1",
                        maxSuggestions: 3,
                        doViewResults: false,
                        image: "images//icn-state.png",
                        zoomType: "extent",                                              
                    },                                                                              
                    {
                        url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/",
                        parameters: "suggest?f=json&text={0}&maxSuggestions={1}&countryCode=USA&searchExtent=%7B%22xmin%22%3A-19374619%2C%22ymin%22%3A1415955%2C%22xmax%22%3A-4072537%2C%22ymax%22%3A11786931%2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%7D%7D&countryCode=USA&category=Address,Postal,Coordinate%20System,Populated%20Place,Arts%20and%20Entertainment,Land%20Features,Parks%20and%20Outdoors,Professional%20and%20Other%20Places,Residence,Travel%20and%20Transport,Water%20Features",
                        paramGetAddress: "findAddressCandidates?SingleLine={0}&magicKey={1}&f=json&outSR=%7B%22wkid%22%3A102100%7D&maxLocations=1",
                        maxSuggestions: 5,
                        doViewResults: false,
                        image: "images//icn-place.png",
                        zoomType: "both",
                        markerSymbol:     
                            { 
                                type: "esriPMS",
                                url: "images//icn-place-h.svg",
                                height: 16,  
                                width: 16
                            }                                               
                    }
                ],                
                layers: [
                    {
                        key: "genericClusters", 
                        minScale: 0,
                        maxScale: 288896, //577791
                        isClustered: true
                    },
                    {
                        key: "genericSingles", 
                        minScale: 288896,
                        maxScale: 0,
                        isClustered: false
                    }                        
                ],
                reQueryObject: {
                    minScale: 288896,  //577791..  1155582. Setting larger switches from summary to normal mode sooner
                    maxScale: 0,
                    mapLevel: 10                        
                },
                queryService: {
                   type: "summary",
                   queries: [                                                                 
                       {layerId: 1,
                        key: "recSitesQLayer", //for identify
                        queryObject: {
                           where: "UPPER(RECAREANAME) LIKE '%{0}%'",
                           returnGeometry: false,
                           outFields: ["RECAREAID","RECAREANAME","MARKERACTIVITY"],
                           outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                           groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                        }                                                                   
                       },
                       {layerId: 2,
                        key: "roadsQuery", //for identify
                        queryObject: {
                           where: "UPPER(NAME) LIKE '%{0}%' OR UPPER(ID) LIKE '{0}%'",
                           returnGeometry: false,
                           outFields: ["ID","NAME","RTE_CN"],
                           outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                           groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                        }                                                                   
                       }, 
                       {layerId: 4,
                        key: "trailsQuery", //for identify
                        queryObject: {
                           where: "UPPER(TRAIL_NAME) LIKE '%{0}%' OR UPPER(TRAIL_NO) LIKE '{0}%'",
                           returnGeometry: false,
                           outFields: ["TRAIL_NO","TRAIL_NAME", "TRAIL_CN"],
                           outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                           groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                         }                                                                                                            
                       }                                                                
                   ]                           
                },                                                   
                clusters: {
                    visible: true,                   
                    minScale: 0,
                    maxScale: 0,                    
                },                 
                clusterOptions: {
                    data: null,
                    distance: 90,
                    labelOffset: 2,
                    labelColor: "#ffffff",
                    labelFont: {
                        family: "Arial",
                        size: 15, 
                        style: "normal",
                        weight: "bold",
                        decoration: "none"
                    },
                    resolution: 0,
                    showSingles: false,
                    singleColor: "#888",
                    singleTemplate: null,
                    imageName: "images//cluster-search-h.svg",
                    imageSize: 40,
                    singleImage: {
                        url: "images//search-h.svg",
                        height: 16,
                        width: 16,
                        angle: 0,
                        type: "esriPMS"
                    },                                                              
                    zoomToExtent: true                    
                }                               
            },
            
            SideBarLayers: [
               {
                  key: "featured",
                  title: "Featured",
                  notes: "Featured may include Yonder and Twitter content.",
                  limit: "",
                  isFeatured: true,
                  isGLayer: true, //new, used when combining Graphic And Other Layers
                  didCheckbox: true,
                  image: "images//featured.png",
                  layers: [
                    { 
                        options: {
                            id: "featContent", /* shows at US full extent (inc. Alaska) */
                            visible: true,
                            maxScale: 0,  /* must be set to 0 so we have the graphics showing zoomed in to (no graphic overlaps between graphic layers) */
                            minScale: 150000000  /*  150000000 */                          
                        },
                        key: "featContent",
                        count: 60, /* should be count multiplied by 3 :  18*/
                        distance: 900000 /*  800000 */ 
                    },
                    { 
                        options: {
                            id: "featContent1", /* shows at continental us */
                            visible: true,
                            maxScale: 0,  
                            minScale: 36978595                            
                        },
                        key: "featContent1",
                        count: 120, /* should be count multiplied by 3 :  18*/
                        distance: 900000 /*  800000 */ 
                    },                    
                    { 
                        options: {
                            id: "featContent2", /* shows at State level and zoomed in */
                            visible: true,
                            maxScale: 0,  /* 400000 */
                            minScale: 9244648  /* alternatively, we could turn this on same as clusters:  1155582   2400000*/                          
                        },
                        key: "featContent2",
                        count: 450, /* should be count multiplied by 3:  300 */
                        distance: 50000,  
                    }                                    
                  ],
                  backgroundMarkerSymbol: {
                    color: [277,73,48,150],
                    size: 50,
                    xoffset: 0,
                    yoffset: 0,
                    type: "esriSMS",
                    style: "esriSMSSquare"
                  },
                  imageSize: 60,
                  icons: {
                    size: 20, 
                    offset: {
                        x: 20,
                        y: -20
                    }
                  }                   
               },
               {
                key: "yonder",
                title: "Yonder",
                identifyDivId: "idYonder",
                identifyDivContId: "identifyYonderContainer",
                paneId: "tab01",
                isYonder: true,
                isGLayer: true, //new, used when combining Graphic And Other Layers
                showNoDataError: false,
                icon: "tk-yonder color-yonder", 
                clusters: {
                    doClustersAtStartup: true, /* true implies we use the tags.featuredLimit below and never use tags.limit */
                    visible: true,                   
                    minScale: 0,
                    maxScale: 0,                    
                },                
                fileName: "Yonder.json",  /*  Set to Yonder.json or YonderEmpty.json*/               
                clusterOptions: {
                    data: null,
                    distance: 60, /* 60 future. Aaron didnt like 100. Not enough singles to click on */
                    id: "yonderCluster",
                    labelOffset: 2,
                    labelColor: "#ffffff",
                    labelFont: {
                        family: "Arial",
                        size: 15, 
                        style: "normal",
                        weight: "bold",
                        decoration: "none"
                    },
                    resolution: 0,
                    imageName: "images//cluster-yonder.svg",
                    imageSize: 40, 
                    singleImageName: "images//yonder.svg",
                    singleImageSize: 23,
                    showSingles: false, /* little gray dots around the clusters */
                    singleColor: "#888",
                    singleTemplate: null,
                    zoomToExtent: true,
                    //scaleToOpenMultiple: 1129, /* TODO: Maybe remove this: below this scale, identify will open. we may end up with basemaps though that dont show below this scale */
                    openIdentifyDistance: 200 /* if the extent distance (from corner to corner) is less then this value, Identify will open */
                },                     
                imageName: "images//yonder.svg",                
                graphicsLayer: {
                    id: "yonder",
                    visible: true
                },                
                attributeKeyValues: [
                    {key: "id", value: "id", parentKeys: null, type: "string"},
                    {key: "description", value: "description", parentKeys: null, type: "string"},
                    {key: "thumbnail", value: "square", parentKeys: ["media"], type: "string", addStyle: {keyName: "style", styleName: "identify-col", noStyleName: "identify-col-landscape"}},
                    {key: "image", value: "actual", parentKeys: ["media"], type: "string"},
                    {key: "userName", value: "username", parentKeys: ["account"], type: "string"},
                    {key: "geolocation", value: "geolocation", parentKeys: ["account"], type: "string"},
                    {key: "userURL", value: "url", parentKeys: ["account", "avatar"], type: "string"},
                    {key: "latitude", value: "latitude", parentKeys: null, type: "string"},
                    {key: "longitude", value: "longitude", parentKeys: null, type: "string"},
                ],
                userURLNoAvatar: "images//yonderNoAvatar.png",
                zoomLevel: 12,
                zoomLevelForCheckbox: 9
               },
               {
                key: "twitter",
                title: "Twitter",
                identifyDivId: "idTwitter",
                identifyDivContId: "identifyTwitterContainer",
                paneId: "tab02",
                showNoDataError: true, 
                isGLayer: true, //new, used when combining Graphic And Other Layers
                icon: "tk-twitter color-twitter",
                clusters: {
                    doClustersAtStartup: true, /* true implies we use the tags.featuredLimit below and never use tags.limit */
                    visible: true,                   
                    minScale: 0,
                    maxScale: 0,                    
                },                
                fileName: "Twitter.json",   //Twitter.json  http://www.fs.fed.us/ivm/mobile/json/TweetsIVM.json  http://www.robinegis.com/twitter/indexApplicationAuth.php  http://www.robinegis.com/twitter/indexGetList.php  http://staging-www.fs.fed.us/ivm/mobile/twitter/indexGetList.php http://www.fs.fed.us/ivm/mobile/twitter/indexGetListFS.php
                clusterOptions: {
                    data: null,
                    distance: 60, /* 80 */
                    id: "twitterCluster",
                    labelOffset: 2,
                    labelColor: "#ffffff",
                    labelFont: {
                        family: "Arial",
                        size: 15, 
                        style: "normal",
                        weight: "bold",
                        decoration: "none"
                    },
                    resolution: 0,
                    imageName: "images//twitter-cluster.svg",
                    imageSize: 40,  /* imageSize was 40 */
                    singleImageName: "images//twitter.svg",
                    singleImageSize: 23,
                    showSingles: false, /* little gray dots around the clusters */
                    singleColor: "#4099FF",  //#4099FF  #888. I dont think we use this
                    singleTemplate: null,
                    zoomToExtent: true,
                    //scaleToOpenMultiple: 1129, /* TODO: Maybe remove this: below this scale, identify will open. we may end up with basemaps though that dont show below this scale */
                    openIdentifyDistance: 200 /* if the extent distance (from corner to corner) is less then this value, Identify will open */                                                            
                },               
                imageName: "images//twitter.svg",
                hashTagPrefix: "http://www.twitter.com/",                             
                graphicsLayer: {
                    id: "twitter",
                    visible: true
                },
                attributeKeyValues: [
                    {key: "id", value: "_tweet_id", parentKeys: ["properties"], type: "string"},
                    {key: "description", value: "text", parentKeys: ["properties", "_tweet_search_result"], type: "string", doAnchor: true},
                    {key: "thumbnail", value: "media_url", parentKeys: ["properties", "_tweet_search_result", "entities", "extended_entities", "media"], type: "array", addStyle: {keyName: "style", styleName: "identify-col", noStyleName: "identify-col-landscape"}},
                    {key: "image", value: "url", parentKeys: ["properties", "_tweet_search_result", "entities", "extended_entities", "media"], type: "array"},
                    {key: "userName", value: "name", parentKeys: ["properties", "_tweet_search_result", "user"], type: "string"},
                    {key: "userURL", value: "profile_image_url", parentKeys: ["properties", "_tweet_search_result", "user"], type: "string"},
                    {key: "userHashTag", value: "screen_name", parentKeys: ["properties", "_tweet_search_result", "user"], type: "string"},
                    {key: "date", value: "created_at", parentKeys: ["properties", "_tweet_search_result"], type: "string", doDate: true},
                    {key: "latitude", value: "coordinates", parentKeys: ["geometry"], type: "array", arrayIndex: 1},
                    {key: "longitude", value: "coordinates", parentKeys: ["geometry"], type: "array", arrayIndex: 0},
                ],
                userURLNoAvatar: "images//twitterNoAvatar.png",
                zoomLevel: 12,
                zoomLevelForCheckbox: 9                               
               },
               {
                key: "wildernessPts",
                title: "Wilderness",
                dynamicLayerKey: "ivmReference", //sets up visibility
                dynamicLayerIndexes: [0], //sets up visibility
                visible: false,
                isGLayer: false, //new, used when combining Graphic And Other Layers
                icon: "tk-bear-paw color-featured"
               },
               {
                key: "weather",
                title: "Weather Warnings<br>& Watches",                                 
                visible: false,
                isGLayer: false, //new, used when combining Graphic And Other Layers
                isDisabled: false,
                addLayerAtStartup: false,
                isDynamicMapService: true,
                dynamicMapServiceKeys: ["RoadsAndTrails","ivmDynService"], //gets placed before (below) this layer. first one in list found is placed below
                image: "images//lightning.png",
                excludeInPDF: true,
                params: {
                    key: "weather",
                    url: "http://livefeeds.arcgis.com/arcgis/rest/services/LiveFeeds/NWS_Watches_Warnings_and_Advisories/MapServer",
                    isVisible: true,
                    opacity: 0.7, //smaller the number, more transparent
                    pngType: "png32",
                    minScale: 0,
                    maxScale: 0,
                    visibleLyrs:[6]                      
                }                                               
               },
               {
                key: "fire",
                title: "Fire Activity",
                visible: false,
                isDisabled: false,
                isGLayer: false, //new, used when combining Graphic And Other Layers
                addLayerAtStartup: false, 
                isGeoRSS: true, 
                image: "images/fire.png",
                graphicsLayer: "graphicsLayer", //this is a bit dangerous, as i dont have control over this name
                params: {
                    key: "fire",
                    url: "http://inciweb.nwcg.gov/feeds/rss/incidents/",
                    isVisible: true, 
                    imageName: "images//fire.svg",
                    imageSize: 23                     
                }                                               
               }                              
            ],
                        
            QueryLayers: [
              {
                key: "recSitesQLayer",
                urls: ["$$$/rest/services/wo_nfs_gstc/GSTC_IVMQuery_01/MapServer/0"],                
                isRecSites: true, /* may not use */
                title: "Recsite Information",
                heading: "Recreation",
                paneId: "tab03",
                identifyDivContId: "home1",
                maxScale: 0,
                minScale: 1155582,        
                outFields: ["*"],
                fields:
                      [
                        {
                            DisplayText: "Rec Site ID:",
                            FieldName: "RECAREAID",
                            DataType: "integer",
                            UseForUniqueValue: true, /* Karen added for ivmAngular identObj.value */
                            UseForTitle: false,
                            ShowFieldInIdentify: false,
                            IncludeFieldNameInIdentify: false,
                            IncludeHeaderIfNoData: false
                        },                       
                        {
                            DisplayText: "Rec Site Name:",
                            FieldName: "RECAREANAME",
                            DataType: "string",
                            UseForTitle: true,
                            ShowFieldInIdentify: false,
                            IncludeFieldNameInIdentify: false,
                            IncludeHeaderIfNoData: true
                        },
                         {
                            DisplayText: "Area Status:",
                            FieldName: "OPENSTATUS",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ConvertToTitleCase: true,
                            ConvertNoneToNull:true,
                            IsHTML: true,
                        },                  
                        {
                            DisplayText: "Description:",
                            FieldName: "RECAREADESCRIPTION",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: false,
                            IncludeHeaderIfNoData: false,
                            IsHTML: true,
                            ReplacePartialString: [["<iframe", "<div class='videoWrapper'><iframe"], ["</iframe>", "</iframe></div>"]]
                        },
                        {
                            DisplayText: "Accessibility Information:",
                            FieldName: "ACCESSIBILITY",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            IsHTML: true
                        },                           
                        {
                            DisplayText: "Activities:",
                            FieldName: "ACTIVITYID",
                            DataType: "integer", //is a double but int is easier for code
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            IsActivities: true,
                            UniqueValue: "RECAREAID"
                        },                                               
                        {
                            DisplayText: "Open Season Start:",
                            FieldName: "OPEN_SEASON_START",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false
                        },
                        {
                            DisplayText: "Open Season End:",
                            FieldName: "OPEN_SEASON_END",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false
                        },
                        {
                            DisplayText: "Forest Name:",
                            FieldName: "FORESTNAME",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: true
                        },
                        {
                            DisplayText: "Lat:",
                            FieldName: "LATITUDE",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: false,
                            AppendFieldWithNextField:  true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: true
                        },                          
                        {
                            DisplayText: "Lat/Long:",
                            FieldName: "LONGITUDE",
                            DataType: "string",
                            UseForTitle: false,
                            AppendFieldWithPreviousField: "LATITUDE",
                            FieldAppender: ", ",
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: true
                         },                         
                         {
                            DisplayText: "Reservation:",
                            FieldName: "RESERVATION_INFO",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            IsHTML: true
                         },                           
                         {
                            DisplayText: "Website:",
                            FieldName: "RECAREAURL",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            IsHomePage: true
                         }                                                                                                                                                                                                                                    
                    ]                   
              },
              {
                key: "trailsQLayer",
                urls: ["$$$/rest/services/wo_nfs_gstc/GSTC_IVMQuery_01/MapServer/3"],                
                isTrails: true, /* may not use */
                title: "Trail Information",
                heading: "Trail",
                paneId: "tab04",
                identifyDivContId: "home3",                
                maxScale: 0,
                minScale: 400000,
                DataReadinessObject: {FieldName: "ATTRIBUTESUBSET", Levels: ["TrailNFS_Centerline","TrailNFS_Basic","TrailNFS_MGMT"]},               
                outFields: ["*"],
                fields:
                    [
                         {
                            DisplayText: "Trail Number:",
                            FieldName: "TRAIL_NO",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: false,
                            AppendFieldWithNextField:  true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: true,
                            DataReadinessLevel: "TrailNFS_Centerline"
                         },            
                        {
                            DisplayText: "Trail Number | Name:",
                            FieldName: "TRAIL_NAME",
                            DataType: "string",
                            UseForTitle: true,
                            ShowFieldInIdentify: true,
                            AppendFieldWithPreviousField: "TRAIL_NO",
                            FieldAppender: " | ",  
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: true,
                            ConvertToTitleCase: true,
                            //ReplaceFieldValues: [[" NST"," NATIONAL SCENIC TRAIL"], [" NHT"," NATIONAL HISTORIC TRAIL"]],
                            DataReadinessLevel: "TrailNFS_Centerline"
                         },
                         {
                            DisplayText: "Trail CN:",
                            FieldName: "TRAIL_CN",
                            DataType: "string",
                            UseForTitle: false,
                            UseForUniqueValue: true, /* TODO: Karen added for ivmAngular identObj.value */
                            ShowFieldInIdentify: false, /* sometimes I need to see this */
                            IncludeFieldNameInIdentify: true, /* sometimes I need to see this */
                            IncludeHeaderIfNoData: true,
                            DataReadinessLevel: "TrailNFS_Centerline"
                         },                                                  
                         {
                            DisplayText: "Accessibility:",
                            FieldName: "ACCESSIBILITY_STATUS",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: false,
                            IncludeHeaderIfNoData: true,
                            ConvertToTitleCase: false,
                            OnlyShowIfFieldIsSet: {Field: "ACCESSIBILITY_STATUS", Value: "Complies with Trail Accessibility Guidelines"},
                            ReplaceFieldValues: [["ACCESSIBLE","Complies with Trail Accessibility Guidelines"]],
                            DataReadinessLevel: "TrailNFS_Basic"
                         },                                                                                                               
                         {
                            DisplayText: "Trail Open To The Following Motor Vehicles:",
                            FieldName: "MVUM_SYMBOL",
                            DataType: "integer", 
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ConvertToTitleCase: false,
                            ReplaceFullFieldValue: [{key:"5", value:"All Vehicles: Yearlong"}, {key:"6", value:"All Vehicles: Seasonal (See Dates Below)"}, {key:"7", value:"Vehicles 50\" or Less in Width: Yearlong"}, {key:"8", value:"Vehicles 50\" or Less in Width: Seasonal (See Dates Below)"}, {key:"9", value:"Dirt Bikes: Yearlong"}, {key:"10", value:"Dirt Bikes: Seasonal (See Dates Below)"}, {key:"11", value:"Special Vehicle Designation: Yearlong"}, {key:"12", value:"Special Vehicle Designation: Seasonal (See Dates Below)"}, {key:"16", value:"Wheeled OHV 50\" or Less in Width: Yearlong"}, {key:"17",value:"Wheeled OHV 50\" or Less in Width: Seasonal (See Dates Below)"}],
                            SetNullValue: {value: "<br>This is a Non-Motorized Trail", excludeHeaderIfNullVal: true},
                            IsHTML: true,
                            DataReadinessLevel: "TrailNFS_MGMT"                            
                         },                          
                         {
                            DisplayText: "Managed For Dirt Bikes:",
                            FieldName: "MOTORCYCLE_MANAGED",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            DataReadinessLevel: "TrailNFS_MGMT",
                            SymbolCodeHandler: {
                                field: "MVUM_SYMBOL",
                                codes: ["6","8","10","12"]
                            }                               
                         }, 
                         {
                            DisplayText: "Open To Dirt Bikes:",
                            FieldName: "MOTORCYCLE_ACCPT_DISC",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            DataReadinessLevel: "TrailNFS_MGMT",
                            SymbolCodeHandler: {
                                field: "MVUM_SYMBOL",
                                codes: ["6","8","10","12"]
                            }                             
                         }, 
                         {
                            DisplayText: "Managed For ATV's:",
                            FieldName: "ATV_MANAGED",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            DataReadinessLevel: "TrailNFS_MGMT",
                            SymbolCodeHandler: {
                                field: "MVUM_SYMBOL",
                                codes: ["6","8","10","12"]
                            }                              
                         }, 
                         {
                            DisplayText: "Open To ATV's:",
                            FieldName: "ATV_ACCPT_DISC",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            DataReadinessLevel: "TrailNFS_MGMT",
                            SymbolCodeHandler: {
                                field: "MVUM_SYMBOL",
                                codes: ["6","8","10","12"]
                            }                              
                         },                                                             
                         {
                            DisplayText: "Managed For 4WD:",
                            FieldName: "FOURWD_MANAGED",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            DataReadinessLevel: "TrailNFS_MGMT",
                            SymbolCodeHandler: {
                                field: "MVUM_SYMBOL",
                                codes: ["6","8","10","12"]
                            }                              
                         }, 
                         {
                            DisplayText: "Open To 4WD:",
                            FieldName: "FOURWD_ACCPT_DISC",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            DataReadinessLevel: "TrailNFS_MGMT",
                            SymbolCodeHandler: {
                                field: "MVUM_SYMBOL",
                                codes: ["6","8","10","12"]
                            }                              
                         },                                       
                         {
                            DisplayText: "Managed For Hiking:",
                            FieldName: "HIKER_PEDESTRIAN_MANAGED",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            DataReadinessLevel: "TrailNFS_MGMT"
                         }, 
                         {
                            DisplayText: "Open To Hiking:",
                            FieldName: "HIKER_PEDESTRIAN_ACCPT_DISC",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,                           
                            IncludeHeaderIfNoData: false,
                            DataReadinessLevel: "TrailNFS_MGMT",
                            ShowDateIfNullHandler: {
                                date: "01/01-12/31",
                                nullFields: ["HIKER_PEDESTRIAN_MANAGED", "HIKER_PEDESTRIAN_RESTRICTED"]
                            }                              
                         },                                                                                                           
                         {
                            DisplayText: "Hiking - Accessible:", //TODO: Do i need this field?
                            FieldName: "ACCESSIBILITY_STATUS",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: false,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: true,
                            DataReadinessLevel: "TrailNFS_MGMT"
                         }, 
                         {
                            DisplayText: "Managed For Pack and Saddle:",
                            FieldName: "PACK_SADDLE_MANAGED",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            DataReadinessLevel: "TrailNFS_MGMT"
                         }, 
                         {
                            DisplayText: "Open To Pack and Saddle:",
                            FieldName: "PACK_SADDLE_ACCPT_DISC",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            DataReadinessLevel: "TrailNFS_MGMT",
                            ShowDateIfNullHandler: {
                                date: "01/01-12/31",
                                nullFields: ["PACK_SADDLE_MANAGED", "PACK_SADDLE_RESTRICTED"]
                            }                              
                         },                         
                         {
                            DisplayText: "Managed For Bicycles:",
                            FieldName: "BICYCLE_MANAGED",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            DataReadinessLevel: "TrailNFS_MGMT"
                         }, 
                         {
                            DisplayText: "Open To Bicycles:",
                            FieldName: "BICYCLE_ACCPT_DISC",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            DataReadinessLevel: "TrailNFS_MGMT",
                            ShowDateIfNullHandler: {
                                date: "01/01-12/31",
                                nullFields: ["BICYCLE_MANAGED", "BICYCLE_RESTRICTED"]
                            }                             
                         }, 
                         {
                            DisplayText: "Trail Class:",
                            FieldName: "TRAIL_CLASS",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: true, /* Trail Class not specified */
                            ReplaceFullFieldValue: [{key:"1", value:"Minimally Developed (Trail Class 1)"}, {key:"2", value:"Moderately Developed (Trail Class 2)"}, {key:"3", value:"Developed (Trail Class 3)"}, {key:"4", value:"Highly Developed (Trail Class 4)"},{key:"5", value:"Fully Developed (Trail Class 5)"}],
                            SetNullValue: {value: "Trail Class not specified", excludeHeaderIfNullVal: false},
                            DataReadinessLevel: "TrailNFS_Basic"                            
                         },                                                                    
                         {
                            DisplayText: "Trail Surface:",
                            FieldName: "TRAIL_SURFACE",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: false,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ConvertToTitleCase: true,
                            AppendFieldWithNextField:  true,
                            RemoveValueBeforeAfterSymbol: [{Symbol: "-", RemoveBefore: true}],
                            ReplaceFullFieldValue: [{key:"ASPHALT", value:"Paved"}, {key:"CHUNK WOOD", value:"Mulch"}, {key:"IMPORTED COMPACTED MATERIAL", value:"Gravel (Compacted)"}, {key:"IMPORTED LOOSE MATERIAL", value:"Gravel (Un-Compacted)"},{key:"NATIVE MATERIAL", value:"Natural Surface"}, {key:"OTHER", value:"Other (Paver, Etc.)"}],                           
                            DataReadinessLevel: "TrailNFS_Basic"
                         },
                         {
                            DisplayText: "Trail Surface | Surface Firmness:",
                            FieldName: "SURFACE_FIRMNESS",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            OnlyShowIfFieldIsSet: {Field: "ACCESSIBILITY_STATUS", Value: "Complies with Trail Accessibility Guidelines"},
                            ConvertToTitleCase: true,
                            AppendFieldWithPreviousField: "TRAIL_SURFACE",
                            FieldAppender: " | ",  
                            RemoveValueBeforeAfterSymbol: [{Symbol: "-", RemoveBefore: true}],
                            DataReadinessLevel: "TrailNFS_Basic"
                         },                      
                         {
                            DisplayText: "Typical Trail Grade:",
                            FieldName: "TYPICAL_TRAIL_GRADE",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            RemoveValueBeforeAfterSymbol: [{Symbol: "-", RemoveBefore: true}],
                            RemoveFirstCharacter: ["+","-"],
                            DataReadinessLevel: "TrailNFS_Basic"
                         }, 
                         {
                            DisplayText: "Typical Trail Width:",
                            FieldName: "TYPICAL_TREAD_WIDTH",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: false, /* it gets appended with Mimimum Trail Width. must set AppendFieldWithNextField*/
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ConvertToTitleCase: true,
                            AppendFieldWithNextField:  true,
                            RemoveValueBeforeAfterSymbol: [{Symbol: "-", RemoveBefore: true}],
                            DataReadinessLevel: "TrailNFS_Basic"
                         }, 
                         {
                            DisplayText: "Typical Trail Width | Minimum Tread Width:",
                            FieldName: "MINIMUM_TRAIL_WIDTH",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ConvertToTitleCase: true,
                            AppendFieldWithPreviousField: "TYPICAL_TREAD_WIDTH",
                            FieldAppender: " | ",  
                            OnlyShowIfFieldIsSet: {Field: "ACCESSIBILITY_STATUS", Value: "Complies with Trail Accessibility Guidelines"},
                            RemoveValueBeforeAfterSymbol: [{Symbol: "-", RemoveBefore: true}, {Symbol: ">", RemoveBefore: true}],
                            DataReadinessLevel: "TrailNFS_Basic"
                         }, 
                         {
                            DisplayText: "Typical Tread Cross Slope:",
                            FieldName: "TYPICAL_TREAD_CROSS_SLOPE",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ConvertToTitleCase: true,
                            OnlyShowIfFieldIsSet: {Field: "ACCESSIBILITY_STATUS", Value: "Complies with Trail Accessibility Guidelines"},
                            DataReadinessLevel: "TrailNFS_Basic"                            
                         },                                                                             
                         {
                            DisplayText: "Length (Segment):",
                            FieldName: "SEGMENT_LENGTH",
                            DataType: "double",
                            UseForTitle: false,
                            AddToResult: " Miles",
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ConvertToDistance: true,
                            DataReadinessLevel: "TrailNFS_Centerline" 
                         },                          
                         {
                            DisplayText: "Forest:",
                            FieldName: "ADMIN_ORG",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: true,
                            ConvertToForest: true,
                            //UseName: true,
                            DataReadinessLevel: "TrailNFS_Centerline"
                         }                                                                                                                                                         
                     ]                 
               },
               {
                key: "roadsQLayer",
                urls: [
                    "$$$/rest/services/wo_nfs_gstc/GSTC_IVMQuery_01/MapServer/2",
                    "$$$/rest/services/wo_nfs_gstc/GSTC_IVMQuery_01/MapServer/1"
                ],                
                isRoads: true, /* may not use */
                title: "Road Information",
                heading: "Road",
                paneId: "tab05",
                identifyDivContId: "home2",                 
                maxScale: 0,
                minScale: 400000,               
                outFields: ["*"],
                fields:
                    [
                        {
                            DisplayText: "Rte CN:",
                            FieldName: "RTE_CN",
                            DataType: "string",
                            UseForTitle: false,
                            UseForUniqueValue: true, /* Karen added for ivmAngular identObj.value */
                            ShowFieldInIdentify: false, /* sometimes I need to see this */
                            IncludeFieldNameInIdentify: true, /* sometimes I need to see this */
                            IncludeHeaderIfNoData: false
                        },                    
                        {
                            DisplayText: "Road Number:",
                            FieldName: "ID",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: false,
                            AppendFieldWithNextField:  true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: true
                        },             
                        {
                            DisplayText: "Road Number | Name:",
                            FieldName: "NAME",
                            DataType: "string",
                            UseForTitle: true,
                            AppendFieldWithPreviousField: "ID",
                            FieldAppender: " | ",                            
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: true,
                            ConvertToTitleCase: true
                         },
                         {
                            DisplayText: "Road Open To The Following Motor Vehicles:",
                            FieldName: "SYMBOL",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ConvertToTitleCase: false,
                            ReplaceFullFieldValue: [{key:"1", value:"All Vehicles: Yearlong"}, {key:"2", value:"All Vehicles: Seasonal (See Dates Below)"}, {key:"3", value:"Highway Legal Vehicles Only: Yearlong"}, {key:"4", value:"Highway Legal Vehicles Only: Seasonal (See Dates Below)"}, {key:"11", value:"Special Vehicle Designation: Yearlong"}, {key:"12", value:"Special Vehicle Designation: Seasonal (See Dates Below)"}]
                         },                          
                         {
                            DisplayText: "Open To Dirt Bikes:",
                            FieldName: "MOTORCYCLE_DATESOPEN",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ShowSeasonalDates: true,
                            SymbolCodeHandler: {
                                field: "SYMBOL",
                                codes: ["2","4","12"]
                            }
                         },
                         {
                            DisplayText: "Open To ATV's:",
                            FieldName: "ATV_DATESOPEN",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ShowSeasonalDates: true,
                            SymbolCodeHandler: {
                                field: "SYMBOL",
                                codes: ["2","4","12"]
                            }                            
                         }, 
                         {
                            DisplayText: "Open to 4WD > 50 Inches:",
                            FieldName: "FOURWD_GT50_DATESOPEN",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ShowSeasonalDates: true,
                            SymbolCodeHandler: {
                                field: "SYMBOL",
                                codes: ["2","4","12"]
                            }                            
                         },                                                                                          
                         {
                            DisplayText: "Open To Highway Legal Vehicles:",
                            FieldName: "PASSENGERVEHICLE_DATESOPEN",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ShowSeasonalDates: true,
                            SymbolCodeHandler: {
                                field: "SYMBOL",
                                codes: ["2","4","12"]
                            }                            
                         },                                                                       
                         {
                            DisplayText: "Type of Road:",
                            FieldName: "SYMBOL_NAME",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: true,
                            //ReplaceFieldValues: [["Road, Not Maintained for Passenger Car","Low Standard (Rough) Road"], ["Gravel Road, Suitable for Passenger Car","Gravel Road"],["Dirt Road, Suitable for Passenger Car","Dirt Road"]],
                            ReplaceFullFieldValue: [{key:"Road, Not Maintained for Passenger Car", value:"Low Standard (Rough) Road"}, {key:"Gravel Road, Suitable for Passenger Car", value:"Gravel Road"},{key:"Dirt Road, Suitable for Passenger Car", value:"Dirt Road"}],
                            SetNullValue: {value: "Road (Road Class not specified)", excludeHeaderIfNullVal: false}
                         },                                     
                         {
                            DisplayText: "Level Of Service:",
                            FieldName: "OPERATIONALMAINTLEVEL",  //OPER_MAINT_LEVEL: layer 2 (used)..  OPERATIONALMAINTLEVEL: Layer 1
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,                   
                            RemoveValueBeforeAfterSymbol: [{Symbol: "-", RemoveBefore: true}],
                            ConvertToTitleCase: true,
                            CombineValuesIntoOne: {CombinedValues: [4,5], StartsWith: true, NewValue: "Suitable for Passenger Cars"},
                            SymbolCodeHandler: {
                                field: "SYMBOL",
                                codes: ["1","2","3","4","11","12"]
                            }                                                      
                         },   
                         {
                            DisplayText: "Length (Segment):",
                            FieldName: "SEG_LENGTH",
                            DataType: "double",
                            UseForTitle: false,
                            AddToResult: " Miles",
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            ConvertToDistance: true
                         },                      
                         {
                            DisplayText: "Forest:",
                            FieldName: "ADMIN_ORG",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: true,
                            ConvertToForest: true
                            //UseName: true
                         }                                                                                                               
                     ]                  
               },
               {
                key: "wilderness",
                urls: ["$$$/rest/services/wo_nfs_gstc/GSTC_IVMQuery_01/MapServer/5"],                
                isWilderness: true, /* may not use */
                doExtentZoom: true,
                title: "Wilderness Information",
                heading: "Wilderness",
                paneId: "tab07",
                identifyDivContId: "home5",                 
                maxScale: 0,
                minScale:  1155581.108577,
                altQueryLayer: {
                    key: "ivmReference",
                    layerIndex: 0, //for visibility purposes (needs to be visible before we can query)
                    maxScale: 577790.554289,
                    minScale: 0,
                    identifyURL: "$$$/rest/services/wo_nfs_gstc/GSTC_IVMQuery_01/MapServer/8" //for query
                },
                outFields: ["WILDERNESSID", "WILDERNESSNAME", "WID", "IMAGEFULL"],
                fields:
                  [
                      {
                          DisplayText: "",
                          FieldName: "IMAGEFULL",
                          DataType: "string",
                          UseForTitle: false,
                          IsImage: true,
                          ShowFieldInIdentify: true
                      },                   
                      {
                          DisplayText: "Website:",
                          FieldName: "WID",
                          DataType: "integer",
                          UseForUniqueValue: true, /* Karen added for ivmAngular identObj.value */
                          UseForTitle: false,
                          URL: "http://www.wilderness.net/NWPS/wildView?WID=",
                          IncludeFieldNameInIdentify: true,
                          ShowFieldInIdentify: true,
                          IsHomePage: true,
                          UseName: false                         
                      },                  
                      {
                          DisplayText: "Wilderness Name:",
                          FieldName: "WILDERNESSNAME",
                          DataType: "string",
                          UseForTitle: true,
                          ShowFieldInIdentify: false
                      }                      
                   ]                    
               },
                {
                key: "fireQLayer",
                urls: [],                
                title: "Fire Activity",
                heading: "Fire Activity",
                paneId: "tab09",
                identifyDivContId: "home9",
                isGeoRSS: true,
                fields:
                      [
                      {
                          DisplayText: "Title:",
                          FieldName: "title",
                          DataType: "string",
                          UseForUniqueValue: false, 
                          UseForTitle: true,
                          ShowFieldInIdentify: false,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true                       
                      },
                      {
                          DisplayText: "Description:",
                          FieldName: "description",
                          DataType: "string",
                          UseForUniqueValue: false, 
                          UseForTitle: false,
                          ShowFieldInIdentify: true,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: false                           
                      },
                      {
                          DisplayText: "Details:",
                          FieldName: "link",
                          DataType: "string",
                          UseForTitle: false,
                          ShowFieldInIdentify: true,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true,
                          IsHomePage: true,
                          AnchorObject: {text: "More info", title: "More information about the fire warning"}  //must be IsHomePage for this         
                      }                                                                   
                      ]
               },               
               {
                key: "weatherQLayer",
                urls: ["http://livefeeds.arcgis.com/arcgis/rest/services/LiveFeeds/NWS_Watches_Warnings_and_Advisories/MapServer/6"], 
                verifyLayersAreVisible: [{key: "weather"}], //array length must match urls, and key must match layer visible in map               
                title: "Weather Warning",
                heading: "Weather Warning",
                paneId: "tab08",
                identifyDivContId: "home8",                                
                maxScale: 0,
                minScale: 0,                 
                outFields: ["*"],
                fields: [
                      {
                          DisplayText: "Event:",
                          FieldName: "Event",
                          DataType: "string",
                          UseForUniqueValue: false, 
                          UseForTitle: true,
                          ShowFieldInIdentify: false,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true,
                          //ApplyFieldValueToHeader: true,                          
                      },
                      {
                          DisplayText: "Severity:",
                          FieldName: "Severity",
                          DataType: "string",
                          UseForUniqueValue: false, 
                          UseForTitle: false,
                          ShowFieldInIdentify: true,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true                           
                      },
                      {
                          DisplayText: "Summary:",
                          FieldName: "Summary",
                          DataType: "string",
                          UseForTitle: false,
                          ShowFieldInIdentify: true,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true          
                      },    
                      {
                          DisplayText: "Details:",
                          FieldName: "Link",
                          DataType: "string",
                          UseForTitle: false,
                          ShowFieldInIdentify: true,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true,
                          IsHomePage: true,
                          AnchorObject: {text: "More info", title: "More information about the weather warning"}  //must be IsHomePage for this         
                      }, 
                      {
                          DisplayText: "Urgency:",
                          FieldName: "Urgency",
                          DataType: "string",
                          UseForTitle: false,
                          ShowFieldInIdentify: true,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true          
                      },
                      {
                          DisplayText: "Certainty:",
                          FieldName: "Certainty",
                          DataType: "string",
                          UseForTitle: false,
                          ShowFieldInIdentify: true,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true          
                      }, 
                      {
                          DisplayText: "Category:",
                          FieldName: "Category",
                          DataType: "string",
                          UseForTitle: false,
                          ShowFieldInIdentify: true,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true          
                      }, 
                      {
                          DisplayText: "Updated:",
                          FieldName: "Updated",
                          DataType: "date",
                          UseForTitle: false,
                          ShowFieldInIdentify: true,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true          
                      },
                      {
                          DisplayText: "Effective:",
                          FieldName: "Start",
                          DataType: "date",
                          UseForTitle: false,
                          ShowFieldInIdentify: true,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true          
                      },
                      {
                          DisplayText: "Expiration:",
                          FieldName: "End",
                          DataType: "date",
                          UseForTitle: false,
                          ShowFieldInIdentify: true,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true          
                      },                                                                                                                                                                                                      
                      {
                          DisplayText: "Areas Affected:",
                          FieldName: "Affected",
                          DataType: "string",
                          UseForTitle: false,
                          ShowFieldInIdentify: true,
                          IncludeFieldNameInIdentify: true,
                          IncludeHeaderIfNoData: true          
                      }                                                           
                ]
               },                               
               {
                /* National Forest Layer */
                key: "forestQLayer",
                urls: ["$$$/rest/services/wo_nfs_gstc/GSTC_IVMQuery_01/MapServer/4"],                
                isForest: true, /* may not use */
                doExtentZoom: true,
                title: "Forest Information",
                heading: "Forest",
                identifyDivContId: "home4",
                paneId: "tab06",                 
                maxScale: 0,
                minScale: 0,
                outFields: ["FORESTORGCODE", "COMMONNAME", "URL"],
                fields:
                  [
                      {
                          DisplayText: "Admin Forest ID:",
                          FieldName: "FORESTORGCODE",
                          DataType: "string",
                          UseForUniqueValue: true, /* Karen added for ivmAngular identObj.value */
                          UseForTitle: false,
                          ShowFieldInIdentify: false
                      },                  
                      {
                          DisplayText: "Forest Name:",
                          FieldName: "COMMONNAME",
                          DataType: "string",
                          UseForTitle: true,
                          ShowFieldInIdentify: false
                      },
                      {
                            DisplayText: "Website:",
                            FieldName: "URL",
                            DataType: "string",
                            UseForTitle: false,
                            ShowFieldInIdentify: true,
                            IncludeFieldNameInIdentify: true,
                            IncludeHeaderIfNoData: false,
                            IsHomePage: true
                      }                                                 
                   ]                    
               }                                                                    
            ],
                                   
            queryPanels: {
                doJson: true,
                activityOptionsArray: [
                    {key: "recSitesQuery",
                     queryLayerKey: "recSitesQLayer",
                     showNoDataError: true,                                           
                     layers: [
                        {
                            key: "recClusters", 
                            minScale: 0,
                            maxScale: 1155582,
                            isClustered: true
                        }, 
                        {
                            key: "recSingles", 
                            minScale: 1155582,
                            maxScale: 0,
                            isClustered: false
                        },
                     ] 
                     },
                     {key: "roadsQuery",
                      queryLayerKey: "roadsQLayer",
                      showNoDataError: false,                                           
                      layers: [
                         {
                             key: "recClusters", 
                             minScale: 0,
                             maxScale: 288896,
                             isClustered: true
                         }, 
                         {
                             key: "recSingles", 
                             minScale: 288896,
                             maxScale: 0,
                             isClustered: false
                         }                     
                       ], 
                       reQueryObject: {
                         minScale: 288896,  //577791..  1155582. Setting larger switches from summary to normal mode sooner
                         maxScale: 0,
                         mapLevel: 10                       
                       }                                       
                     },
                     {key: "trailsQuery",
                      queryLayerKey: "trailsQLayer",
                      showNoDataError: false,                                           
                      layers: [
                         {
                             key: "recClusters", 
                             minScale: 0,
                             maxScale: 288896,
                             isClustered: true
                         }, 
                         {
                             key: "recSingles", 
                             minScale: 288896,
                             maxScale: 0,
                             isClustered: false
                         }                     
                       ], 
                       reQueryObject: {
                         minScale: 288896,  //577791..  1155582. Setting larger switches from summary to normal mode sooner
                         maxScale: 0,
                         mapLevel: 10                        
                       }                                       
                     }                     
                ],
                exploreQuery: {
                    url: "",
                    key: "exploreQuery", 
                    headerTitle: "Explore",
                    headerIcon: "mag-glass-square nav-mag-glass",
                    divSize: "col-sm-6",
                    showing: true,                                         
                    queryArray: [
                        /* current format in case we need to add one of the sideBar Layers back in. */
                       /*
                        {name: "Yonder",
                         key: "exp_yonder",
                         titleExplore: "Yonder is a community of outdoor folks who are social media driven.",
                         iconClasses: "tk-yonder yonder activity",
                         isChecked: false,
                         layer: {
                             key: "yonder",
                             isSideBar: true
                         }                         
                        },                        
                        */
                        {name: "Accessibility Info",
                         key: "exp_acc",
                         titleExplore: "Find accessibility information",
                         iconClasses: "tk-wheelchair-2 accessible activity",
                         imageName: "images//cluster-accessible-h.svg",
                         singleImageName: "images//accessible-h.svg",
                         isChecked: false,
                         type: "recSitesQuery",
                         mapLevel: 10,
                         pdfLegendKey: 7,                         
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: [31]                                  
                             }                                                           
                         ],                          
                         featureService: {
                             layerDefs: [                                                                 
                                {
                                 layerId: 1,                                 
                                 where: "ACCESSIBILITY IS NOT NULL AND ACCESSIBILITY NOT LIKE '%null%'",
                                 outFields: "RECAREAID,RECAREANAME,MARKERACTIVITYGROUP,MARKERACTIVITY,ACCESSIBILITY",
                                 verifyHasDataField: "ACCESSIBILITY"
                                },
                                {
                                 layerId: 4,
                                 where: "(ACCESSIBILITY_STATUS = 'ACCESSIBLE' AND TRAIL_TYPE = 'TERRA' AND (ATTRIBUTESUBSET = 'TrailNFS_Basic' OR ATTRIBUTESUBSET = 'TrailNFS_MGMT'))",
                                 outFields: "TRAIL_NO,TRAIL_NAME,TRAIL_CN",                                
                                }                                
                            ]                          
                         }                                                
                        }, 
                        {name: "Camping & Cabins",
                         key: "exp_camp",
                         titleExplore: "Find camping and cabin rental opportunities",
                         iconClasses: "tk-camping activity",
                         imageName: "images//cluster-camping-h.svg",
                         singleImageName: "images//camping-h.svg",  
                         isChecked: false,
                         type: "recSitesQuery", 
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: []                                  
                             }                                                           
                         ],
                         featureService: {
                             layerDefs: [ 
                                {
                                 layerId: 1,
                                 where: "MARKERACTIVITY IN ('Cabin Rentals', 'Campground Camping', 'Dispersed Camping','Group Camping','OHV Camping','RV Camping', 'Horse Camping')", //Camping & Cabins Another query:  ACTIVITYID IN (101,29,34,33,30,32,31) MARKERACTIVITYGROUP LIKE 'Camping%'" http://stackoverflow.com/questions/16622504/escaping-ampersand-in-url
                                 outFields: "RECAREAID,MARKERACTIVITYGROUP,MARKERACTIVITY"
                                }
                            ]                             
                         }                        
                        },                         
                        {name: "Hiking",
                         key: "exp_hiking",
                         titleExplore: "Find hiking opportunities",
                         iconClasses: "tk-day-hiking activity",
                         imageName: "images//cluster-hiking-h.svg",                         
                         isChecked: false,                         
                         type: "trailsQuery",
                         pdfLegendKey: 1, 
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: [25,26,27,34]                                  
                             }                                                           
                         ],
                         queryService: { 
                            type: "summary",
                            queries: [                                 
                                {layerId: 1,
                                 queryObject: {
                                    where: "MARKERACTIVITY IN ('Day Hiking','Backpacking','Trailhead')",
                                    returnGeometry: false,
                                    outFields: ["RECAREAID","RECAREANAME","MARKERACTIVITY"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                 }                                                                         
                                },                                
                                {layerId: 4,
                                 queryObject: {
                                    where: "ATTRIBUTESUBSET = 'TrailNFS_MGMT' AND HIKER_PEDESTRIAN_RESTRICTED IS NULL",
                                    returnGeometry: false,
                                    outFields: ["TRAIL_NO","TRAIL_NAME", "TRAIL_CN"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                  }                                                                                                            
                                }                                                                 
                            ]                             
                         }                                                       
                        },                                                                     
                        {name: "Biking",
                         key: "exp_biking",
                         titleExplore: "Find biking opportunities",
                         iconClasses: "tk-road-cycling activity",
                         imageName: "images//cluster-road-cycling-h.svg",                         
                         isChecked: false,                          
                         type: "trailsQuery", 
                         pdfLegendKey: 0,
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: [22,23,24,34]                                  
                             }                                                           
                         ],                          
                         queryService: { 
                            type: "summary",
                            queries: [                                 
                                {layerId: 1,
                                 queryObject: {
                                    where: "MARKERACTIVITY IN ('Mountain Biking','Road Cycling')",
                                    returnGeometry: false,
                                    outFields: ["RECAREAID","RECAREANAME","MARKERACTIVITY"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                 }                                                                         
                                },                                
                                {layerId: 4,
                                 queryObject: {
                                    where: "ATTRIBUTESUBSET = 'TrailNFS_MGMT' AND BICYCLE_RESTRICTED IS NULL",
                                    returnGeometry: false,
                                    outFields: ["TRAIL_NO","TRAIL_NAME","TRAIL_CN"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                  }                                                                                                            
                                }                                                                 
                            ]                             
                          }                                                  
                        },
                        {name: "Pack & Saddle",
                         key: "exp_pack",
                         titleExplore: "Find pack & saddle opportunities",
                         iconClasses: "tk-horse-riding activity",
                         imageName: "images//cluster-horse-riding-h.svg",                         
                         isChecked: false,                         
                         type: "trailsQuery", 
                         pdfLegendKey: 2,
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: [28,29,30,34]                                  
                             }                                                           
                         ],
                         queryService: { 
                            type: "summary",
                            queries: [                                 
                                {layerId: 1,
                                 queryObject: {
                                    where: "MARKERACTIVITY IN ('Horse Riding','Horse Camping')",
                                    returnGeometry: false,
                                    outFields: ["RECAREAID","RECAREANAME","MARKERACTIVITY"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                 }                                                                         
                                },                                
                                {layerId: 4,
                                 queryObject: {
                                    where: "ATTRIBUTESUBSET = 'TrailNFS_MGMT' AND PACK_SADDLE_RESTRICTED IS NULL",
                                    returnGeometry: false,
                                    outFields: ["TRAIL_NO","TRAIL_NAME","TRAIL_CN"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                  }                                                                                                            
                                }                                                                 
                            ]                             
                          }                                                  
                        },
                        {name: "Trailhead",
                         key: "exp_trailhead",
                         titleExplore: "Find trailheads",
                         iconClasses: "tk-trailhead activity",
                         imageName: "images//cluster-trailhead-h.svg",
                         singleImageName: "images//trailhead-h.svg",                         
                         isChecked: false,                         
                         type: "recSitesQuery", 
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: []                                  
                             }                                                           
                         ],
                         featureService: {
                             layerDefs: [ 
                                {
                                 layerId: 1,
                                 where: "MARKERACTIVITYGROUP = 'Trailhead'", //Camping & Cabins http://stackoverflow.com/questions/16622504/escaping-ampersand-in-url
                                 outFields: "RECAREAID,MARKERACTIVITYGROUP,MARKERACTIVITY"
                                }
                            ]                             
                         }                        
                        },
                        {name: "Picnicking",
                         key: "exp_picnic",
                         titleExplore: "Find picnic areas",
                         iconClasses: "tk-picnicking activity",
                         imageName: "images//cluster-picnicking-h.svg",
                         singleImageName: "images//picnicking-h.svg",                         
                         isChecked: false,                         
                         type: "recSitesQuery", 
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: []                                  
                             }                                                           
                         ],
                         featureService: {
                             layerDefs: [ 
                                {
                                 layerId: 1,
                                 where: "MARKERACTIVITY IN ('Picnicking','Group Picnicking')", //Camping & Cabins http://stackoverflow.com/questions/16622504/escaping-ampersand-in-url
                                 outFields: "RECAREAID,MARKERACTIVITYGROUP,MARKERACTIVITY"
                                }
                            ]                             
                         }                                                  
                        }, 
                        {name: "Outdoor Learning",
                         key: "exp_outdoor",
                         titleExplore: "Find outdoor learning opportunities",
                         iconClasses: "tk-interpretive-areas activity",
                         imageName: "images//cluster-interpretive-areas-h.svg",
                         singleImageName: "images//interpretive-areas-h.svg",                         
                         isChecked: false,                         
                         type: "recSitesQuery", 
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: []                                  
                             }                                                           
                         ],
                         featureService: {
                             layerDefs: [ 
                                {
                                 layerId: 1,
                                 where: "MARKERACTIVITY IN ('Interpretive Areas','Visitor Centers','Visitor Programs')", //Camping & Cabins http://stackoverflow.com/questions/16622504/escaping-ampersand-in-url
                                 outFields: "RECAREAID,MARKERACTIVITYGROUP,MARKERACTIVITY"
                                }
                            ]                             
                         }                                                 
                        },
                        {name: "Nature Viewing",
                         key: "exp_nature",
                         titleExplore: "Find nature viewing opportunities",
                         iconClasses: "tk-binoculars activity",
                         imageName: "images//cluster-viewing-wildlife-h.svg",
                         singleImageName: "images//viewing-wildlife-h.svg",                        
                         isChecked: false,                         
                         type: "recSitesQuery", 
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: []                                  
                             }                                                           
                         ],
                         featureService: {
                             layerDefs: [ 
                                {
                                 layerId: 1,
                                 where: "MARKERACTIVITY IN ('Birdwatching','Viewing Plants','Viewing Scenery','Viewing Wildlife')", //Camping & Cabins http://stackoverflow.com/questions/16622504/escaping-ampersand-in-url
                                 outFields: "RECAREAID,MARKERACTIVITYGROUP,MARKERACTIVITY"
                                }
                            ]                             
                         }                                                      
                        }, 
                        {name: "Fishing",
                         key: "exp_fish",
                         titleExplore: "Find fishing opportunities",
                         iconClasses: "tk-fishing activity",
                         imageName: "images//cluster-fishing-h.svg",
                         singleImageName: "images//fishing-h.svg",                         
                         isChecked: false,                         
                         type: "recSitesQuery", 
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: []                                  
                             }                                                           
                         ],
                         featureService: {
                             layerDefs: [ 
                                {
                                 layerId: 1,
                                 where: "MARKERACTIVITYGROUP = 'Fishing'", //Camping & Cabins http://stackoverflow.com/questions/16622504/escaping-ampersand-in-url
                                 outFields: "RECAREAID,MARKERACTIVITYGROUP,MARKERACTIVITY"
                                }
                            ]                             
                         }                                                 
                        }, 
                        {name: "Water",
                         key: "exp_water",
                         titleExplore: "Find boating opportunities",
                         iconClasses: "tk-water activity",
                         imageName: "images//cluster-water-activities-h.svg",
                         singleImageName: "images//water-activities-h.svg",                         
                         isChecked: false,                         
                         type: "recSitesQuery", 
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: []                                  
                             }                                                           
                         ],
                         featureService: {
                             layerDefs: [ 
                                {
                                 layerId: 1,
                                 where: "MARKERACTIVITYGROUP = 'Water Activities'", //Camping & Cabins http://stackoverflow.com/questions/16622504/escaping-ampersand-in-url
                                 outFields: "RECAREAID,MARKERACTIVITYGROUP,MARKERACTIVITY"
                                }
                            ]                             
                         }                                                   
                        }, 
                        {name: "Highway Legal",
                         key: "exp_highway",
                         titleExplore: "Find places to drive",
                         title: "Highway Legal Vehicles", //for legend
                         iconClasses: "tk-sedan activity",
                         imageName: "images//cluster-highway-legal-vehicle-h.svg",                         
                         isChecked: false,                         
                         type: "roadsQuery",                         
                         pdfLegendKey: 3,
                         dontShowManagedInLegend: true, 
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: [7,8,18,19,20,33,34]                                  
                             }                                                           
                         ],                         
                         queryService: {
                            type: "summary",
                            queries: [                                 
                                {layerId: 3,
                                 queryObject: {
                                    where: "SYMBOL IN ('1','2','3','4') OR (SYMBOL IN ('11','12') AND (PASSENGERVEHICLE = 'open' OR HIGHCLEARANCEVEHICLE  = 'open' OR TRUCK = 'open' OR BUS = 'open' OR MOTORHOME= 'open'))",
                                    returnGeometry: false,
                                    outFields: ["ID","NAME","RTE_CN"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"] 
                                  }                                                                    
                                 },
                                 {layerId: 4,
                                  queryObject: {
                                    where: "ATTRIBUTESUBSET = 'TrailNFS_MGMT' AND MVUM_SYMBOL IN (5, 6)",
                                    returnGeometry: false,
                                    outFields: ["TRAIL_NO","TRAIL_NAME", "TRAIL_CN"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                  }
                                 }                                                                 
                            ]                             
                         }                                                   
                        }, 
                        {name: "OHV > 50 Inches",
                         key: "exp_ohv",
                         titleExplore: "Find places to take your OHV > 50 inches",
                         iconClasses: "tk-jeep activity",
                         imageName: "images//cluster-jeep-h.svg",                         
                         isChecked: false,                          
                         type: "roadsQuery", 
                         pdfLegendKey: 4,                        
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: [5,6,15,16,17,20,33,34]                                  
                             }                                                           
                         ],                          
                         queryService: {
                            type: "summary",
                            queries: [                                 
                                {layerId: 3,
                                 queryObject: {
                                    where: "(SYMBOL IN (1,2) OR (SYMBOL IN (11,12) AND (TRACKED_OHV_GT50INCHES = 'open' OR OTHER_OHV_GT50INCHES  = 'open' OR FOURWD_GT50INCHES = 'open' OR TWOWD_GT50INCHES = 'open')))",
                                    returnGeometry: false,
                                    outFields: ["ID","NAME","RTE_CN"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                 }                                                                        
                                },
                                {layerId: 4,
                                 queryObject: {
                                    where: "ATTRIBUTESUBSET = 'TrailNFS_MGMT' AND (FOURWD_MANAGED IS NOT NULL OR FOURWD_ACCPT_DISC IS NOT NULL)",
                                    returnGeometry: false,
                                    outFields: ["TRAIL_NO","TRAIL_NAME", "TRAIL_CN"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                  }                                                                                                            
                                }                                                                 
                            ]                             
                         }                                                     
                        },
                        {name: "ATV/OHV <= 50 Inches",
                         key: "exp_atv",
                         titleExplore: "Find places to take your ATV/OHV <= 50 inches",
                         iconClasses: "tk-ohv-riding activity",
                         imageName: "images//cluster-ohv-riding-h.svg",                      
                         isChecked: false,                         
                         type: "roadsQuery",
                         pdfLegendKey: 5,
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: [3,4,12,13,14,20,33,34]                                  
                             }                                                           
                         ],                          
                         queryService: { 
                            type: "summary",
                            queries: [                                 
                                {layerId: 1,
                                 queryObject: {
                                    where: "MARKERACTIVITY IN ('OHV Camping','OHV Open Area Riding','OHV Road Riding','OHV Trail Riding')",
                                    returnGeometry: false,
                                    outFields: ["RECAREAID","RECAREANAME","MARKERACTIVITY"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                 }                                                                         
                                },                                
                                {layerId: 3,
                                 queryObject: {
                                    where: "(SYMBOL IN ('1','2','16','17') OR (SYMBOL IN ('11','12') AND (ATV = 'open' OR TRACKED_OHV_LT50INCHES = 'open' OR  OTHER_OHV_LT50INCHES = 'open')))",
                                    returnGeometry: false,
                                    outFields: ["ID","NAME","RTE_CN"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                 }                                                                         
                                },
                                {layerId: 4,
                                 queryObject: {
                                    where: "ATTRIBUTESUBSET = 'TrailNFS_MGMT' AND (ATV_MANAGED IS NOT NULL OR ATV_ACCPT_DISC IS NOT NULL)",
                                    returnGeometry: false,
                                    outFields: ["TRAIL_NO","TRAIL_NAME", "TRAIL_CN"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                  }                                                                                                            
                                }                                                                 
                            ]                             
                         }                                                  
                        }, 
                        {name: "Dirt Bike",
                         key: "exp_motor",
                         titleExplore: "Find places to take your dirt bike",
                         title: "Dirt Bikes", //for legend
                         iconClasses: "tk-motorcycle activity",
                         imageName: "images//cluster-motorcycle-h.svg",                       
                         isChecked: false,                          
                         type: "roadsQuery",
                         pdfLegendKey: 6,
                         visibleLayers: [
                             {key: "RoadsAndTrails", //Dynamic Map Service ID generated. Must match HighlightLayers key below
                              layerIds: [1,2,9,10,11,20,33,34]                                  
                             }                                                           
                         ],                         
                         queryService: {
                            type: "summary",
                            queries: [                                                                 
                                {layerId: 3,
                                 queryObject: {
                                    where: "(SYMBOL IN ('1','2') OR (SYMBOL IN ('11','12') AND MOTORCYCLE = 'open'))",
                                    returnGeometry: false,
                                    outFields: ["ID","NAME","RTE_CN"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                 }                                                                   
                                }, 
                                {layerId: 4,
                                 queryObject: {
                                    where: "ATTRIBUTESUBSET = 'TrailNFS_MGMT' AND (MOTORCYCLE_MANAGED IS NOT NULL OR MOTORCYCLE_ACCPT_DISC IS NOT NULL)",
                                    returnGeometry: false,
                                    outFields: ["TRAIL_NO","TRAIL_NAME", "TRAIL_CN"],
                                    outStatistics: [{statisticType: "count", onStatisticField: "DISTRICTORGCODE", outStatisticFieldName: "Count"}],                                  
                                    groupByFieldsForStatistics: ["DISTRICTORGCODE"]                                    
                                  }                                                                                                            
                                }                                                                
                            ]                           
                         }                                                 
                        }                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                    ]                    
                },                
                otherDropdownArray: [
                    {
                        key: "Explore", 
                        headerTitle: "Explore",
                        headerIcon: "tk-activity-menu nav-recsites",
                        id: "headerExplore",
                        title: "Explore recreation activities on National Forests and Grasslands",
                        dropDownClass: "compassDropdown",
                        isExplore: true,
                        showing: false
                    },  
                    {
                        key: "searchQuery", 
                        headerTitle: "Search",
                        headerIcon: "tk-mag-glass nav-mag-glass",
                        id: "headerSearch",
                        title: "Search for a recreation site, road, or trail, or zoom to a state or forest",
                        dropDownClass: "searchDropdown",
                        isSearch: true, 
                        showing: false                    
                    },
                    {
                        key: "toolsQuery", 
                        headerTitle: "Tools",
                        headerIcon: "tk-gears nav-tools",
                        id: "headerTools",
                        title: "Click the tools button to change base maps, create a PDF, or share the map",
                        divSize: "col-xs-4", 
                        dropDownClass: "toolsDropdown",
                        isTools: true,
                        showing: false,
                        queryArray: [
                            {name: "Base Map",
                            key: "basemaps",
                            iconClasses: "tk-table-4x fsbrown activity"
                            },
                            {name: "Legend",
                            key: "legend",
                            iconClasses: "tk-legend fsbrown activity"
                            },
                            {name: "Create GEO PDF",
                            key: "pdf",
                            iconClasses: "tk-print fsbrown activity"
                            },
                            {name: "Share Map",
                            key: "share",
                            iconClasses: "tk-share fsbrown activity"
                            },
                            {name: "About",
                            type: "window",
                            key: "help",
                            iconClasses: "tk-help-fill fsbrown activity"
                            },
                            {name: "Feedback",
                            type: "window",
                            key: "helpFeedback",
                            iconClasses: "tk-feedback fsbrown activity"
                            }                                                                                                                                                                        
                        ]                 
                    }                                                      
                ],
                clusterOptions: {
                    data: null,
                    distance: 90,  //115
                    id: "recClusters", //TODO: Maybe dont use this
                    imageSize: 40,
                    labelOffset: 3,
                    labelColor: "#ffffff",
                    labelFont: {
                        family: "Arial",
                        size: 13, 
                        style: "normal",
                        weight: "bold",
                        decoration: "none"
                    },
                    markerSymbolJson: {
                        type: "esriSMS",
                        style: "esriSMSCircle",
                        color: [87,57,34,255],
                        size: 30,
                        outline: {
                            color: [51,33,20,255],
                            width: 2
                        }
                    },
                    textSymbolJson: {
                        type: "esriTS",
                        color: [255,255,255,255],
                        yoffset: -1,
                        font: {
                            family: "forest",
                            size: 16
                        }                           
                    },                    
                    resolution: 0,
                    zoomLevel: 3, //ClusterLayer. _zoomLevel. onClick event: how many levels to zoom in
                    showSingles: false,
                    singleColor: "#888",
                    singleTemplate: null,
                    singleImageSize: 23,
                    zoomToExtent: true,
                    singleImages: [
                        {
                            layerId: 2,
                            singleImage: {
                              url: "images/road-marker.svg",
                              height: 19,  //22
                              width: 19,
                              yoffset: 9,
                              angle: 0,
                              type: "esriPMS"
                            }                            
                        },                    
                        {
                            layerId: 3,
                            singleImage: {
                              url: "images/road-marker.svg",
                              height: 19,  //22
                              width: 19,
                              yoffset: 9,
                              angle: 0,
                              type: "esriPMS"
                            }                            
                        },
                        {
                            layerId: 4,
                            singleImage: {
                              url: "images/trail-marker.svg",
                              height: 19,
                              width: 19,
                              yoffset: 9,
                              angle: 0,
                              type: "esriPMS"
                            }                            
                        }                                            
                    ]                    
                } 
            },
            
            modalDialogs: {
               templateURL: "js/widgets/modalDialogs/template/",
               doAnimation: true,
               doBackdrop: true, //backdrop must be set to true in order to click outside modal dialog in order to close it.
               openModalAtStartup: {
                   modalKey: "explore"
               },
               dialogArray: [
                        {key: "explore",
                         template: "exploreModal.tpl.html",
                         controller: "ExploreModalCtrl",
                         windowClass: "exploreModal"                           
                        },  
                        {key: "pdf",
                         template: "pdf.tpl.html",
                         controller: "PDFCtrl" ,
                         windowClass: "pdfModal"                           
                        }, 
                        {key: "share",
                         template: "shareModal.tpl.html",
                         controller: "ShareModalCtrl",
                         windowClass: "shareModal"                           
                        }, 
                        {key: "basemaps",
                         template: "basemaps.tpl.html",
                         controller: "BasemapsCtrl",
                         windowClass: "basemapsModal"                            
                        },                                                          
                ],            
            },
            
            // ------------------------------------------------------------------------------------------------------------------------
            // OPERATIONAL LAYERS
            // ------------------------------------------------------------------------------------------------------------------------
                  
            Layers: [           
                         {
                            Key: "ivmReference",
                            Title: "Reference Layers",       
                            ServiceURL: "$$$/rest/services/wo_nfs_gstc/GSTC_IVMReference_01/MapServer", //GSTC_IVMReference_01
                            isVisible: true,
                            addLayerAtStartup: false,
                            opacity: 1,
                            pngType: "png32", //png32. causes problems to older IE on my machine
                            isDynamicMapService: true,
                            isReference: true,
                            minScale: 0,
                            maxScale: 0
                        },                     
                        {
                            Key: "ivmDynService",
                            Title: "Data Layers",
                            ServiceURL: "$$$/rest/services/wo_nfs_gstc/GSTC_IVMCartography_01/MapServer",
                            isVisible: true,
                            addLayerAtStartup: false,
                            opacity: 1.0,
                            pngType: "png32",  
                            isDynamicMapService: true,
                            minScale: 1155582,
                            maxScale: 0
                        },                                                
                        {
                            Key: "gLayer",
                            isGraphicsLayer: true,
                            addLayerAtStartup: true,
                        }                                                         
            ],

            // ------------------------------------------------------------------------------------------------------------------------
            // HIGHLIGHT LAYERS
            // ------------------------------------------------------------------------------------------------------------------------
                     
            HighlightLayers: [
                {url: "$$$/rest/services/wo_nfs_gstc/GSTC_IVMTravelOpportunities_01/MapServer/",  
                 key: "RoadsAndTrails", //Dynamic Map Service ID generated
                 dynamicMapServiceKeys: ["ivmDynService"], //gets placed before (below) this layer. first one in list found is placed below
                 isVisible: false,                
                 opacity: 1,
                 pngType: "png32",  
                 isDynamicMapService: true,
                 minScale: 1155582,
                 maxScale: 0                                                          
                }                                                                       
            ],

            // ------------------------------------------------------------------------------------------------------------------------
            // BASEMAP LAYERS
            // Make sure to set DefaultBaseMap as well 
            // Also make sure to properly set scaleToOpenMultiple. Must be set to 1 more then Default Basemaps maxScale (never smaller)
            // ------------------------------------------------------------------------------------------------------------------------
  
            BaseMapLayers: {
                selectedKey: "layer0",
                DefaultBaseMap: "streets",  //The following are valid options: "streets" , "satellite" , "hybrid", "topo", "gray", "oceans", "national-geographic", "osm".
                layers:   
                       [
                          {
                               key: "layer0", /* if I flip this layer with fsMap, some stuff will break in layerUtils.js */
                               thumbnailSource: "images/streets.png",                      
                               name: "Streets",
                               ariaLabel: "Streets Base Map",
                               visible: true,
                               maxScale: 1128, 
                               layerClass: "btn-success",                              
                               isFSBasemap: false,
                               showLayersOnBasemapSwitch: {
                                   key: "ivmReference",
                                   lyrIdArray:  [1,2,3,4,5,6,7] /*Sublayers from ivmReferenceLayer to show:  TODO: Fix this. Nathan changed the layers */
                               }, 
                               mapURL: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
                           },                        
                           {
                               key: "natGeo",
                               thumbnailSource: "images/natgeo.jpg",
                               name: "National Geog",
                               ariaLabel: "National Geographic Base Map",
                               visible: false,
                               maxScale:  9027, 
                               layerClass: "btn-default",                              
                               isFSBasemap: false,                               
                               showLayersOnBasemapSwitch: {
                                   key: "ivmReference",
                                   lyrIdArray:  [1,2,3,4,5,6,7]  /*Sublayers from ivmReferenceLayer to show */
                               },                                 
                               mapURL: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer"
                           },                                                                                                         
                           {
                               key: "fsMap",
                               thumbnailSource: "images/fs-basemap-2.png",
                               name: "Forest Service",
                               ariaLabel: "Forest Service Base Map",
                               visible: false,
                               maxScale: 1128,
                               layerClass: "btn-default",
                               isFSBasemap: true,
                               showLayersOnBasemapSwitch: {
                                   key: "ivmReference",
                                   lyrIdArray:  [] /*Turn off Wilderness, Ownership.*/
                               },                                                              
                               mapURL: "https://apps.fs.usda.gov/arcx/rest/services/wo_nfs_gstc/GSTC_TravelAccessBasemap_01/MapServer" 
                           },                                                                                                                                                   
                           {
                               key: "worldtopo",
                               thumbnailSource: "images/topographic.jpg",
                               name: "World Topo",
                               ariaLabel: "World Topographic Base Map",
                               visible: false,
                               maxScale: 1128,
                               layerClass: "btn-default",
                               isFSBasemap: false,
                               showLayersOnBasemapSwitch: {
                                   key: "ivmReference",
                                   lyrIdArray:  [1,2,3,4,5,6,7]  /*Sublayers from ivmReferenceLayer */
                               },                                 
                               mapURL: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
                           },                                             
                           {
                               key: "topo",
                               thumbnailSource: "images/topo.jpg",
                               name: "USGS Topo",
                               ariaLabel: "USGS Topographic Base Map",
                               visible: false,
                               maxScale: 18055,
                               layerClass: "btn-default",
                               isFSBasemap: false,
                               showLayersOnBasemapSwitch: {
                                   key: "ivmReference",
                                   lyrIdArray:  [1,2,3,4,5,6,7]  /*Sublayers from ivmReferenceLayer */
                               },                                                             
                               mapURL: "https://server.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer"
                           },
                           {
                               key: "imageryMap",
                               thumbnailSource: "images/imagery.jpg",
                               name: "Imagery",
                               ariaLabel: "Satellite Imagery Base Map",
                               visible: false,
                               maxScale: 1128,
                               layerClass: "btn-default",
                               isFSBasemap: false,
                               showLayersOnBasemapSwitch: {
                                   key: "ivmReference",
                                   lyrIdArray:  [1,2,3,4,5,6,7], /*Sublayers from ivmReferenceLayer */
                               },                                  
                               mapURL: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
                           },
                           {
                               key: "worldTerrain",
                               thumbnailSource: "images/worldterrain.jpg",
                               name: "World Terrain",
                               ariaLabel: "World Terrain Base Map",
                               visible: false,
                               maxScale: 72223,
                               layerClass: "btn-default",
                               isFSBasemap: false,
                               showLayersOnBasemapSwitch: {
                                   key: "ivmReference",
                                   lyrIdArray:  [1,2,3,4,5,6,7],  /*Sublayers from ivmReferenceLayer */
                               },                                
                               mapURL: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer"
                           }                                   
                       ]                
            },
          
            FeatureService: {
                url: "$$$/rest/services/wo_nfs_gstc/GSTC_IVMRecRoadTrailSearch_01/FeatureServer/",  
                parameters: "&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&returnGeometry=true&f=pjson",
                requiredJsonFiles: {
                    didJson: false,
                    data: [
                        {key: "marker", fileName: "MarkerTypes.json", attKey: "MARKERACTIVITY", data: null},
                        {key: "rangerDistrict", fileName: "RangerDistrictCentroids.json", attKey: "DISTRICTORGCODE", data: null}
                    ],
                }, 
                layerIdKey: "layerId",
            },
            zoomToRecArea:{
                url: "$$$/rest/services/wo_nfs_gstc/GSTC_IVMRecRoadTrailSearch_01/FeatureServer/1",
                field:"RECAREAID",
                dataType:"integer",
                zoomLevel:14               
            },
            request:{
                    validKeys:['activity','minx','miny','maxx','maxy','recid','exploremenu','eclipse','featurecontent','markeractivity'],
                    eclipse2017:{
                         id: "eclipse",
                         title: "Eclipse path 2017",
                         visible: true,
                         ServiceURL: "https://services1.arcgis.com/gGHDlz6USftL5Pau/ArcGIS/rest/services/r06_Eclipse_Path_2017/FeatureServer/0"
                    },
                    markeractivity:[
                      {name:"Camping & Cabins",activity:['Cabin Rentals', 'Campground Camping', 'Dispersed Camping','Group Camping','OHV Camping','RV Camping', 'Horse Camping']},
                      {name:"Hiking",activity:['Day Hiking','Backpacking','Trailhead']},
                      {name:"Biking",activity:['Mountain Biking','Road Cycling']},
                      {name:"Pack & Saddle",activity:['Horse Riding','Horse Camping']},
                      {name:"Picnicking",activity:['Picnicking','Group Picnicking']},
                      {name:"Outdoor Learning",activity:['Interpretive Areas','Visitor Centers','Visitor Programs']},
                      {name:"Nature Viewing",activity:['Birdwatching','Viewing Plants','Viewing Scenery','Viewing Wildlife']},
                      {name:"ATV/OHV <= 50 Inches",activity:['OHV Camping','OHV Open Area Riding','OHV Road Riding','OHV Trail Riding']}          
                    ], 
                  clusterIcons:[{name:'Cabin Rentals', imageName: "images//cluster-cabin-rentals-h.svg"}]                                     
            }                                                                        
        };
});
