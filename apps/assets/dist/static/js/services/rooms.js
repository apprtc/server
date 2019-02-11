

"use strict";
define([
	'angular',
	'jquery',
	'underscore'
], function (angular, $, _) {

	return ["$window", "$route", "$rootScope", "connector", "api", "appData",

		function ($window, $route, $rootScope, connector, api, appData) {

			var body = $("body");

			var requestedRoomName = "";
			var helloedRoomName = null;
			var currentRoom = null;

			var rooms;
			var joinRequestedRoom;
			var setCurrentRoom;

			var applyRoomUpdate;

			joinRequestedRoom = function () {
				if (!connector.connected) {
					// Do nothing while not connected.
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
							console.log("joining room error", error);
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

			appData.e.on("selfReceived", function (event, data) {
				_.defer(joinRequestedRoom);
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
			};

			return rooms;
		}];
});
