

"use strict";
define(["jquery", "angular", "underscore"], function($, angular, _) {

	// AppController
	return ["$scope", "$window", "appData", "$timeout", function($scope, $window, appData, $timeout) {

		// Disable drag and drop.
		$($window).on("dragover dragenter drop", function(event) {
			event.preventDefault();
		});

		appData.set($scope);

		// User related scope data.
		$scope.authorizing = false;
		$scope.roomsHistory = [];
		$scope.defaults = {
			message: null,
			settings: {
				videoQuality: "high",
				sendStereo: false,
				maxFrameRate: 20,
				defaultRoom: "",
				language: "",
				audioRenderToAssociatedSkin: true,
				videoCpuOveruseDetection: true,
				experimental: {
					enabled: false,
					audioEchoCancellation2: true,
					audioAutoGainControl2: true,
					audioNoiseSuppression2: true,
					audioTypingNoiseDetection: true,
					videoLeakyBucket: true,
					videoNoiseReduction: false,
					preferVideoSendCodecVP9: false
				},
				sound: {
					incomingMessages: true,
					incomingCall: true,
					roomJoinLeave: false
				}
			}
		};
		$scope.master = angular.copy($scope.defaults);

		$scope.update = function(user) {
			$scope.master = angular.copy(user);
			if (appData.flags.connected) {
				$scope.updateStatus();
			}
			$scope.refreshWebrtcSettings();
		};

		$scope.reset = function() {
			$scope.user = angular.copy($scope.master);
		};

		$scope.manualReloadApp = function(url) {
			appData.flags.manualUnload = true;
			if (url) {
				$window.location.href = url;
				$timeout(function() {
					appData.flags.manualUnload = false;
				}, 0);
			} else {
				$window.location.reload(true);
			}
		};

		$scope.$on("room.joined", function(event, roomName) {
			if (roomName) {
				_.pull($scope.roomsHistory, roomName);
				$scope.roomsHistory.unshift(roomName);
				if ($scope.roomsHistory.length > 15) {
					// Limit the history.
					$scope.roomsHistory = $scope.roomsHistory.splice(0, 15);
				}
			}
		});

		appData.e.on("authorizing", function(event, authorizing) {
			$scope.authorizing = !!authorizing;
		});

		$scope.reset(); // Call once for bootstrap.

	}];

});
