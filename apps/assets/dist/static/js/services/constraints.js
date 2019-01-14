

"use strict";
 define(["jquery", "underscore", "webrtc.adapter"], function($, _) {

	// constraints
	return ["webrtc", "$window", "$q", function(webrtc, $window, $q) {

		var service = this;

		// Constraints implementation holder. Created new all the time.
		var Constraints = function(settings) {
			this.settings = _.clone(settings, true);
			this.pc = [];
			this.audio = [];
			this.video = [];
			this.videoMandatory = {};
			this.disabled = {};
			// Add a single promise for ourselves.
			this.promises = [];
			this.defer().resolve();
		};

		// Helpers to wait on stuff.
		Constraints.prototype.defer = function() {
			var deferred = $q.defer();
			this.promises.push(deferred.promise);
			return deferred;
		};
		Constraints.prototype.wait = function(promise) {
			this.promises.push(promise);
			return promise;
		};

		// Add constraints.
		Constraints.prototype.add = function(t, k, v, mandatory) {
			if (_.isArray(t)) {
				_.forEach(t, function(x) {
					this.add(x, k, v, mandatory);
				}, this);
				return;
			}
			var obj;
			if (mandatory) {
				t = t + "Mandatory";
			}
			obj = this[t];
			if (!obj) {
				console.warn("Pushed to unknown constraint", t, k, v, mandatory);
			} else {
				if (mandatory) {
					// Mandatory constraints are key/values.
					obj[k] = v;
				} else {
					// Optional constraints are arrays.
					var d = {};
					d[k] = v;
					obj.push(d);
				}
			}
		};

		// Set constraints, overwriting existing.
		Constraints.prototype.set = function(t, data, mandatory) {
			if (mandatory) {
				t = t + "Mandatory";
			}
			if (!this[t]) {
				console.warn("Set to unknown constraint", t, data, mandatory);
			} else {
				this[t] = data;
			}
		};

		// Set disable flag for video/audio.
		Constraints.prototype.disable = function(name) {
			this.disabled[name] = true;
		};

		// Define our service helpers
		service.e = $({}); // events
		service.stun = [];
		service.turn = {};

		// Create as WebRTC data structure.
		service.mediaConstraints = function(constraints) {
			if (constraints.disabled.audio) {
				webrtc.settings.mediaConstraints.audio = false
			} else {
				webrtc.settings.mediaConstraints.audio = {
					optional: constraints.audio
				};
			}
			if (constraints.disabled.video) {
				webrtc.settings.mediaConstraints.video = false;
			} else {
				webrtc.settings.mediaConstraints.video = {
					optional: constraints.video,
					mandatory: constraints.videoMandatory
				};
			}
		};

		// Create as WebRTC data structure.
		service.pcConstraints = function(constraints) {
			webrtc.settings.pcConstraints.optional = constraints.pc;
		};

		service.iceServers = function(constraints) {
			var createIceServers = function(urls, username, password) {
				var s = {
					urls: urls
				}
				if (username) {
					s.username = username;
					s.credential = password;
				}
				return s;
			};
			var iceServers = [];
			if (service.stun && service.stun.length) {
				iceServers.push(createIceServers(service.stun));
			}
			if (service.turn && service.turn.urls && service.turn.urls.length) {
				iceServers.push(createIceServers(service.turn.urls, service.turn.username, service.turn.password));
			}
			webrtc.settings.pcConfig.iceServers = iceServers;
		};

		// Some default constraints.
		service.e.on("refresh", function(event, constraints) {

			if ($window.webrtcDetectedBrowser === "chrome") {
				// NOTE(longsleep): We can always enable SCTP data channels, as we have a workaround
				// using the "active" event for Firefox < 27.
				// SCTP does not work correctly with Chrome 31. Require M32.
				if ($window.webrtcDetectedVersion >= 32) {
					// SCTP is supported from Chrome M31.
					// No need to pass DTLS constraint as it is on by default in Chrome M31.
					// For SCTP, reliable and ordered is true by default.
				} else {
					// Chrome < M32 does not yet do DTLS-SRTP by default whereas Firefox only
					// does DTLS-SRTP. In order to get interop, you must supply Chrome
					// with a PC constructor constraint to enable DTLS.
					console.warn("Turning on SCTP combatibility - please update your Chrome.");
					constraints.add("pc", "DtlsSrtpKeyAgreement", true);
				}
			}

		});

		// Public API.
		return {
			e: service.e,
			refresh: function(settings) {
				var constraints = new Constraints(settings);
				service.e.triggerHandler("refresh", [constraints]);
				return $q.all(constraints.promises).then(function() {
					service.mediaConstraints(constraints);
					service.pcConstraints(constraints);
					service.iceServers(constraints);
				});
			},
			// Setters for TURN and STUN data.
			turn: function(turnData) {
				service.turn = turnData;
			},
			stun: function(stunData) {
				service.stun = stunData;
			},
			supported: (function() {
				var isChrome = $window.webrtcDetectedBrowser === "chrome";
				var isFirefox = $window.webrtcDetectedBrowser === "firefox";
				var isEdge = $window.webrtcDetectedBrowser === "edge";
				var version = $window.webrtcDetectedVersion;
				// Constraints support table.
				return {
					// Chrome supports it. FF supports new spec starting 38. See https://wiki.mozilla.org/Media/getUserMedia for FF details.
					audioVideo: isChrome || (isFirefox && version >= 38),
					// HD constraints in Chrome no issue. In FF we MJPEG is fixed with 38 (see https://bugzilla.mozilla.org/show_bug.cgi?id=1151628).
					hdVideo: isChrome || (isFirefox && version >= 38),
					// Chrome supports this on Windows only.
					renderToAssociatedSink: isChrome && $window.navigator.platform.indexOf("Win") === 0,
					vp9: isChrome && version >= 48,
					chrome: isChrome,
					firefox: isFirefox,
					edge: isEdge
				};
			})()
		};

	}];

 });