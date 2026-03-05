// =============================================
// ESP32-C3 Super Mini — Button Test via Serial Monitor
// Wiring: 3.3V → Button COM → Button NO → GPIO
// Open Serial Monitor at 115200 baud
// =============================================

#define BTN1 0
#define BTN2 21
#define BTN3 3
#define BTN4 10

const int buttons[4] = {BTN1, BTN2, BTN3, BTN4};
bool lastState[4] = {LOW, LOW, LOW, LOW};

void setup() {
  Serial.begin(115200);
  delay(500);

  for (int i = 0; i < 4; i++) {
    pinMode(buttons[i], INPUT_PULLDOWN);
  }

  Serial.println("=== Button Test Ready ===");
  Serial.println("Press any button...");
}

void loop() {
  for (int i = 0; i < 4; i++) {
    bool currentState = digitalRead(buttons[i]);

    if (currentState != lastState[i]) {
      if (currentState == HIGH) {
        Serial.print("Button "); Serial.print(i + 1); Serial.println(" PRESSED");
      } else {
        Serial.print("Button "); Serial.print(i + 1); Serial.println(" RELEASED");
      }
      lastState[i] = currentState;
    }
  }
  delay(20);
}
