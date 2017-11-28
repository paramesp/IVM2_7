/**
 * @author karen@robinegis.com (Karen Robine)
 */

define([], function () {       
        'use strict';
        return {
            DataError: "The Forest Service Visitor Map has lost access to some of the required data services.  If you continue to experience problems, alternative maps can be found at https://www.fs.fed.us/visit/maps.",
            NavBar: {
               clusters: {
                   jsonProblem: "There was a problem obtaining Clusters.",
                   noGraphics:  "The current item does not have any graphics associated with it.",
                   missingDiv: "The current item is not available yet. Please check back soon."
               },
               other: {
                   missingFunctionality: "Please check back soon for requested functionality."
               } 
            },
            Identify: {  /* http://www.codeproject.com/Tips/201899/String-Format-in-JavaScript    http://www.codeproject.com/Tips/204293/String-Format-in-JavaScript */
                missingData: {
                    fsData: "There is a problem obtaining Forest Service data when clicking on the map. However, other data such as Social Media data will appear.",
                    zoomToForestData: "Problem obtaining a forest value from the current forest, {0}, to zoom to."
                }
            },
            StateForest: {
                selectionErr: "Please select a State or National Forest to navigate to."
            },
            SideBar: {
                missingData: {
                    graphicsData: "There is a problem obtaining data from one of the social media layers (ie., Yonder or Twitter). The rest of the application should function properly.",
                    graphicsDataMsg: "There is a problem obtaining data from one of the social media layers (ie., Yonder or Twitter). Error: {0}",
                    graphicsLayer: "There is a problem obtaining data from {0}. The rest of the application should function properly."
                }
            },
            Print: {
                PDFBeingGenerated: "A PDF is currently being generated. Please stand by.",
                getError: "The Forest Service Visitor Map has lost access to some of the required data services. If you continue to experience problems, alternative maps can be found at&hellip;<br> <a href='https://www.fs.fed.us/visit/maps' target='_blank'>https://www.fs.fed.us/visit/maps</a>"
            },
            Basemap: {
                showingError: "There was a problem showing the Basemap layer.",
                notVisible: "The Basemap you selected is not visible at the current extent. Please zoom out to see the Basemap."
            },
            Search: {
                noData: "Please enter a search phrase.",
                nothingReturned: "No data is being returned from your search. Please try another.",
                getError: "The following problem occurred while obtaining data from the Feature Service. Error: {0}",
                genericError: "There is a problem obtaining data from the service."
            },
            Share: {
                genericError: "There is a problem obtaining data."
            }
        };
});
