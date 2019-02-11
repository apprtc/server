

"use strict";

define([
	'jquery',
	'underscore',
	'mediastream/peercall',
	'mediastream/peerconference',
	'mediastream/usermedia',
	'webrtc.adapter',
	'RecordRTC'
],

	function ($, _, PeerCall, PeerConference, UserMedia) {
		var InternalPC = function (call) {
			this.currentcall = call;
			this.isinternal = true;
		};

		InternalPC.prototype.close = function () {
			this.currentcall.e.triggerHandler("connectionStateChange", ["closed", this.currentcall]);
		};

		InternalPC.prototype.addStream = function () {
		};

		InternalPC.prototype.removeStream = function () {
		};

		InternalPC.prototype.negotiationNeeded = function () {
		};

		var InternalCall = function (webrtc) {
			this.id = null;
			this.webrtc = webrtc;
			this.e = $({});
			this.isinternal = true;
			this.pc = new InternalPC(this);

			this.mediaConstraints = $.extend(true, {}, this.webrtc.settings.mediaConstraints);
		};

		InternalCall.prototype.setInitiate = function (initiate) {
		};

		InternalCall.prototype.createPeerConnection = function (success_cb, error_cb) {
			success_cb(this.pc);
		};

		InternalCall.prototype.close = function () {
			this.pc.close();
			this.e.triggerHandler("closed", [this]);
		};

		var WebRTC = function (api) {

			this.api = api;

			this.e = $({});

			this.conference = new PeerConference(this);
			this.msgQueues = {};
			this.usermediaReady = false;
			this.pendingMediaCalls = [];
			this.pendingMessages = [];

			this.usermedia = null;
			this.audioMute = false;
			this.videoMute = false;

			// Settings.are cloned into peer call on call creation.
			this.settings = {
				mediaConstraints: {
					audio: true,
					video: {
						optional: [],
						mandatory: {
							maxWidth: 640,
							maxHeight: 480
						}
					}
				},
				pcConfig: {
					iceServers: [{
						// url: 'stun:' + 'stun.l.google.com:19302'
					}]
				},
				pcConstraints: {
					mandatory: {},
					optional: []
				},
				// sdpParams values need to be strings.
				sdpParams: {
					//audioSendBitrate: ,
					audioSendCodec: "opus/48000",
					//audioRecvBitrate: ,
					//audioRecvCodec: ,
					//opusMaxPbr: ,
					opusStereo: "true",
					//videoSendBitrate: ,
					//videoSendInitialBitrate: ,
					videoSendCodec: "VP8/90000"
					//videoRecvBitrate: ,
					//videoRecvCodec
				},
				// Set up audio and video regardless of what devices are present.
				offerOptions: {
					offerToReceiveAudio: 1,
					offerToReceiveVideo: 1,
					voiceActivityDetection: false
				},
				renegotiation: true
			};

			this.api.e.bind("received.offer received.candidate received.answer received.bye received.conference", _.bind(this.processReceived, this));
		};

		WebRTC.prototype.stopLocalVideo = function () {
			if (this.usermedia) {
				this.usermedia.stop();
			}
		};

		WebRTC.prototype.processReceived = function (event, to, data, type, to2, from) {

			//console.log(">>>>>>>>>>>>", type, from, data, to, to2);
			this.processReceivedMessage(to, data, type, to2, from);
		};

		WebRTC.prototype.findTargetCall = function (id) {
			return this.conference.getCall(id);
		};

		WebRTC.prototype.callForEachCall = function (fn) {
			var calls = this.conference.getCalls();
			if (!calls.length) {
				return 0;
			}
			_.map(calls, fn);
			return calls.length;
		};

		WebRTC.prototype._getMessageQueue = function (id, create) {
			var queue = this.msgQueues[id] || null;
			if (queue === null && create) {
				queue = this.msgQueues[id] = [];
			}
			return queue;
		};

		WebRTC.prototype.pushBackMessage = function (id, message) {
			this._getMessageQueue(id, true).push(message);
		};

		WebRTC.prototype.pushFrontMessage = function (id, message) {
			this._getMessageQueue(id, true).unshift(message);
		};

		WebRTC.prototype.popFrontMessage = function (id) {
			var queue = this._getMessageQueue(id);
			if (!queue) {
				return null;
			}
			var message = queue.shift();
			if (!queue.length) {
				delete this.msgQueues[id];
			}
			return message;
		};

		WebRTC.prototype._processOffer = function (to, data, type, to2, from) {
			console.log("Offer process.");
			var call = this.conference.getCall(from);
			if (call) {
				// Remote peer is trying to renegotiate media.
				if (!this.settings.renegotiation && call.peerconnectionclient && call.peerconnectionclient.hasRemoteDescription()) {
					// Call replace support without renegotiation.
					this.doHangup("unsupported", from);
					console.error("Processing new offers is not implemented without renegotiation.");
					return;
				}

				call.setRemoteDescription(new window.RTCSessionDescription(data), _.bind(function (sessionDescription, currentcall) {
					this.e.triggerHandler("peercall", [currentcall]);
					currentcall.createAnswer(_.bind(function (sessionDescription, currentcall) {
						console.log("Sending answer", sessionDescription, currentcall.id);
						this.api.sendAnswer(currentcall.id, sessionDescription);
					}, this));
				}, this));
				return;
			}

			var autoaccept = true;
			if (this.conference.hasCalls() && !this.conference.isDisconnected(from)) {
				// TODO(fancycode): support joining callers to currently active conference.
				console.warn("Received Offer while already in a call -> busy.", from);
				this.api.sendBye(from, "busy");
				this.e.triggerHandler("busy", [from, to2, to]);
				return;
			}

			call = this.createCall(from, this.api.id, from);
			if (!this.conference.addIncoming(from, call)) {
				console.warn("Already got a call, not processing Offer", from, autoaccept);
				return;
			}

			this.pushFrontMessage(from, [to, data, type, to2, from]);
			if (autoaccept) {
				if (!this.doAccept(call, true)) {
					this.popFrontMessage(from);
				}
				return;
			}

			// Delegate next steps to UI.
			this.e.triggerHandler("offer", [from, to2, to]);
		};

		WebRTC.prototype._processCandidate = function (to, data, type, to2, from) {
			var call = this.conference.getCall(from);
			if (!call) {
				console.warn("Received Candidate for unknown id -> ignore.", from);
				return;
			}

			var candidate = new window.RTCIceCandidate({
				sdpMLineIndex: data.sdpMLineIndex,
				sdpMid: data.sdpMid,
				candidate: data.candidate
			});
			call.addIceCandidate(candidate);
			console.log("Got candidate [sdpMid=]", data.sdpMid, "[sdpMLineIndex=]", data.sdpMLineIndex, "[candidate=]", data.candidate);
		};

		WebRTC.prototype._processAnswer = function (to, data, type, to2, from) {
			var call = this.conference.getCall(from);
			if (!call) {
				console.warn("Received Answer from unknown id -> ignore", from);
				return;
			}

			console.log("Answer process.");
			this.conference.setCallActive(call.id);
			// TODO(longsleep): In case of negotiation this could switch offer and answer
			// and result in a offer sdp sent as answer data. We need to handle this.
			call.setRemoteDescription(new window.RTCSessionDescription(data), function () {
				// Received remote description as answer.
				console.log("Received answer after we sent offer", data);
			});
		};

		WebRTC.prototype._processBye = function (to, data, type, to2, from) {
			console.log("Bye process.");
			this.doHangup("receivedbye", from);
			// Delegate bye to UI.
			this.e.triggerHandler("bye", [data.Reason, from, to, to2]);
		};

		WebRTC.prototype.processReceivedMessage = function (to, data, type, to2, from) {
			switch (type) {
				case "Offer":
					this._processOffer(to, data, type, to2, from);
					break;
				case "Candidate":
					this._processCandidate(to, data, type, to2, from);
					break;
				case "Answer":
					this._processAnswer(to, data, type, to2, from);
					break;
				case "Bye":
					this._processBye(to, data, type, to2, from);
					break;
				default:
					console.log("Unhandled message type", type, data);
					break;
			}
		};

		WebRTC.prototype.createCall = function (id, from, to) {
			var call = new PeerCall(this, id, from, to);
			call.e.on("connectionStateChange", _.bind(function (event, iceConnectionState, currentcall) {
				this.onConnectionStateChange(iceConnectionState, currentcall);
			}, this));
			call.e.on("remoteStreamAdded", _.bind(function (event, stream, currentcall) {
				this.onRemoteStreamAdded(stream, currentcall);
			}, this));
			call.e.on("remoteStreamRemoved", _.bind(function (event, stream, currentcall) {
				this.onRemoteStreamRemoved(stream, currentcall);
			}, this));
			call.e.on("error", _.bind(function (event, error_id, message) {
				if (!error_id) {
					error_id = "failed_peerconnection";
				}
				this.e.triggerHandler("error", [message, error_id]);
				_.defer(_.bind(this.doHangup, this), "error", id); // Hangup on error is good yes??
			}, this));
			call.e.on("closed", _.bind(function () {
				this.conference.removeCall(id);
			}, this));
			call.e.on("connectionStateChange", _.bind(function (event, state, currentcall) {
				switch (state) {
					case "disconnected":
					case "failed":
						this.conference.markDisconnected(currentcall.id);
						break;
				}
			}, this));
			return call;
		};

		WebRTC.prototype.doUserMedia = function (call) {

			if (this.usermedia) {
				// We should not create a new UserMedia object while the current one
				// is still being used.
				console.error("UserMedia already created, check caller");
			}

			// Create default media (audio/video).
			var usermedia = new UserMedia({
				renegotiation: this.settings.renegotiation,
				audioMute: this.audioMute,
				videoMute: this.videoMute
			});
			usermedia.e.on("mediasuccess mediaerror", _.bind(function (event, um) {
				this.e.triggerHandler("usermedia", [um]);
				this.usermediaReady = true;
				// Start always, no matter what.
				while (this.pendingMediaCalls.length > 0) {
					var c = this.pendingMediaCalls.shift();
					this.maybeStart(um, c);
				}
			}, this));
			usermedia.e.on("mediachanged", _.bind(function (event, um) {
				// Propagate media change events.
				this.e.triggerHandler("usermedia", [um]);
			}, this));
			usermedia.e.on("stopped", _.bind(function (event, um) {
				if (um === this.usermedia) {
					this.e.triggerHandler("usermedia", [null]);
					this.usermediaReady = false;
					this.usermedia = null;
				}
			}, this));
			this.e.one("stop", function () {
				usermedia.stop();
			});
			this.usermedia = usermedia;
			this.e.triggerHandler("usermedia", [usermedia]);
			this.pendingMediaCalls.push(call);

			return usermedia.doGetUserMedia(call);

		};

		WebRTC.prototype._doCallUserMedia = function (call) {
			if (this.usermedia) {
				if (!this.usermediaReady) {
					this.pendingMediaCalls.push(call);
				} else {
					this.maybeStart(this.usermedia, call);
				}
				return true;
			}

			var ok = this.doUserMedia(call);
			if (ok) {
				this.e.triggerHandler("waitforusermedia", [call]);
				return true;
			}

			// this.e.triggerHandler("error", ["Failed to access camera/microphone.", "failed_getusermedia"]);
			// if (call.id) {
			// 	this.doHangup("usermedia", call.id);
			// }
			return false;
		};

		WebRTC.prototype._doAutoStartCall = function (call) {
			if (!this.usermedia) {
				return false;
			}

			if (!this.usermediaReady) {
				// getUserMedia is still pending, defer starting of call.
				this.pendingMediaCalls.push(call);
			} else {
				this.maybeStart(this.usermedia, call, true);
			}
			return true;
		};

		WebRTC.prototype.doCall = function (id, autocall) {
			var call = this.createCall(id, null, id);
			call.setInitiate(true);
			if (!this.conference.addOutgoing(id, call)) {
				console.log("Already has a call with", id);
				return;
			}
			this.e.triggerHandler("peercall", [call]);
			if (!autocall) {
				this.e.triggerHandler("connecting", [call]);
			}

			if (!this._doCallUserMedia(call)) {
				return;
			}
		};

		WebRTC.prototype.doAccept = function (call, autoanswer) {
			if (typeof call === "string") {
				var id = call;
				call = this.conference.getCall(id);
				if (!call) {
					console.warn("Trying to accept unknown call.", id);
					return false;
				}
			}

			this.conference.setCallActive(call.id);
			if (autoanswer && this._doAutoStartCall(call)) {
				return true;
			}

			return this._doCallUserMedia(call);
		};

		WebRTC.prototype.stop = function () {

			this.conference.close();
			this.e.triggerHandler("peercall", [null]);
			this.e.triggerHandler("stop");
			this.msgQueues = {};

		}

		WebRTC.prototype.doHangup = function (reason, id) {

			if (!id) {
				console.log("Closing all calls")
				_.each(this.conference.getCallIds(), _.bind(function (callid) {
					this.doHangup(reason, callid);
				}, this));
				this.stop();
				return true;
			}

			console.log("Hanging up.", id);
			var call = this.conference.removeCall(id);
			if (!call) {
				console.warn("Tried to hangup unknown call.", reason, id);
				return false;
			}
			call.close();
			if (reason !== "receivedbye") {
				this.api.sendBye(id, reason);
			}

			// Last peer disconnected, perform cleanup.
			this.e.triggerHandler("peercall", [null]);
			_.defer(_.bind(function () {
				this.e.triggerHandler("done", [reason]);
			}, this));
			this.stop();

			return true;
		}

		WebRTC.prototype.maybeStart = function (usermedia, call, autocall) {

			//console.log("maybeStart", call);
			if (call.peerconnectionclient) {
				console.log("Already started", call);
				return;
			}

			if (!autocall) {
				if (!call.isinternal) {
					this.e.triggerHandler("connecting", [call]);
				} else if (!this.conference.hasCalls()) {
					// Signal UI that media access has been granted.
					this.e.triggerHandler("done");
				}
			}
			console.log('Creating PeerConnectionClient.', call);
			call.createPeerConnection(_.bind(function (peerconnectionclient) {
				// Success call.
				usermedia.addToPeerConnection(peerconnectionclient);
				if (!call.initiate) {
					this.processPendingMessages(call.id);
				}
				call.e.on("negotiationNeeded", _.bind(function (event, call) {
					this.sendOfferWhenNegotiationNeeded(call);
				}, this));
			}, this), _.bind(function () {
				// Error call.
				this.e.triggerHandler("error", ["Failed to create peer connection. See log for details."]);
				if (call.id) {
					this.doHangup("failed", call.id);
				}
			}, this));

		};

		WebRTC.prototype.processPendingMessages = function (id) {
			do {
				var message = this.popFrontMessage(id);
				if (!message) {
					break;
				}
				this.processReceivedMessage.apply(this, message);
			} while (true);
		};

		WebRTC.prototype.sendOfferWhenNegotiationNeeded = function (currentcall, to) {
			if (!to) {
				to = currentcall.id;
			}
			currentcall.createOffer(_.bind(function (sessionDescription, currentcall) {
				console.log("Sending offer with sessionDescription", sessionDescription, to, currentcall);
				this.api.sendOffer(to, sessionDescription);
			}, this));
		};

		WebRTC.prototype.onConnectionStateChange = function (iceConnectionState, currentcall) {
			// Defer this to allow native event handlers to complete before running more stuff.
			_.defer(_.bind(function () {
				this.e.triggerHandler('statechange', [iceConnectionState, currentcall]);
			}, this));
		};

		WebRTC.prototype.onRemoteStreamAdded = function (stream, currentcall) {
			this.e.triggerHandler("streamadded", [stream, currentcall]);
		};

		WebRTC.prototype.onRemoteStreamRemoved = function (stream, currentcall) {
			this.e.triggerHandler("streamremoved", [stream, currentcall]);
		};

		return WebRTC;

	});
