/**********************************************************
Section 1. SET UP THE BACKGROUND MAP and Initial Parameters
***********************************************************/

// create the Leaflet map container and initialize some other variables
var map = L.map('map');

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	var initialZoomLevel = 12;
} else {
	var initialZoomLevel = 10;
}

var layerOptions = null;
var legend = null;

// Set current input data - either recently completed development or current development. Initialize map with recent. 
var dev_options = 'recent';
var catProps = unitcats;
var catName = 'unitcat';

//initialize map with quarter 2 2016 and residential data
var quarter = 'All Quarters';
var type = 'Residential';

//add tile layer basemap to the map
var basemapUrl = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
var basemapAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';
var basemapProperties = {minZoom: 10, maxZoom: 16, attribution: basemapAttribution};
var basemap = L.tileLayer(basemapUrl, basemapProperties);
map.addLayer(basemap);

/**************************************************************
Section 2: Generate Map Elements (Change with button) 
**************************************************************/

//create a function to create all the styles and functionality for the point data so it's reusable when we switch datasets dynamically
function createFeatures() {
	//Define Title
	var title = '<h4>SF Development Map</h4>';
	
	var button = '<button onclick="updateMap();">Update Map</button>';
	
	//Create popup control for when hovering over polygon
	
   var menu1 = '<select id="mySelect">' +
	'<optgroup label="Recently Completed">' +
	'<option value="All Quarters">All Quarters</option>' + 
    '<option value="Q2-2016">Q2-2016</option>' +
    '<option value="Q1-2016">Q1-2016</option>' +
    '<option value="Q4-2015">Q4-2015</option>' +
    '<option value="Q3-2015">Q3-2015</option>' +
    '<option value="Q2-2015">Q2-2015</option>' +
    '<option value="Q1-2015">Q1-2015</option>' +
    '<option value="Q4-2014">Q4-2014</option>' +
    '<option value="Q3-2014">Q3-2014</option>' +
    '<option value="Q2-2014">Q2-2014</option>' +
	'<option value="Q1-2014">Q1-2014</option>' +
	'<option value="Q4-2013">Q4-2013</option>' +
	'<option value="Q3-2013">Q3-2013</option>' +
	'<option value="Q2-2013">Q2-2013</option>' +
	'<option value="Q1-2013">Q1-2013</option>' +
	'<option value="Q4-2012">Q4-2012</option>' +
    '</optgroup>' +
	'<optgroup label="Currently Proposed (Q3-2016)">' +
	'<option value="All Proposed">All Proposed</option>' +
	'<option value="CONSTRUCTION">Under Construction</option>' +
	'<option value="PL APPROVED">PL Approved</option>' +
	'<option value="PL FILED">PL Filed</option>' +
	'<option value="BP ISSUED">BP Issued</option>' +
	'<option value="BP APPROVED">BP Approved</option>' +
	'<option value="BP FILED">BP Filed</option>' +
	'<option value="BP REINSTATED">BP Reinstated</option>' +
	'</optgroup>' +
    '</select>';
	
	var menu2 = '<select id="mySelect2">' +
	'<option value="Residential">Residential</option>' + 
    '<option value="Non-Residential">Non-Residential</option>' +
	'</select>';

	var catchphrase = 'Click any dot for details.'
	
	//var asterisk = '*Non-residential includes educational, medical, professional, industrial, retail, and hotel development.'
	
	//Add title box
	info = L.control();

	info.onAdd = function (map) {
		var div = L.DomUtil.create('div', 'info');
		div.innerHTML = title + catchphrase + (inIframe() ? '' : ' <a href="http://www.briangoggin.com/2017/02/03/q3-2016-sf-development-data-is-out/">More Info.</a>') + '<br><b>Filters</b>' + 
		'<br>Status:' + menu1 + '<br>Type:' + menu2 + '<br>' + button /*+ '<br><small>' + asterisk + '</small>'*/;
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
	
	function filter(feature, layer) {
		if (quarter == "All Quarters") {
			return true;
		} else if (quarter == "All Proposed") {
			return true;
		} else if (dev_options == "recent") {
			return feature.properties.quarter == quarter;
		} else {
			return feature.properties.status == quarter;
		}
	}
	
	// function to add data points to map layer with proper styling
	function pointToLayer(feature, latlng) {
			var category = feature.properties[catName];
			markerStyle.fillColor = catProps[category].color;
			markerStyle.radius = getRadius();
	        return L.circleMarker(latlng, markerStyle);
	}

	function getRadius() {
		//Make dots bigger if viewed on mobile
		if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		    if (map.getZoom()) { radius = Math.pow(map.getZoom(), 0.9); } //if map already exists, get current zoom level
		    else { radius = Math.pow(initialZoomLevel, 0.9); } //if it's the initial startup, use initial zoom level
		    return radius;
		} else {
		    if (map.getZoom()) { radius = Math.pow(map.getZoom(), 0.8); } //if map already exists, get current zoom level
		    else { radius = Math.pow(initialZoomLevel, 0.8); } //if it's the initial startup, use initial zoom level
		    return radius;
		}	
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
		var lat_lon = target.feature.geometry.coordinates;
		var lat = lat_lon[1];
		var zoomLevel = map.getZoom();
		
		//set zoom level for click
		if (zoomLevel <= 12) {
			var adj_factor = 0.012;
		} else if (zoomLevel == 13) {
			var adj_factor = 0.008;
		} else if (zoomLevel == 14) {
			var adj_factor = 0.006;
		} else if (zoomLevel == 15) {
			var adj_factor = 0.004;
		} else {
			var adj_factor = 0.002;
		}
		//var adj_factor = (Math.pow(map.getZoom(), -2));
		var lat_adj = lat_lon[1]+adj_factor; //when clicking on dot, adjust view to be just above popup so that whole popup is visible
		var lon = lat_lon[0];
		var coordinates = {lat: lat, lng: lon};
		
		//define popup content
		if (dev_options == 'recent' & type == 'Residential') {
			var popupContent ='<span class="popup-label"><b>' + props.address + '</b></span>' +
            '<br /><span class="popup-label">Net Units: ' + props.net_units + '</span>' +
            '<br /><span class="popup-label">Net Affordable Units: ' + props.net_affordable_units + '</span>'  +
	        '<br /><span class="popup-label">Quarter Completed: ' + props.quarter + '</span>'  +
		    '<br /><span class="popup-label">Zone: ' + props.zone + '</span>'  +
			'<div id = "pano" class = "pano"></div>' +
			'<button>Show Description</button>' +
			'<br /><span class="description">' + props.desc + '</span>';
			   }
	     else if (dev_options == 'recent' & type == "Non-Residential") {
 			var popupContent ='<span class="popup-label"><b>' + props.address + '</b></span>' +
            '<br /><span class="popup-label">Net Square Footage: ' + props.comm_sqft_net + '</span>' +
			'<br /><span class="popup-label">Quarter Completed: ' + props.quarter + '</span>'  +
 		    '<br /><span class="popup-label">Zone: ' + props.zone + '</span>'  +
 			'<div id = "pano" class = "pano"></div>' +
 			'<button>Show Description</button>' +
 			'<br /><span class="description">' + props.desc + '</span>';
			   }
  	     else if (dev_options == 'current' & type == "Residential") {
   			var popupContent ='<span class="popup-label"><b>' + props.address + '</b></span>' +
            '<br /><span class="popup-label">Net Units: ' + props.net_units + '</span>' +
            '<br /><span class="popup-label">Net Affordable Units: ' + props.net_affordable_units + '</span>'  +
  			'<br /><span class="popup-label">Status: ' + props.status + '</span>'  +
   		    '<br /><span class="popup-label">Zone: ' + props.zone + '</span>'  +
   			'<div id = "pano" class = "pano"></div>' +
   			'<button>Show Description</button>' +
   			'<br /><span class="description">' + props.desc + '</span>';
  			   }
		  else {
  			var popupContent ='<span class="popup-label"><b>' + props.address + '</b></span>' +
        	'<br /><span class="popup-label">Net Square Footage: ' + props.comm_sqft_net + '</span>' +
 			'<br /><span class="popup-label">Status: ' + props.status + '</span>'  +
  		    '<br /><span class="popup-label">Zone: ' + props.zone + '</span>'  +
  			'<div id = "pano" class = "pano"></div>' +
  			'<button>Show Description</button>' +
  			'<br /><span class="description">' + props.desc + '</span>';
 			   }
		 

			
	    var popup = L.popup({closeOnClick: false}).setContent(popupContent).setLatLng(latlng);
	    target.bindPopup(popup).openPopup(); 
		
	    //pan to feature and zoom in 1 if map is currently at/above initial zoom
		if (zoomLevel <= initialZoomLevel) { zoomLevel++; }
	    map.setView([lat_adj, lon], zoomLevel);
		
		//toggle description on and off when user clicks button
		
		$("button").click(function(){
			  $(".description").toggle();
		 });
		
		 
		 //Google Panorama Element 
		 var panoelement = document.getElementsByClassName("pano");
		 var panorama = new google.maps.StreetViewPanorama(
		 	panoelement[panoelement.length - 1], {
		 		position: coordinates,
		 		pov: {
		 			heading: 34,
		 			pitch: 10
		 		}, 
		 		addressControl: false
		 	});
		 
		 //updates popup content so that toggling works when opening popup a second time in the same session
		 target.updatePopup();

	}//end of defining interactions: clicks and hovers
	
}//end of createFeatures()

