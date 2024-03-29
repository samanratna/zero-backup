let currentLocation = [];
let destinationLocation =[];
let mbBearing = null;
let map;
let geocoder;
let destinationMarker, currentMarker;
const initialZoomLevel = 17;
const navigationZoomLevel = 18;
const navigationPitch = 0;
let maneuvers;
let destinationName;
let distanceToDestination = Infinity;
const RANGE_ON_FULL_AH = 180;
// startMap();

/*
Request for API Key from the backend
*/
// function startMap() {
//   console.log('Executing getKeyFunction');
//   eel.getAPIKey()(onAPIKeyResponse);
// }

// dummy startMap function for UI development
function startMap() {
  updateMapTheme();
  if(isMapLoaded){
    showInternetWarning(true, 'Waiting for GPS signal', false, false);
    eel.getCurrentLocation(true);
    return;
  }
  console.log('Executing getKeyFunction');
  let key = "pk.eyJ1IjoieWF0cmkiLCJhIjoiY2swZzY1MDNqMDQ2ZzNubXo2emc4NHZwYiJ9.FtepvvGORqK03qJxFNvlEQ";
  onAPIKeyResponse(key)
}

/*
On receiving API Key from the backend
*/
function onAPIKeyResponse(key){
  if(key == null){
    console.log('Unable to retreive Mapbox API Key.')
    return;
  }

  mapboxgl.accessToken = key;
  console.log('Received Mapbox API Key');
  showInternetWarning(true, 'Waiting for GPS signal', false, false);
  eel.getCurrentLocation(true) //uncomment this after removing dummy
  // onLocationResponse([27.71181, 85.3075]) //dummy for UI development
}

/*
On receiving location from the backend
*/
eel.expose(onLocationResponse);

function onLocationResponse(hasFix, location){
  if(!hasFix){
    console.log('GPS Signal Lost.');
    showInternetWarning(true, "GPS Signal not available.", true, true);
    return;
  }
  showInternetWarning(false);
  if(location == null){
    console.log('Unable to retreive current location.')
    return;
  }
  eel.getCurrentLocation(false);
  currentLocation = [location[1], location[0]];
  console.log("Current Location Received: " + currentLocation);
  if(isMapLoaded){
    currentMarker.setLngLat(currentLocation);
    map.easeTo({
      center: currentLocation,
      // speed: 0.01,
      // maxDuration: 1900,
      // essential: true
    });
  } else{
    initMap();
  }
}
function initMap(){

  // moveNotificationCard('normal-mode');
  var elCurrentMarker = document.createElement('div');
  elCurrentMarker.className = 'current-marker';

  var elDestinationMarker = document.createElement('div');
  elDestinationMarker.className = 'destination-marker';

  destinationMarker = new mapboxgl.Marker({
    element: elDestinationMarker,
    // draggable: true
  });

  // Initialize the map
  map = new mapboxgl.Map({
    container: 'js-map-card', // element where map is loaded
    // style: 'mapbox://styles/yatri/ck7n2g8mw0mf41ipgdkwglthq',
    // style:'mapbox://styles/yatri/cke13s7e50j3s19olk91crfkb?optimize=true',
    style: mapStyleURI,
    // style: 'mapbox://styles/mapbox/streets-v11?optimize=true', // stylesheet location
    center: currentLocation, // starting position [lng, lat]
    zoom: initialZoomLevel,
    // pitch: navigationPitch,
    attributionControl: false,
    // touchZoomRotate: false,
    touchPitch: false
    // keyboard: true,
    // antialias: true
    });
    // map.touchZoomRotate.disable();
    map.addControl(new mapboxgl.AttributionControl({compact: false}), 'top-right');
    map.addControl(new mapboxgl.NavigationControl({showZoom: false}));
  // Initialize a Geocoder
  geocoder = new MapboxGeocoder({ // Initialize the geocoder
      accessToken: mapboxgl.accessToken, // Set the access token
      // types: 'poi',
      countries: 'NP',
      collapsed: true,
      clearOnBlur: true,
      mapboxgl: mapboxgl, // Set the mapbox-gl instance
      marker: false, // Do not use the default marker style
  });
  
  // Add the geocoder to the map
  map.addControl(geocoder, 'top-left');
  
  // initialize the map canvas to interact with later
  var canvas = map.getCanvasContainer();

  // Current Location Marker
  currentMarker = new mapboxgl.Marker({
    element: elCurrentMarker,
    // rotationAlignment: map,
    // pitchAlignment: viewport,
    // draggable: true
  }) // initialize a new marker //elPsyCongroo
    .setLngLat(currentLocation) // Marker [lng, lat] coordinates
    .addTo(map); // Add the marker to the map

  addListeners();
}

