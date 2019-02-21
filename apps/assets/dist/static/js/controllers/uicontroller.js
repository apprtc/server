

"use strict";
define(['jquery', 'underscore'], function ($, _) {

	return ["$scope", "$rootScope", "$element", "$window", "$timeout", "mediaStream", "appData", "rooms", "constraints",
		function ($scope, $rootScope, $element, $window, $timeout, mediaStream, appData, rooms, constraints) {

			// Avoid accidential reloads or exits when in a call.
			$($window).on("beforeunload", function (event) {
				if (appData.flags.manualUnload || !$scope.peer) {
					return;
				}
				return "Close this window and disconnect?";
			});

			$($window).on("unload", function () {
				mediaStream.webrtc.doHangup("unload");
				if (mediaStream.api.connector) {
					mediaStream.api.connector.disabled = true;
				}
			});


			// Init STUN from server config.
			(function () {
				var stun = mediaStream.config.StunURIs || [];
				constraints.stun(stun);
			})();


			// Default scope data.
			$scope.status = "initializing";
			$scope.id = $scope.myid = null;
			$scope.peer = null;
			$scope.incoming = null;
			$scope.layout = {
				main: null,
			};

			$scope.getStatus = function () {
				return $scope.status;
			};

			$scope.updateStatus = function (clear) {
				// This is the user status.
				var status = {
					displayName: $scope.master.displayName || null,
					message: $scope.master.message || null
				}
				console.log("Status update commit", status);
				mediaStream.api.updateStatus(status);
			};

			$scope.refreshWebrtcSettings = function () {
				// Refresh constraints.
				constraints.refresh($scope.master.settings).then(function () {
				});
			};
			$scope.refreshWebrtcSettings(); // Call once for bootstrap.

			var ttlTimeout;

			mediaStream.api.e.on("received.self", function (event, data) {

				$timeout.cancel(ttlTimeout);

				$scope.id = $scope.myid = data.Id;


				// Set TURN and STUN data and refresh webrtc settings.
				constraints.turn(data.Turn);
				constraints.stun(data.Stun);
				$scope.refreshWebrtcSettings();

				// Support to upgrade stuff when ttl was reached.
				if (data.Turn.ttl) {
					ttlTimeout = $timeout(function () {
						console.log("Ttl reached - sending refresh request.");
						mediaStream.api.sendSelf();
					}, data.Turn.ttl / 100 * 90 * 1000);
				}

				// Propagate authentication event.
				appData.e.triggerHandler("selfReceived", [data]);
			});


			mediaStream.api.e.on("received.users", function (event, data) {
				console.log('received.users:', data);
				var selfId = $scope.id;

				var isInitiator_ = false;
				for (let index = 0; index < data.length; index++) {
					const p = data[index];

					if (p.Id !== selfId) {
						isInitiator_ = true;
						// 对聊天室内的第一个好友进行自动呼叫
						mediaStream.webrtc.doCall(p.Id);
						break;
					}
				}

				// if (!isInitiator_) {
				// 	mediaStream.webrtc.doUserMedia(false);
				// }
				$scope.$apply();
			});

			mediaStream.webrtc.e.on("error", function (event, message, msgid) {
				switch (msgid) {
					case "failed_getusermedia":
						message = "Failed to access camera/microphone.";
						break;
					case "failed_peerconnection_setup":
					case "failed_peerconnection":
						message = "Failed to establish peer connection."
						break;
				}
				if (!message) {
					message = msgid;
				}
				if (!message) {
					message = "We are sorry but something went wrong. Boo boo.";
				}

				console.error("webrtc error: ", msgid, message);
			});


			appData.flags.autoreconnect = true;
			appData.flags.autoreconnectDelay = 0;

			var reconnect = function () {
				if (appData.flags.connected && appData.flags.autoreconnect) {
					if (appData.flags.resurrect === null) {
						// Store data at the resurrection shrine.
						appData.flags.resurrect = {
							status: $scope.getStatus(),
							id: $scope.id
						}
						console.log("Stored data at the resurrection shrine", appData.flags.resurrect);
					}
					if (!appData.flags.reconnecting) {
						var delay = appData.flags.autoreconnectDelay;
						if (delay < 10000) {
							appData.flags.autoreconnectDelay += 500;
						}
						appData.flags.reconnecting = true;
						_.delay(function () {
							if (appData.flags.autoreconnect) {
								console.log("Requesting to reconnect ...");
								mediaStream.reconnect();
							}
							appData.flags.reconnecting = false;
						}, delay);
					} else {
						console.warn("Already reconnecting ...");
					}
				}
			};

			mediaStream.connector.e.on("open error close", function (event) {
				$timeout.cancel(ttlTimeout);
				switch (event.type) {
					case "open":
						appData.flags.connected = true;
						appData.flags.autoreconnectDelay = 0;
						$scope.updateStatus(true);
						break;
					case "error":
						if (appData.flags.connected) {
							reconnect();
						}
						break;
					case "close":
						reconnect();
						break;
				}
			});

			mediaStream.webrtc.e.on("statechange", function (event, state, currentcall) {
				console.info("P2P state changed", state);
				switch (state) {
					case "closed":
						if ($scope.getStatus() === "closed" || $scope.getStatus() === "waiting") {
							return;
						}
					case "completed":
					case "connected":
						break;
					case "failed":
						var wasConnected = !currentcall.closed;
						mediaStream.webrtc.doHangup("failed", currentcall.id);
						if (!wasConnected) {
							console.error("Peer connection failed. Check your settings.");
						}
						break;
				}
			});

			// Start heartbeat timer.
			$window.setInterval(function () {
				mediaStream.api.heartbeat(5000, 11500)
			}, 1000);

			// Apply all layout stuff as classes to our element.
			$scope.$watch("layout", (function () {
				return function (layout, old) {
					$scope.$broadcast("mainresize", layout.main);
				}
			}()), true);


			mediaStream.webrtc.e.on("busy", function (event, from) {
				console.log("Incoming call - sent busy.", from);
				$scope.$emit("notification", "incomingbusy", {
					reason: 'busy',
					from: from
				});
			});

			mediaStream.webrtc.e.on("bye", function (event, reason, from) {
				switch (reason) {
					case "busy":
						console.log("User is busy", reason, from);
						$scope.$emit("notification", "busy", {
							reason: reason,
							from: from
						});
						break;
					case "reject":
						console.log("User rejected", reason, from);
						$scope.$emit("notification", "reject", {
							reason: reason,
							from: from
						});
						break;
					case "pickuptimeout":
						console.log("User did not pick up", reason, from);
						$scope.$emit("notification", "pickuptimeout", {
							reason: reason,
							from: from
						});
						break;
					case "error":
						console.log("User cannot accept call because of error");
						break;
					case "abort":
						console.log("Remote call was aborted before we did pick up");
						$scope.$emit("notification", "abortbeforepickup", {
							reason: reason,
							from: from
						});
						break;
				}
			});


			$scope.$on("notification", function (event, type, details) {
				var message = null;
				switch (type) {
					case "busy":
						message = details.from + " is busy. Try again later.";
						break;
					case "reject":
						message = details.from + " rejected your call.";
						break;
					case "pickuptimeout":
						message = details.from + " does not pick up.";
						break;
					case "incomingbusy":
						message = details.from + " tried to call you";
						break;
					case "abortbeforepickup":
					// Fall through
					case "incomingpickuptimeout":
						message = details.from + " called you";
						break;
				}
				if (message) {
					console.log("notification", type, message);
				}

			});

		}];

});
