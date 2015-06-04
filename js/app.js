var map;
var sb;
var sbInput;
var mapDiv;
var restContainer;


var ViewModel = function(){
    var self = this;

    var curMarker;
    var defaultMapIcon = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    var infoWindow;


    infoWindow = new google.maps.InfoWindow();

    this.yelpData = ko.observableArray([]);
    this.statusMessage = ko.observable("Loading Restaurants...");
    this.filteredList = ko.observable(false);


    /*
        This is used for 2 different reasons:
            1. When the user clicks on a restaurant or a marker, it will hide all the restaurants from the list box.
                It will also reset the map section to the default.  This is done in case the user has a marker selected
                and then clicks on another marker.
            2.  When the user clicks on the refresh all link (this only appears with the list is filtered), it shows all
                the restaurants.  It still resets the map to the default look.
    */
    this.filterList = function(filter){
        for (var j=0; j<self.yelpData().length; j++){
            self.yelpData()[j].marker.setIcon(defaultMapIcon);
            self.yelpData()[j].shouldShowRest(!filter);
        }
        self.filteredList(false);
        infoWindow.close();
    };


    /*
        Used when the user clicks on either a restaurant from the list or the marker on the map.
        This will change the marker to blue, perfom a drop animation of the marker,
        and show an infoWindow with an image from Yelp.
    */
    this.clickIcon = function (data){
        var content;
        self.filterList(true);
        data.marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
        data.marker.setAnimation(google.maps.Animation.DROP);
        data.shouldShowRest(true);
        self.filteredList(true);
        content = "<b>" + data.yData.name + "</b><p>";
        content = content + "<img src=" + data.yData.image_url + ">"    ;
        infoWindow.setContent(content);
        infoWindow.open(map, data.marker);
    };


    /*
        This is used to create the marker on the map and add a click listener to each marker on the map.
        It uses the latitude/longitude from the Yelp API to create the marker.
    */
    function createMarker(latitude, longitude, element) {
        var mrkrLatLng = new google.maps.LatLng(latitude, longitude);
        self.curMarker = new google.maps.Marker({
            map: map,
            position: mrkrLatLng,
            icon: defaultMapIcon
        });
        google.maps.event.addListener(self.curMarker, 'click', function(){
            self.clickIcon(self.yelpData()[element]);
        });

    }

    /*
        Function to load the markers on the map.
    */
    function LoadMarkers(){
        /*
            This gets the bounds of the map to send to the Yelp API.  I zoom out at the end since I noticed that
            some of the markers returned from the Yelp API were at the very edge of the map.  This gets the
            map bounds when zoomed in and then zooms out so that the markers will be more centered in the map.
        */
        var mapBounds = map.getBounds().toString();        
        mapBounds = mapBounds.replace("((", "");
        mapBounds = mapBounds.replace(new RegExp('[ ]', 'g'), "");
        mapBounds = mapBounds.replace("),(", "|");
        mapBounds = mapBounds.replace("))", "");
        map.setZoom(13);


        /*
            LoadRestaurants is a library I found while researching how to use the Yelp API.  I made some modifications to it
            (setting a timeout, using latitude/longitude instead of a location, and updating my key information).  I
            used this because the OAUTH methods required by the Yelp API were already handled by this function.
        */
        LoadRestaurants(mapBounds, function (){
            var curYelp;

            self.yelpData.removeAll();
            self.statusMessage("");
            if (functionList.length === 0){
                self.statusMessage("Unable to find any restaurants.");
                return;
            }
            for (var k=0; k<functionList.length; k++){
                curYelp = functionList[k];
                //create the marker based on the Yelp coordinates
                createMarker(curYelp.location.coordinate.latitude, curYelp.location.coordinate.longitude, k);

                //A knockout array to hold all the information about each restaurant returned.
                self.yelpData.push({
                    "yData": curYelp,
                    "marker": self.curMarker,
                    "shouldShowRest": ko.observable(true)
                });
            }

        });

    }


    //Create the map.
    function initializeMap(latitude, longitude){
        self.yelpData([]);
        self.statusMessage("Loading Restaurants...");

        map = new google.maps.Map(mapDiv, {
            zoom: 14,
            center: new google.maps.LatLng(latitude,longitude)
        });
        /*
            This listener is done to wait until the google map loads before going out to grab the restaurants
            from the Yelp API.  If this was not done, the bounds of the map could not be received.
        */
        google.maps.event.addListenerOnce(map, 'idle', function(){
            LoadMarkers();

            /*
                This is the listener for the search box.  When the user puts in a new location, it will go out
                and grab restaurants from the location the user provides.
            */
            google.maps.event.addListener(sb, 'places_changed', function() {
                var places = sb.getPlaces();


                if (places.length === 0)
                    return;

                initializeMap(places[0].geometry.location.A, places[0].geometry.location.F);

            });

        });

        // This is a timeout to handle an issue with the loading of the google map.
        var timeout = window.setTimeout(handleTimeout, 5000);
        google.maps.event.addListener(map, 'tilesloaded', function(){
            window.clearTimeout(timeout);
        });
        function handleTimeout(){
            self.statusMessage("Unable to Load Google Map");
        }
        
        sb = new google.maps.places.SearchBox(sbInput);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(sbInput);
        map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(restContainer);
    }

    //This listener is used to wait for the window to load.  Once that happens, the map is created.
    google.maps.event.addDomListener(window, 'load', initializeMap (33.3549709, -86.8239194));
};

/*
    This event will handle the situation where you are not connected to the internet.
    This would cause adverse effects on the page, and will notify the user of the error.
*/
window.addEventListener('offline', function(){
	var message = 'You are currently not connected to the internet.  ' +
	    'In order to use all the functions of the page, you will need to be connected.  ' +
	    'Once connected, please refresh the page.';

    alert (message);
});


/*
    Waits until the DOM is loaded to grab the elements used on the site and do bindings
*/
$(function () {
    sbInput = document.getElementById('rest-searchbox');
    mapDiv = document.getElementById('map-canvas');
    restContainer = document.getElementById('rest-container');

    ko.applyBindings(new ViewModel());

});