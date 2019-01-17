

"use strict";
define([
	'jquery',
	'underscore',
	'ua-parser',
	'sjcl',
	'modernizr',
	'webrtc.adapter'

], function ($, _, uaparser, sjcl, Modernizr) {

	return ["globalContext", "connector", "api", "webrtc", "appData", "$route", "$location", "$window", "visibility", "$http", "safeApply", "$timeout", "$sce", "continueConnector", "restURL", function (context, connector, api, webrtc, appData, $route, $location, $window, visibility, $http, safeApply, $timeout, $sce, continueConnector, restURL) {

		var url = (context.Ssl ? "wss" : "ws") + "://" + context.Host + (context.Cfg.B || "/") + "ws";
		var version = context.Cfg.Version;
		console.log("Service version: " + version);
		console.log("Ws URL: " + url);
		console.log("Secure Contextual Escaping: " + $sce.isEnabled());

		var connectMarker = null;

		// Create encryption key from server token and browser name.
		var secureKey = sjcl.codec.base64.fromBits(sjcl.hash.sha256.hash(context.Cfg.Token + uaparser().browser.name));

		// Apply configuration details.
		webrtc.settings.renegotiation = context.Cfg.Renegotiation && true;
		if (webrtc.settings.renegotiation && $window.webrtcDetectedBrowser !== "chrome") {
			console.warn("Disable renegotiation in anything but Chrome for now.");
			webrtc.settings.renegotiation = false;
		}

		// mediaStream service API.
		var mediaStream = {
			version: version,
			ws: url,
			config: context.Cfg,
			webrtc: webrtc,
			connector: connector,
			api: api,
			connect: function () {
				var myMarker = {};
				connectMarker = myMarker;
				continueConnector.then(function () {
					if (connectMarker === myMarker) {
						console.log("Connecting ...");
						connector.connect(url);
					}
				});
			},
			reconnect: function () {
				var myMarker = {};
				connectMarker = myMarker;
				continueConnector.then(function () {
					if (connectMarker === myMarker) {
						console.log("Reconnecting ...");
						connector.reconnect();
					}
				});
			},
			initialize: function ($rootScope) {

				var cont = false;
				var ready = false;

				$rootScope.version = version;
				$rootScope.connect = false;

				var connect = function () {
					// We need websocket support to connect.
					if (!Modernizr.websockets) {
						console.error("This browser has no support for websockets. Connect aborted.");
						return;
					}
					if (ready && cont) {
						// Inject connector function into scope, so that controllers can pick it up.
						console.log("Ready to connect ...");
						mediaStream.connect();
						safeApply($rootScope, function (scope) {
							scope.connect = true;
						});
					}
				};

				$rootScope.$on("rooms.ready", function (event) {
					console.info("Initial room path set, continuing to connect ...");
					ready = true;
					connect();
				});

				visibility.afterPrerendering(function () {

					// Hide loader when we are visible.
					var loader = $("#loader");
					loader.addClass("done");
					_.delay(function () {
						loader.remove();
					}, 1000);


					cont = true;
					connect();
				});

			}
		};

		return mediaStream;

	}];

});
