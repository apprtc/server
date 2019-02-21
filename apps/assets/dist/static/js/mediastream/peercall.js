

"use strict";
define(['jquery', 'underscore', 'mediastream/peerconnectionclient'], function ($, _, PeerConnectionClient) {

	var PeerCall = function (webrtc, id, from, to) {

		this.webrtc = webrtc;
		this.id = id;
		this.from = from;
		this.to = to;

		this.e = $({}) // events

		this.mediaConstraints = $.extend(true, {}, this.webrtc.settings.mediaConstraints);
		this.pcConfig = $.extend(true, {}, this.webrtc.settings.pcConfig);
		this.pcConstraints = $.extend(true, {}, this.webrtc.settings.pcConstraints);
		this.sdpParams = $.extend(true, {}, this.webrtc.settings.sdpParams);
		this.offerOptions = $.extend(true, {}, this.webrtc.settings.offerOptions);

		this.peerconnectionclient = null;
		this.pendingCandidates = [];

		this.remoteStream = null;

		this.initiate = false;
		this.closed = false;

		this.started_ = false;
		this.hasRemoteSdp_ = false;


		this.onremotesdpset = null;

		this.recorder = null;

	};

	PeerCall.prototype.isOutgoing = function () {
		return !!this.from;
	};

	PeerCall.prototype.setInitiate = function (initiate) {
		this.initiate = !!initiate;
		console.log("Set initiate", this.initiate);
	};


	PeerCall.prototype.createPeerConnection = function (success_cb, error_cb) {

		var peerconnectionclient = this.peerconnectionclient = new PeerConnectionClient(this.webrtc, this);
		if (success_cb && peerconnectionclient.pc) {
			success_cb(peerconnectionclient);
		}
		if (error_cb && !peerconnectionclient.pc) {
			// TODO(longsleep): Check if this can happen?
			error_cb(peerconnectionclient);
		}

		this.drainMessageQueues();
		return peerconnectionclient;

	};

	PeerCall.prototype.drainMessageQueues = function () {
		console.log("PeerCall.drainMessageQueues.");
		if (!this.peerconnectionclient || !this.hasRemoteSdp_) {
			return;
		}
		while (this.pendingCandidates.length > 0) {
			var candidate = this.pendingCandidates.shift();
			this.addIceCandidate(candidate);
		}
	}

	PeerCall.prototype.createOffer = function (cb) {

		var options = this.offerOptions;
		console.log('Creating offer with options: \n' +
			'  \'' + JSON.stringify(options, null, '\t') + '\'.');
		this.peerconnectionclient.createOffer(_.bind(this.onCreateAnswerOffer, this, cb), _.bind(this.onErrorAnswerOffer, this), options);

	};

	PeerCall.prototype.createAnswer = function (cb) {

		console.log("Creating answer.");
		this.peerconnectionclient.createAnswer(_.bind(this.onCreateAnswerOffer, this, cb), _.bind(this.onErrorAnswerOffer, this));

	};

	PeerCall.prototype.onCreateAnswerOffer = function (cb, sessionDescription) {
		console.log("PeerCall.onCreateAnswerOffer type=", sessionDescription.type);

		this.setLocalSdp(sessionDescription);

		// Always set local description.
		this.peerconnectionclient.setLocalDescription(sessionDescription, _.bind(function () {
			console.log("Set local session description.", sessionDescription);
			if (cb) {
				cb(sessionDescription, this);
			}
		}, this), _.bind(function (err) {
			console.error("Set local session description failed", err);
			this.close();
			this.e.triggerHandler("error", "failed_peerconnection_setup");
		}, this));
	};

	PeerCall.prototype.onErrorAnswerOffer = function (event) {
		console.error("Failed to create answer/offer", event);
	};

	PeerCall.prototype.setRemoteDescription = function (sessionDescription, cb) {

		var peerconnectionclient = this.peerconnectionclient;
		if (!peerconnectionclient) {
			console.log("Got a remote description but not connected -> ignored.");
			return;
		}

		sessionDescription.sdp = maybeSetOpusOptions(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybePreferAudioSendCodec(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybePreferVideoSendCodec(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybeSetAudioSendBitRate(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybeSetVideoSendBitRate(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybeSetVideoSendInitialBitRate(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybeRemoveVideoFec(sessionDescription.sdp, this.sdpParams);

		peerconnectionclient.setRemoteDescription(new RTCSessionDescription(sessionDescription))
			.then(this.onSetRemoteDescriptionSuccess_.bind(this))
			.catch(function (err) {
				console.error("Set remote session description failed", err);
				this.close();
				this.e.triggerHandler("error", "failed_peerconnection_setup");
			});

	};


	PeerCall.prototype.onSetRemoteDescriptionSuccess_ = function () {
		trace('Set remote session description success.');
		this.hasRemoteSdp_ = true;
		// By now all onaddstream events for the setRemoteDescription have fired,
		// so we can know if the peer has any remote video streams that we need
		// to wait for. Otherwise, transition immediately to the active state.
		var remoteStreams = this.peerconnectionclient.pc.getRemoteStreams();
		if (this.onremotesdpset) {
			this.onremotesdpset(remoteStreams.length > 0 &&
				remoteStreams[0].getVideoTracks().length > 0);
		}

		this.drainMessageQueues();
	};

	PeerCall.prototype.setLocalSdp = function (sessionDescription) {
		sessionDescription.sdp = maybePreferAudioReceiveCodec(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybePreferVideoReceiveCodec(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybeSetAudioReceiveBitRate(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybeSetVideoReceiveBitRate(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybeRemoveVideoFec(sessionDescription.sdp, this.sdpParams);
	};


	// Return false if the candidate should be dropped, true if not.
	PeerCall.prototype.filterIceCandidate_ = function (candidateObj) {
		var candidateStr = candidateObj.candidate;

		// Always eat TCP candidates. Not needed in this context.
		if (candidateStr.indexOf('tcp') !== -1) {
			return false;
		}

		// If we're trying to eat non-relay candidates, do that.
		if (iceCandidateType(candidateStr) === 'relay') {
			return false;
		}

		return true;
	};

	PeerCall.prototype.onIceCandidate = function (event) {
		console.info("PeerCall.onIceCandidate:", event.candidate);

		// Eat undesired candidates.
		if (event.candidate) {
			if (this.filterIceCandidate_(event.candidate)) {
				//console.log("ice candidate", event.candidate);
				var payload = {
					type: 'candidate',
					sdpMLineIndex: event.candidate.sdpMLineIndex,
					sdpMid: event.candidate.sdpMid,
					candidate: event.candidate.candidate
				};
				// Allow external payload modifications.
				this.e.triggerHandler("icecandidate", [payload, this]);
				// Send it.
				// XXX(longsleep): This seems to be breaking conferences when this.to and not this.id.
				this.webrtc.api.sendCandidate(this.to, payload);
				//console.log("Sent candidate", event.candidate.sdpMid, event.candidate.sdpMLineIndex, event.candidate.candidate);
			}
		} else {
			console.log('End of candidates.');
		}
	};


	PeerCall.prototype.onSignalingStateChange = function (signalingState) {
		console.info("PeerCall.onSignalingStateChange signalingState=", signalingState);

		this.e.triggerHandler("signalingStateChange", [signalingState, this]);
	};

	PeerCall.prototype.onIceConnectionStateChange = function (iceConnectionState) {
		console.info("PeerCall.onIceConnectionStateChange iceConnectionState=", iceConnectionState);

		this.e.triggerHandler("connectionStateChange", [iceConnectionState, this]);

	};


	PeerCall.prototype.startRecord = function (stream) {
		if (stream == null) {
			return;
		}

		trace("PeerCall.startRecord");

		this.recorder = RecordRTC(stream, {
			// audio, video, canvas, gif
			type: 'video',

			// audio/webm
			// video/webm;codecs=vp9
			// video/webm;codecs=vp8
			// video/webm;codecs=h264
			// video/x-matroska;codecs=avc1
			// video/mpeg -- NOT supported by any browser, yet
			// video/mp4  -- NOT supported by any browser, yet
			// audio/wav
			// audio/ogg  -- ONLY Firefox
			// demo: simple-demos/isTypeSupported.html
			mimeType: 'video/webm',

			// MediaStreamRecorder, StereoAudioRecorder, WebAssemblyRecorder
			// CanvasRecorder, GifRecorder, WhammyRecorder
			recorderType: MediaStreamRecorder,

			// disable logs
			disableLogs: true,

			// get intervals based blobs
			// value in milliseconds
			timeSlice: 1000,

			// requires timeSlice above
			// returns blob via callback function
			ondataavailable: function (blob) { },

			// auto stop recording if camera stops
			checkForInactiveTracks: false,

			// requires timeSlice above
			onTimeStamp: function (timestamp) { },

			// both for audio and video tracks
			bitsPerSecond: 128000,

			// only for audio track
			audioBitsPerSecond: 128000,

			// only for video track
			videoBitsPerSecond: 128000,

			// used by CanvasRecorder and WhammyRecorder
			// it is kind of a "frameRate"
			frameInterval: 90,

			// if you are recording multiple streams into single file
			// this helps you see what is being recorded
			previewStream: function (stream) { },

			// used by CanvasRecorder and WhammyRecorder
			// you can pass {width:640, height: 480} as well
			video: HTMLVideoElement,

			// used by CanvasRecorder and WhammyRecorder
			canvas: {
				width: 640,
				height: 480
			},

			// used by StereoAudioRecorder
			// the range 22050 to 96000.
			sampleRate: 96000,

			// used by StereoAudioRecorder
			// the range 22050 to 96000.
			// let us force 16khz recording:
			desiredSampRate: 16000,

			// used by StereoAudioRecorder
			// Legal values are (256, 512, 1024, 2048, 4096, 8192, 16384).
			bufferSize: 16384,

			// used by StereoAudioRecorder
			// 1 or 2
			numberOfAudioChannels: 2,

			// used by WebAssemblyRecorder
			frameRate: 30,

			// used by WebAssemblyRecorder
			bitrate: 128000
		});
		this.recorder.startRecording();
	}


	PeerCall.prototype.stopRecord = function () {
		trace("PeerCall.stopRecord");

		if (this.recorder !== null) {
			var recorder = this.recorder;
			recorder.stopRecording(function () {
				let blob = recorder.getBlob();

				getSeekableBlob(blob, function (seekableBlob) {
					invokeSaveAsDialog(seekableBlob, "record-rtc-media.webm");
				})
			});

			this.remoteStream = null;
		}

	}

	PeerCall.prototype.onRemoteStreamAdded = function (stream) {
		console.log("PeerCall.onRemoteStreamAdded");

		if (stream != null) {
			this.remoteStream = stream;

			this.webrtc.onRemoteStreamAdded(stream, this);

			this.startRecord(stream);
		}

		// this.remoteStream = stream;
		// this.e.triggerHandler("remoteStreamAdded", [stream, this]);
	};

	PeerCall.prototype.onRemoteStreamRemoved = function (stream) {
		console.log("PeerCall.onRemoteStreamRemoved");

		this.e.triggerHandler("remoteStreamRemoved", [this.remoteStream, this]);
		this.webrtc.onRemoteStreamRemoved(this.remoteStream, this);

		if (this.remoteStream) {
			this.remoteStream = null;
		}

		// if (this.remoteStream) {
		// 	this.remoteStream = null;
		// }
	};


	PeerCall.prototype.addIceCandidate = function (candidate) {

		if (this.closed) {
			// Avoid errors when still receiving candidates but closed.
			return;
		}
		if (!this.peerconnectionclient || !this.hasRemoteSdp_) {
			this.pendingCandidates.push(candidate);
			return;
		}
		this.peerconnectionclient.addIceCandidate(candidate, function () {
			console.log("Remote candidate added successfully.", candidate);
		}, function (error) {
			console.warn("Failed to add remote candidate:", error, candidate);
		});

	};

	PeerCall.prototype.close = function () {

		if (this.closed) {
			return;
		}

		this.closed = true;

		if (this.peerconnectionclient) {
			this.peerconnectionclient.close();
			this.peerconnectionclient = null;
		}

		this.e.triggerHandler("remoteStreamRemoved", [this.remoteStream, this]);

		this.stopRecord();

		console.log("Peercall close", this);
		this.e.triggerHandler("closed", [this]);

	};

	return PeerCall;

});
