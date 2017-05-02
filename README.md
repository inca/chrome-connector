# Chrome Connector

Control any Chrome using [Chrome Debugging Protocol](https://chromedevtools.github.io/debugger-protocol-viewer/tot/).

* Promise-based `sendCommand` (async/await)
* Works everywhere (browser, Node.js, Electron, etc)
* Thin on dependencies

## Usage

First you need to obtain a remote debugging target.

Here's an example of how to do this manually:

```bash
# Start Chrome in debugging mode
/path/to/chrome/Chrome --remote-debugging-port=9222
# Obtain a webSocketDebuggerUrl
curl http://localhost:9222/json
```

This will give you an array of debugging targets like this:

```
[{
   "description": "",
   "devtoolsFrontendUrl": "/devtools/inspector.html?ws=localhost:9222/devtools/page/74863d10-ff7c-43d9-b847-104c3a39e43f",
   "faviconUrl": "https://www.google.ru/favicon.ico",
   "id": "74863d10-ff7c-43d9-b847-104c3a39e43f",
   "title": "New Tab",
   "type": "page",
   "url": "chrome://newtab/",
   "webSocketDebuggerUrl": "ws://localhost:9222/devtools/page/74863d10-ff7c-43d9-b847-104c3a39e43f"
}, ...]
```

You'll need `webSocketDebuggerUrl` there:

```es6
const { ChromeConnector } = require('chrome-connector');

const chrome = new ChromeConnector('ws://localhost:9222/devtools/page/74863d10-ff7c-43d9-b847-104c3a39e43f');

await chrome.connect();

// Send CDP commands
const res = await chrome.sendCommand('Page.navigate', { url: 'http://github.com' });
// Read CDP response
const { frameId } = res;

// Subscribe to CDP events
chrome.on('Page.frameStoppedLoading', params => {
    // Access CDP event parameters
    const { frameId } = params;
});
```
