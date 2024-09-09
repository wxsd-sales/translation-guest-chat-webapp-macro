/********************************************************
*
* Macro Author:      	William Mills
*                    	Technical Solutions Specialist
*                    	wimills@cisco.com
*                    	Cisco Systems
*
* Version: 1-0-0
* Released: 09/09/24
*
* This is an example Cisco Collaboration Device Macro which
* launches a Webex Chat Web App which enables a Guest Urer to 
* IM with a Webex User with automatic translation.
* 
* Full Readme, source code and license agreement available on Github:
* https://github.com/wxsd-sales/translation-guest-chat-webapp-macro
*
********************************************************/

import xapi from 'xapi';

/*********************************************************
 * Configure the settings below
**********************************************************/

const config = {
  webapp: 'https://wxsd-sales.github.io/translation-guest-chat-webapp-macro/webapp',
  oauth: {
    clientId: '<Guest Management Service App Client ID>',
    clientSecret: '<Guest Management Service App Client Secret>',
    refreshToken: '<Guest Management Service App Refresh Token>'
  },
  target: '<Email Address Of Target Agent>',
  panelId: 'webexchat'
}


/*********************************************************
 * Main functions and event subscriptions
**********************************************************/

let oauth = {
  accessToken: null,
  expiresDate: null
};

let guestDetails;

main();

async function main() {
  xapi.Config.HttpClient.Mode.set('On');

  // Retrieve any stored token
  const storedoauth = await retrieveToken()
    .catch(err => console.log('Unable to get stored oauth'));

  if (storedoauth == null) {
    console.log('Error parsing stored OAuth Token');
    await getAccessToken();
    if (oauth.accessToken == null) {
      return
    }
  } else {
    oauth = storedoauth;
    console.log('OAuth Token Restored');
  }

  console.log(oauth)
  createPanel();

  xapi.Event.UserInterface.Extensions.Panel.Clicked.on(async event => {
    if (!event.PanelId.startsWith(config.panelId)) return
    console.log('button clicked');
    openWebapp();
  });

}


function openWebapp(){
  const params = createParameters(oauth,{target: config.target})
  xapi.Command.UserInterface.WebView.Display({
    Target: 'OSD',
    Title: 'Webex Chat', 
    Url: config.webapp + '#' + params 
    })
}

function createParameters(...args){
  let parameters = ''
  for (let i = 0; i < args.length; i++) {
    console.log(args[i]);
    parameters = parameters + Object.keys(arguments[i]).map(key => `${key}=${arguments[i][key]}`).join('&')
    if(args.length - i > 1) parameters = parameters + '&';
  }
  return parameters
}


function getAccessToken() {
  const body = {
    "grant_type": "refresh_token",
    "client_id": config.oauth.clientId,
    "client_secret": config.oauth.clientSecret,
    "refresh_token": config.oauth.refreshToken
  }

  return xapi.Command.HttpClient.Post({
    Header: ['Content-Type: application/json'],
    ResultBody: 'PlainText',
    Url: 'https://webexapis.com/v1/access_token'
  },
    JSON.stringify(body)
  )
    .then(result => {
      const body = JSON.parse(result.Body);
      oauth.accessToken = body.access_token;
      oauth.expiresDate = new Date(Date.now().valueOf() + (body.expires_in * 1000)).valueOf();
      saveToken(oauth)
      console.log(`New Access Token Obtained - expires in [${body.expires_in}] seconds at [${oauth.expiresDate}]`);
      return
    })
    .catch(err => {
      if (err.hasOwnProperty('StatusCode')) {
        console.log(`Error getting access token - StatusCode [${err.data.StatusCode}] - Message [${err.message}]`)
      } else {
        console.log(`Error getting access token - Message [${err.message}]`)
      }
    })
}



function saveToken(token) {
  const panel = `
    <Extensions>
      <Panel>
        <Order>99</Order>
        <Location>Hidden</Location>
        <Name>accessToken</Name>
        <CustomIcon>
        <Id>${btoa(JSON.stringify(token))}</Id>
        </CustomIcon>
      </Panel>
    </Extensions>`;
  xapi.Command.UserInterface.Extensions.Panel.Save(
    { PanelId: 'accessToken' }, panel);
}

function retrieveToken() {
  return xapi.Command.UserInterface.Extensions.List({ ActivityType: 'Custom' })
    .then(result => {
      const panels = result.Extensions.Panel;
      if (panels.length == 0) return null;
      const accessPanel = panels.find(panel => panel.PanelId == 'accessToken')
      if (accessPanel.length == 0) return null;
      try {
        return JSON.parse(atob(accessPanel.CustomIcon.Id));
      } catch (error) {
        return null;
      }
    })
}


async function createPanel() {
  const panelId = config.panelId
  const order = await panelOrder(panelId)
  const panel = `
    <Extensions>
      <Panel>
        <Location>HomeScreen</Location>
        <Name>Webex Chat</Name>
        <ActivityType>Custom</ActivityType>
        <Icon>Helpdesk</Icon>
        ${order}
      </Panel>
    </Extensions>`;

  xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: panelId }, panel)
    .catch(e => console.log('Error saving panel: ' + e.message))
}

/*********************************************************
 * Gets the current Panel Order if exiting Macro panel is present
 * to preserve the order in relation to other custom UI Extensions
 **********************************************************/
async function panelOrder(panelId) {
  const list = await xapi.Command.UserInterface.Extensions.List({ ActivityType: "Custom" });
  const panels = list?.Extensions?.Panel
  if (!panels) return ''
  const existingPanel = panels.find(panel => panel.PanelId == panelId)
  if (!existingPanel) return ''
  return `<Order>${existingPanel.Order}</Order>`
}
