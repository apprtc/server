

"use strict";
define(['jquery', 'underscore', 'mediastream/peerconnectionclient', 'mediastream/util', 'mediastream/sdputils'], function ($, _, PeerConnectionClient) {

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
		while (this.pendingCandidates.length > 0) {
			var candidate = this.pendingCandidates.shift();
			this.addIceCandidate(candidate);
		}
		return peerconnectionclient;

	};

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

		// Convert to object to allow custom property injection.
		var sessionDescriptionObj = sessionDescription;
		if (sessionDescriptionObj.toJSON) {
			sessionDescriptionObj = JSON.parse(JSON.stringify(sessionDescriptionObj));
		}
		// console.log("Created offer/answer", JSON.stringify(sessionDescriptionObj, null, "\t"));

		// Allow external session description modifications.
		this.e.triggerHandler("sessiondescription", [sessionDescriptionObj, this]);
		// Always set local description.
		this.peerconnectionclient.setLocalDescription(sessionDescription, _.bind(function () {
			console.log("Set local session description.", sessionDescription);
			if (cb) {
				cb(sessionDescriptionObj, this);
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

		this.setRemoteSdp(sessionDescription);

		peerconnectionclient.setRemoteDescription(new RTCSessionDescription(sessionDescription), _.bind(function () {
			console.log("Set remote session description.", sessionDescription);
			if (cb) {
				cb(sessionDescription, this);
			}

			// _.defer(_.bind(function () {
			// 	console.log("Adding stream after remote SDP success.");
			// 	if (this.remoteStream) {
			// 		this.onRemoteStreamAdded(this.remoteStream);
			// 	}
			// }, this));


		}, this), _.bind(function (err) {
			console.error("Set remote session description failed", err);
			this.close();
			this.e.triggerHandler("error", "failed_peerconnection_setup");
		}, this));

	};

	PeerCall.prototype.setLocalSdp = function (sessionDescription) {
		sessionDescription.sdp = maybePreferAudioReceiveCodec(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybePreferVideoReceiveCodec(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybeSetAudioReceiveBitRate(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybeSetVideoReceiveBitRate(sessionDescription.sdp, this.sdpParams);
		sessionDescription.sdp = maybeRemoveVideoFec(sessionDescription.sdp, this.sdpParams);
	};

	PeerCall.prototype.setRemoteSdp = function (message) {

		message.sdp = maybeSetOpusOptions(message.sdp, this.sdpParams);
		message.sdp = maybePreferAudioSendCodec(message.sdp, this.sdpParams);
		message.sdp = maybePreferVideoSendCodec(message.sdp, this.sdpParams);
		message.sdp = maybeSetAudioSendBitRate(message.sdp, this.sdpParams);
		message.sdp = maybeSetVideoSendBitRate(message.sdp, this.sdpParams);
		message.sdp = maybeSetVideoSendInitialBitRate(message.sdp, this.sdpParams);
		message.sdp = maybeRemoveVideoFec(message.sdp, this.sdpParams);

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

	PeerCall.prototype.onRemoteStreamAdded = function (stream) {
		console.log("PeerCall.onRemoteStreamAdded stream");

		if (stream != null) {
			this.remoteStream = stream;

			this.webrtc.onRemoteStreamAdded(stream, this);
		}

		// this.remoteStream = stream;
		// this.e.triggerHandler("remoteStreamAdded", [stream, this]);
	};

	PeerCall.prototype.onRemoteStreamRemoved = function (stream) {
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
		if (!this.peerconnectionclient) {
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

		this.remoteStream = null;

		console.log("Peercall close", this);
		this.e.triggerHandler("closed", [this]);

	};

	return PeerCall;

});
