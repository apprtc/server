

"use strict";
define(['jquery', 'underscore'], function ($, _) {

	var conferences = 0;

	var STATE_ACTIVE = "active";
	var STATE_INCOMING = "incoming";
	var STATE_OUTGOING = "outgoing";

	var PeerConference = function (webrtc) {

		this.webrtc = webrtc;

		this.calls = {};
		this.callsCount = 0;
		this.callStates = {};
		this.connectedCalls = {};
		// Ids of calls that "seem" to be disconnected (i.e. had a p2p state
		// change of "disconnected" without a "Bye").
		this.disconnectedCalls = {};
		this.conferenceMode = false;

		this.e = $({});
		this.id = null;

		// Send conference updates to the other peers once we get a new connection.
		webrtc.e.on("statechange", _.bind(function (event, iceConnectionState, currentcall) {
			this.onConnectionStateChange(iceConnectionState, currentcall);
		}, this));
	};

	// Creates a new unique random id to be used as conference id.
	PeerConference.prototype._createConferenceId = function () {
		return this.webrtc.api.id + "_" + (++conferences) + "_" + Math.round(Math.random() * 1e16);
	};

	PeerConference.prototype.getOrCreateId = function () {
		if (!this.id) {
			this.id = this._createConferenceId();
			console.log("Created new conference id", this.id);
		}
		return this.id;
	};

	PeerConference.prototype.hasCalls = function () {
		return this.callsCount > 0;
	};

	// Return number of currently active and pending calls.
	PeerConference.prototype.getCallsCount = function () {
		return this.callsCount;
	};

	PeerConference.prototype._addCallWithState = function (id, call, state) {
		var oldcall = this.calls[id];
		if (oldcall) {
			if (!this.disconnectedCalls[id]) {
				console.warn("Already has a call for", id);
				return false;
			}
			oldcall.close();  // This will remove the call from the conference.
		}

		this.calls[id] = call;
		this.callStates[id] = state;
		this.callsCount += 1;
		return true;
	};

	PeerConference.prototype.addIncoming = function (from, call) {
		return this._addCallWithState(from, call, STATE_INCOMING);
	};

	PeerConference.prototype.addOutgoing = function (to, call) {
		return this._addCallWithState(to, call, STATE_OUTGOING);
	};

	PeerConference.prototype._setCallState = function (id, state) {
		if (this.callStates.hasOwnProperty(id)) {
			this.callStates[id] = state;
		}
	};

	PeerConference.prototype.setCallActive = function (id) {
		this._setCallState(id, STATE_ACTIVE);
	};

	PeerConference.prototype.getCall = function (id) {
		if (this.disconnectedCalls[id]) {
			return null;
		}
		return this.calls[id] || null;
	};

	PeerConference.prototype.getCalls = function () {
		return _.values(this.calls);
	};

	PeerConference.prototype.getCallIds = function () {
		return _.keys(this.calls);
	};

	PeerConference.prototype.removeCall = function (id) {
		if (!this.calls.hasOwnProperty(id)) {
			return null;
		}

		var call = this.calls[id];
		delete this.calls[id];
		delete this.callStates[id];
		delete this.connectedCalls[id];
		delete this.disconnectedCalls[id];
		this.callsCount -= 1;
		return call;
	};

	PeerConference.prototype.markDisconnected = function (id) {
		this.disconnectedCalls[id] = true;
	};

	PeerConference.prototype.isDisconnected = function (id) {
		return this.disconnectedCalls[id] || false;
	};

	PeerConference.prototype.getDisconnectedIds = function (id) {
		return _.keys(this.disconnectedCalls);
	};

	PeerConference.prototype.close = function () {

		var api = this.webrtc.api;
		_.each(this.calls, function (c) {
			c.close();
			var id = c.id;
			if (id) {
				api.sendBye(id);
			}
		});
		this.calls = {};
		this.callStates = {};
		this.connectedCalls = {};
		this.callsCount = 0;
		this.id = null;

	};

	PeerConference.prototype.onConnectionStateChange = function (iceConnectionState, currentcall) {

		console.log("PeerConference.onConnectionStateChange iceConnectionState=", iceConnectionState);
		switch (iceConnectionState) {
			case "completed":
			case "connected":
				if (!this.connectedCalls.hasOwnProperty(currentcall.id)) {
					this.connectedCalls[currentcall.id] = true;
				}
				break;
			case "failed":
				console.warn("Conference peer connection state failed", currentcall);
				break;
		}

	};


	PeerConference.prototype.peerIds = function () {
		return this.getCallIds();
	};

	return PeerConference;

});
