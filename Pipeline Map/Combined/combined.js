/**********************************************************
Section 1. SET UP THE BACKGROUND MAP and Initial Parameters
***********************************************************/

// create the Leaflet map container and initialize some other variables
var map = L.map('map');
var initialZoomLevel = 12;
var layerOptions = null;
var legend = null;

// Set current input data - either recently completed development or current development. Initialize map with recent. 
var dev_options = 'recent';
var catProps = unitcats;
var catName = 'unitcat';

// Title Text Options 
var current_unitDesc = '<span><b>Proposed Residential Development</b></span><span>Click any development for details.</span><span><button onclick="javascript:switchData();">Recently Completed Development</button>';
var recent_unitDesc = '<span><b>Recently Completed Residential Development</b></span><span>Click any development for details.</span><span><button onclick="javascript:switchData();">Currently Proposed Development</button>';

//add tile layer basemap to the map
var basemapUrl = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
var basemapAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';
var basemapProperties = {minZoom: 12, maxZoom: 16, attribution: basemapAttribution};
var basemap = L.tileLayer(basemapUrl, basemapProperties);
map.addLayer(basemap);

/**************************************************************
Section 2: Generate Map Elements (Change with button) 
**************************************************************/

//create a function to create all the styles and functionality for the point data so it's reusable when we switch datasets dynamically
function createFeatures() {
	//set the overlay description based on whether we on looking at rent categories or switched datasets to rent change categories
	var overlayDesc = document.getElementById('overlay-desc');
	if (dev_options == 'recent') {descText = recent_unitDesc;} else { descText = current_unitDesc; }
	//if they're not viewing this in an iframe, link to my blog post
	if (inIframe()) { descText += '</span>' } else { descText += ' <a href="http://geoffboeing.com/2015/11/landscape-us-rents/">More Info</a></span>' }
	overlayDesc.innerHTML = descText;

	//specify what the circle markers should look like (radius and fill color are dynamically set later)
	var markerStyle = {radius: null, fillOpacity: 0.7, color: '#666666', opacity: 1, weight: 1, fillColor: null};
	var markerStyleHover = {radius: null, fillOpacity: 0.9, color: '#333333', opacity: 1, weight: 3, fillColor: null};


	// specify how to load the individual features: give each its styling and a text popup
	layerOptions = {
		pointToLayer: pointToLayer,
	    onEachFeature: onEachFeature
	};
	
	
	// function to add data points to map layer with proper styling
	function pointToLayer(feature, latlng) {
			var category = feature.properties[catName];
			markerStyle.fillColor = catProps[category].color;
			markerStyle.radius = getRadius();
	        return L.circleMarker(latlng, markerStyle);
	}

	function getRadius() {
	    if (map.getZoom()) { radius = Math.pow(map.getZoom(), 0.8); } //if map already exists, get current zoom level
	    else { radius = Math.pow(initialZoomLevel, 0.8); } //if it's the initial startup, use initial zoom level
	    return radius;
	}

	//make marker size scale with zoom
	map.on('zoomend', function() {
	    for (var key in geojsonLayer._layers) {
	        geojsonLayer._layers[key].setRadius(getRadius());
	    }
	});

	//check if someone's viewing this page directly instead of in iframe
	function inIframe() {
	    try {
	        return window.self !== window.top;
	    } catch (e) {
	        return true;
	    }
	}


	//************************************************************************
	//define interactions with a feature: clicks and hovers
	//************************************************************************

	function onEachFeature(feature, layer) {
	    layer.on({
	        mouseover: highlightFeature,
	        mouseout: resetHighlight, 
			click: clickFeature
	    });
	}

	//on mouseover, highlight the feature hovered over
	function highlightFeature(e) {
	    var target = e.target;
		var category = target.feature.properties[catName];
		markerStyleHover.fillColor = catProps[category].color;
	    markerStyleHover.radius = getRadius() * 1.2; //make radius 20% bigger when hovering
	    target.setStyle(markerStyleHover);
	    target.bringToFront();
	}

	//on mouseout, reset highlighted feature's style
	function resetHighlight(e) {
	    var target = e.target;
		var category = target.feature.properties[catName];
		markerStyle.fillColor = catProps[category].color;
	    markerStyle.radius = getRadius();
	    target.setStyle(markerStyle);
	}


	//on click, pan/zoom to feature and show popup
	function clickFeature(e) {
	    var target = e.target;
	    var latlng = target._latlng;
	    var props = target.feature.properties;
		
		if (dev_options == 'recent') {
			var popupContent = '<div class="popup-container">' + 
                   '<h4>' + props.address + '</h4>' + 
                   '<br /><span class="popup-label">Net Units: ' + props.net_units + '</span>' +
                   '<br /><span class="popup-label">Net Affordable Units: ' + props.net_affordable_units + '</span>'  +
			       '<br /><span class="popup-label">Quarter Completed: ' + props.quarter + '</span>'  +
				   '<br /><span class="popup-label">Zone: ' + props.zone + '</span>'  +
                   '</div>';
			   }
	     else {
			 var popupContent = '<div class="popup-container">' + 
                   '<h4>' + props.address + '</h4>' + 
                   '<br /><span class="popup-label">Net Units: ' + props.net_units + '</span>' +
                   '<br /><span class="popup-label">Net Affordable Units: ' + props.net_affordable_units + '</span>'  +
			 	   '<br /><span class="popup-label">Status: ' + props.status + '</span>'  +
				   '<br /><span class="popup-label">Zone: ' + props.zone + '</span>'  +
                   '</div>';
			   }
			
	    var popup = L.popup().setContent(popupContent).setLatLng(latlng);
	    target.bindPopup(popup).openPopup(); 

	    //pan to feature and zoom in 1 if map is currently at/above initial zoom
	    var zoomLevel = map.getZoom();
	    if (map.getZoom() <= initialZoomLevel) { zoomLevel++; }
	    map.setView(latlng, zoomLevel);

	}//end of defining interactions: clicks and hovers

}//end of createFeatures()

