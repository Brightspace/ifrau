# ifrau

[![NPM version][npm-image]][npm-url]
[![Build status][ci-image]][ci-url]
[![Coverage Status][coverage-image]][coverage-url]
[![Dependency Status][dependencies-image]][dependencies-url]

Short for iframe-free-range-app-utilities, `ifrau` makes it easy to communicate from within an `IFRAME` cross-domain to a parent host. It wraps [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) in an easy-to-use, promise-based API.

## Installation

Install from NPM:

```shell
npm install ifrau
```

Or include it in your application as UMD/CommonJs from the Brightspace CDN:

```html
<!-- probably what you're looking for -->
<script src="https://s.brightspace.com/lib/ifrau/{version}/ifrau/client.js"></script>

<!-- actually hosting a FRA on your page? grab the host -->
<script src="https://s.brightspace.com/lib/ifrau/{version}/ifrau/host.js"></script>

<!-- the old bundle is still available too -->
<script src="https://s.brightspace.com/lib/ifrau/{version}/ifrau.js"></script>
```

## Host and Client

`ifrau` exposes two classes:

* **Host**: Created once for each FRA by the AppLoader within Brightspace.
It will build an `IFRAME` element, point it at the FRA endpoint, and wait for the FRA to load and connect. It can then respond to events and requests from the FRA.
* **Client**: Created by the free-range app, it will establish communication with the host and can then be used to send/receive requests and events.

To create a Host:

```javascript
var Host = require('ifrau/host');

function parentProvider() {
    return document.getElementById('myParentId');
}

var host = new Host(parentProvider, endpoint, options)
host.connect().then(function() {
	console.log('connected to client');
});
```

Parameters:

* `parentProvider`: function which will return the parent HTML element into which to insert the `IFRAME`
* `endpoint`: URL of the free-range app endpoint (the `src` of the `IFRAME`)
* `options`
 * `debug`: whether to enable console debugging, `false` by default
 * `resizeFrame`: whether the `IFRAME` should automatically resize to fit its content, `true` by default
 * `syncFont`: whether to allow client to automatically sync its font size with the host, `false` by default
 * `syncLang`: whether to allow client to automatically sync its language with the host, `false` by default
 * `syncPageTitle`: whether the page title (in the `<head>` element) should be kept in sync automatically with the title of the FRA, `false` by default
 * `height`: sets the iframe to a certain height, also disables automatic resizing
 * `id`: sets the id of the iframe
 * `allowFullScreen`: whether the frame can be placed into full screen mode, `false` by default

Creating a Client is even simpler:

```javascript
var Client = require('ifrau/client');

var client = new Client(options);
client
	.connect()
	.then(function() {
		console.log('connected to host!');
	});
```

Parameters:

* `options`
 * `debug`: whether to enable console debugging, `false` by default
 * `resizeFrame`: whether this `Client` should participate in automatic resizing. `true` by default
 * `syncFont`: whether the font size should be automatically set to match the host page, `false` by default
 * `syncLang`: whether the page's language tag should be automatically set to match the host page, `true` by default
 * `syncTitle`: whether the host page's title and `IFRAME` element title should be kept in sync with the FRA's title, `true` by default
 * `resizerOptions`: pass iframe-resizer client options through to the iframe resizer client

## Events

Events are the simplest way to communicate between the host and client. They're an asynchronous "fire and forget" mechanism.

Let's say the host wanted a way to notify all clients that the
user's session had expired. This example adds a handler for the **sessionExpired** event in the client:

```javascript
var client = new Client();
client.onEvent('sessionExpired', function(who, when) {
	console.log('session expired', who, when);
}).connect().then(function() {
	console.log('connected to host');
});
```

The handler should be added *before* the call to `connect()`, otherwise it could miss events.

From the host's perspective, events must be triggered *after* a connection is established:

```javascript
var host = new Host(...);
host.connect().then(function() {
	host.sendEvent('sessionExpired', 'user123', new Date());
});
```

Although this example sends an event from the host to the client, both parties can register for and send events.

## Requests

Requests are similar to events, but instead of "fire and forget", they use promises to pass along a response to the requester.

Just like events, request handlers should be set up *before* connecting:

```javascript
var host = new Host(...);
host.onRequest('sayMyName', 'Heisenberg')
	.connect().then(function() {
		console.log('connected to client!');
	});
```

Request handlers can either be a static value like in the `"sayMyName"` example above, or a function which can take optional arguments and returns a value:

```javascript
host.onRequest('addThesePlease', function(p1, p2) {
		return p1 + p2;
	});
```
Finally, if the result isn't available immediately, the function can return a promise:

```javascript
host.onRequest('addSlower', function(a, b) {
	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			resolve(a + b);
		}, 1000);
	});
});
```

On the other side, making `request()`s uses a promise-based API:

```javascript
var client = new Client();
client.connect()
    .then(function() {
	    return client.request('addThesePlease', 2, 3);
    }).then(function(val) {
		console.log(val); // 5
	});
```

## Services

Building on the concept of requests, services can be registered by both the host and client. Services provide a way to wrap a set of methods in an API which can be versioned.

Again, services must be registered before connecting:

```javascript
var host = new Host(...);
host.registerService('calculator', '1.0', {
    add: function(a, b) {
        return a + b;
    },
    subtract: function(a, b) {
        return a - b;
    }
});
```

To support breaking changes to your APIs while maintaining backwards compatibility, multiple versions of a service may be registered by passing in different values for the `version`.

**Note:** service methods become static, so any reference to `this` inside your methods will refer to the method itself.

Calling service APIs after connecting is simple and promise-based:

```javascript
var client = new Client();
client.connect()
    .then(function() {
        return client.getService('calculator', '1.0');
    }).then(function(calculator) {
        return calculator.add(1, 5);
    }).then(function(result) {
        console.log(result); // 6
    });
```

## Plugins

`ifrau` hosts and clients can be extended with plugins:

```javascript
var myPlugin require('ifrau-someplugin');
var client = new Client()
	.use(myPlugin);
```

Please prefix plugin names with `ifrau-*` so that it can be easily found.

## Chaining

When setting up your event, request handlers and services on the host or client, they can be chained:

```javascript
var client = new Client();
client.onEvent('jump', function() {
	// handle "jump" event
}).onEvent('skip', function() {
	// handle "skip" event
}).onRequest('time', new Date())
.onRequest('sayMyName', function() {
	return 'Heisenberg';
}).registerService('myService', '1.2', {...});
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
