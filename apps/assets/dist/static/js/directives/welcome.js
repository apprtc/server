

"use strict";
define([], function() {

	// welcome
	return ["rooms", "$timeout", "mediaStream", "translation", function(rooms, $timeout, mediaStream, translation) {

		function link($scope, $element) {
			//console.log("xxx welcome", $scope.$id, $element);

			var placeHolder = translation._("Room name");

			$scope.randomRoom = rooms.randomRoom;
			$scope.canCreateRooms = rooms.canCreateRooms;
			$scope.canJoinRooms = rooms.canJoinRooms;
			$scope.joinRoomByName = function(name) {
				if ($scope.welcome.$invalid) {
					return;
				}
				if (!name) {
					return;
				}
				rooms.joinByName(name);
			};

			var roomdata = rooms.getRandomRoom();
			var recreate = true;
			if (roomdata) {
				$scope.roomdata = {name: roomdata.name, placeholder: roomdata.name ? roomdata.name : placeHolder};
				recreate = false;
			} else {
				$scope.roomdata = {placeholder: placeHolder};
			}

			$scope.roomdataInput = {
				name: ""
			};

			$scope.$watch("roomdata.name", function(name) {
				$scope.roomdata.link = rooms.link({Name: name});
			}, true);

			$scope.$watch("roomdataInput.name", function(name) {
				if (name === "") {
					if (recreate) {
						$scope.randomRoom();
					} else {
						recreate = true;
					}
				} else {
					$scope.roomdata.name = name;
				}
			});

			$scope.$on("room.random", function(event, roomdata) {
				$scope.roomdata = {name: roomdata.name, last: roomdata.name, placeholder: roomdata.name ? roomdata.name : placeHolder};
				$scope.roomdataInput.name = "";
			});

			$timeout(function() {
				$element.find(".roomdata-link-input:visible:enabled:first").focus();
			});

		}

		return {
			restrict: 'EA',
			link: link
		}

	}];

});
