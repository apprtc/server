

"use strict";
define(['jquery', 'underscore', 'mediastream/dummystream', 'webrtc.adapter'], function($, _, DummyStream) {
	var stopUserMediaStream = (function() {
		return function(stream) {
			if (stream && stream.getTracks) {
				// Stop all tracks.
				var tracks = stream.getTracks();
				_.each(tracks, function(t) {
					t.stop();
				});
			} else {
				// MediaStream.stop is deprecated.
				stream.stop();
			}
		}
	})();

	// UserMedia.
	var UserMedia = function(options) {

		this.options = $.extend({}, options);
		this.e = $({}); // Events.

		this.localStream = null;
		this.started = false;

		this.peerconnections = {};

		// If true, mute/unmute of audio/video creates a new stream which
		// will trigger renegotiation on the peer connection.
		this.renegotiation = options.renegotiation && true;
		if (this.renegotiation) {
			console.info("User media with renegotiation created ...");
		}

		this.audioMute = options.audioMute && true;
		this.videoMute = options.videoMute && true;
		this.mediaConstraints = null;


		this.e.on("localstream", _.bind(function(event, stream, oldstream) {
			// Update stream support.
			if (oldstream) {
				_.each(this.peerconnections, function(pc) {
					if (DummyStream.not(oldstream)) {
						pc.removeStream(oldstream);
					}
					if (DummyStream.not(stream)) {
						pc.addStream(stream);
					}
					console.log("Updated usermedia stream at peer connection", pc, stream);
				});
			}
		}, this));

	};


	UserMedia.stopUserMediaStream = stopUserMediaStream;

	UserMedia.prototype.doGetUserMedia = function(currentcall, mediaConstraints) {

		if (!mediaConstraints) {
			mediaConstraints = currentcall.mediaConstraints;
		}

		return this.doGetUserMediaWithConstraints(mediaConstraints);

	};

	UserMedia.prototype.doGetUserMediaWithConstraints = function(mediaConstraints) {

		if (!mediaConstraints) {
			mediaConstraints = this.mediaConstraints;
		} else {
			this.mediaConstraints = mediaConstraints;
			if (this.localStream) {
				// Release stream early if any to be able to apply new constraints.
				this.replaceStream(null);
			}
		}

		var constraints = $.extend(true, {}, mediaConstraints);

		if (this.renegotiation) {

			if (this.audioMute && this.videoMute) {
				// Fast path as nothing should be shared.
				_.defer(_.bind(function() {
					this.onUserMediaSuccess(new DummyStream());
				}, this));
				this.started = true;
				return true
			}

			if (this.audioMute) {
				constraints.audio = false;
			}
			if (this.videoMute) {
				constraints.video = false;
			}

		}

		try {
			console.log('Requesting access to local media with mediaConstraints:\n' +
				'  \'' + JSON.stringify(constraints) + '\'', constraints);
			navigator.getUserMedia(constraints, _.bind(this.onUserMediaSuccess, this), _.bind(this.onUserMediaError, this));
			this.started = true;
			return true;
		} catch (e) {
			console.error('getUserMedia failed with exception: ' + e.message);
			this.onUserMediaSuccess(new DummyStream());
			return false;
		}

	};

	UserMedia.prototype.onUserMediaSuccess = function(stream) {
		console.log('User has granted access to local media.');

		if (!this.started) {
			stopUserMediaStream(stream);
			return;
		}

		this.onLocalStream(stream);

	};

	UserMedia.prototype.onUserMediaError = function(error) {
		console.error('Failed to get access to local media. Error was ' + error.name, error);
		this.onUserMediaSuccess(new DummyStream());
		return;
		
		if (!this.started) {
			return;
		}

		// Let webrtc handle the rest.
		this.e.triggerHandler("mediaerror", [this, error]);

	};

	UserMedia.prototype.replaceStream = function(stream) {

		var oldStream = this.localStream;

		if (oldStream && oldStream.active) {
			// Let old stream silently end.
			var onendedsilent = function(event) {
				console.log("Silently ended replaced user media stream.");
			};
			if (oldStream.getTracks) {
				_.each(stream.getTracks(), function(t) {
					t.onended = onendedsilent;
				});
			} else {
				// Legacy api.
				oldStream.onended = onendedsilent;
			}
			stopUserMediaStream(oldStream);
		}

		if (stream) {
			// Catch events when streams end.
			var trackCount = 0;
			var onended = _.bind(function(event) {
				trackCount--;
				if (this.started && trackCount <= 0) {
					console.log("Stopping user media as a stream has ended.", event);
					this.stop();
				}
			}, this);
			if (stream.getTracks) {
				_.each(stream.getTracks(), function(t) {
					t.onended = onended;
					trackCount++;
				});
			} else {
				// Legacy api.
				stream.onended = onended;
				trackCount++;
			}
			// Set new stream.
			this.localStream = stream;
			this.e.triggerHandler("localstream", [stream, oldStream, this]);
		}

		return oldStream && stream;

	};

	UserMedia.prototype.onLocalStream = function(stream) {

		if (this.replaceStream(stream)) {
			// We replaced a stream.
			setTimeout(_.bind(function() {
				this.e.triggerHandler("mediachanged", [this]);
			}, this), 0);
		} else {
			// We are new.
			setTimeout(_.bind(function() {
				this.e.triggerHandler("mediasuccess", [this]);
			}, this), 0);
		}

		if (!this.renegotiation) {
			// Apply mute states after we got streams.
			this.applyAudioMute(this.audioMute);
			this.applyVideoMute(this.videoMute);
		}

	};

	UserMedia.prototype.stop = function() {

		this.started = false;

		if (this.audioSource) {
			this.audioSource.disconnect();
			this.audioSource = null;
		}
		if (this.localStream) {
			stopUserMediaStream(this.localStream);
			this.localStream = null;
		}
		if (this.audioProcessor) {
			this.audioProcessor.disconnect()
		}
		this.audioLevel = 0;
		this.audioMute = false;
		this.videoMute = false;
		this.mediaConstraints = null;
		console.log("Stopped user media.");
		this.e.triggerHandler("stopped", [this]);
		this.e.off();

	};

	UserMedia.prototype.applyAudioMute = function(mute) {

		var m = !!mute;

		if (!this.renegotiation) {

			// Disable streams only - does not require renegotiation but keeps mic
			// active and the stream will transmit silence.

			if (this.localStream) {

				var audioTracks = this.localStream.getAudioTracks();
				if (audioTracks.length === 0) {
					//console.log('No local audio available.');
					return;
				}

				for (var i = 0; i < audioTracks.length; i++) {
					audioTracks[i].enabled = !mute;
				}

				if (mute) {
					console.log("Local audio muted by disabling audio tracks.");
				} else {
					console.log("Local audio unmuted by enabling audio tracks.");
				}

			}

		} else {

			// Remove audio stream, by creating a new stream and doing renegotiation. This
			// is the way to go to disable the mic when audio is muted.

			if (this.started) {
				if (this.audioMute !== m) {
					this.audioMute = m;
					this.doGetUserMediaWithConstraints();
				}
			} else {
				this.audioMute = m;
			}

		}

		return m;

	};

	UserMedia.prototype.applyVideoMute = function(mute) {

		var m = !!mute;

		if (!this.renegotiation) {

			// Disable streams only - does not require renegotiation but keeps camera
			// active and the stream will transmit black.

			if (this.localStream) {
				var videoTracks = this.localStream.getVideoTracks();
				if (videoTracks.length === 0) {
					//console.log('No local video available.');
					return;
				}

				for (var i = 0; i < videoTracks.length; i++) {
					videoTracks[i].enabled = !mute;
				}

				if (mute) {
					console.log("Local video muted by disabling video tracks.");
				} else {
					console.log("Local video unmuted by enabling video tracks.");
				}

			}
		} else {

			// Remove video stream, by creating a new stream and doing renegotiation. This
			// is the way to go to disable the camera when video is muted.

			if (this.started) {
				if (this.videoMute !== m) {
					this.videoMute = m;
					this.doGetUserMediaWithConstraints();
				}
			} else {
				this.videoMute = m;
			}

		}

		return m;

	};

	UserMedia.prototype.addToPeerConnection = function(pc) {

		console.log("Add usermedia stream to peer connection", pc, this.localStream);
		if (this.localStream) {
			if (DummyStream.not(this.localStream)) {
				pc.addStream(this.localStream);
			}
			var id = pc.id;
			if (!this.peerconnections.hasOwnProperty(id)) {
				this.peerconnections[id] = pc;
				pc.currentcall.e.one("closed", _.bind(function() {
					delete this.peerconnections[id];
				}, this));
			}
		} else {
			// Make sure to trigger renegotiation even if we have no media.
			_.defer(pc.negotiationNeeded);
		}

	};

	UserMedia.prototype.removeFromPeerConnection = function(pc) {

		console.log("Remove usermedia stream from peer connection", pc, this.localStream);
		if (this.localStream) {
			if (DummyStream.not(this.localStream)) {
				pc.removeStream(this.localStream);
			}
			if (this.peerconnections.hasOwnProperty(pc.id)) {
				delete this.peerconnections[pc.id];
			}
		}

	};

	UserMedia.prototype.attachMediaStream = function(video) {

		if (this.localStream && DummyStream.not(this.localStream)) {
			window.attachMediaStream(video, this.localStream);
		}

	};

	return UserMedia;

});
