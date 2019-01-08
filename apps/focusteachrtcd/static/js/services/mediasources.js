

"use strict";
define(['jquery', 'underscore', 'webrtc.adapter'], function($, _, adapter) {

	return ["$window", "mediaDevices", function($window, mediaDevices) {

		var MediaSources = function() {

			// For now enable media sources only in Chrome until other browsers have some use for it.
			this.supported = $window.navigator.mediaDevices && $window.navigator.mediaDevices.enumerateDevices && adapter.webrtcDetectedBrowser === "chrome";
			this.audio = [];
			this.video = [];

		};

		MediaSources.prototype.refresh = function(cb) {

			if (!this.supported) {
				if (cb) {
					cb([], []);
				}
				return;
			}

			// NOTE(longsleep): Put this in a try/catch to continue with
			// broken implementation like in node-webkit 0.7.2.
			try {
				this._refresh(cb);
			} catch (e) {
				console.error("Failed to get media sources: " + e.message);
				this.supported = false;
				if (cb) {
					cb([], []);
				}
			}

		};

		MediaSources.prototype._refresh = function(cb) {

			mediaDevices.enumerateDevices().then(_.bind(function(devices) {
				var audio = this.audio = [];
				var video = this.video = [];
				_.each(devices, function(device) {
					var o = {
						id: device.deviceId,
					}
					if (device.kind === "audioinput") {
						o.label = device.label ? device.label : "Microphone " + (audio.length + 1);
						audio.push(o);
					} else if (device.kind === "videoinput") {
						o.label = device.label ? device.label : "Camera " + (video.length + 1);
						video.push(o);
					}
				});
				if (cb) {
					cb(audio, video);
				}
			}, this), _.bind(function(error) {
				console.error("failed to get media devices: " + error);
				if (cb) {
					cb([], []);
				}
			}, this));

		};

		MediaSources.prototype.hasAudioId = function(id) {

			var i;
			for (i = 0; i < this.audio.length; i++) {
				if (this.audio[i].id === id) {
					return true;
				}
			}
			return false;

		};

		MediaSources.prototype.hasVideoId = function(id) {

			var i;
			for (i = 0; i < this.video.length; i++) {
				if (this.video[i].id === id) {
					return true;
				}
			}
			return false;

		};

		MediaSources.prototype.hasVideo = function() {

			return !this.supported || this.video.length > 0;

		};

		MediaSources.prototype.hasAudio = function() {

			return !this.supported || this.audio.length > 0;

		};


		return new MediaSources();

	}];

});
