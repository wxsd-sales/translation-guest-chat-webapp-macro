const Keyboard = window.SimpleKeyboard.default;
const KeyboardLayouts = window.SimpleKeyboardLayouts.default;
const Focus = window.SimpleKeyboardLayouts.default;
const hashes = getHashes(["accessToken", "target"]);
const nameInput = document.getElementById("nameInput");
const chatInput = document.getElementById("chatInput");



const languages = {
      en: {
        name: "English",
        icon: "🇬🇧",
        prompt: "Enter Name",
        language: "english",
      },
      fr: {
        name: "French",
        icon: "🇫🇷",
        prompt: "Entrez le nom",
        language: "french",
      },
      de: {
        name: "German",
        icon: "🇩🇪",
        prompt: "Geben Sie den Namen ein",
        language: "german",
      },
      ru: {
        name: "Russian",
        icon: "🇷🇺",
        prompt: "Введите имя",
        language: "russian",
      },
    };


const webexChat = webexConnection();

let selectedInput;
let keyboard;
let webex;


document.addEventListener("alpine:init", () => {
  window.Alpine.data("app", () => ({ ...webexChat }));
});

document.querySelectorAll(".input").forEach((input) => {
  input.addEventListener("focus", onInputFocus);
  input.addEventListener("input", onInputChange);
});


function generateGuestAccount(displayName) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", "Bearer " + hashes.accessToken);

  const uuid = self.crypto.randomUUID();
  const body = { subject: uuid, displayName };
  console.log(body)

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(body),
    redirect: "follow",
  };

  return fetch("https://webexapis.com/v1/guests/token", requestOptions)
    .then((response) => response.json())
    .catch((error) => console.error(error));
}



function getHashes(required) {
  if (!location.hash) return;
  let hashes = {};
  let splitHash = location.hash.split("#").pop();
  splitHash = splitHash.split("&");
  for (let i = 0; i < splitHash.length; i++) {
    let hash = splitHash[i].split("=");
    if (hash.length == 2) {
      hashes[hash[0]] = hash[1];
    }
  }

  if (required.every((key) => Object.keys(hashes).includes(key))) {
    console.log("All required parameters found");
    return hashes;
  }
  console.log("Missing Parameters", hashes);
}


function onInputFocus(event) {
  selectedInput = `#${event.target.id}`;
  console.log("focus change", selectedInput);
  keyboard.setOptions({
    inputName: event.target.id,
  });
}

function onInputChange(event) {
  keyboard.setInput(event.target.value, event.target.id);
}

function onChange(input) {
  const inputElm = document.querySelector(selectedInput || ".input");
  inputElm.value = input;
  console.log("Updating Input Elm:", inputElm.id, "with text input:", input);
}

function onKeyPress(button) {
  console.log("Button pressed", JSON.stringify(button));
  if (button != "{enter}") return;

  const inputElm = document.querySelector(selectedInput || ".input");
  const event = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    which: 13,
    keyCode: 13,
  });
  console.log("Emitting Enter on element:", inputElm.id);
  inputElm.dispatchEvent(event);

  keyboard.clearInput();
}

function Event(event, params) {
  params = params || { bubbles: false, cancelable: false, detail: undefined };
  var evt = window.document.createEvent("CustomEvent");
  evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
  return evt;
}

async function translate(code, text){

  const sourceLang = 'en';
  const targetLang = code;

  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl="+ sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(text);
  //console.log(url);
  
  const requestOptions = {
    method: "GET",
    redirect: "follow",
  };

  return fetch(url, requestOptions)
    .then((response) => response.json())
    .then((response) => response[0][0][0])
    .catch((error) => console.error(error));

}

