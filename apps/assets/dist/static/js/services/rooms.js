

"use strict";
define([
	'angular',
	'jquery',
	'underscore'
], function (angular, $, _) {

	return ["$window", "$location", "$timeout", "$q", "$route", "$rootScope", "$http", "globalContext", "safeApply", "connector", "api", "restURL", "appData", "translation", "mediaStream", function ($window, $location, $timeout, $q, $route, $rootScope, $http, globalContext, safeApply, connector, api, restURL, appData, translation, mediaStream) {

		var body = $("body");

		var url = restURL.api("rooms");
		var requestedRoomName = "";
		var priorRoomName = null;
		var helloedRoomName = null;
		var currentRoom = null;
		var randomRoom = null;
		var canJoinRooms = !mediaStream.config.AuthorizeRoomJoin;
		var canCreateRooms = canJoinRooms ? !mediaStream.config.AuthorizeRoomCreation : false;

		var rooms;
		var joinFailed;
		var joinRequestedRoom;
		var setCurrentRoom;
		var updateRoom;
		var applyRoomUpdate;

		joinFailed = function (error) {
			setCurrentRoom(null);

			switch (error.Code) {
				case "default_room_disabled":
					priorRoomName = null;
					rooms.randomRoom();
					break;
				case "room_join_requires_account":
					console.log("Room join requires a logged in user.");
					alert("Please sign in to create rooms.");
					rooms.joinPriorOrDefault(true);
					break;
				default:
					console.log("Unknown error", error, "while joining room ", requestedRoomName);
					break;
			}
		};

		joinRequestedRoom = function () {
			if (!connector.connected || appData.authorizing()) {
				// Do nothing while not connected or authorizing.
				return;
			}
			if (!currentRoom || requestedRoomName !== currentRoom.Name) {
				requestedRoomName = requestedRoomName ? requestedRoomName : "";
				if (helloedRoomName !== requestedRoomName) {
					helloedRoomName = requestedRoomName;
					var myHelloedRoomName = helloedRoomName;
					_.defer(function () {
						if (helloedRoomName === myHelloedRoomName) {
							helloedRoomName = null;
						}
					});
					console.log("Joining room", [requestedRoomName]);
					api.sendHello(requestedRoomName, "", function (room) {
						setCurrentRoom(room);
					}, function (error) {
						joinFailed(error);
					});
				}
			}
		};

		setCurrentRoom = function (room) {
			if (room === currentRoom) {
				return;
			}
			var priorRoom = currentRoom;
			currentRoom = room;
			if (priorRoom) {
				body.removeClass("roomType" + priorRoom.Type);
				priorRoomName = priorRoom.Name;
				console.log("Left room", [priorRoom.Name]);
				$rootScope.$broadcast("room.left", priorRoom.Name);
			}
			if (currentRoom) {
				body.addClass("roomType" + currentRoom.Type);
				console.log("Joined room", [currentRoom.Name]);
				$rootScope.$broadcast("room.joined", currentRoom.Name);
			}
		};

		updateRoom = function (room) {
			var response = $q.defer();
			api.requestRoomUpdate(room, response.resolve, response.reject);
			return response.promise.then(applyRoomUpdate);
		};

		applyRoomUpdate = function (room) {
			currentRoom = room;
			$rootScope.$broadcast("room.updated", currentRoom);
			return room;
		};

		connector.e.on("close error", function () {
			setCurrentRoom(null);
		});

		api.e.on("received.room", function (event, room) {
			applyRoomUpdate(room);
		});

		appData.e.on("authorizing", function (event, value) {
			if (!value) {
				// NOTE(lcooper): This will have been skipped earlier, so try again.
				_.defer(joinRequestedRoom);
			}
		});

		appData.e.on("selfReceived", function (event, data) {
			_.defer(joinRequestedRoom);
			canJoinRooms = (!mediaStream.config.AuthorizeRoomJoin || $rootScope.myuserid) ? true : false
			if (canJoinRooms) {
				canCreateRooms = (!mediaStream.config.AuthorizeRoomCreation || $rootScope.myuserid) ? true : false;
			} else {
				canCreateRooms = false;
			}
		});

		$rootScope.$on("$locationChangeSuccess", function (event) {
			var roomName;
			if ($route.current) {
				roomName = $route.current.params.room;
				roomName = $window.decodeURIComponent(roomName);
			} else {
				roomName = "";
			}
			requestedRoomName = roomName;
			if (connector.connected) {
				_.defer(joinRequestedRoom);
			} else {
				$rootScope.$broadcast("rooms.ready");
			}
		});

		// Public API.
		rooms = {
			inDefaultRoom: function () {
				return (currentRoom !== null ? currentRoom.Name : requestedRoomName) === "";
			},
			canCreateRooms: function () {
				return canCreateRooms;
			},
			canJoinRooms: function () {
				return canJoinRooms;
			},
			joinByName: function (name, replace) {
				var nn = restURL.encodeRoomURL(name, "", function (url) {
					// Apply new URL.
					safeApply($rootScope, function (scope) {
						$location.path(url);
						if (replace) {
							$location.replace();
						}
					});
				});
				return nn;
			},
			joinDefault: function (replace) {
				return rooms.joinByName("", replace);
			},
			joinPriorOrDefault: function (replace) {
				if (!priorRoomName || requestedRoomName === priorRoomName) {
					rooms.joinDefault(replace);
				} else {
					rooms.joinByName(priorRoomName, replace);
				}
			}
		};

		return rooms;
	}];
});
