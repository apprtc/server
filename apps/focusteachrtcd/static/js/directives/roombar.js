

"use strict";
define(['underscore', 'angular', 'text!partials/roombar.html'], function(_, angular, template) {

	// roomBar
	return ["$window", "rooms", "$timeout", "safeApply", function($window, rooms, $timeout, safeApply) {

		var link = function($scope, $element) {

			var clearRoomName = function() {
				$scope.currentRoomName = null;
				$scope.newRoomName = "";
			};

			$scope.save = function() {
				if ($scope.roombarform.$invalid) {
					return;
				}
				var roomName = rooms.joinByName($scope.newRoomName);
				if (roomName !== $scope.currentRoomName) {
					// Room name accepted.
					$scope.roombarform.$setPristine();
				} else {
					// Room name did not apply. Reset new name and form.
					$scope.newRoomName = roomName;
					$scope.roombarform.$setPristine();
				}
			};

			$scope.exit = function() {
				$scope.newRoomName = "";
				$scope.save();
			};

			$scope.$on("room.updated", function(ev, room) {
				safeApply($scope, function(scope) {
					scope.currentRoomName = scope.newRoomName = room.Name;
					if (scope.currentRoomName && !scope.peer) {
						scope.layout.roombar = true;
					}
				});
			});

			$scope.$on("room.left", function() {
				safeApply($scope, clearRoomName);
			});

			$scope.$watch("newRoomName", function(name) {
				if (name === $scope.currentRoomName) {
					$scope.roombarform.$setPristine();
				}
			});

			$scope.$watch("layout.roombar", function(value) {
				$timeout(function() {
					$element.find("input").focus();
				});
			});

			$scope.$watch("peer", function(peer) {
				$scope.layout.roombar = !peer;
			});

			clearRoomName();
		};

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			template: template,
			link: link
		}

	}];

});
