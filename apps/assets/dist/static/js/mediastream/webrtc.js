// signal server通信处理

"use strict";

define([
	'jquery',
	'underscore',
	'mediastream/peercall',
	'mediastream/peerconference',
	'mediastream/usermedia'
],

	function ($, _, PeerCall, PeerConference, UserMedia) {
		var WebRTC = function (api) {

			this.api = api;

			this.e = $({});

			this.conference = new PeerConference(this);
			this.msgQueues = {};
			this.currentCall = null;

			this.usermedia = null;
			this.onRemoteStreamAdded = null;
			this.onRemoteStreamRemoved = null;
			this.onremotesdpset = null;
			// Settings.are cloned into peer call on call creation.


			this.resolutions = ["1920x1080", "1280x720", "640x480", "3840x2160"];
			this.defaultResolution = this.resolutions[1].split('x');


			this.defaultWidth = parseInt(this.defaultResolution[0]);
			this.defaultHeight = parseInt(this.defaultResolution[1]);

			this.settings = {
				mediaConstraints: {
					audio: true,
					video: {
						optional: [],
						mandatory: {
							minWidth: this.defaultWidth,
							minHeight: this.defaultHeight
						}
					}
				},
				pcConfig: {
					iceServers: []
				},
				pcConstraints: {
					mandatory: {},
					optional: []
				},
				// sdpParams values need to be strings.
				sdpParams: {
					//audioSendBitrate: ,
					// audioSendCodec: "opus/48000",
					//audioRecvBitrate: ,
					//audioRecvCodec: ,
					//opusMaxPbr: ,
					opusStereo: "true",
					//videoSendBitrate: ,
					//videoSendInitialBitrate: ,
					// videoSendCodec: "VP8/90000"
					//videoRecvBitrate: ,
					//videoRecvCodec
				},
				// Set up audio and video regardless of what devices are present.
				offerOptions: {
					offerToReceiveAudio: 1,
					offerToReceiveVideo: 1,
					voiceActivityDetection: false
				}
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
			if (this.conference.hasCalls() && !this.conference.isDisconnected(from)) {
				// TODO(fancycode): support joining callers to currently active conference.
				console.warn("Received Offer while already in a call -> busy.", from);
				this.api.sendBye(from, "busy");
				this.e.triggerHandler("busy", [from, to2, to]);
				return;
			}

			// autoaccept
			this.doAccept(from, data);

		};

		WebRTC.prototype._processAnswer = function (to, data, type, to2, from) {
			console.log("WebRTC._processAnswer");
			var call = this.conference.getCall(from);
			if (!call) {
				console.warn("Received Answer from unknown id -> ignore", from);
				return;
			}

			this.conference.setCallActive(call.id);

			call.setRemoteDescription(data, function () {
				// Received remote description as answer.
				console.log("Received answer after we sent offer", data);
			});
		};


		WebRTC.prototype._processCandidate = function (to, data, type, to2, from) {
			console.log("WebRTC._processCandidate");
			var call = this.conference.getCall(from);
			if (!call) {
				console.warn("Received Candidate for unknown id -> ignore.", from);
				return;
			}

			var candidate = new RTCIceCandidate({
				sdpMLineIndex: data.sdpMLineIndex,
				sdpMid: data.sdpMid,
				candidate: data.candidate
			});
			call.addIceCandidate(candidate);
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

		WebRTC.prototype.doUserMedia = function (needStream) {
			console.log("WebRTC.doUserMedia");
			if (this.usermedia) {
				// We should not create a new UserMedia object while the current one
				// is still being used.
				console.error("UserMedia already created, check caller");
			}

			// Create default media (audio/video).
			var usermedia = new UserMedia();
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

			return usermedia.doGetUserMedia(this.settings.mediaConstraints, needStream);
		};

		WebRTC.prototype.doCall = function (id) {
			console.log("WebRTC.doCall");
			var call = this.createCall(id, null, id);
			call.setInitiate(true);
			if (!this.conference.addOutgoing(id, call)) {
				console.log("Already has a call with", id);
				return;
			}
			this.currentCall = call;
			this.currentCall.onremotesdpset = this.onremotesdpset;

			this.doUserMedia(true)
				.then(function () {
					this.CreatePcClient(this.usermedia, call);

					call.createOffer(_.bind(function (sessionDescription, call) {
						this.api.sendOffer(call.id, sessionDescription);
					}, this));

				}.bind(this)).catch(function (error) {
					console.error('Failed to caling: ' + error.message);
				}.bind(this));
		};

		WebRTC.prototype.doAccept = function (from, data) {
			console.log("WebRTC.doAccept");
			var call = this.createCall(from, this.api.id, from);



			if (!this.conference.addIncoming(from, call)) {
				console.warn("Already got a call, not processing Offer", from);
				return;
			}

			this.conference.setCallActive(call.id);
			this.currentCall = call;
			this.currentCall.onremotesdpset = this.onremotesdpset;

			this.doUserMedia(false)
				.then(function () {
					this.CreatePcClient(this.usermedia, call);
					call.setRemoteDescription(data);

					call.createAnswer(_.bind(function (sessionDescription, call) {
						console.log("Sending answer", sessionDescription, call.id);
						this.api.sendAnswer(call.id, sessionDescription);
					}, this));


				}.bind(this)).catch(function (error) {
					console.error('Failed to accept: ' + error.message);
				}.bind(this));

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

		WebRTC.prototype.CreatePcClient = function (usermedia, call) {

			console.log("WebRTC.CreatePcClient");
			if (call.peerconnectionclient) {
				console.log("Already started", call);
				return;
			}

			call.createPeerConnection(_.bind(function (peerconnectionclient) {
				// Success call.
				usermedia.addToPeerConnection(peerconnectionclient);
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


		WebRTC.prototype.onConnectionStateChange = function (iceConnectionState, currentcall) {
			console.log("WebRTC.onConnectionStateChange");
			// Defer this to allow native event handlers to complete before running more stuff.
			_.defer(_.bind(function () {
				this.e.triggerHandler('statechange', [iceConnectionState, currentcall]);
			}, this));
		};

		// WebRTC.prototype.onRemoteStreamAdded = function (stream, currentcall) {
		// 	console.log("WebRTC.onRemoteStreamAdded");
		// 	this.e.triggerHandler("streamadded", [stream, currentcall]);
		// };

		// WebRTC.prototype.onRemoteStreamRemoved = function (stream, currentcall) {
		// 	console.log("WebRTC.onRemoteStreamRemoved");
		// 	this.e.triggerHandler("streamremoved", [stream, currentcall]);
		// };

		return WebRTC;

	});
