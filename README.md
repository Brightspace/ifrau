# ifrau

[![NPM version][npm-image]][npm-url]
[![Dependency Status][dependencies-image]][dependencies-url]

Short for iframe-free-range-app-utilities, `ifrau` makes it easy to communicate from within an `IFRAME` cross-domain to a parent host. It wraps [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) in an easy-to-use, promise-based API.

## Installation

Install from NPM:

```shell
npm install ifrau
```

## Host and Client

`ifrau` exposes three classes:

* **Host**: Created once for each FRA by the AppLoader within Brightspace.
It will build an `IFRAME` element, point it at the FRA endpoint, and wait for the FRA to load and connect. It can then respond to events and requests from the FRA.
* **Client**: Created by the free-range app, it will establish communication with the host and can then be used to send/receive requests and events.
* **SlimClient**: A lighter-weight client created by components within free-range apps that may need to send/receive requests and events with the host. This assumes the parent app has already created a full client to manage syncing options. 

To create a Host:

```javascript
import { Host } from 'ifrau/host.js';

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
 * `syncLang`: whether to allow client to automatically sync its language, timezone, internationalization, and OSLO settings with the host, `false` by default
 * `syncPageTitle`: whether the page title (in the `<head>` element) should be kept in sync automatically with the title of the FRA, `false` by default
 * `syncCssVariable`: whether css variables (in the `<head>` element) should be kept in sync automatically with the css variables of the FRA, `false` by default
 * `height`: sets the iframe to a certain height, also disables automatic resizing
 * `id`: sets the id of the iframe
 * `allowFullScreen`: whether the frame can be placed into full screen mode, `false` by default
 * `allowMicrophone`: whether the frame will allow access to the microphone, `false` by default
 * `allowCamera`: whether the frame will allow access to the camera, `false` by default
 * `allowScreenCapture`: whether the frame will allow access to record the screen, `false` by default
 * `allowEncryptedMedia`:  whether the frame will allow access to encrypted media, `false` by default
 * `allowAutoplay`:  whether the frame will allow access to autoplay, `false` by default

Creating a Client is even simpler:

```javascript
import { Client } from 'ifrau/client.js';

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

Creating a SlimClient can be done in the same way:

```javascript
import { SlimClient } from 'ifrau/client/slim.js';

var slimClient = new SlimClient(options);
slimClient
	.connect()
	.then(function() {
		console.log('connected to host!');
	});
```

Parameters:

* `options`
 * `debug`: whether to enable console debugging, `false` by default

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

## Versioning & Releasing

> TL;DR: Commits prefixed with `fix:` and `feat:` will trigger patch and minor releases when merged to `master`. Read on for more details...

The [sematic-release GitHub Action](https://github.com/BrightspaceUI/actions/tree/master/semantic-release) is called from the `release.yml` GitHub Action workflow to handle version changes and releasing.

### Version Changes

All version changes should obey [semantic versioning](https://semver.org/) rules:
1. **MAJOR** version when you make incompatible API changes,
2. **MINOR** version when you add functionality in a backwards compatible manner, and
3. **PATCH** version when you make backwards compatible bug fixes.

The next version number will be determined from the commit messages since the previous release. Our semantic-release configuration uses the [Angular convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) when analyzing commits:
* Commits which are prefixed with `fix:` or `perf:` will trigger a `patch` release. Example: `fix: validate input before using`
* Commits which are prefixed with `feat:` will trigger a `minor` release. Example: `feat: add toggle() method`
* To trigger a MAJOR release, include `BREAKING CHANGE:` with a space or two newlines in the footer of the commit message
* Other suggested prefixes which will **NOT** trigger a release: `build:`, `ci:`, `docs:`, `style:`, `refactor:` and `test:`. Example: `docs: adding README for new component`

To revert a change, add the `revert:` prefix to the original commit message. This will cause the reverted change to be omitted from the release notes. Example: `revert: fix: validate input before using`.

### Releases

When a release is triggered, it will:
* Update the version in `package.json`
* Tag the commit
* Create a GitHub release (including release notes)
* Deploy a new package to NPM
* Deploy `ifrau` to the CDN at `https://s.brightspace.com/lib/ifrau/{version}/*`

### Releasing from Maintenance Branches

Occasionally you'll want to backport a feature or bug fix to an older release. `semantic-release` refers to these as [maintenance branches](https://semantic-release.gitbook.io/semantic-release/usage/workflow-configuration#maintenance-branches).

Maintenance branch names should be of the form: `+([0-9])?(.{+([0-9]),x}).x`.

Regular expressions are complicated, but this essentially means branch names should look like:
* `1.15.x` for patch releases on top of the `1.15` release (after version `1.16` exists)
* `2.x` for feature releases on top of the `2` release (after version `3` exists)

[npm-url]: https://www.npmjs.org/package/ifrau
[npm-image]: https://img.shields.io/npm/v/ifrau.svg
[dependencies-url]: https://david-dm.org/Brightspace/ifrau
[dependencies-image]: https://img.shields.io/david/Brightspace/ifrau.svg
