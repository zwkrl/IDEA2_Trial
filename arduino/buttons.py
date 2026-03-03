# =============================================
# ESP32-C3 Button → USB Serial → Linux Keypress
# Reads serial from ESP32-C3 and maps to keypresses
# Run: python3 buttons.py
# =============================================

import serial
import time
from pynput.keyboard import Key, Controller

# --- Config ---
SERIAL_PORT = '/dev/ttyACM0'  # windows is 'COM 7
BAUD_RATE   = 115200

# --- Key mappings ---
# Must match keyMap[] in Arduino code
key_map = {
    'q': 'q',
    'w': 'w',
    'e': 'e',
    'r': 'r'
}

keyboard = Controller()

def find_port():
    """Try common ESP32-C3 serial ports"""
    import os
    for port in ['/dev/ttyACM0', '/dev/ttyACM1', '/dev/ttyUSB0', '/dev/ttyUSB1']:
        if os.path.exists(port):
            return port
    return SERIAL_PORT

def main():
    port = find_port()
    print(f"Connecting to {port} at {BAUD_RATE} baud...")

    try:
        with serial.Serial(port, BAUD_RATE, timeout=1) as ser:
            print("Connected! Listening for button presses...")
            print("Press Ctrl+C to quit\n")

            while True:
                line = ser.readline().decode('utf-8').strip()

                if len(line) == 2:
                    action = line[0]   # P = press, R = release
                    key    = line[1]   # q, w, e, r

                    if key in key_map:
                        mapped = key_map[key]
                        if action == 'P':
                            print(f"PRESS:   [{mapped}]")
                            keyboard.press(mapped)
                        elif action == 'R':
                            print(f"RELEASE: [{mapped}]")
                            keyboard.release(mapped)

                time.sleep(0.001)  # Yield CPU

    except serial.SerialException as e:
        print(f"Serial error: {e}")
        print("Check your port with: ls /dev/ttyACM*")
    except KeyboardInterrupt:
        print("\nExiting...")

if __name__ == "__main__":
    main()
