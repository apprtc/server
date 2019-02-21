

"use strict";
define([
	'underscore'
], function (_) {

	return ["$window", "$route", "$rootScope", "connector", "api", "appData",

		function ($window, $route, $rootScope, connector, api, appData) {
			var requestedRoomName = "";
			var helloedRoomName = null;
			var currentRoom = null;

			var rooms;
			var joinRequestedRoom;

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
							currentRoom = room;
						}, function (error) {
							console.log("joining room error", error);
						});
					}
				}
			};


			connector.e.on("close error", function () {
				currentRoom = null;
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
