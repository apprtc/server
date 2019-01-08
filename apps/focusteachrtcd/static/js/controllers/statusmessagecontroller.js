

"use strict";
define([], function() {

	// StatusmessageController
	return ["$scope", "mediaStream", function($scope, mediaStream) {

		$scope.doHangup = function(reason, id) {
			mediaStream.webrtc.doHangup(reason, id);
		}
		$scope.doAbort = function() {
			mediaStream.webrtc.doHangup("abort", $scope.dialing);
		}
		$scope.doReconnect = function() {
			mediaStream.connector.reconnect();
		}
		$scope.doAccept = function() {
			mediaStream.webrtc.doAccept($scope.incoming);
		}
		$scope.doReject = function(id) {
			mediaStream.webrtc.doHangup('reject', id, $scope.incoming);
		}

	}];

});
