import can
import time
import os
from flask import Flask, jsonify, request, render_template
import random

# Set can parameters and create 'bus' object
can.rc['interface'] = 'socketcan_native'
can.rc['channel'] = 'can0'


# Initialize variables
bat_current = 0
bat_voltage = 0
veh_speed = 0
max_torque = 0
torque_act = 0
motor_temp = 0
motor_vel = 0
drive_prof = 0
odometer = 0
htsink_temp = 0
dig_input = 0
s_o_charge = 0
est_range = 0
recuperation = 0
data_json = {}

hibeam = 0
lturn = 0
rturn = 0
mode = 'standby'
drive = 0
hold_time = 0
just_switched = 0


def get_can():
    # Get global variables
    global bat_current
    global bat_voltage
    global veh_speed
    global max_torque
    global torque_act
    global motor_temp
    global motor_vel
    global drive_prof
    global odometer
    global htsink_temp
    global dig_input
    global s_o_charge
    global est_range
    global recuperation
    global data_json

    # Get data
    bus = can.interface.Bus()
    message = bus.recv(0.0)
    # print('Message: ', message)
    # print('Type: ', type(message))

    # Filter data
    if message is not None:
        if message.arbitration_id != 128:
            # Sort data
            if message.arbitration_id == 663:
                # Perform data swap in binary
                data = message.data
                new_data = [data[1], data[0], data[3], data[2], data[5], data[4], data[7], data[6]]

                # Convert new_data to hex
                count = 0
                for d in new_data:
                    d_hex = hex(d)[2:]
                    new_data[count] = d_hex
                    count += 1

                bat_current_hex = new_data[0] + new_data[1]
                bat_voltage_hex = new_data[4] + new_data[5]

                bat_current = int(int(bat_current_hex, 16)*0.0625)
                bat_voltage = int(int(bat_voltage_hex, 16)*0.0625)
                bat_v_notint = int(bat_voltage_hex, 16)*0.0625

                # Fix negative current issue
                if bat_current > 4096/2:
                    bat_current = int(bat_current - 4096)
                    recuperation = 1
                else:
                    recuperation = 0

                # Calculate Battery SoC and Range
                s_o_charge = int((bat_v_notint - 95.12) / (101.2 - 95.12) * 100)
                if s_o_charge < 0:
                    s_o_charge = 0
                elif s_o_charge > 100:
                    s_o_charge = 100

                est_range = s_o_charge * 1.5  # Assuming 150km when 100%

            if message.arbitration_id == 768:
                # Perform data swap in binary
                data = message.data
                new_data = [data[1], data[0], data[3], data[2], data[5], data[4], data[7], data[6]]

                # Convert new_data to hex
                count = 0
                for d in new_data:
                    d_hex = hex(d)[2:]
                    new_data[count] = d_hex
                    count += 1

                veh_speed_hex = new_data[0] + new_data[1]
                max_torque_hex = new_data[2] + new_data[3]
                torque_act_hex = new_data[4] + new_data[5]
                motor_temp_hex = new_data[6] + new_data[7]

                veh_speed = int(int(veh_speed_hex, 16)*0.0625)
                max_torque = int(int(max_torque_hex, 16)*0.1)
                torque_act = int(int(torque_act_hex, 16)*0.0625)
                motor_temp = int(int(motor_temp_hex, 16)*1)

                # Fix negative velocity issue
                if veh_speed > 4096/2:
                    veh_speed = 0

                # Fix negative torque issue
                if torque_act > 4096/2:
                    torque_act = int(torque_act-4096)

            if message.arbitration_id == 336:
                # Perform data swap in binary
                data = message.data
                new_data = [data[1], data[0], data[3], data[2], data[5], data[4], data[7], data[6]]

                # Convert new_data to hex
                count = 0
                for d in new_data:
                    d_hex = hex(d)[2:]
                    new_data[count] = d_hex
                    count += 1

                motor_vel_hex = new_data[6] + new_data[7] + new_data[4] + new_data[5]
                motor_vel = int(motor_vel_hex, 16)*1

                # Fix negative motor rpm issue
                if motor_vel > 4294967295/2:  # 4294967295 is 'ffffffff' in hex
                    motor_vel = 0

            if message.arbitration_id == 664:
                # Perform data swap in binary
                data = message.data
                new_data = [data[1], data[0], data[3], data[2]]

                # Convert new_data to hex
                count = 0
                for d in new_data:
                    d_hex = hex(d)[2:]
                    new_data[count] = d_hex
                    count += 1

                drive_prof_hex = new_data[0] + new_data[1]
                drive_prof = int(drive_prof_hex, 16)*1

            if message.arbitration_id == 769:
                # Perform data swap in binary
                data = message.data
                new_data = [data[1], data[0], data[3], data[2], data[5], data[4], data[7], data[6]]

                # Convert new_data to hex
                count = 0
                for d in new_data:
                    d_hex = hex(d)[2:]
                    new_data[count] = d_hex
                    count += 1

                odometer_hex = new_data[2] + new_data[3] + new_data[0] + new_data[1]
                htsink_temp_hex = new_data[7]
                dig_input_hex = new_data[6]

                odometer = int(int(odometer_hex, 16)*0.0039)
                htsink_temp = int(int(htsink_temp_hex, 16)*1)
                dig_input = int(int(dig_input_hex, 16)*1)

            
            # Print stuff
            os.system('clear')
            print('Battery Current: ', bat_current, ' A')
            print('Battery Voltage: ', bat_voltage, ' V')
            print('Vehicle Speed: ', veh_speed, ' km/h')
            print('Max Torque: ', max_torque, ' %')
            print('Actual Torque: ', torque_act, ' Nm')
            print('Motor Temperature: ', motor_temp, ' deg C')
            print('Velocity: ', motor_vel, ' rpm')
            print('Drive profile: ', drive_prof)
            print('Odo distance: ', odometer, ' km')
            print('Heat sink temp: ', htsink_temp, 'deg C')
            print('Digital input: ', dig_input)
            print(' ')

while True:
	get_can()
