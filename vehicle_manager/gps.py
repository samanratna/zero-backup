import serial
from event_handler import *
import threading
import time
import math
from quectel import *
import enum
GPS_DATA_PORT = "/dev/ttyUSB1"

class GPSStates(enum.Enum):
    OFF     = 1
    ON      = 2
    READY   = 3
    STRMNG  = 4

class GPS():
    # _counter = 0
    __instance__ = None
    gpsPort = None
    gpsState = GPSStates.OFF
    @staticmethod
    def getInstance(_gpsHandle):
        """ Static method to fetch the current instance.
        """
        if not GPS.__instance__:
            GPS.__instance__ = GPS(_gpsHandle)
        elif not GPS.gpsPort:
            self.initializeConnection()
        print('Returning GPS instance: ', GPS.__instance__)
        return GPS.__instance__

    def initializeConnection(self):
        if not GPS.gpsPort:
            try:
                GPS.gpsPort = serial.Serial(GPS_DATA_PORT, baudrate = 115200, timeout = 0.5)
            except (FileNotFoundError, serial.serialutil.SerialException) as error:
                print(error)
                return
    def __init__(self, _gpsHandle):
        # GPS._counter = GPS._counter + 1
        # print('GPS Counter: ', GPS._counter)
        # print('GPS Constructor: GPS Object Id: ', self)
        self.gpsHandle = _gpsHandle
        self.gpsHistory = []
        if(self.gpsHandle == None):
            return

        # print("Receiving GPS data")
        self.initializeConnection()
        self.stopGPSThread = False
        GPS.gpsState = GPSStates.ON
        vehicleReadings.network({'gpsStatus': GPS.gpsState.name}) # the state should be ON
        vehicleEvents.guiReady += self.onGUIReady
        vehicleEvents.onNavigation += self.onNavigation
        self.tGPS = threading.Thread(target = self.getGPSFix)
        self.tGPS.start()

    def __del__(self):
        # GPS._counter = GPS._counter - 1
        vehicleEvents.onNavigation -= self.onNavigation
        if(GPS.gpsPort):
            GPS.gpsPort.close()
        vehicleReadings.network({'gpsStatus': False})
        print("Destroyed GPS Object.")

    def parseGPS(self, data):
        decodedData = data.decode()
        # print(decodedData)

        if decodedData[1:6] == "GPRMC":
            sdata = decodedData.split(",")
            # print(sdata)
            if sdata[2] == 'V':
                print("no satellite data available")
                return False
            # print("-----Parsing GPRMC-----")
            # print(sdata)
            gmttime = sdata[1][0:2] + ":" + sdata[1][2:4] + ":" + sdata[1][4:6]
            # lat = decode(sdata[3]) #latitude
            dd = int(float(sdata[3])/100)
            mm = float(sdata[3]) - dd * 100
            lat = round(dd + mm/60, 5)
            dirLat = sdata[4]      #latitude direction N/S
            if(dirLat == 'S'):
                lat = -lat

            # lon = decode(sdata[5]) #longitute
            dd = int(float(sdata[5])/100)
            mm = float(sdata[5]) - dd * 100
            lon = round(dd + mm/60, 5)
            dirLon = sdata[6]      #longitude direction E/W
            if(dirLon == 'W'):
                lon = -lon

            speed = sdata[7]       #Speed in knots
            trCourse = sdata[8]    #True course
            date = sdata[9][0:2] + "/" + sdata[9][2:4] + "/" + sdata[9][4:6]
                               #date
            variation = sdata[10]  #variation
            degreeChecksum = sdata[12]
            # print('Degree Checksum: '+degreeChecksum)
            dc = degreeChecksum.split("*")
            degree = dc[0]        #degree
            checksum = dc[1]      #checksum
            # print("time : %s, latitude : %s(%s), longitude : %s(%s), speed : %s, True Course : %s, Date : %s, Magnetic Variation : %s(%s),Checksum : %s "%    (time,lat,dirLat,lon,dirLon,speed,trCourse,date,variation,degree,checksum))
            # print("Latitude : ", lat)
            # print("Longitude: ", lon)
            return [lat, lon]

        else:
            return None

    def decode(self, coord):
        #Converts DDDMM.MMMMM -> DD deg MM.MMMMM min
        x = coord.split(".")
        head = x[0]
        tail = x[1]
        deg = head[0:-2]
        min = head[-2:]
        return deg + " deg " + min + "." + tail + " min"

    def startGPSStreaming(self):
        self.stopGPSThread = False
        print(self, ': GPS Read Thread Started.')
        while not self.stopGPSThread:
            rawData = GPS.gpsPort.readline()
            data = self.parseGPS(rawData)
            if(data == None):
                continue
            elif(data == False):
                vehicleReadings.gpsLocation(False, 0, 0)
                time.sleep(1.0)
                continue
            self.gpsHistory.append(data)
            vehicleReadings.gpsLocation(True, data[0], data[1])
            time.sleep(1.0)
        print(self, ': GPS Read Thread Stopped.')

    def getGPSFix(self):
        self.stopGPSThread = False
        print(self, ': GPS Fix Thread Started.')
        while True:
            rawData = GPS.gpsPort.readline()
            data = self.parseGPS(rawData)
            if(data is None):
                time.sleep(1.0)
                continue
            break
        GPS.gpsState = GPSStates.READY
        vehicleReadings.network({'gpsStatus': GPS.gpsState.name}) # the state should be READY
        print(self, ': GPS Fix Thread Stopped.')

    def stopGPS(self):
        self.stopGPSThread = True

    def calculateHeading(self, location_a, location_b):
        if (len(self.gpsHistory) < 3):
            return
        lat_a = self.gpsHistory[len(self.gpsHistory) - 1][0]
        lat_b = self.gpsHistory[len(self.gpsHistory)][0]
        lon_a = self.gpsHistory[len(self.gpsHistory) - 1][1]
        lon_b = self.gpsHistory[len(self.gpsHistory)][0]

        delta_lon = lon_b - lon_a
        
        x = math.cos(lat_b) * math.sin(delta_lon)
        y = math.cos(lat_a) * math.sin(lat_b) - math.sin(lat_a)*math.cos(lat_b)*math.cos(delta_lon)
        heading = math.atan2(x,y)
        print('Heading: ', heading)

    def onNavigation(self, request):
        if((request==True) and (GPS.gpsState == GPSStates.READY or GPS.gpsState == GPSStates.ON)):
            self.stopGPSThread = False
            if(self.tGPS.is_alive()):
                print(self, ': GPS Thread already active.')
                return
            print(self, ': About to start GPS Thread')
            GPS.gpsState = GPSStates.STRMNG
            self.tGPS = threading.Thread(target = self.startGPSStreaming)
            self.tGPS.start()
        elif((request==True) and (GPS.gpsState == GPSStates.OFF)):
            vehicleReadings.network({'gpsStatus': GPS.gpsState.name})
            print(self,': GPS not ready.')
        elif(request==False):
            print(self, ': About to stop GPS Thread')
            if(GPS.gpsState == GPSStates.STRMNG):
                GPS.gpsState = GPSStates.READY
            self.stopGPS()

    def onGUIReady(self):
        vehicleReadings.network({'gpsStatus': GPS.gpsState.name})

if __name__ == "__main__":
    quectel = Quectel.getInstance()

    