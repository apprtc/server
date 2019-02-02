

"use strict";
define(['jquery', 'underscore', 'webrtc.adapter'], function($, _) {

	var count = 0;

	var PeerConnection = function(webrtc, currentcall) {

		this.webrtc = webrtc;
		this.id = count++;
		this.currentcall = null;
		this.pc = null;
		this.readyForRenegotiation = true;

		if (currentcall) {
			this.createPeerConnection(currentcall);
		}

	};

	PeerConnection.prototype.setReadyForRenegotiation = function(ready) {
		this.readyForRenegotiation = !!ready;
	};

	PeerConnection.prototype.createPeerConnection = function(currentcall) {

		// XXX(longsleep): This function is a mess.

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
			console.error('Failed to create PeerConnection, exception: ' + e.message);
			pc = this.pc = null;
		}

		if (pc) {

			// Bind peer connection events.
			pc.onicecandidate = _.bind(currentcall.onIceCandidate, currentcall);
			pc.oniceconnectionstatechange = _.bind(this.onIceConnectionStateChange, this)
			// NOTE(longsleep): There are several szenarios where onaddstream is never fired, when
			// the peer does not provide a certain stream type (eg. has no camera). See
			// for example https://bugzilla.mozilla.org/show_bug.cgi?id=998546.
			pc.onaddstream = _.bind(this.onRemoteStreamAdded, this);
			pc.onremovestream = _.bind(this.onRemoteStreamRemoved, this);
			// NOTE(longsleep): Firefox 38 has support for onaddtrack. Unfortunately Chrome does
			// not support this and thus both are not compatible. For the time being this means
			// that renegotiation does not work between Firefox and Chrome. Even worse, current
			// spec says that the event should really be named ontrack.
			if (window.webrtcDetectedBrowser === "firefox") {
				// NOTE(longsleep): onnegotiationneeded is not supported by Firefox < 38.
				// Also firefox does not care about streams, but has the newer API for tracks
				// implemented. This does not work together with Chrome, so we trigger negotiation
				// manually when a stream is added or removed.
				// https://bugzilla.mozilla.org/show_bug.cgi?id=1017888
				// https://bugzilla.mozilla.org/show_bug.cgi?id=1149838
				this.negotiationNeeded = _.bind(function() {
					if (this.currentcall.initiate) {
						// Trigger onNegotiationNeeded once for Firefox.
						console.log("Negotiation needed.");
						this.onNegotiationNeeded({target: this.pc});
					}
				}, this);
			} else {
				pc.onnegotiationneeded = _.bind(this.onNegotiationNeeded, this);
			}
			pc.onsignalingstatechange = _.bind(this.onSignalingStateChange, this);
			// NOTE(longsleep):
			// Support old callback too (https://groups.google.com/forum/?fromgroups=#!topic/discuss-webrtc/glukq0OWwVM)
			// Chrome < 27 and Firefox < 24 need this.
			pc.onicechange = _.bind(function(iceConnectionState) {
				//XXX(longsleep): Hack the compatibility to new style event.
				console.warn("Old style onicechange event", arguments);
				this.onIceConnectionStateChange({
					target: {
						iceConnectionState: iceConnectionState
					}
				});
			}, this);
		}

		return pc;

	};

	PeerConnection.prototype.negotiationNeeded = function() {
		// Per default this does nothing as the browser is expected to handle this.
	};


	PeerConnection.prototype.onSignalingStateChange = function(event) {

		var signalingState = event.target.signalingState;
		console.debug("Connection signaling state change", signalingState, this.currentcall.id);
		this.currentcall.onSignalingStateChange(signalingState);

	};

	PeerConnection.prototype.onIceConnectionStateChange = function(event) {

		var iceConnectionState = event.target.iceConnectionState;
		console.debug("ICE connection state change", iceConnectionState, this.currentcall.id);
		this.currentcall.onIceConnectionStateChange(iceConnectionState);

	};

	PeerConnection.prototype.onRemoteStreamAdded = function(event) {

		var stream = event.stream;
		console.info('Remote stream added.', stream);
		this.currentcall.onRemoteStreamAdded(stream);

	};

	PeerConnection.prototype.onRemoteStreamRemoved = function(event) {

		var stream = event.stream;
		console.info('Remote stream removed.', stream);
		this.currentcall.onRemoteStreamRemoved(stream);

	};

	PeerConnection.prototype.onNegotiationNeeded = function(event) {

		var peerconnection = event.target;
		if (peerconnection === this.pc) {
			this.currentcall.onNegotiationNeeded();
		}

	};

	PeerConnection.prototype.close = function() {

		if (this.pc) {
			this.pc.close();
		}

		this.pc = null;

	};

	PeerConnection.prototype.hasRemoteDescription = function() {

		// NOTE(longsleep): Chrome seems to return empty sdp even if no remoteDescription was set.
		if (!this.pc || !this.pc.remoteDescription || !this.pc.remoteDescription.sdp) {
			return false
		}
		return true;

	};

	PeerConnection.prototype.setRemoteDescription = function() {

		return this.pc.setRemoteDescription.apply(this.pc, arguments);

	};

	PeerConnection.prototype.setLocalDescription = function() {

		return this.pc.setLocalDescription.apply(this.pc, arguments);

	};

	PeerConnection.prototype.addIceCandidate = function() {

		return this.pc.addIceCandidate.apply(this.pc, arguments);

	};

	PeerConnection.prototype.addStream = function() {

		_.defer(this.negotiationNeeded);
		return this.pc.addStream.apply(this.pc, arguments);

	};

	PeerConnection.prototype.removeStream = function() {

		_.defer(this.negotiationNeeded);
		return this.pc.removeStream.apply(this.pc, arguments);

	};

	PeerConnection.prototype.createAnswer = function() {
		return this.pc.createAnswer.apply(this.pc, arguments);

	};

	PeerConnection.prototype.createOffer = function() {

		return this.pc.createOffer.apply(this.pc, arguments);

	};

	PeerConnection.prototype.getRemoteStreams = function() {

		if (!this.pc) {
			return [];
		}
		return this.pc.getRemoteStreams.apply(this.pc, arguments);

	};

	PeerConnection.prototype.getLocalStreams = function() {

		if (!this.pc) {
			return [];
		}
		return this.pc.getRemoteStreams.apply(this.pc, arguments);

	};

	PeerConnection.prototype.getStreamById = function() {

		return this.pc.getStreamById.apply(this.pc, arguments);

	};

	return PeerConnection;

});