//create all the styles and functionality for the point data
createFeatures();

//switch between median rent and change in rent datasets. currently not working
function switchData() {
    if (dev_options == 'recent') {
        dev_options = 'current';
	    //remove the old data and legend from the map and add the other dataset
	    map.removeLayer(geojsonLayer);
	    createFeatures();
	    geojsonLayer = L.geoJson(dataset2, layerOptions); 
	    map.addLayer(geojsonLayer);  
    }
    else {
        dev_options = 'recent';
	    //remove the old data and legend from the map and add the other dataset
	    map.removeLayer(geojsonLayer);
	    createFeatures();
	    geojsonLayer = L.geoJson(dataset, layerOptions); 
	    map.addLayer(geojsonLayer); 
    }     

}

/**********************************************************
Section 3. CREATE LEGEND AND ADD DATA TO MAP
***********************************************************/

//************************************************************************
//create legend
//************************************************************************
function keys(myObj) {//extract keys from obj
    var ks = [];
    for (var k in myObj) {if (myObj.hasOwnProperty(k)) {ks.push(k);}}
    return ks;
}

legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    var title = 'Net Units'
    var div = L.DomUtil.create('div', 'overlay legend');
    div.innerHTML = '<h4>' + title + '</h4>';
    //loop from high to low to put legend ranges in descending order
    for (var i=keys(unitcats).length-1; i>=0; i--) { 
        div.innerHTML += '<i style="background:' + unitcats[i]['color'] + '"></i> ' + unitcats[i]['label'] + '<br>';
    }
    return div;
};
legend.addTo(map);//end of legend creation

// create the layer and add to map
var geojsonLayer = L.geoJson(dataset, layerOptions); 
map.addLayer(geojsonLayer);

// fit the initial map view to the data points
map.fitBounds(geojsonLayer.getBounds());
