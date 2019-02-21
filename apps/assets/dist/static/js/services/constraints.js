

"use strict";
 define(["jquery", "underscore"], function($, _) {

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


		// Public API.
		return {
			e: service.e,
			refresh: function(settings) {
				var constraints = new Constraints(settings);
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
			}
		};

	}];

 });