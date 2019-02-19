

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
			pc = this.pc = new RTCPeerConnection(currentcall.pcConfig, currentcall.pcConstraints);
		} catch (e) {
			console.error('Failed to create PeerConnectionClient, exception: ' + e.message);
			pc = this.pc = null;
		}

		if (pc) {
			// Bind peer connection events.
			pc.onicecandidate = currentcall.onIceCandidate.bind(currentcall);
			pc.ontrack = currentcall.onRemoteStreamAdded.bind(currentcall);
			pc.onremovestream = currentcall.onRemoteStreamRemoved.bind(currentcall);
			pc.onsignalingstatechange = currentcall.onSignalingStateChange.bind(currentcall);
			pc.oniceconnectionstatechange = currentcall.onIceConnectionStateChange.bind(currentcall);
		}

		return pc;

	};


	PeerConnectionClient.prototype.onRemoteStreamRemoved = function (event) {

		var stream = event.stream;
		console.info('PeerConnectionClient onRemoteStreamRemoved.');
		this.currentcall.onRemoteStreamRemoved(stream);

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
		return this.pc.addStream.apply(this.pc, arguments);

	};

	PeerConnectionClient.prototype.removeStream = function () {
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
