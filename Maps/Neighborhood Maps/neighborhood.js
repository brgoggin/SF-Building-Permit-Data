/***********************************************
SET UP THE BACKGROUND MAP
***********************************************/

// create the Leaflet map container
var map = L.map('map');
//initiate geojson layer now so that we can reference it in the subsequent functions
var geojsonLayer ;

//initiate category name for mapping and name of the color dictionary (separate JS file)
var catName = 'unitcat';
var catProps = unitcats;

//initiate controls on the map 
var layerOptions = null;
var legend = null;
var info = null;

//Initialize map with residential and recently completed data
var type = 'Residential';
var statusvar = "Recently Completed";

//add tile layer basemap to the map
var basemapUrl = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
var basemapAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';
var basemapProperties = {minZoom: 2, maxZoom: 16, attribution: basemapAttribution};
var basemap = L.tileLayer(basemapUrl, basemapProperties);
map.addLayer(basemap);



/***********************************************
CREATE DATA OVERLAY 
***********************************************/
//create a function to create all the styles and functionality for the point data so it's reusable when we switch datasets dynamically
function createFeatures() {

	function style(feature) {
		
		if (type == "Residential") {
			catProps = unitcats;
		}
		
		else {
			catProps = unitcats2;
		}
		
		var category = feature.properties[catName];
		var color = catProps[category].color;
	    return {
	        fillColor: color,
	        weight: 2,
	        opacity: 1,
	        color: 'black',
	        dashArray: '3',
	        fillOpacity: 0.7
	    };
	}

	//Create popup control for when hovering over polygon
	
	var menu1 = '<select id="mySelect">' +
	'<option value="Recently Completed">Recently Completed</option>' + 
    '<option value="Currently Proposed">Currently Proposed</option>' +
	'</select>';
	
	var menu2 = '<select id="mySelect2">' +
	'<option value="Residential">Residential</option>' + 
    '<option value="Non-Residential">Non-Residential</option>' +
	'</select>';
	
	var button = '<button onclick="updateMap();">Update Map</button>';
	
	//Define Title
	var title = '<h4>SF Residential Development</h4>';

	info = L.control();

	info.onAdd = function (map) {
	    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
	    this.update();
	    return this._div;
	};

	// method that we will use to update the control based on feature properties passed
	info.update = function (props) {
		
		if (type == "Residential") {
		    this._div.innerHTML = title + (props ? '<b>' + props.name + '</b><br />' + props.net_units + ' net units added' : 'Hover over a neighborhood' + (inIframe() ? '' : ' <a href="https://www.ocf.berkeley.edu/~bgoggin/">More Info</a>')) + 
			'<br><b>Filters</b>' + '<br>Status:'+ menu1 + '<br>Type:' + menu2 +  '<br>' + button ;
		} 
		
		else {
		    this._div.innerHTML = title + (props ? '<b>' + props.name + '</b><br />' + props.comm_sqft_net + ' net square footage added' : 'Hover over a neighborhood' + (inIframe() ? '' : ' <a href="https://www.ocf.berkeley.edu/~bgoggin/">More Info</a>')) + 
			'<br><b>Filters</b>' + '<br>Status:'+ menu1 + '<br>Type:' + menu2 + '<br>' + button ;
		}

    };

	info.addTo(map);
	

	//define hover and click functionality

	function highlightFeature(e) {
	    var layer = e.target;

	    layer.setStyle({
	        weight: 5,
	        color: 'black',
	        dashArray: '',
	        fillOpacity: 0.7
	    });

		// do not perform web highlighting in the given web browsers
	    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
	        layer.bringToFront();
	    }
	
		info.update(layer.feature.properties);
	}

	function resetHighlight(e) {
	    geojsonLayer.resetStyle(e.target);
	
		info.update();
	}

	// click listener that zooms upon clicking
	function zoomToFeature(e) {
	    map.fitBounds(e.target.getBounds());
	}

	function onEachFeature(feature, layer) {
	    layer.on({
	        mouseover: highlightFeature,
	        mouseout: resetHighlight,
	        click: zoomToFeature
	    });
	}

	layerOptions = {
		style: style, onEachFeature: onEachFeature
	};

	//check if someone's viewing this page directly instead of in iframe
	function inIframe() {
	    try {
	        return window.self !== window.top;
	    } catch (e) {
	        return true;
	    }
	}

}//end of createFeatures()

//create all the styles and functionality for the point data
createFeatures();


//************************************************************************
//create legend
//************************************************************************
function createlegend() {
	function keys(myObj) {//extract keys from obj
	    var ks = [];
	    for (var k in myObj) {if (myObj.hasOwnProperty(k)) {ks.push(k);}}
	    return ks;
	}

	//type = document.getElementById("mySelect2").value;
	
	if (type == "Residential") {
		legend = L.control({position: 'topright'});
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
		legend = L.control({position: 'topright'});
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


function updateMap() {
	statusvar = document.getElementById("mySelect").value;
	type = document.getElementById("mySelect2").value;
	
	if (statusvar == "Recently Completed" & type == "Residential") {
		//something with legend
		map.removeLayer(geojsonLayer);
		geojsonLayer = L.geoJson(dataset1, layerOptions); 
		map.addLayer(geojsonLayer);  
		map.removeControl(legend);
		createlegend();
	} else if (statusvar == "Currently Proposed" & type == "Residential") {
		//something with legend
		map.removeLayer(geojsonLayer);
		geojsonLayer = L.geoJson(dataset2, layerOptions); 
		map.addLayer(geojsonLayer);  
		map.removeControl(legend);
		createlegend();
	} else if (statusvar == "Recently Completed" & type == "Non-Residential") {
		//something with legend
		map.removeLayer(geojsonLayer);
		geojsonLayer = L.geoJson(dataset3, layerOptions); 
		map.addLayer(geojsonLayer);  
		map.removeControl(legend);
		createlegend();
	} else if (statusvar == "Currently Proposed" & type == "Non-Residential") {
		//something with legend
		map.removeLayer(geojsonLayer);
		geojsonLayer = L.geoJson(dataset4, layerOptions); 
		map.addLayer(geojsonLayer);  
		map.removeControl(legend);
		createlegend();
	}
}


/*
//switch between median rent and change in rent datasets. currently not working
function switchData() {
    if (dev_options == 'recent') {
        dev_options = 'current';
	    //remove the old data and legend from the map and add the other dataset
	    map.removeLayer(geojsonLayer);
		map.removeControl(legend);
		map.removeControl(info);
	    createFeatures();
	    geojsonLayer = L.geoJson(dataset2, layerOptions); 
	    map.addLayer(geojsonLayer);  
    }
    else {
        dev_options = 'recent';
	    //remove the old data and legend from the map and add the other dataset
	    map.removeLayer(geojsonLayer);
		map.removeControl(legend);
		map.removeControl(info);
	    createFeatures();
	    geojsonLayer = L.geoJson(dataset, layerOptions); 
	    map.addLayer(geojsonLayer); 
    }     

}
*/

// create the layer and add to map
geojsonLayer = L.geoJson(dataset1, layerOptions); 
map.addLayer(geojsonLayer);

// fit the initial map view to the data points
map.fitBounds(geojsonLayer.getBounds());