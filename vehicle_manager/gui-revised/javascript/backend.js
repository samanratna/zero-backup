eel.expose(updateBearing);
eel.expose(updateSpeedPower);
eel.expose(updateBikeMode);
eel.expose(updateMaxSpeed);
eel.expose(updateDistances);
eel.expose(updateAverageSpeed);
eel.expose(updateBluetoothStatus);
eel.expose(updateStandState);
eel.expose(updateCarbonOffset);
eel.expose(requestBluetoothPairingConfirmation);
eel.expose(updateTime);
eel.expose(updateTurnSignal);
eel.expose(updateHeadlightSignal);
eel.expose(updateStandState);

function updateRouteToBackend(route){
  eel.updateRoute(route);
}
function initiateTripReset(){
  eel.resetTripData()
}

function initializeGUI(){
  eel.getGUIData()
}

function respondBluetoothPairing(response){
  eel.bluetoothPairingConfirmation(response);
}
document.addEventListener("click", function(){
  console.log('Page Active.')
  eel.updateUserActivityStatus(1);
});
initializeGUI();