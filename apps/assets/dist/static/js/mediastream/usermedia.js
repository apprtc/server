

"use strict";
define(['jquery', 'underscore', 'webrtc.adapter'], function ($, _) {
	// UserMedia.
	var UserMedia = function () {
		this.e = $({}); // Events.

		this.localStream = null;
		this.started = false;

		this.mediaConstraints = null;
	};

	UserMedia.prototype.doGetUserMedia = function (currentcall, mediaConstraints) {

		if (!mediaConstraints) {
			mediaConstraints = currentcall.mediaConstraints;
		}

		if (!mediaConstraints) {
			mediaConstraints = this.mediaConstraints;
		} else {
			this.mediaConstraints = mediaConstraints;
			this.localStream = null;
		}

		var constraints = $.extend(true, {}, mediaConstraints);

		try {
			console.log('Requesting access to local media with mediaConstraints:\n' +
				'  \'' + JSON.stringify(constraints) + '\'', constraints);
			navigator.getUserMedia(constraints, _.bind(this.onUserMediaSuccess, this), _.bind(this.onUserMediaError, this));
			this.started = true;
			return true;
		} catch (e) {
			console.error('getUserMedia failed with exception: ' + e.message);
			return false;
		}

	};

	UserMedia.prototype.onUserMediaSuccess = function (stream) {
		console.log('User has granted access to local media.');

		this.localStream = stream;
		// We are new.
		setTimeout(_.bind(function () {
			this.e.triggerHandler("mediasuccess", [this]);
		}, this), 0);
	};

	UserMedia.prototype.onUserMediaError = function (error) {
		console.error('Failed to get access to local media. Error was ' + error.name, error);

		// Let webrtc handle the rest.
		this.e.triggerHandler("mediaerror", [this, error]);

	};

	UserMedia.prototype.stop = function () {
		this.started = false;

		if (this.localStream && this.localStream.getTracks) {
			// Stop all tracks.
			var tracks = this.localStream.getTracks();
			_.each(tracks, function (t) {
				t.stop();
			});
			this.localStream = null;
		}

		this.mediaConstraints = null;
		console.log("Stopped user media.");
		this.e.triggerHandler("stopped", [this]);
		this.e.off();

	};


	UserMedia.prototype.addToPeerConnection = function (pc) {

		console.log("Add usermedia stream to peer connection", pc, this.localStream);
		if (this.localStream) {
			pc.addStream(this.localStream);
		}
	};

	UserMedia.prototype.removeFromPeerConnection = function (pc) {

		console.log("Remove usermedia stream from peer connection", pc, this.localStream);
		if (this.localStream) {
			pc.removeStream(this.localStream);
		}

	};

	return UserMedia;

});
