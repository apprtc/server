

"use strict";
define(['jquery', 'underscore', 'text!partials/audiovideo.html'], function ($, _, template) {

	return ["$window", "mediaStream", "$timeout", function ($window, mediaStream, $timeout) {


		var controller = ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {


			$scope.isActive = false;


			var remoteVideo_ = document.querySelector('video');
			remoteVideo_.srcObject = null;

			$scope.attachStream = function (stream, currentcall) {
				console.log("audivideo.attachStream.stream videotracks:");

				stream.getTracks().forEach(function (track) {
					console.log("track.id=", track.id);
				});

				remoteVideo_.srcObject = stream;
			};

			$scope.removeRemoteStream = function (stream, currentcall) {
				console.log("audivideo.removeRemoteStream");
				remoteVideo_.srcObject = stream;

				$scope.transitionToWaiting_();
			};




			$scope.onRemoteSdpSet_ = function (hasRemoteVideo) {
				if (hasRemoteVideo) {
					trace('Waiting for remote video.');
					$scope.waitForRemoteVideo_();
				} else {
					trace('No remote video stream; not waiting for media to arrive.');
					// TODO(juberti): Make this wait for ICE connection before transitioning.
					$scope.transitionToActive_();
				}
			};

			$scope.waitForRemoteVideo_ = function () {
				// Wait for the actual video to start arriving before moving to the active
				// call state.
				if (remoteVideo_.readyState >= 2) { // i.e. can play
					trace('Remote video started; currentTime: ' +
						remoteVideo_.currentTime);
					$scope.transitionToActive_();
				} else {
					remoteVideo_.oncanplay = $scope.waitForRemoteVideo_.bind($scope);
				}
			};


			$scope.transitionToActive_ = function () {
				// Stop waiting for remote video.
				remoteVideo_.oncanplay = undefined;

				// Transition opacity from 0 to 1 for the remote videos.
				$scope.activate_(remoteVideo_);

			};


			$scope.transitionToWaiting_ = function () {
				// Stop waiting for remote video.
				remoteVideo_.oncanplay = undefined;

				// Transition opacity from 1 to 0 for the remote videos.
				$scope.deactivate_(remoteVideo_);

			};


			$scope.activate_ = function (element) {
				element.classList.add('active');
			};

			$scope.deactivate_ = function (element) {
				element.classList.remove('active');
			};


			mediaStream.webrtc.onRemoteStreamAdded = $scope.attachStream.bind($scope);
			mediaStream.webrtc.onRemoteStreamRemoved = $scope.removeRemoteStream.bind($scope);
			mediaStream.webrtc.onremotesdpset = $scope.onRemoteSdpSet_.bind($scope);

			// mediaStream.webrtc.e.on("streamadded", function (event, stream, currentcall) {

			// 	console.log("audivideo > on [webrtc.streamadded].");

			// 	$scope.attachStream(stream, currentcall);

			// });

			// mediaStream.webrtc.e.on("streamremoved", function (event, stream, currentcall) {

			// 	console.log("audivideo > on [webrtc.streamremoved].");
			// 	$scope.removeRemoteStream(stream, currentcall);

			// });

			mediaStream.webrtc.e.on("statechange", function (event, iceConnectionState, currentcall) {

				if (currentcall.closed) {
					return;
				}

				switch (iceConnectionState) {
					case "new":
					case "checking":
					case "connected":
					case "completed":
					case "failed":
						break;
				}

			});

		}];


		return {
			restrict: 'E',
			replace: true,
			scope: true,
			template: template,
			controller: controller
		}

	}];

});
