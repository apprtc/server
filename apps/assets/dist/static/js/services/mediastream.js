

"use strict";
define([
	'jquery',
	'underscore',
	'webrtc.adapter'

], function ($, _) {

	return ["globalContext", "connector", "api", "webrtc", "appData", "$window", "$http", "safeApply", "$timeout", "$sce", "continueConnector", function (context, connector, api, webrtc, appData, $window, $http, safeApply, $timeout, $sce, continueConnector) {

		var url = (context.Ssl ? "wss" : "ws") + "://" + context.Host + (context.Cfg.B || "/") + "ws";
		var version = context.Cfg.Version;
		console.log("Service version: " + version);
		console.log("Ws URL: " + url);
		console.log("Secure Contextual Escaping: " + $sce.isEnabled());

		var connectMarker = null;

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

				cont = true;
				connect();
			}
		};

		return mediaStream;

	}];

});
