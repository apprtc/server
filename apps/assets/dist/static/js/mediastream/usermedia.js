

"use strict";
define(['jquery', 'underscore', 'webrtc.adapter'], function ($, _) {
	// UserMedia.
	var UserMedia = function () {
		this.e = $({}); // Events.

		this.localStream = null;
	};

	// Asynchronously request user media if needed.
	UserMedia.prototype.doGetUserMedia = function (mediaConstraints, needStream) {
		var mediaPromise = null;
		if (needStream) {

			mediaPromise = navigator.mediaDevices.getUserMedia(mediaConstraints)
				.catch(function (error) {
					this.onUserMediaError(error);
				})
				.then(function (stream) {
					console.log('Got access to local media with mediaConstraints:\n' +
						'  \'' + JSON.stringify(mediaConstraints) + '\'');

					this.localStream = stream;
				}.bind(this)).catch(function (error) {
					console.error('Failed to get access to local media. Error was ' + error.name, error);
				}.bind(this));
		} else {
			mediaPromise = Promise.resolve();
		}
		return mediaPromise;
	};

	UserMedia.prototype.stop = function () {
		if (this.localStream && this.localStream.getTracks) {
			// Stop all tracks.
			var tracks = this.localStream.getTracks();
			_.each(tracks, function (t) {
				t.stop();
			});
			this.localStream = null;
		}

		console.log("Stopped user media.");
		this.e.triggerHandler("stopped", [this]);
		this.e.off();

	};


	UserMedia.prototype.addToPeerConnection = function (pc) {

		console.log("UserMedia.addToPeerConnection");
		if (this.localStream) {
			pc.addStream(this.localStream);
		}
	};

	UserMedia.prototype.removeFromPeerConnection = function (pc) {

		console.log("UserMedia.removeFromPeerConnection");
		if (this.localStream) {
			pc.removeStream(this.localStream);
		}

	};

	return UserMedia;

});
