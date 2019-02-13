

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

		this.streams = {};

		this.negotiationNeeded = false;
		this.initiate = false;
		this.closed = false;

	};

	PeerCall.prototype.isOutgoing = function () {
		return !!this.from;
	};

	PeerCall.prototype.setInitiate = function (initiate) {
		this.initiate = !!initiate;
		console.log("Set initiate", this.initiate, this);
	};

	PeerCall.prototype.getStreamId = function (stream) {
		var streamid = stream.id;
		var id = this.id + "-" + streamid;
		if (!this.streams.hasOwnProperty(streamid) || this.streams[streamid] === stream) {
			this.streams[streamid] = stream;
		} else {
			console.warn("A different stream is already registered, not replacing", stream, this.streams[streamid])
		}
		//console.log("Created stream ID", id);
		return id;
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
			'  \'' + JSON.stringify(options, null, '\t') + '\'.', this.negotiationNeeded);
		this.peerconnectionclient.createOffer(_.bind(this.onCreateAnswerOffer, this, cb), _.bind(this.onErrorAnswerOffer, this), options);

	};

	PeerCall.prototype.createAnswer = function (cb) {

		console.log("Creating answer.", this.negotiationNeeded);
		this.peerconnectionclient.createAnswer(_.bind(this.onCreateAnswerOffer, this, cb), _.bind(this.onErrorAnswerOffer, this));

	};

	PeerCall.prototype.onCreateAnswerOffer = function (cb, sessionDescription) {

		if (sessionDescription.type === "answer") {
			// We processed the incoming Offer by creating an answer, so it's safe
			// to create own Offers to perform renegotiation.
			this.peerconnectionclient.setReadyForRenegotiation(true);
		}

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
			console.log("Set local session description.", sessionDescription, this);
			if (cb) {
				cb(sessionDescriptionObj, this);
			}
		}, this), _.bind(function (err) {
			console.error("Set local session description failed", err);
			this.close();
			this.e.triggerHandler("error", "failed_peerconnection_setup");
		}, this));

		if (this.negotiationNeeded) {
			this.negotiationNeeded = false;
			console.log("Negotiation complete.", this);
		}

	};

	PeerCall.prototype.onErrorAnswerOffer = function (event) {

		console.error("Failed to create answer/offer", event);

		// Even though the Offer/Answer could not be created, we now allow
		// to create own Offers to perform renegotiation again.
		this.peerconnectionclient.setReadyForRenegotiation(true);

	};

	PeerCall.prototype.setRemoteDescription = function (sessionDescription, cb) {

		var peerconnectionclient = this.peerconnectionclient;
		if (!peerconnectionclient) {
			console.log("Got a remote description but not connected -> ignored.");
			return;
		}

		this.setRemoteSdp(sessionDescription);

		if (sessionDescription.type === "offer") {
			// Prevent creation of Offer messages to renegotiate streams while the
			// remote Offer is being processed.
			peerconnectionclient.setReadyForRenegotiation(false);
		}

		peerconnectionclient.setRemoteDescription(sessionDescription, _.bind(function () {
			console.log("Set remote session description.", sessionDescription, this);
			if (cb) {
				cb(sessionDescription, this);
			}
			// NOTE(longsleep): There are several szenarios where onaddstream is never fired, when
			// the peer does not provide a certain stream type (eg. has no camera). See
			// for example https://bugzilla.mozilla.org/show_bug.cgi?id=998546. For this
			// reason we always trigger onRemoteStream added for all streams which are available
			// after the remote SDP was set successfully.


			// _.defer(_.bind(function () {
			// 	var streams = 0;
			// 	_.each(peerconnectionclient.getRemoteStreams(), _.bind(function (stream) {
			// 		if (!this.streams.hasOwnProperty(stream.id) && (stream.getAudioTracks().length > 0 || stream.getVideoTracks().length > 0)) {
			// 			// NOTE(longsleep): Add stream here when it has at least one audio or video track, to avoid FF >= 33 to add it multiple times.
			// 			console.log("Adding stream after remote SDP success.", stream);
			// 			this.onRemoteStreamAdded(stream);
			// 			streams++;
			// 		}
			// 	}, this));
			// 	if (streams === 0 && (this.offerOptions.offerToReceiveAudio || this.offerOptions.offerToReceiveVideo)) {
			// 		// We assume that we will eventually receive a stream, so we trigger the event to let the UI prepare for it.
			// 		this.e.triggerHandler("remoteStreamAdded", [null, this]);
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
		sessionDescription.sdp = maybePreferVideoReceiveCodec(
			sessionDescription.sdp,
			this.sdpParams);
		sessionDescription.sdp = maybeSetAudioReceiveBitRate(
			sessionDescription.sdp,
			this.sdpParams);
		sessionDescription.sdp = maybeSetVideoReceiveBitRate(
			sessionDescription.sdp,
			this.sdpParams);
		sessionDescription.sdp = maybeRemoveVideoFec(
			sessionDescription.sdp,
			this.sdpParams);

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

	PeerCall.prototype.onIceCandidate = function (event) {
		if (event.candidate) {
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
		} else {
			console.log('End of candidates.');
		}
	};

	PeerCall.prototype.onSignalingStateChange = function (signalingState) {

		this.e.triggerHandler("signalingStateChange", [signalingState, this]);

	};

	PeerCall.prototype.onIceConnectionStateChange = function (iceConnectionState) {

		this.e.triggerHandler("connectionStateChange", [iceConnectionState, this]);

	};

	PeerCall.prototype.onRemoteStreamAdded = function (stream) {
		console.log("PeerCall.onRemoteStreamAdded stream");
		var id = stream.id;
		if (this.streams.hasOwnProperty(id)) {
			return;
		}
		this.streams[id] = stream;
		this.e.triggerHandler("remoteStreamAdded", [stream, this]);
	};

	PeerCall.prototype.onRemoteStreamRemoved = function (stream) {

		this.stopRecording();
		this.e.triggerHandler("remoteStreamRemoved", [stream, this]);
		if (stream) {
			delete this.streams[stream.id];
		}



	};

	PeerCall.prototype.onNegotiationNeeded = function () {
		console.log("PeerCall.onNegotiationNeeded.", this);
		
		if (!this.peerconnectionclient.readyForRenegotiation) {
			console.log("PeerConnectionClient is not ready for renegotiation yet", this);
			return;
		}

		if (!this.negotiationNeeded) {
			this.negotiationNeeded = true;
			
			this.e.triggerHandler("negotiationNeeded", [this]);
		}

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

		// Trigger event for all previously added streams.
		_.each(this.streams, _.bind(function (stream, id) {
			this.e.triggerHandler("remoteStreamRemoved", [stream, this]);
		}, this));
		this.streams = {};

		console.log("Peercall close", this);
		this.e.triggerHandler("closed", [this]);

	};

	return PeerCall;

});