function webexConnection() {
  return {
    setLanguage: function (languageCode) {
      const selectedLanguage = this.languages?.[languageCode];
      if (!selectedLanguage) return;
      this.languageCode = languageCode;
      this.languagePrompt = selectedLanguage.prompt;
      this.languageName = selectedLanguage.name;
      this.languageIcon = selectedLanguage.icon;
      const layout = new KeyboardLayouts().get(selectedLanguage.language);
      keyboard = new Keyboard({
        onChange: (input) => onChange(input),
        onKeyPress: (button) => onKeyPress(button),
        theme: "hg-theme-default myTheme1",
        ...layout,
      });

      this.languageSelected = true;
    },
    resetLanguage: function () {
      this.languageSelected = false;
      this.languageCode = "";
      this.languagePrompt = "";
      this.languageName = "";
      this.languageIcon = "";
      keyboard.destroy();
    },
    languages: languages,
    languageSelected: false,
    languageCode: "",
    languageName: "",
    languageIcon: "",
    languagePrompt: "",
    nameSet: false,
    name: "",
    setName: function (target) {
      if (target.value.trim()) {
        this.name = target.value.trim();
        this.nameSet = true;
        target.value = "";
        console.log("Setting Name:", this.name);
        //webexChatConnect(this.name);
      }
    },
    resetName: function () {
      this.name = "";
      this.nameSet = false;
    },
    webex:{},
    async webexChatConnect(displayName) {
      if (!hashes) return;

      console.log("Connect to Webex Chat - username", hashes.accessToken);

      const guestDetails = await generateGuestAccount(displayName);

      if (!guestDetails) {
        console.log("unable to get guest details");
        return;
      }


      // Init a new widget
      webex = window.Webex.init({
        credentials: {
          access_token: guestDetails.accessToken,
        },
      });
      this.webex = webex

      webex.messages
        .listen()
        .then(() => {
          console.log("listening to message events");
          this.webexConnected = true;
           
        })
        .catch((e) => console.error(`Unable to register for message events: ${e}`));

      this.webex.messages.on("created", (event) => {
            console.log(`Got a message:created event:\n${JSON.stringify(event)}`);
            const personEmail = event.data?.personEmail;
            const text = event.data?.text;
            console.log(
              "Message:",
              text,
              "\nFrom:",
              personEmail,
              "\nTarget:",
              hashes.target
            );
            if (personEmail != hashes.target) return;
            this.addAgentChat(event.data.text);
          });
          this.webex.messages.on("deleted", (event) =>
            console.log(`Got a message:deleted event:\n${event}`)
          );

      this.webex.messages
        .create({
          toPersonEmail: hashes.target,
          text: "New Chat Session with " + this.name +" started",
        })
        .catch((e) => console.error(`Unable to send message: ${e}`));
    },
    webexConnected: false,
    messages: [],
    addUserChat: function (input) {
      console.log("Adding User Message:", input);
      // Add user message
      this.messages.unshift({
        from: "user",
        text: input,
      });

      // Keep messages at most recent
      this.scrollChat();
    },
    addAgentChat: async function (input) {
      console.log("Adding Agent Message:", input);
      // Add user message
      try{
        const translated = await translate(this.languageCode, input);
        
        this.messages.unshift({
          from: "agent",
          text: translated,
        });
        
      } catch {
        
        
        this.messages.unshift({
          from: "agent",
          text: input,
        });
        
        
      }
      

      // Keep messages at most recent
      this.scrollChat();
    },
    scrollChat: function () {
      const messagesContainer = document.getElementById("messages");
      messagesContainer.scrollTop =
        messagesContainer.scrollHeight - messagesContainer.clientHeight;
      setTimeout(() => {
        messagesContainer.scrollTop =
          messagesContainer.scrollHeight - messagesContainer.clientHeight;
      }, 100);
    },
    updateChat: function (target) {
      if(!this.webexConnected)return
      keyboard.clearInput();
      if (target.value.trim()) {
        const text = target.value.trim();
        this.addUserChat(text);
        target.value = "";
        this.webex.messages
          .create({
            toPersonEmail: hashes.target,
            text: text,
          })
          .catch((e) => console.error(`Unable to send message: ${e}`));
      }
    },
  };
}
