

"use strict";
define(['jquery', 'underscore', 'webrtc.adapter'], function ($, _) {

	var count = 0;

	var PeerConnectionClient = function (webrtc, currentcall) {

		console.debug("new PeerConnectionClient");

		this.webrtc = webrtc;
		this.id = count++;
		this.currentcall = null;
		this.pc = null;

		if (currentcall) {
			this.createPeerConnection(currentcall);
		}

	};


	PeerConnectionClient.prototype.createPeerConnection = function (currentcall) {

		// XXX(longsleep): This function is a mess.
		console.debug("PeerConnectionClient.createPeerConnection", this.currentcall);

		var pc;
		if (currentcall) {
			this.currentcall = currentcall;
		} else {
			currentcall = this.currentcall;
		}

		try {
			// Create an RTCPeerConnection via the polyfill (adapter.js)
			console.log('Creating RTCPeerConnnection with:\n' +
				'  config: \'' + JSON.stringify(currentcall.pcConfig) + '\';\n' +
				'  constraints: \'' + JSON.stringify(currentcall.pcConstraints) + '\'.');
			pc = this.pc = new window.RTCPeerConnection(currentcall.pcConfig, currentcall.pcConstraints);
		} catch (e) {
			console.error('Failed to create PeerConnectionClient, exception: ' + e.message);
			pc = this.pc = null;
		}

		if (pc) {
			// Bind peer connection events.
			pc.onicecandidate = _.bind(currentcall.onIceCandidate, currentcall);
			pc.ontrack = _.bind(this.onRemoteStreamAdded, this);
			pc.onremovestream = _.bind(this.onRemoteStreamRemoved, this);
			pc.onsignalingstatechange = _.bind(this.onSignalingStateChange, this);
			pc.oniceconnectionstatechange = _.bind(this.onIceConnectionStateChange, this)

			pc.onnegotiationneeded = _.bind(this.onNegotiationNeeded, this);
		}

		return pc;

	};

	PeerConnectionClient.prototype.negotiationNeeded = function () {
		// Per default this does nothing as the browser is expected to handle this.
	};


	PeerConnectionClient.prototype.onSignalingStateChange = function (event) {

		var signalingState = event.target.signalingState;
		console.debug("Connection signaling state change", signalingState, this.currentcall.id);
		this.currentcall.onSignalingStateChange(signalingState);

	};

	PeerConnectionClient.prototype.onIceConnectionStateChange = function (event) {

		var iceConnectionState = event.target.iceConnectionState;
		console.debug("ICE connection state change", iceConnectionState, this.currentcall.id);
		this.currentcall.onIceConnectionStateChange(iceConnectionState);

	};

	PeerConnectionClient.prototype.onRemoteStreamAdded = function (event) {

		// var stream = event.stream;
		var stream = event.streams[0];

		if (stream != null) {
			console.info('PeerConnectionClient.onRemoteStreamAdded');
			this.currentcall.onRemoteStreamAdded(stream);
		}
	};

	PeerConnectionClient.prototype.onRemoteStreamRemoved = function (event) {

		var stream = event.stream;
		console.info('PeerConnectionClient onRemoteStreamRemoved.');
		this.currentcall.onRemoteStreamRemoved(stream);

	};

	PeerConnectionClient.prototype.onNegotiationNeeded = function (event) {

		var peerconnectionclient = event.target;
		if (peerconnectionclient === this.pc) {
			this.currentcall.onNegotiationNeeded();
		}

	};

	PeerConnectionClient.prototype.close = function () {

		if (this.pc) {
			this.pc.close();
		}

		this.pc = null;

	};

	PeerConnectionClient.prototype.setRemoteDescription = function () {

		return this.pc.setRemoteDescription.apply(this.pc, arguments);

	};

	PeerConnectionClient.prototype.setLocalDescription = function () {

		return this.pc.setLocalDescription.apply(this.pc, arguments);

	};

	PeerConnectionClient.prototype.addIceCandidate = function () {

		return this.pc.addIceCandidate.apply(this.pc, arguments);

	};

	PeerConnectionClient.prototype.addStream = function () {

		_.defer(this.negotiationNeeded);
		return this.pc.addStream.apply(this.pc, arguments);

	};

	PeerConnectionClient.prototype.removeStream = function () {

		_.defer(this.negotiationNeeded);
		return this.pc.removeStream.apply(this.pc, arguments);

	};

	PeerConnectionClient.prototype.createAnswer = function () {
		return this.pc.createAnswer.apply(this.pc, arguments);

	};

	PeerConnectionClient.prototype.createOffer = function () {

		return this.pc.createOffer.apply(this.pc, arguments);

	};

	PeerConnectionClient.prototype.getRemoteStreams = function () {

		if (!this.pc) {
			return [];
		}
		return this.pc.getRemoteStreams.apply(this.pc, arguments);

	};

	PeerConnectionClient.prototype.getLocalStreams = function () {

		if (!this.pc) {
			return [];
		}
		return this.pc.getRemoteStreams.apply(this.pc, arguments);

	};

	PeerConnectionClient.prototype.getStreamById = function () {

		return this.pc.getStreamById.apply(this.pc, arguments);

	};

	return PeerConnectionClient;

});
