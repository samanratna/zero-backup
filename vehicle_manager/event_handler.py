from events import Events
import threading

class VehicleEvents(Events):
    __events__ = ('onRUPress','onRDPress', 'onRDHold', 'onRBPress', 'onHibeamToggle', 'onButtonPress','onSideLight','onHeadLight','onRightSideLightToggle', 'onLeftSideLightToggle', 'onBrakeToggle', 'onStandSwitch', 'onIgnition', 'onCharging', 'onTripReset', 'onBLEReady', 'bluetoothStatus','onUserInteraction', 'onUserInactivity', 'onCarbonOffsetRequest', 'onBrightnessChange', 'confirmBluetoothPairing', 'onBluetoothPairingConfirmation', 'onBluetoothConnection', 'onNavigation', 'onBluetooth', 'guiReady', 'onBluetoothNameChange', 'bluetoothName', 'finder','swupdate','swupdateResponse', 'bikeOn', 'bikeOff', 'bikeOnOff','charging', 'onChargeCostsRequest', 'refreshSettingsData', 'fetchRiderInfo', 'checkInternetConnectivity', 'autoSideLight', 'autoOff', 'vcuCharging', 'removeBluetoothDevices')

class VehicleReadings(Events):
    __events__ = ('odoReading','speedReading', 'maxSpeed', 'tripMaxSpeed', 'averageSpeeds', 'distances', 'batteryStatus', 'batteryTemperature', 'motorTemperature', 'controllerTemperature', 'vcuTemperature','packVoltage', 'gpsLocation' , 'carbonOffset', 'carbonOffsetForBluetooth', 'heading', 'bleDevices', 'network', 'bikeMode', 'orientation', 'distancehour', 'socRange', 'fuelSavings', 'chargeCostsForBluetooth', 'riderInfo', 'time', 'adxl')

vehicleEvents = VehicleEvents()
vehicleReadings = VehicleReadings()

# def eventOdoReading(value):
#     print("Odo Reading: ", value)

# def eventSpeedReading(value):
#     print("Speed Reading: ", value)

# def eventMaxSpeed(value):
#     print("Max Speed: ", value)

# def eventAverageSpeeds(value1, value2):
#     print("Average Speeds: ", value1, value2)

# def eventDistances(value1, value2):
#     print("Distances: ", value1, value2)

# # def eventRUPress():
# #     print("RU Press Event Triggered.")

# # def eventRBPress():
# #     print("RB Press Event Triggered.")

# # def eventRDPress():
# #     print("RD Press Event Triggered.")

# # def eventRDHold():
# #     print("RD Hold Event Triggered.")

# # def eventLeftTurn(value):
# #     print("Left Turn Toggled: ", str(value))

# # def eventRightTurn(value):
# #     print("Right Turn Toggled: ", str(value))

# def eventStand(state):
#     print("Stand Toggled: " + str(state) )

# def eventBrake(state):
#     print("Brake Toggled: " + str(state))

# # def eventHibeam(state):
# #     print("Hibeam toggled: " + str(state))

# def eventTripReset():
#     print("Trip Reset Requested")

# def eventBatteryStatus(value):
#     print('Battery Status: ', str(value))
    
# def eventBLEReady(value):
#     print('BLE Status: ', str(value))

# def eventUserInteraction(state):
#     print('User Activity: ', str(state))

# def readingGPSLocation(lat, lon):
#     print('Latitude: ', lat)
#     print('Longitude: ', lon)

# def readingCarbonOffset(data):
#     print(data)

# def readingNetwork(data):
#     print(data)
# def confirmBluetoothPairing(data):
#     print(data)
# def respondBluetoothPairing(data):
#     print(data)
# def bluetoothConnection(name, data):
#     print("Bluetooth Connection: ",name, data)
# def navigationRequest(request):
#     print('Navigation Request: ', request)
# def bluetoothRequest(request):
#     print('Bluetooth Request: ', request)
# def onFinder(value):
#     print('Find Request: ', value)
# def onswupdate(message):
#     print('Software Update: ', message)
# def onBikeOff():
#     print('Bike is Off.')
# def onBikeOn():
#     print('Bike is On.')
# def chargeCostsRequest(cycle):
#     print('Cycle: ', cycle)
# def onOrientationData(heading, roll, pitch):
#     print('Heading={0} Roll={1} Pitch={2}'.format(heading, roll, pitch))
# def eventSideLightStatus(status):
#     print('Side Light Status: ', status)
# def eventHeadLightStatus(status):
#     print('Head Light Status: ', status)
# def eventBikeMode(status):
#     print('Bike Mode Status: ', status)
# def onADXL(data):
#     print('ADXL data: ', data[0], data[1], data[2], data[3], data[4])
# # vehicleEvents.onRUPress += eventRUPress
# # vehicleEvents.onRBPress += eventRBPress
# # vehicleEvents.onRDPress += eventRDPress
# # vehicleEvents.onHibeamToggle += eventHibeam
# # vehicleEvents.onRightSideLightToggle += eventRightTurn
# # vehicleEvents.onLeftSideLightToggle += eventLeftTurn
# vehicleEvents.onBrakeToggle += eventBrake
# vehicleEvents.onStandSwitch += eventStand
# # vehicleEvents.onRDHold += eventRDHold
# vehicleEvents.onTripReset += eventTripReset
# # vehicleReadings.odoReading += eventOdoReading
# # vehicleReadings.speedReading += eventSpeedReading
# vehicleReadings.maxSpeed += eventMaxSpeed
# # vehicleReadings.averageSpeeds += eventAverageSpeeds
# # vehicleReadings.distances += eventDistances
# # vehicleReadings.batteryStatus += eventBatteryStatus
# vehicleEvents.onBLEReady += eventBLEReady
# vehicleEvents.onUserInteraction += eventUserInteraction
# vehicleReadings.gpsLocation += readingGPSLocation
# vehicleReadings.carbonOffset += readingCarbonOffset
# vehicleEvents.confirmBluetoothPairing += confirmBluetoothPairing
# vehicleEvents.onBluetoothPairingConfirmation += respondBluetoothPairing
# vehicleEvents.onBluetoothConnection += bluetoothConnection
# vehicleEvents.onNavigation += navigationRequest
# vehicleEvents.onBluetooth += bluetoothRequest
# vehicleEvents.finder += onFinder
# vehicleEvents.swupdate += onswupdate
# vehicleEvents.bikeOff += onBikeOff
# vehicleEvents.bikeOn += onBikeOn
# vehicleReadings.orientation += onOrientationData
# vehicleReadings.network += readingNetwork
# vehicleEvents.onChargeCostsRequest += chargeCostsRequest
# vehicleReadings.bikeMode += eventBikeMode
# vehicleEvents.onSideLight += eventSideLightStatus
# vehicleEvents.onHeadLight += eventHeadLightStatus
# vehicleReadings.adxl += onADXL