function addListeners(){
  // After the map style has loaded on the page,
  // add a source layer and default styling for a single point
  // map.on('load', function() {
  //   map.addSource('single-point', {
  //     type: 'geojson',
  //     data: {
  //       type: 'FeatureCollection',
  //       features: []
  //     }
  //   });
  // });
  
  // Listen for the `result` event from the Geocoder
  // `result` event is triggered when a user makes a selection
  //  Add a marker at the result's coordinates
  geocoder.on('result', function(e) {
    geocoder.clear();
    document.getElementsByClassName('mapboxgl-ctrl-geocoder--input')[0].blur();
    // console.log(e);
    destinationName = e.result.text;
    // console.log(destinationName);
    // console.log(e.place_name);
    // addPlaceToPanel(e.result.place_name);
    if(map.getSource('single-point')){
      map.removeSource('single-point');
    }
    map.addSource('single-point', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    map.getSource('single-point').setData(e.result.geometry);
    var coordsObj = e.result.geometry.coordinates;
    //   console.log(coordsObj);
    // canvas.style.cursor = '';
    destinationLocation = coordsObj;
    destinationMarker.setLngLat(coordsObj)
    .addTo(map);

    //getCurrentLocation
    // startNavigation(true);
    getRoute(coordsObj);
  }); 

  map.on('rotate', onRotate);
  
  // document.getElementById('navigation-north').addEventListener('click', function(){
  //   map.resetNorth();
  // });

  initKeyboardListener();
  isMapLoaded = true;
  updateMapTheme();
  updateUIMode('map-mode');
}

let navigationRoute = undefined;
// create a function to make a directions request
function getRoute(end) {
  console.log('Executing getRoute()')
  closeKeyboard();
  closeSearchBox();
  // make a directions request using cycling profile
  // an arbitrary start will always be the same
  // only the end or destination will change
  var url = 'https://api.mapbox.com/directions/v5/mapbox/driving/' + currentLocation[0] + ',' + currentLocation[1] + ';' + end[0] + ',' + end[1] + '?steps=true&geometries=geojson&banner_instructions=true&overview=full&access_token=' + mapboxgl.accessToken;

  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.onload = function() {
    var json = JSON.parse(req.response);
    navigationRoute = json;
    console.log(navigationRoute);
    if(json.code.toLowerCase() != 'ok'){
      return;
    }
    maneuvers = json.routes[0].legs[0].steps;
    var data = json.routes[0];
    if(currentMode != 'navigation-mode'){
      addSummaryToPanel(data);
    }
    // traverseAllSteps(maneuvers);
    // addStepMarkers(maneuvers); //this will add markers to the steps (debug functionality)
    // findManeuverPoint(maneuvers);

    // elPsyCongroo
    currentMarker.on('dragend', function(){
      currentLocation = currentMarker.getLngLat();
      // findManeuverPoint(maneuvers);
      navigate();
    });
    // elPsyCongroo

    var route = data.geometry.coordinates; //navigationRoute.routes[0].geometry.coordinates

    // var geojson = {
    //   type: 'Feature',
    //   properties: {},
    //   geometry: {
    //     type: 'LineString',
    //     coordinates: route
    //   }
    // };
    // // if the route already exists on the map, reset it using setData
    // if (map.getSource('route')) {
    //   map.getSource('route').setData(geojson);
    // } else { // otherwise, make a new request
    //   map.addLayer({
    //     id: 'route',
    //     type: 'line',
    //     source: {
    //       type: 'geojson',
    //       data: {
    //         type: 'Feature',
    //         properties: {},
    //         geometry: {
    //           type: 'LineString',
    //           coordinates: geojson
    //         }
    //       }
    //     },
    //     layout: {
    //       'line-join': 'round',
    //       'line-cap': 'round'
    //     },
    //     paint: {
    //       'line-color': '#40e0d0',
    //       'line-width': 30,
    //       'line-opacity': 0.75
    //     }
    //   });
    //   map.getSource('route').setData(geojson);
    // }
    loadRoute(navigationRoute.routes[0].geometry.coordinates);

    //fit the route in the view : start
    var bounds = route.reduce(function (bounds, coord) {
      return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(route[0], route[0]));
       
    map.fitBounds(bounds, { padding: 100 });
    // fit the route in the view :  end

    // updateRouteToBackend(json.routes[0]);
    resetCurrentStep(); //it's important to call this function before calling navigate() for a new route
    navigate();
    startNavigation(true);
  };
  req.send();
}

function addSummaryToPanel(route){
  let content = route.distance;
  let distance = Infinity;
  let estimatedStateOfCharge = 0;
  if(content > 999){
    distance = content / 1000;
    document.getElementById('js-trip-distance').innerHTML = distance.toFixed(1);
    document.getElementById('js-trip-distance-unit').innerHTML = 'km';
    document.getElementById('js-route-distance').innerHTML = distance.toFixed(1)+' km';
  }
  else{
    distance = content;
    document.getElementById('js-trip-distance').innerHTML = distance.toFixed(0);
    document.getElementById('js-trip-distance-unit').innerHTML = 'm';
    document.getElementById('js-route-distance').innerHTML = distance.toFixed(1)+' m';
  }
  document.getElementById('js-route-destination').innerHTML = 'To: '+ destinationName;

  // update trip start SOC
  document.getElementById('js-trip-start-soc').innerHTML = currentSOC +'%';

  // update trip end soc
  if(currentSusteRange - content/1000 > 0){
    estimatedStateOfCharge = (currentSusteRange - content/1000) *10000 / (RANGE_ON_FULL_AH * currentSOH);
    console.log('EstimatedStateOfCharge: ', estimatedStateOfCharge);
  }
  document.getElementById('js-trip-end-soc').innerHTML = Math.round(estimatedStateOfCharge) +'%';
  
  setMode('nav-info-mode');
}

function findClosestStep(){
  let closestStepIndex,
  minDistance = Infinity;
  let currentLngLat = mapboxgl.LngLat.convert(currentLocation);
  let steps = navigationRoute.routes[0].legs[0].steps;
  console.log(' ');
  steps.forEach(function(step, stepIndex) {
    let maneuverLocation = mapboxgl.LngLat.convert(step.maneuver.location);
    // console.log("Current Maneuver Point: " + currManeuverPoint);
    let distanceToManeuver = maneuverLocation.distanceTo(currentLngLat);
    console.log("Step: " + stepIndex +" : Current Distance is: " + distanceToManeuver);
    if (distanceToManeuver < minDistance) {
      minDistance = distanceToManeuver;
      closestStepIndex = stepIndex;
    }
  });
  return closestStepIndex;
}

function findClosestStepOffset(_closestStepIndex){
  let steps = navigationRoute.routes[0].legs[0].steps;
  let currentLngLat = mapboxgl.LngLat.convert(currentLocation);
  let minDistanceOne = Infinity;
  let minDistanceTwo = Infinity;

    if(_closestStepIndex - 1 >= 0){
    steps[_closestStepIndex - 1].geometry.coordinates.forEach(function(point, pointIndex) {
      let currentPoint = mapboxgl.LngLat.convert(point);
      let distanceToPoint = currentPoint.distanceTo(currentLngLat);
      if (distanceToPoint < minDistanceOne) {
        minDistanceOne = distanceToPoint;
      }
    });
  }
  
  steps[_closestStepIndex].geometry.coordinates.forEach(function(point, pointIndex) {
    let currentPoint = mapboxgl.LngLat.convert(point);
    let distanceToPoint = currentPoint.distanceTo(currentLngLat);
    if (distanceToPoint < minDistanceOne) {
      minDistanceTwo = distanceToPoint;
    }
  });

  if(minDistanceTwo < minDistanceOne){
    return 0;
  }
  else{
    return -1;
  }
}

function findCurrentStep(){
  let closestStep = findClosestStep();
  let closestPoint = findClosestStepOffset(closestStep);
  console.log('Closest Step: ' + closestStep + ' : Closest Point: '+closestPoint)
  let currentStep = closestStep + closestPoint;
  // if(closestPoint > -1){
  //   map.setLngLat(navigationRoute.routes[0].legs[0].steps[currentStep].geometry.coordinates[closestPoint]);
  // }
  return currentStep;
}

let _currentStep = -2;
let _currentStepOffset = -2;
function resetCurrentStep(){
  _currentStep = -2;
}
function resetCurrentStepOffset(){
  _currentStepOffset = -2;
}
function navigate(){
  let steps = navigationRoute.routes[0].legs[0].steps;
  let currentStep = findCurrentStep();
  let upcompingStep = currentStep + 1;
  distanceToManeuver = calculateDistanceToManeuver(steps[upcompingStep]);
  distanceToDestination = calculateDistanceToDestination(distanceToManeuver, upcompingStep, steps);
  
  let distanceToDestinationText = ' ';
  let distanceToManeuverText = ' ';
  if(distanceToDestination > 999){
    distanceToDestinationText = (distanceToDestination / 1000).toFixed(1)+' km';
  }
  else{
    distanceToDestinationText = (distanceToDestination).toFixed(0)+' m';
  }

  if(distanceToManeuver > 999){
    distanceToManeuverText = (distanceToManeuver / 1000).toFixed(1)+' km';
  }
  else{
    distanceToManeuverText = (distanceToManeuver).toFixed(0)+' m';
  }

  document.getElementById('js-route-distance').innerHTML = distanceToDestinationText;
  document.getElementById('js-distance-to-maneuver').innerHTML = ' ( ' + distanceToManeuverText + ' )';

  if(_currentStep != currentStep){ //check if the step has changed
    _currentStep = currentStep;
    map.setBearing(steps[currentStep].maneuver.bearing_after);
    document.getElementById('js-current-maneuver').innerHTML = steps[upcompingStep].maneuver.instruction;
    let icon = findManeuverType('primary', steps[upcompingStep].maneuver.type, steps[upcompingStep].maneuver.modifier);
    document.getElementById('js-current-maneuver-icon').style.backgroundImage = icon;

    if(_currentStep + 2 < steps.length){
      setNextManeuverVisibility(true);
      document.getElementById('js-next-maneuver').innerHTML = steps[upcompingStep + 1].maneuver.instruction;
      let icon = findManeuverType('secondary', steps[upcompingStep + 1].maneuver.type, steps[upcompingStep + 1].maneuver.modifier);
      document.getElementById('js-next-maneuver-icon').style.backgroundImage = icon;
    }
    else{
      document.getElementById('js-next-maneuver').innerHTML = ' ';
      setNextManeuverVisibility(false);
    }

    // addRouteLeg(steps[_currentStep]); // this will show the current step on the map (debug functionality)
  }
  
}

const preIcon = "url('../nav-icons/";
const postIcon = ".svg')";
const demarcator = '-';
function findManeuverType(step, type, modifier){
  let icon;
  type = type.replace(/\s/g, '');
  type = type.toLowerCase();
  icon = preIcon + type
  if(modifier !== undefined && (type != 'arrive' && type !='depart')){
    modifier = modifier.replace(/\s/g, '');
    modifier = modifier.toLowerCase();
    icon = icon + demarcator + modifier
  }
  icon = icon + demarcator + step + postIcon
  return icon;
}

function onDragEnd() {
  var lngLat = currentMarker.getLngLat();
  let markerCoord = [lngLat.lng, lngLat.lat];
  console.log(markerCoord);
  getRoute(markerCoord);
}

function onRotate() {
  let bearing = -map.getBearing();
  // console.log(bearing);
  // document.getElementById("navigation-north").style.transform = "rotate("+bearing+"deg)";
}

let navigationSession = false;
function startNavigation(request){
  if(request == navigationSession){
    console.log('Navigation Session already in requested state.')
    return;
  }
  console.log('Requesting for navigation session: '+ request);
  if(request == true){
    let cLngLat = currentMarker.getLngLat();
    let markerCoord = [cLngLat.lng, cLngLat.lat];
    map.easeTo({
      center: [ cLngLat.lng, cLngLat.lat ],
      pitch: navigationPitch,
      zoom: navigationZoomLevel,
      // essential: true // this animation is considered essential with respect to prefers-reduced-motion
      });
  
    // function to get the latitude and longitude of the vehicle and update it
    eel.requestLocationHeading(true);
    navigationSession = true;
  }
  else{
    eel.requestLocationHeading(false);
    navigationSession = false;
  }
}

function closeSearchBox(){
  document.getElementsByClassName('mapboxgl-ctrl-geocoder')[0].classList.add('mapboxgl-ctrl-geocoder--collapsed');
}

function setNextManeuverVisibility(visibility) {
  if(visibility == true){
    document.getElementById('js-next-maneuver-box').style.display = 'flex';
    document.getElementById('js-maneuver-divider').style.display = 'flex';
  }
  else{
    document.getElementById('js-next-maneuver-box').style.display = 'none';
    document.getElementById('js-maneuver-divider').style.display = 'none';
  }
}

function addMarkersToRoute(data){

  data.forEach(function(man, manIndex) {
    man.maneuver.location 
    new mapboxgl.Popup()
    .setLngLat(man.maneuver.location)
    .setHTML(man.maneuver.instruction)
    .addTo(map);
  });
}
// eel.expose(updateBearing);

// function updateBearing(data){
//   if(data[1] != null && data[0] != null){
//     currentLocation = [data[1], data[0]];
//     // console.log(currentLocation);
//     if(map === undefined || currentMarker === undefined){
//       return;
//     }
//   }

//   if('None' != data[2]){
//     bearing = -data[2];
//     currentMarker.setLngLat(currentLocation);
//     // currentMarker.setRotation(bearing);
//     map.easeTo({
//         center: currentLocation,
//         bearing: bearing,
//         speed: 0.01,
//         maxDuration: 1900,
//         essential: true
//     });
//     // findManeuverPoint();
//     // navigate();
//   }
//   else{
//     currentMarker.setLngLat(currentLocation);
//     map.easeTo({
//         center: currentLocation,
//         speed: 0.01,
//         maxDuration: 1900,
//         essential: true
//     });
//     // findManeuverPoint();
//     // navigate();
//   }
// }

let currentBearing = 0;
function updateHeading(heading){
  mbBearing = heading;
  //mapbox
  // if(mbBearing - map.getBearing > 5){
    if(!isMapLoaded){
      return;
    }
    // map.easeTo({
    //   bearing: mbBearing,
    //   // speed: 0.01,
    //   // maxDuration: 1900,
    //   // essential: true
    // });
    currentMarker.setRotation(-map.getBearing() - mbBearing);
    currentBearing = mbBearing;
  // }
}
// map.on('rotate', function() {
//   map.getBearing() + 
//   });
let dataCounter = 0;
eel.expose(updateLocation);
function updateLocation(hasFix, data){
  if(!hasFix){
    console.log('GPS Fix not available.');
    showInternetWarning(true, 'GPS Signal Lost', false, true);
    return;
  }
  showInternetWarning(false);
  console.log('GPS Data:'+data[0]+ ' ' + data[1])
  let latitude = data[0];
  let longitude = data[1];
  if(data[1] != null && data[0] != null){
    currentLocation = [data[1], data[0]];
    // console.log(currentLocation);
    if(map === undefined || currentMarker === undefined){
      return;
    }
  }
  if(!isMapLoaded){
    return;
  }
  
  // var turfPoint = turf.point([longitude, latitude]);

  // if(currentMode == 'navigation-mode'){
  //   var snapped = turf.nearestPointOnLine(tRouteLineString, turfPoint);
  //   console.log(snapped);
  //   currentMarker.setLngLat(snapped.geometry.coordinates);
  // } else {
  // currentMarker.setLngLat(currentLocation);
  // }
  currentMarker.setLngLat(currentLocation);
  dataCounter = (dataCounter + 1) % 7;
  if(dataCounter == 0){
    // console.log('Centering map.')
    map.easeTo({
      center: currentLocation,
      // speed: 0.01,
      // maxDuration: 1900,
      // essential: true
    });
  }
  // if(mbBearing != null){
  //   map.easeTo({
  //     center: currentLocation,
  //     // bearing: mbBearing,
  //     // speed: 0.01,
  //     // maxDuration: 1900,
  //     // essential: true
  //   });
  // }
  // else{
  //   map.easeTo({
  //     center: currentLocation,
  //     // speed: 0.01,
  //     // maxDuration: 1900,
  //     // essential: true
  //   });
  // }
  let tCurrentLocation = turf.point(currentLocation);
  let contains = turf.booleanContains(tRouteBuffer, tCurrentLocation);
  if(!contains){
    // console.log('Off Route Detected');
    offRouteDetection(true);
  } else {
    offRouteDetection(false);
  }
  // findManeuverPoint();
  // navigate();
}

function updateHeadingTest(headingData){
  if(!isMapLoaded){
    return;
  }
  headingDiff = Math.abs(headingData - currentMarker.getRotation());
  // console.log('Heading Diff: '+headingDiff);
  if(headingDiff > 2){
    // currentMarker.setRotation(headingData-82);
    map.easeTo({
      // center: currentLocation,
      bearing: -headingData,
      speed: 0.01,
      maxDuration: 1900,
      essential: true
  });
  }
}

// function to calculate the distance to upcoming maneuver from the current location
function calculateDistanceToManeuver(upcomingStep){
  let currentLngLat = mapboxgl.LngLat.convert(currentLocation);
  let stepLngLat = mapboxgl.LngLat.convert(upcomingStep.maneuver.location);
  let distanceToManeuver = stepLngLat.distanceTo(currentLngLat);
  return distanceToManeuver;
}

// function to calculate the distance to destination from the current location
function calculateDistanceToDestination(distanceToManeuver, closestManeuverIndex, steps){
  let distanceToDestination = distanceToManeuver;
  for(index = closestManeuverIndex; index < steps.length; index++ ){
    distanceToDestination = distanceToDestination + steps[index].distance;
  }
  // console.log('Distance to Destination: ' + distanceToDestination)
  return distanceToDestination;
}

// Debug functionality
// function addStepMarkers(steps){
//   steps.forEach(function(step, stepIndex) {
//     let marker = new mapboxgl.Marker()
//     .setLngLat(step.maneuver.location)
//     .addTo(map);
//   });
// }

// function addRouteLeg(step){
//   if(_currentStep < 0){
//     return;
//   }
//   // console.log(step);
//   let leg = step.geometry.coordinates;
//     let geojson = {
//       type: 'Feature',
//       properties: {},
//       geometry: {
//         type: 'LineString',
//         coordinates: leg
//       }
//     };
//     // if the route already exists on the map, reset it using setData
//     if (map.getSource('leg')) {
//       map.getSource('leg').setData(geojson);
//     } else { // otherwise, make a new request
//       map.addLayer({
//         id: 'leg',
//         type: 'line',
//         source: {
//           type: 'geojson',
//           data: {
//             type: 'Feature',
//             properties: {},
//             geometry: {
//               type: 'LineString',
//               coordinates: geojson
//             }
//           }
//         },
//         layout: {
//           'line-join': 'round',
//           'line-cap': 'round'
//         },
//         paint: {
//           'line-color': '#C4C4C4',
//           'line-width': 20,
//           'line-opacity': 1
//         }
//       });
//       map.getSource('leg').setData(geojson);
//     }
// }

// //debug
// function traverseAllSteps(maneuver){
//   maneuver.forEach(function(man, manIndex) {
//       type = man.maneuver.type
//       modifier = man.maneuver.modifier

//       // console.log('type: '+type);
//       // console.log('modifier: '+ modifier);
//       icon = findManeuverType('primary', type, modifier);
//       console.log(icon);

//       text = man.maneuver.instruction
      
//       // html = "<img src='nav-icons/arrive-primary.svg' width='80px' height='80px'></img>"
//       let popup = new mapboxgl.Popup({ closeOnClick: false })
//             .setLngLat(man.maneuver.location)
//             .setHTML(text)
//             .addTo(map);
//   });
// }

// Function: switches the style of the map based on the input
// Funtion: Draws the geojson line on the map for specific modes related to navigation
// Input: Style to switch to i.e. dark or light
function switchMapMode(layer) {
  // if(layer == 'dark'){
  //   map.setStyle('mapbox://styles/yatri/ckgucl6jh0l9o19qj83mzbrjh?optimize=true');
  // }
  // else{
  //   map.setStyle('mapbox://styles/yatri/cke13s7e50j3s19olk91crfkb?optimize=true');
  // }
  if(mapTheme != layer){
    map.setStyle(mapStyleURI);
  }
  // Draw route on the map if the mode is 'nav-info-mode' or 'navigation-mode'
  if(currentMode == 'nav-info-mode' || currentMode == 'navigation-mode'){
    console.log('Getting the Route.');
    map.on('styledata', function(){
      loadRoute(navigationRoute.routes[0].geometry.coordinates);
    });
  }
}

let tRouteLineString;
let tRouteBuffer;
// Draws a line on the map based on the input
// Input: co-ordinates of the route
// Global Variable Used: map
function loadRoute(route){
  var geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: route
    }
  };
  // if the route already exists on the map, reset it using setData
  if (map.getSource('route')) {
    map.getSource('route').setData(geojson);
  } else { // otherwise, make a new request
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: geojson
          }
        }
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#40e0d0',
        'line-width': 30,
        'line-opacity': 0.75
      }
    });
    map.getSource('route').setData(geojson);
  }

  tRouteLineString = turf.lineString(route);
  tRouteBuffer = turf.buffer(tRouteLineString, 0.075, {units: 'kilometers'});

  // Development only: visualize the route buffer zone

  // if (map.getSource('routeBuffer')){
  //   map.getSource('routeBuffer').setData(tRouteBuffer);
  // }else{
  //   map.addLayer({
  //     "id": "routeBuffer",
  //     "type": "fill",
  //     "source": {
  //       "type": "geojson",
  //       "data": tRouteBuffer
  //     },
  //     "layout": {},
  //     "paint": {
  //       "fill-color": '#d9d838',
  //       "fill-opacity": 0.3
  //     }
  //   });
  // }
}

let offRouteCountDown = 5;
function offRouteDetection(state){
  if(state){
    offRouteCountDown -= 1;
    if(offRouteCountDown <= 0){
      console.log('Vehicle is going off route!!!');
      displayRerouteSuggestion(true);
    }
  }
  else{
    offRouteCountDown = 5;
    displayRerouteSuggestion(false);
  }
}

let rerouteSuggestionState = null;
displayRerouteSuggestion(false);
function displayRerouteSuggestion(state){
  if(state == rerouteSuggestionState){
    return;
  }
  if(state){
    document.getElementById('js-off-route').style.display = 'flex';
    rerouteSuggestionState = true;
  } else{
    document.getElementById('js-off-route').style.display = 'none';
    rerouteSuggestionState = false;
  }
}

document.getElementById('js-off-route').addEventListener('click', function(){
  if(currentMode == 'nav-info-mode' || currentMode == 'navigation-mode'){
    console.log('Rerouting.');
    getRoute(destinationLocation);
  }
});

document.getElementById('js-attribution-toggle').addEventListener('click', function(){
  //open attribution page
  document.getElementById('js-attribution-page').style.display = 'flex';
});
