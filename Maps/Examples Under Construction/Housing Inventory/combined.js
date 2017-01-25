/**********************************************************
Section 1. SET UP THE BACKGROUND MAP and Initial Parameters
***********************************************************/

// create the Leaflet map container and initialize some other variables
var map = L.map('map');
var initialZoomLevel = 12;
var layerOptions = null;
var legend = null;

// Set color options for dots and legend
var catProps = unitcats;
var catName = 'unitcat';

//initialize with 2015 construction
var year = 2015;

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

	//Define Title
	var title = '<h4>SF Residential Development: Recently Completed</h4>';
	
	var button = '<button onclick="updateMap();">Update Map</button>'

	//Create popup control for when hovering over polygon
	var menu = '<input list="hosting-plan" type="text" value='+ year + ' id="mySelect"><datalist id="hosting-plan"><option value="2011"/><option value="2012"/><option value="2013"/><option value="2014"/><option value="2015"/></datalist>';

	var catchphrase = 'Click any dot for details.'

	var info = L.control();

	info.onAdd = function (map) {
		var div = L.DomUtil.create('div', 'info');
		div.innerHTML = title  + catchphrase + '<br>Year: '+ menu + button + (inIframe() ? '' : ' <a href="http://www.briangoggin.com/2016/12/11/mapping-residential-development-in-san-francisco/">More Info</a>');
		return div;
	};

	info.addTo(map);


	//specify what the circle markers should look like (radius and fill color are dynamically set later)
	var markerStyle = {radius: null, fillOpacity: 0.7, color: '#666666', opacity: 1, weight: 1, fillColor: null};
	var markerStyleHover = {radius: null, fillOpacity: 0.9, color: '#333333', opacity: 1, weight: 3, fillColor: null};


	// specify how to load the individual features: give each its styling and a text popup
	layerOptions = {
		filter: filter,
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

	function filter(feature, layer) {
		return feature.properties.year == year;
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

	var panorama;
	//on click, pan/zoom to feature and show popup
	function clickFeature(e) {
	    var target = e.target;
	    var latlng = target._latlng;
	    var props = target.feature.properties;
		var lat_lon = target.feature.geometry.coordinates;
		var lat = lat_lon[1];
		var lon = lat_lon[0];
		var coordinates = {lat: lat, lng: lon};

		var popupContent = '<div class="popup-container">' + 
               '<span class="popup-label"><b>' + props.address + '</b></span>' +
               '<br /><span class="popup-label">Net Units: ' + props.net_units + '</span>' +
               '<br /><span class="popup-label">Net Affordable Units: ' + props.affordable_units + '</span>'  +
			   '<br /><span id = "t_text" class="popup-label">' + props.year + '</span>' +
			   '<br /><div id = "pano" class = "pano"></div>'  +
               '</div>';

	    var popup = L.popup({closeOnClick: false}).setContent(popupContent).setLatLng(latlng);
	    target.bindPopup(popup).openPopup(); 
		
	    //pan to feature and zoom in 1 if map is currently at/above initial zoom
	    var zoomLevel = map.getZoom();
	    if (map.getZoom() <= initialZoomLevel) { zoomLevel++; }
	    map.setView(latlng, zoomLevel);
		
		//Google Panorama Element
		var panoelement = document.getElementsByClassName("pano");
		var panorama = new google.maps.StreetViewPanorama(
			panoelement[panoelement.length - 1], {
				position: coordinates,
				pov: {
					heading: 34,
					pitch: 10
				}, 
				addressControl: false, 
				source: 'outdoor'
			});

		 target.updatePopup();

	}//end of defining interactions: clicks and hovers
	
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
	    var title = 'Net Units Added'
	    var div = L.DomUtil.create('div', 'info legend');
	    div.innerHTML = '<h4>' + title + '</h4>';
	    //loop from high to low to put legend ranges in descending order
	    for (var i=keys(unitcats).length-1; i>=0; i--) { 
	        div.innerHTML += '<i style="background:' + unitcats[i]['color'] + '"></i> ' + unitcats[i]['label'] + '<br>';
	    }
	    return div;
	};
	legend.addTo(map);//end of legend creation

}//end of createFeatures()

//create all the styles and functionality for the point data
createFeatures();


//Update Map features based on selection
function updateMap() {
  year = document.getElementById("mySelect").value;
  map.removeLayer(geojsonLayer);
  geojsonLayer = L.geoJson(dataset, layerOptions); 
  map.addLayer(geojsonLayer);
}

/**********************************************************
Section 3. CREATE LEGEND AND ADD DATA TO MAP
***********************************************************/

// create the layer and add to map
var geojsonLayer = L.geoJson(dataset, layerOptions); 
map.addLayer(geojsonLayer);

// fit the initial map view to the data points
map.fitBounds(geojsonLayer.getBounds());