//create all the styles and functionality for the point data
createFeatures();

//************************************************************************
//Section 3. create legend and source of data
//************************************************************************


function createlegend() {
	function keys(myObj) {//extract keys from obj
	    var ks = [];
	    for (var k in myObj) {if (myObj.hasOwnProperty(k)) {ks.push(k);}}
	    return ks;
	}

	type = document.getElementById("mySelect2").value;
	
	if (type == "Residential") {
		legend = L.control({position: 'bottomright'});
		legend.onAdd = function (map) {
		    var title = 'Net Units Added';
		    var div = L.DomUtil.create('div', 'info legend');
		    div.innerHTML = '<h4>' + title + '</h4>';
		    //loop from high to low to put legend ranges in descending order
		    for (var i=keys(unitcats).length-1; i>=0; i--) { 
		        div.innerHTML += '<i style="background:' + unitcats[i]['color'] + '"></i> ' + unitcats[i]['label'] + '<br>';
		    }
		    return div;
		};
		legend.addTo(map);//end of legend creation
	} else {
		legend = L.control({position: 'bottomright'});
		legend.onAdd = function (map) {
		    var title = 'Net Square Footage Added';
		    var div = L.DomUtil.create('div', 'info legend');
		    div.innerHTML = '<h4>' + title + '</h4>';
		    //loop from high to low to put legend ranges in descending order
		    for (var i=keys(unitcats2).length-1; i>=0; i--) { 
		        div.innerHTML += '<i style="background:' + unitcats2[i]['color'] + '"></i> ' + unitcats2[i]['label'] + '<br>';
		    }
		    return div;
		};
		legend.addTo(map);//end of legend creation
	}
}

