# My documentation
https://docs.technolitrix.org/trix-spotlight-storage/

## Add-On
https://violentmonkey.github.io/


# Part-DB with Custom Storage Tower and Light-Picker

## Introduction

The initial reason for a storage system like **Part-DB** is the simple issue of having too many electronic and mechanical parts at home, stored in various containers. Over time, you forget what you have in stock and where you last placed it.

I have been looking for a good **open-source** software like **Part-DB** for around five years. After trying many options, I finally managed to integrate a **Light-Picking System** similar to enterprise storage solutions. This system uses **WS2812 LEDs** to indicate in which compartment the part you are looking for is stored.

## Storage Tower with LED Indicators

I built a **large storage tower** with **528 storage containers**, each equipped with a **WS2812 LED** to display the part’s location and stock status:

- 🟢 **Green LED** → Stock is available  
- 🔴 **Red LED** → No stock left  

The LEDs are controlled by an **ESP32-C3**, mounted on a **PCB board**. Each **storage tower** or **location** requires **one ESP32**, which receives information from an **MQTT broker** via subscription to, for example, `tower_1/range`.

!!! note "ESP32 and MQTT"
    Each storage tower has its own ESP32, which listens to a specific MQTT topic.

## Getting Part Location Information

To determine the **storage location** of a part, I use a **Chrome/Mozilla extension** called **Violentmonkey**. This extension allows me to extract information about the **currently open part** in my **Part-DB** instance.

Violentmonkey activates its script based on the **IP address or URL** where Part-DB is running. It checks the current **URL** to extract the **part ID**, such as:

- **Locally**: `http://192.168.1.60/en/part/2012/info`
- **Over a domain**: `https://demo.part-db.de/en/part/2012/info`

Since **Part-DB** includes the **part ID** in the URL (e.g., `2012`), **Violentmonkey** extracts this **ID** and sends it to a **Node-RED node**. Node-RED then processes the data and makes an **API call** using an API token generated in **Part-DB**:

```bash
https://demo.part-db.de/api/parts/2012
```

## Storage Location Name vs. Storage Location ID

!!! warning "Initial Mistake in Handling Storage Locations"
    Initially, I made a mistake by using the **storage-location ID** instead of the **storage-location name**. This would have required rewriting the **ESP32 code** whenever I added a new storage location.

Now, I use the **storage-location name**, formatted so that **Node-RED** can interpret its meaning:

Example:
- `1088` → The **first digit** indicates the **tower number**, and the **last three digits** (`088`) represent the **LED pixel address**.

## Mapping Storage Locations to MQTT Topics

Node-RED then **subscribes** to the correct **MQTT topic**, depending on the **storage-location name**:

| Storage Location Name | Tower Number | MQTT Topic         |
|----------------------|--------------|---------------------|
| `1088`              | `1`          | `tower_1/range`    |
| `5042`              | `5`          | `tower_5/range`    |

Each **ESP32** has a hardcoded subscription topic:
- `tower_1-ESP` subscribes to `tower_1/range`
- `tower_5-ESP` subscribes to `tower_5/range`

## LED Activation via Node-RED and MQTT

Node-RED sends the relevant **MQTT messages**, and the **subscribed ESP32** then activates the correct **LED**, for example:

```bash
tower_1 → LED 48 → Green or Red
tower_5 → LED 42 → Green or Red
```

## Handling Multiple Storage Locations for the Same Part

If a part (**e.g., `2012`**) is stored in **multiple containers**, such as:

- **Tower 1**: Containers **048** and **005**
- **Tower 5**: Container **483**
- **Tower 3**: Container **521**

**Node-RED** sends the data to **MQTT** in a **delayed and parallel** manner:

1. If a part is stored in multiple containers **within the same tower**, it processes the **smallest container number first**  
   - E.g., **Container `005` before `048`**
2. **Simultaneously**, Node-RED sends the data for the other towers, following the same logic.

!!! note "Adjustable Delay"
    The delay before switching to the next LED is **3 seconds** by default but can be adjusted in Node-RED.

## Installation Guide

### 1. Install Violentmonkey Extension

1. Install the **Violentmonkey** extension in your browser (Chrome or Firefox).
2. Click the **+** symbol to create a new script.
3. Replace the existing content with the script from [Violentmonkey Script](https://github.com/Technolitix/Inventory-System/blob/main/violentmonkey_partdb.js).
4. Modify the following lines in the script:
   - Replace `// @match https://yourPart-DB-instance.com/*` with your actual **Part-DB instance URL**.
   - Replace `const url = 'http://yourNodeRedservice:1880/inventoryid?getID=' + content;` with your **Node-RED instance URL**.

!!! note "HTTPS vs. HTTP"
    If your Part-DB runs on `http://`, use `http://` in the script. If it runs on `https://`, adjust accordingly.

### 2. Set Up Node-RED

1. Install and run a **Node-RED instance**.
2. Import the [Node-RED flow](https://github.com/Technolitix/Inventory-System/blob/main/flows.json) via `Import -> Custom JSON`.
3. Configure the API token for your Part-DB instance.

!!! warning "API Token Security"
    Never expose your API token publicly. It should have **read-only** permissions.

4. Configure MQTT broker credentials (e.g., using Mosquitto in **HomeAssistant**).
5. Save and deploy the Node-RED flow.

### 3. Flash the ESP32

1. Install **VS Code** and **PlatformIO**.
2. Download the [ESP32-WS2812-PartDB](https://github.com/Technolitix/Inventory-System/tree/main) project.
3. Open the project in VS Code.
4. Modify `platformio.ini` to match your ESP32's COM ports.
5. Update the following files:
   - `src/credentials.h`: Set **Wi-Fi credentials**.
   - `src/globals.h`: Set **WS2812 LED pin number** and **total LEDs**.
   - `src/wifimqtt.h`: Set **MQTT broker IP and credentials**.
6. Compile and upload the firmware to your ESP32.

!!! tip "Finding the COM Port"
    If unsure about the COM port, delete `COM4` and check available ports automatically.

If everything is set up correctly, the ESP32 should flash successfully. 🚀


