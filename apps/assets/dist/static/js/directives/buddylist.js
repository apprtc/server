

"use strict";
define(['underscore'], function (_, template) {

	// buddyList
	return ["api", "webrtc", function (api, webrtc) {

		//console.log("buddyList directive");

		var controller = ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
			var inRoom = false;

			webrtc.e.on("done", function () {
			});

			$scope.$watch("peer", function () {
				if ($scope.peer) {
					// Also reset the buddylist if the peer is cleared after the "done" event.
				}
			});

			$scope.$on("room.joined", function (ev) {
				inRoom = true;
			});

			$scope.$on("room.left", function (ev) {
				inRoom = false;
				// buddylist.onClosed();
			});

			$scope.doCall = function (id) {
				webrtc.doCall(id);
			};


			api.e.on("received.userleftorjoined", function (event, dataType, data) {
				if (dataType === "Left") {
					// onLeft(data);
				} else {
					// onJoined(data);
				}
			});
			api.e.on("received.users", function (event, data) {
				console.log('received.users:', data);
				var selfId = $scope.id;

				for (let index = 0; index < data.length; index++) {
					const p = data[index];

					if (p.Id !== selfId) {
						// onJoined(p);
						webrtc.doCall(p.Id);
						break;
					}	
				}

				$scope.$apply();
			});
			api.e.on("received.status", function (event, data) {
				// onStatus(data);
			});
		}];

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller
		}

	}];

});