createlegend();


//Add source of data box
source = L.control({position: 'bottomleft'});

source.onAdd = function (map) {
	var div = L.DomUtil.create('div', 'info');
	div.innerHTML = 'Source: <a href="http://sf-planning.org/pipeline-report">SF Development Pipeline</a>';
	return div;
};

source.addTo(map);

//************************************************************************
//Section 4: switch between recently completed and currently proposed development
//************************************************************************

/*
function updateMap() {
quarter = document.getElementById("mySelect").value;
type = document.getElementById("mySelect2").value;

array = ['All Proposed', 'CONSTRUCTION', 'PL FILED', 'PL APPROVED', 'BP FILED', 'BP ISSUED', 'BP APPROVED', 'BP REINSTATED']; //define array for recent selections

//remove the old data and legend from the map and add the other dataset
if (array.indexOf(quarter) >=0 & type == "Residential")  {
	dev_options = "current";
	map.removeLayer(geojsonLayer);
	geojsonLayer = L.geoJson(dataset2, layerOptions); 
	map.addLayer(geojsonLayer);  
} else  {
	dev_options = 'recent';
	map.removeLayer(geojsonLayer);
	geojsonLayer = L.geoJson(dataset, layerOptions); 
	map.addLayer(geojsonLayer); 
}

}
*/


function updateMap() {
quarter = document.getElementById("mySelect").value;
type = document.getElementById("mySelect2").value;

array = ['All Proposed', 'CONSTRUCTION', 'PL FILED', 'PL APPROVED', 'BP FILED', 'BP ISSUED', 'BP APPROVED', 'BP REINSTATED']; //define array for recent selections
//remove the old data and legend from the map and add the other dataset
if (array.indexOf(quarter) >=0 & type == "Residential") {
	dev_options = "current";
	catProps = unitcats;
	map.removeLayer(geojsonLayer);
	geojsonLayer = L.geoJson(dataset2, layerOptions); 
	map.addLayer(geojsonLayer);  
	map.removeControl(legend);
	createlegend();
} else if (array.indexOf(quarter) >=0 & type == "Non-Residential") {
	dev_options = "current";
	catProps = unitcats2;
	map.removeLayer(geojsonLayer);
	geojsonLayer = L.geoJson(dataset4, layerOptions); 
	map.addLayer(geojsonLayer); 
	map.removeControl(legend);
	createlegend();
} else if (array.indexOf(quarter) == -1 & type == "Residential")  {
	dev_options = 'recent';
	catProps = unitcats;
	map.removeLayer(geojsonLayer);
	geojsonLayer = L.geoJson(dataset, layerOptions); 
	map.addLayer(geojsonLayer); 
	map.removeControl(legend);
	createlegend(); 
} else {
	dev_options = 'recent';
	catProps = unitcats2;
	map.removeLayer(geojsonLayer);
	geojsonLayer = L.geoJson(dataset3, layerOptions); 
	map.addLayer(geojsonLayer); 
	map.removeControl(legend);
	createlegend();
}

}




/*Attempt to fix bug when maximizing window
map.on('resize', function () {
    createFeatures();
});
*/
/**********************************************************
Section 5. CREATE MAP AND FIT BOUNDS
***********************************************************/

// create the layer and add to map
var geojsonLayer = L.geoJson(dataset, layerOptions); 
map.addLayer(geojsonLayer);

// fit the initial map view to the data points
map.fitBounds(geojsonLayer.getBounds(), {maxZoom: 12});
