from event_handler import *
import threading
from gpio_manager import RepeatableTimer
import subprocess
import json
from datetime import datetime
# import requests
from bike_credentials import *

COST_FACTOR = 1.2
CHARGE_SAVINGS_FILE = '/etc/yatri/charge-savings.json'
MAX_DATA_COUNT = 30

class PowerManager():
    def __init__(self):
        self.standState = 0
        self.isInMotion = False
        self.motionTimer = None
        self.ignitionState = True
        self.chargeCycle = 0
        self.isCharging = False
        self.isFastCharging = False
        self.lastChargeUpdate = None
        self.stateOfCharge = None
        self.socOnChargeStart = None
        self.socOnChargeEnd = None
        self.chargeSavingsData = []
        try:
            with open(CHARGE_SAVINGS_FILE, 'r') as f:
                self.chargeSavingsData = json.load(f)
                self.chargeCycle = self.chargeSavingsData[-1][0]

        except (OSError, json.decoder.JSONDecodeError) as error:
            print(error)

        vehicleEvents.onStandSwitch += self.updateStandState
        vehicleEvents.onUserInteraction += self.uiMonitor
        # vehicleEvents.onButtonPress += self.onButtonPress
        vehicleEvents.bikeOnOff += self.onBikeOnOff
        vehicleEvents.charging += self.onCharging
        vehicleReadings.socRange += self.batteryStatus
        vehicleReadings.speedReading += self.speedMonitor
        vehicleEvents.onChargeCostsRequest += self.onChargeCostsRequest
        # vehicleEvents.vcuCharging += self.onVCUCharging
        self.inactivityTimer = RepeatableTimer(10.0, self.poweroff)
    def updateStandState(self, state):
        self.standState = state
        self.standMonitor(state)
    
    def poweroff(self):
        print('User inactive.')
        if(self.ignitionState == True):
            vehicleEvents.autoOff(True)
            self.onBikeOnOff(False)

    def standMonitor(self, state):
        self.standState == state
        if(state == 1 and self.ignitionState == True and self.isInMotion == False and self.isCharging == False):
            vehicleEvents.onButtonPress += self.onButtonPress
            if(not self.inactivityTimer.isAlive()):
                self.inactivityTimer.start()
        elif (state == 2):
            vehicleEvents.onButtonPress -= self.onButtonPress
            if(self.inactivityTimer.isAlive()):
                self.inactivityTimer.cancel()
    
    def speedMonitor(self, speed):
        if(speed < 0.5):
            if(self.motionTimer == None):
                self.motionTimer = int(datetime.now().timestamp())
            elif(int(datetime.now().timestamp()) - self.motionTimer > 10):
                self.isInMotion = False
        else:
            self.motionTimer = None
            self.isInMotion = True
        
        if(self.isInMotion):
            if(self.inactivityTimer.isAlive()):
                self.inactivityTimer.cancel()
        elif((not self.isInMotion) and (self.standState == 1)):
            if(not self.inactivityTimer.isAlive()):
                self.inactivityTimer.start()
        
    def uiMonitor(self, state):
        if((self.standState == 1) and (state == 1) and (self.ignitionState == True)):
            self.inactivityTimer.cancel()
            self.inactivityTimer.start()

    def onButtonPress(self):
        if(self.inactivityTimer.isAlive()):
            self.inactivityTimer.cancel()
            self.inactivityTimer.start()
    
    def onBikeOnOff(self, state):
        if(state == False): # bike is off
            process = subprocess.Popen('sleep 3s; vcgencmd display_power 0',stdout=subprocess.PIPE, shell=True)
            vehicleReadings.speedReading -= self.speedMonitor
            print('Bike is Off.')
            if(self.inactivityTimer.isAlive()):
                self.inactivityTimer.cancel()
        elif(state == True): #bike is on
            subprocess.call('vcgencmd display_power 1', shell=True)
            vehicleReadings.speedReading += self.speedMonitor
            print('Bike is On.')
            if(self.standState == 1):
                self.inactivityTimer.cancel()
                self.inactivityTimer.start()
        self.ignitionState = state

    def batteryStatus(self, soc, soh, rangeSuste, rangeThikka, rangeBabbal):
        self.stateOfCharge = soc

    def onCharging(self, isCharging, isFastCharging):
        self.isCharging = isCharging
        self.isFastCharging = isFastCharging
        if(isCharging == True):
            subprocess.call('vcgencmd display_power 1', shell=True)
            if(self.stateOfCharge == None):
                return
            
            self.socOnChargeStart = self.stateOfCharge
            self.socOnChargeStartTime = int(datetime.now().timestamp())
            if(self.inactivityTimer.isAlive()):
                self.inactivityTimer.cancel()
        else:
            subprocess.call('vcgencmd display_power 0', shell=True)
            self.socOnChargeEnd = self.stateOfCharge
            self.socOnChargeEndTime = int(datetime.now().timestamp())
            if(self.socOnChargeStart == None):
                return

            deltaSOC = self.socOnChargeEnd - self.socOnChargeStart
            if(deltaSOC > 1.0):
                costOfCharging = round(deltaSOC * COST_FACTOR, 2)
                self.chargeCycle += 1
                dataToBeSaved = [self.chargeCycle, self.isFastCharging, self.socOnChargeStart, self.socOnChargeEnd, self.socOnChargeStartTime, self.socOnChargeEndTime, costOfCharging]
                self.addToList(dataToBeSaved)
                with open(CHARGE_SAVINGS_FILE, 'w') as f:
                    json.dump(self.chargeSavingsData, f)
                vehicleReadings.chargeCostsForBluetooth(self.chargeSavingsData)
            else:
                print('Delta SOC is less than 1%.')

    def addToList(self, data):
        if(len(self.chargeSavingsData) > MAX_DATA_COUNT):
            del self.chargeSavingsData[0]
        self.chargeSavingsData.append(data)
    
    def searchForCycle(self, cycle):
        # print('Last data: ', int(self.chargeSavingsData[-1][0]))
        if(cycle > int(self.chargeSavingsData[-1][0])):
            return None
        index = 0
        for data in self.chargeSavingsData:
            print(int(data[0]))
            if(cycle < int(data[0])):
                break
            else:
                cycle += 1
                index += 1
        return index

    def onChargeCostsRequest(self, cycle):
        print('ChargeCosts: Cycle Received from Bluetooth: ', cycle)
        index = self.searchForCycle(cycle)
        print('Latest Charge Cycle Index: ', index)
        if(index != None):
            vehicleReadings.chargeCostsForBluetooth(self.chargeSavingsData[index:])
