# Translation Guest Chat Web App and Macro

This is an example Cisco Collaboration Device Macro and Web App which enables a guest user to IM with a Webex User with automatic translation.


## Overview

### Cisco Collaboration Device Macro:

This macros stores Webex Service App Guest Issuer OAuth Credentials and also saves a UI Extension Button to the Device. When a Guest User taps on the button, the macro generates an Access Token using the Service App credentials and then opens the Chat Web App as a WebView while also sharing the Access Token and Target Agents Email address to the Web App using URL hash parameters.

### Chat Web App:

This is a Single Page Application Web App which can be hosted on any Static Web Server and no backend is required. All configuration details which the Web App requires to function are shared to it via URL hash parameters when launched by the macro above. The Web App has three states:

* Language Selection
* Name Input
* Chat Session



### Flow Diagram

```mermaid
sequenceDiagram
    actor Guest
    participant Device as Cisco<br/>Collab Device
    participant Server as Static<br/>Web Server
    participant Translation as Translation<br/>Services
    participant Webex as Webex<br/>Services
    actor Agent as Agent<br/>Webex App


    Guest->>Device: Taps 'Webex Chat' Button
    Note over Device: Macro Opens WebView<br/>Sharing Service App OAuth<br/>Data Via URL Parameters
    Device->>Server: WebEngine Requests Web App
    Server->>Device: Returns Web App

    Guest->>Device: Select Lanaguage
    Guest->>Device: Enter Guest Name
    Device->>Webex: Generate Guest Account<br/>With Guests Name
    Webex->>Device: Guest Account<br/>Access Token Returned
   
    Note over Device: Init Webex SDK<br/>Using Guest Access Token
    Device-->Webex: Listen For Messages<br/>Via WebSocket

    
    Device->>Webex : Web App Sends Initial Message<br/>To Agent Using Guest Account
    Webex->>Agent: Agent Receives Initial Message
    Agent->>Webex: Agent Replies To Guest User
    Webex-->>Device: Agent Message Sent To Webex SDK<br/>Via WebSocket Connection
    Device->>Translation: Web App Requests Message Translation
    Translation->>Device: Returns Translated Message
    Note over Device: Translated Message Displayed
    Guest->>Device: Enters New Message
    Device->>Webex: Send Message To Agent
    Webex->>Agent: Recieved Guests Message
    Note over Agent: Webex App Translates Message
    Note over Guest,Agent: Guest And Agent Are Now Messaging With Automatic Translations
```



## Setup

### Prerequisites & Dependencies: 

- Cisco Collaboration Desk or Board Device with RoomOS 11.x or above
- Web admin access to the device to upload the macro
- (optional) Web Server to host your own copy of the Chat Web App


### Installation Steps:

1. Download the ``translation-guest-chat.js`` file and upload it to your Webex Devices Macro editor via the web interface.
2. Configure the macros, there are comments for each field to help with the configuration.
3. Enable the Macro on the editor.

## Demo

*For more demos & PoCs like this, check out our [Webex Labs site](https://collabtoolbox.cisco.com/webex-labs).

## License

All contents are licensed under the MIT license. Please see [license](LICENSE) for details.


## Disclaimer
<!-- Keep the following here -->  
Everything included is for demo and Proof of Concept purposes only. Use of the site is solely at your own risk. This site may contain links to third party content, which we do not warrant, endorse, or assume liability for. These demos are for Cisco Webex usecases, but are not Official Cisco Webex Branded demos.


## Questions
Please contact the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=translation-guest-chat-webapp-macro) for questions. Or, if you're a Cisco internal employee, reach out to us on the Webex App via our bot (globalexpert@webex.bot). In the "Engagement Type" field, choose the "API/SDK Proof of Concept Integration Development" option to make sure you reach our team. 
