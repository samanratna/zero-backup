from datetime import date, datetime
import json
from event_handler import vehicleReadings, vehicleEvents

class CarbonOffsetCalculator:
    def __init__(self):
        # load the values of CO from JSON
        # Assign the values to appropriate headers
        # initialize current cycle
        # send the values to GUI
        self.MAX_RUNNING_SIZE = 30
        self.MAX_TOTAL_SIZE = 90
        carbonOffsetData = []
        self.sumTillLastDay = 0
        self.carbonOffset = []
        self.outstandingCarbonOffsetIndex = 0
        self.runningCarbonOffsetIndex = 0
        self.latestData = [None,0]

        try:
            with open('carbon-offset.json', 'r') as f:
                carbonOffsetData = json.load(f)
            self.runningCarbonOffsetIndex = carbonOffsetData[0]
            self.outstandingCarbonOffsetIndex = carbonOffsetData[1]
            self.sumTillLastDay = carbonOffsetData[2]
            self.carbonOffset = carbonOffsetData[3]
            self.latestData = self.carbonOffset[-1]
            if(not self.isToday(self.latestData[0])):
                self.latestData = [self.getDate(), 0]
                self.append(self.latestData)
        except (OSError, json.decoder.JSONDecodeError) as error:
            print(error)
            self.latestData = [self.getDate(), 0]
            self.append(self.latestData)
        
        self.sendToUI(0)
        vehicleEvents.onCarbonOffsetRequest += self.onRequest
        vehicleEvents.guiReady += self.onRequest

    def onChange(self, distance):
        # compute carbon offset from the distance travelled
        # check if the cycle has changed
        # if it has changed, end the current running cycle
        # start a new cycle and initialize the new cycle to current cycle
        # update the values 
        # send the values to GUI
        carbonOffset = distance * 77
        if(not self.isToday(self.latestData[0])):
            self.carbonOffset[-1] = self.latestData
            self.sumTillLastDay = self.sumTillLastDay + self.latestData[1]
        self.latestData = [self.getDate(), carbonOffset - self.sumTillLastDay]
        self.sendToUI(1)

    def onShutdown(self):
        # save the data to JSON
        self.carbonOffset[-1] = self.latestData
        carbonOffsetData = [self.runningCarbonOffsetIndex, self.outstandingCarbonOffsetIndex, self.sumTillLastDay, self.carbonOffset]
        with open('carbon-offset.json', 'w') as f:
            json.dump(carbonOffsetData, f)

    def onRequest(self, mode = 0):
        # send the outstanding values to bluetooth/UI
        # update the outstandingCarbonOffsetIndex value if needed
        if(mode == 0):
            self.sendToUI(0)
        elif(mode == 1):
            pass

    def getDate(self):
        today = str(date.today())
        return today

    def isToday(self, givenDateString):
        today = date.today()
        givenDate = datetime.strptime(givenDateString, '%Y-%m-%d').date()
        return (today == givenDate)

    def append(self, value):
        self.carbonOffset.append(value)
        if len(self.carbonOffset) > self.MAX_TOTAL_SIZE:
            self.carbonOffset.pop(0)
        if len(self.carbonOffset) > self.MAX_RUNNING_SIZE:
            self.runningCarbonOffsetIndex  += 1
    
    def sendToUI(self, mode = 0):
        # the data has to be sent as an array of array of date and Carbon Offset Data
        if mode == 0: 
            vehicleReadings.carbonOffset(self.carbonOffset[self.runningCarbonOffsetIndex:])
        elif mode == 1:
            vehicleReadings.carbonOffset([self.latestData])
