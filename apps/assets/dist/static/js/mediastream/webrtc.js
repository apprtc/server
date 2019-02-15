// signal server通信处理

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
		var WebRTC = function (api) {

			this.api = api;

			this.e = $({});

			this.conference = new PeerConference(this);
			this.msgQueues = {};
			this.currentCall = null;

			this.usermedia = null;

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


		WebRTC.prototype.processReceived = function (event, to, data, type, to2, from) {

			//console.log(">>>>>>>>>>>>", type, from, data, to, to2);
			this.processReceivedMessage(to, data, type, to2, from);
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
			console.log("WebRTC._processOffer");
			var call = this.conference.getCall(from);
			if (call) {
				call.setRemoteDescription(new window.RTCSessionDescription(data), _.bind(function (sessionDescription, currentcall) {
					currentcall.createAnswer(_.bind(function (sessionDescription, currentcall) {
						console.log("Sending answer", sessionDescription, currentcall.id);
						this.api.sendAnswer(currentcall.id, sessionDescription);
					}, this));
				}, this));
				return;
			}


			if (this.conference.hasCalls() && !this.conference.isDisconnected(from)) {
				// TODO(fancycode): support joining callers to currently active conference.
				console.warn("Received Offer while already in a call -> busy.", from);
				this.api.sendBye(from, "busy");
				this.e.triggerHandler("busy", [from, to2, to]);
				return;
			}

			call = this.createCall(from, this.api.id, from);
			if (!this.conference.addIncoming(from, call)) {
				console.warn("Already got a call, not processing Offer", from);
				return;
			}

			this.pushFrontMessage(from, [to, data, type, to2, from]);
			// autoaccept)
			if (!this.doAccept(call, true)) {
				this.popFrontMessage(from);
			}
		};

		WebRTC.prototype._processCandidate = function (to, data, type, to2, from) {
			console.log("WebRTC._processCandidate");
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
			console.log("WebRTC._processAnswer");
			var call = this.conference.getCall(from);
			if (!call) {
				console.warn("Received Answer from unknown id -> ignore", from);
				return;
			}

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
			console.log("WebRTC.createCall");
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
			console.log("WebRTC.doUserMedia");
			if (this.usermedia) {
				// We should not create a new UserMedia object while the current one
				// is still being used.
				console.error("UserMedia already created, check caller");
			}

			// Create default media (audio/video).
			var usermedia = new UserMedia();
			usermedia.e.on("mediasuccess mediaerror", _.bind(function (event, um) {
				this.e.triggerHandler("usermedia", [um]);
				// Start always, no matter what.
				if (this.currentCall != null) {
					this.maybeStart(um, this.currentCall);
				}
			}, this));
			usermedia.e.on("stopped", _.bind(function (event, um) {
				if (um === this.usermedia) {
					this.e.triggerHandler("usermedia", [null]);
					this.usermedia = null;
				}
			}, this));
			this.e.one("stop", function () {
				usermedia.stop();
			});
			this.usermedia = usermedia;
			this.e.triggerHandler("usermedia", [usermedia]);
			this.currentCall = call;

			return usermedia.doGetUserMedia(call);

		};

		WebRTC.prototype.doCall = function (id) {
			console.log("WebRTC.doCall");
			var call = this.createCall(id, null, id);
			call.setInitiate(true);
			if (!this.conference.addOutgoing(id, call)) {
				console.log("Already has a call with", id);
				return;
			}

			if (!this.doUserMedia(call)) {
				return;
			}
		};

		WebRTC.prototype.doAccept = function (call, autoanswer) {
			console.log("WebRTC.doAccept");
			this.conference.setCallActive(call.id);

			return this.doUserMedia(call);
		};

		WebRTC.prototype.stop = function () {
			console.log("WebRTC.stop");
			this.conference.close();
			this.e.triggerHandler("stop");
			this.msgQueues = {};

		}

		WebRTC.prototype.doHangup = function (reason, id) {
			console.log("WebRTC.doHangup");
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
			_.defer(_.bind(function () {
				this.e.triggerHandler("done", [reason]);
			}, this));
			this.stop();

			return true;
		}

		WebRTC.prototype.maybeStart = function (usermedia, call) {

			console.log("WebRTC.maybeStart");
			if (call.peerconnectionclient) {
				console.log("Already started", call);
				return;
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
			console.log("WebRTC.sendOfferWhenNegotiationNeeded");

			if (!to) {
				to = currentcall.id;
			}
			currentcall.createOffer(_.bind(function (sessionDescription, currentcall) {
				this.api.sendOffer(to, sessionDescription);
			}, this));
		};

		WebRTC.prototype.onConnectionStateChange = function (iceConnectionState, currentcall) {
			console.log("WebRTC.onConnectionStateChange");
			// Defer this to allow native event handlers to complete before running more stuff.
			_.defer(_.bind(function () {
				this.e.triggerHandler('statechange', [iceConnectionState, currentcall]);
			}, this));
		};

		WebRTC.prototype.onRemoteStreamAdded = function (stream, currentcall) {
			console.log("WebRTC.onRemoteStreamAdded");
			this.e.triggerHandler("streamadded", [stream, currentcall]);
		};

		WebRTC.prototype.onRemoteStreamRemoved = function (stream, currentcall) {
			console.log("WebRTC.onRemoteStreamRemoved");
			this.e.triggerHandler("streamremoved", [stream, currentcall]);
		};

		return WebRTC;

	});
