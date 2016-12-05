/***********************************************
SET UP THE BACKGROUND MAP
***********************************************/

// create the Leaflet map container
var map = L.map('map');
//initiate geojson layer now so that we can reference it in the subsequent functions
var geojsonLayer ;
//variable that defines which dataset currently used. Can be recent or current. Initiate map with recently completed development
var dev_options = 'recent';

//initiate category name for mapping and name of the color dictionary (separate JS file)
var catName = 'unitcat';
var catProps = unitcats;

//initiate controls on the map 
var layerOptions = null;
var legend = null;
var info = null;

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
	var button1 = '<button onclick="javascript:switchData();">Switch to: Currently Proposed</button>'
	var button2 = '<button onclick="javascript:switchData();">Switch to: Recently Completed</button>'
	
	if (dev_options == 'recent') {button = button1;} else {button = button2;}
	
	//Define Title
	var title1 = '<h4>SF Residential Development: Recently Completed</h4>'
	var title2 = '<h4>SF Residential Development: Currently Proposed</h4>'
	
	
	if (dev_options == 'recent') {title = title1;} else {title = title2;}

	info = L.control();

	info.onAdd = function (map) {
	    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
	    this.update();
	    return this._div;
	};

	// method that we will use to update the control based on feature properties passed
	info.update = function (props) {
	    this._div.innerHTML = title + (props ?
	        '<b>' + props.name + '</b><br />' + props.net_units + ' net units added'
	        : 'Hover over a neighborhood') + '<br>'+ button + (inIframe() ? '' : ' <a href="https://www.ocf.berkeley.edu/~bgoggin/">More Info</a></span>');
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

// create the layer and add to map
geojsonLayer = L.geoJson(dataset, layerOptions); 
map.addLayer(geojsonLayer);


// fit the initial map view to the data points
map.fitBounds(geojsonLayer.getBounds());