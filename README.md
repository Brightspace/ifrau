# ifrau

[![NPM version][npm-image]][npm-url]
[![Build status][ci-image]][ci-url]
[![Coverage Status][coverage-image]][coverage-url]
[![Dependency Status][dependencies-image]][dependencies-url]

Short for iframe-free-range-app-utilities, `ifrau` makes it easy to communicate
from within an `IFRAME` cross-domain to a parent host. It does this by wrapping
[postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
in a promise-based API.

## Installation

Install from NPM:

```shell
npm install ifrau
```

Or include it in your application from the Brightspace CDN:

```html
<script src="https://s.brightspace.com/lib/ifrau/{version}/ifrau.js"></script>
```

## Host and Client

`ifrau` exposes two classes:

* **Host**: Created once for each FRA by the AppLoader within Brightspace.
It will build an `IFRAME` element, point it at the FRA endpoint,
and wait for the FRA to load and connect. It can then respond to events and
requests from the FRA.
* **Client**: Created by the free-range app, it will establish communication
with the host and can then be used to send/receive requests and events.

To create a Host:

```javascript
var Host = require('ifrau').Host;

var host = new Host(id, endpoint, options)
host.connect().then(function() {
	console.log('connected to client');
});
```

Parameters:

* `id`: id of the parent HTML element to insert the `IFRAME` into
* `endpoint`: URL of the free-range app endpoint (the `src` of the `IFRAME`)
* `options`
 * `debug`: whether to enable console debugging, `false` by default

Creating a Client is even simpler:

```javascript
var Client = require('ifrau').Client;

var client = new Client(options);
client.connect().then(function() {
	console.log('connected to host');
});
```

Parameters:

* `options`
 * `debug`: whether to enable console debugging, `false` by default

## Events

Events are the simplest way to communicate between the host and client. They're
an asynchronous "fire and forget" mechanism.

Let's say the host wanted a way to notify all clients that the
user's session had expired. This example adds a handler for the
**sessionExpired** event in the client:

```javascript
var client = new Client();
client.onEvent('sessionExpired', function(when) {
	console.log('session expired', when);
}).connect().then(function() {
	console.log('connected to host');
});
```

Notice that the handler must be added *before* the call to `connect()`,
otherwise it could miss events.

From the host's perspective, events must be triggered *after* a connection is
established:

```javascript
var host = new Host(...);
host.connect().then(function() {
	host.sendEvent('sessionExpired', new Date());
});
```

Although this example sends an event from the host to the client, both parties
can register for and send events.

## Requests

Requests are similar to events, but instead of "fire and forget", they use
promises to pass along a response to the requester.

Just like events, request handlers should be set up *before* connecting:

```javascript
var host = new Host(...);
host.onRequest('foo', 'bar')
	.connect().then(function() {
		console.log('connected to client');
	});
```

Request handlers can either provide a value (like the example above), a
function which returns a value, or a function which returns a promise.

On the other side, `request()` uses a promise-based API:

```javascript
var client = new Client();
client.connect().then(function() {
	client.request('foo').then(function(val) {
		console.log(val); // bar
	});
})
```

## Chaining

When setting up your event and request handlers on the host or client, they
can be chained:

```javascript
var client = new Client();
client.onEvent('jump', function() {
	// handle "jump" event
}).onEvent('skip', function() {
	// handle "skip" event
}).onRequest('time', new Date())
.onRequest('sayMyName', function() {
	return 'Heisenberg';
});
```

## Contributing
Contributions are welcome, please submit a pull request!

### Code Style

This repository is configured with [EditorConfig](http://editorconfig.org) rules and
contributions should make use of them.

[npm-url]: https://www.npmjs.org/package/ifrau
[npm-image]: https://img.shields.io/npm/v/ifrau.svg
[ci-url]: https://travis-ci.org/Brightspace/ifrau
[ci-image]: https://img.shields.io/travis/Brightspace/ifrau.svg
[coverage-url]: https://coveralls.io/r/Brightspace/ifrau?branch=master
[coverage-image]: https://img.shields.io/coveralls/Brightspace/ifrau.svg
[dependencies-url]: https://david-dm.org/Brightspace/ifrau
[dependencies-image]: https://img.shields.io/david/Brightspace/ifrau.svg
