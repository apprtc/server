

"use strict";
define(["underscore", "jquery", "webrtc.adapter"], function(_, $) {

	// chromeExtension
	return ["$window", "$q", "alertify", "translation", function($window, $q, alertify, translation) {

		var ChromeExtension = function() {
			this.available = false;
			this.registry = {};
			this.count = 0;
			this.e = $({});
			this.autoinstall = {};
			this.initialize();
		};

		ChromeExtension.prototype.initialize = function() {
			var marker = $window.document.getElementById("chromeextension-available");
			if (marker) {
				this.available = true;
				console.log("Chrome extension is available.");
				this.e.triggerHandler("available", true);
			} else if (!marker && this.available) {
				this.available = false;
				console.log("Chrome extension is no longer available.");
				this.e.triggerHandler("available", false);
			}
		};

		ChromeExtension.prototype.call = function(data) {
			var deferred = $q.defer();
			var n = this.count++;
			this.registry[n] = deferred;
			var msg = {
				Type: "Call",
				Call: data,
				n: n
			}
			$window.postMessage(msg, $window.document.URL);
			return deferred.promise;
		};

		ChromeExtension.prototype.onMessage = function(event) {
			var data = event.data;
			switch (data.Type) {
			case "Call":
				var deferred = this.registry[data.n];
				if (deferred) {
					var call = data.Call;
					switch (call.Type) {
					case "Result":
						delete this.registry[data.n];
						//console.log("Call complete with result", call);
						deferred.resolve(call.Result);
						break;
					case "Notify":
						//console.log("Notify", call);
						deferred.notify(call.Notify);
						break;
					case "Error":
						delete this.registry[data.n];
						//console.log("Call failed with error", call);
						deferred.reject(call.Error);
						break
					}
				} else {
					console.warn("Unknown call reference received", data, this.registry, this);
				}
				break;
			case "Upgrade":
				console.log("Extension installed or upgraded", data);
				this.initialize();
				break;
			default:
				console.log("Unknown message type", data.Type, data);
				break;
			}
		};

		ChromeExtension.prototype.registerAutoInstall = function(installFunc, cancelInstallFunc, force) {

			this.autoinstall.install = installFunc;
			this.autoinstall.cancel = cancelInstallFunc;
			this.autoinstall.force = !!force;
			if (!this.available && installFunc) {
				this.e.triggerHandler("available", true);
			}

		};

		// Create extension api and wait for messages.
		var extension = new ChromeExtension();
		$window.addEventListener("message", function(event) {
			//console.log("message", event.origin, event.source === window, event);
			if (event.source === window && event.data.answer) {
				// Only process answers to avoid loops.
				extension.onMessage(event);
			}
		});

		// Always register default auto install which tells user that extension is required
		// if screen sharing can only work with extension.
		if ($window.webrtcDetectedBrowser === "chrome" && $window.webrtcDetectedVersion >= 37) {
			extension.registerAutoInstall(function() {
				var d = $q.defer();
				alertify.dialog.alert(translation._("Screen sharing requires a browser extension. Please add the Spreed WebRTC screen sharing extension to Chrome and try again."));
				d.reject("Manual extension installation required");
				return d.promise;
			});
		}

		// Expose.
		return extension;

	}];

});