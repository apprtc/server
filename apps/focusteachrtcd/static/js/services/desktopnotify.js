

"use strict";
define(['jquery', 'underscore', 'desktop-notify', 'webrtc.adapter'], function($, _, notify) {

	return ["$window", function($window) {

		// Retrieve URL from CSS.
		var defaultIconUrl = (function() {
			var iconElement = $("<span>").addClass("desktopnotify-icon hidden");
			iconElement.appendTo("body");
			var url = iconElement.css('background-image');
			url = /^url\((['"]?)(.*)\1\)$/.exec(url);
			url = url ? url[2] : "";
			iconElement.remove();
			return url;
		}());

		var helper = notify;

		var DesktopNotify = function() {

			this.asked = false;
			this.windowHasFocus = true;
			this.dummy = {
				close: function() {}
			};
			this.refresh();
			this.enabled();

			$($window).on("focus blur", _.bind(function(event) {
				this.windowHasFocus = event.type === "focus" ? true : false;
			}, this));

		};

		DesktopNotify.prototype.enabled = function() {

			if (this.supported && this.level === "default") {
				this.asked = true;
				this.requestPermission();
			}
			return this.supported && this.level === "granted";

		};

		DesktopNotify.prototype.refresh = function() {

			var level = this.level = helper.permissionLevel();
			this.supported = (function() {
				if (helper.isSupported) {
					if ($window.Notification && $window.Notification.requestPermission) {
						if (level !== "granted") {
							// Aditional check to verify Notification really works. This fails
							// on Android, where Notifications raise an exception.
							// See https://code.google.com/p/chromium/issues/detail?id=481856
							try {
								/*jshint strict: true, nonew: false */
								new $window.Notification('');
							} catch(e) {
								if (e.name == 'TypeError') {
									return false;
								}
							}
						} else {
							// Disable notifications even if granted and on Android Chrome.
							if ($window.webrtcDetectedAndroid) {
								return false;
							}
						}
					}
					return true;
				}
				return false;
			}());

		};

		DesktopNotify.prototype.requestPermission = function(cb) {

			//console.log("request permission");
			return helper.requestPermission(_.bind(function() {

				//console.log("requestPermission result", arguments);
				this.refresh();
				if (cb) {
					cb.apply(helper, arguments);
				}

			}, this));

		};

		DesktopNotify.prototype.createNotification = function(title, options) {

			return helper.createNotification(title, options);

		};

		DesktopNotify.prototype.notify = function(title, body, options) {

			if (!this.enabled()) {
				return this.dummy;
			}

			var opts = {
				body: body,
				icon: defaultIconUrl,
				timeout: 7000
			}
			$.extend(opts, options);
			var timeout = opts.timeout;
			delete opts.timeout;
			var n = this.createNotification(title, opts);
			if (timeout) {
				$window.setTimeout(function() {
					n.close();
				}, timeout);
			}
			return n;

		};

		return new DesktopNotify();

	}];

});
