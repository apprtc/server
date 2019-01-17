

"use strict";
define(['jquery', 'underscore', 'text!partials/audiovideo.html', 'text!partials/audiovideopeer.html', 'bigscreen', 'webrtc.adapter'], function ($, _, template, templatePeer, BigScreen) {

	return ["$window", "$compile", "mediaStream", "safeApply", "videoWaiter", "$timeout", "dummyStream", function ($window, $compile, mediaStream, safeApply, videoWaiter, $timeout, DummyStream) {

		var peerTemplate = $compile(templatePeer);

		var controller = ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

			var streams = this.streams = {};
			var calls = {};

			$scope.container = $element[0];
			$scope.layoutparent = $element.parent();

			$scope.remoteVideos = $element.find(".remoteVideos")[0];

			$scope.hasUsermedia = false;
			$scope.isActive = false;
			$scope.haveStreams = false;



			$scope.addRemoteStream = function (stream, currentcall) {

				var id = currentcall.getStreamId(stream);
				console.log("New stream", id);

				if (streams.hasOwnProperty(id)) {
					console.warn("Cowardly refusing to add stream id twice", id);
					return;
				}

				var callscope;
				var subscope;
				if (calls.hasOwnProperty(currentcall.id)) {
					//console.log("xxx has call", id, currentcall.id);
					if (DummyStream.is(stream)) {
						return;
					}
					callscope = calls[currentcall.id];
					if (callscope.dummy) {
						// Current call is marked as dummy. Use it directly.
						var dummyId = currentcall.getStreamId(callscope.dummy);
						subscope = streams[dummyId];
						if (subscope) {
							subscope.dummy = null;
							delete streams[dummyId];
							streams[id] = subscope;
							safeApply(subscope, function (scope) {
								console.log("Replacing dummy with stream", id);
								scope.attachStream(stream);
							});
						} else {
							console.warn("Scope marked as dummy but target stream not found", dummyId);
						}
						return;
					}
				} else {
					//console.log("xxx create call scope", currentcall.id, id);
					// Create scope.
					callscope = $scope.$new();
					calls[currentcall.id] = callscope;
					callscope.streams = 0;
					console.log("Created call scope", id);
				}

				// Create scope for this stream.
				subscope = callscope.$new();
				callscope.streams++;
				var peerid = subscope.peerid = currentcall.id;

				subscope.unattached = true;
				subscope.withvideo = false;
				subscope.onlyaudio = false;
				subscope.destroyed = false;
				subscope.$on("active", function () {
					console.log("Stream scope is now active", id, peerid);
				});
				subscope.$on("$destroy", function () {
					if (subscope.destroyed) {
						return;
					}
					console.log("Destroyed scope for stream", id, peerid);
					subscope.destroyed = true;
					callscope.streams--;
					if (callscope.streams < 1) {
						callscope.$destroy();
						delete calls[peerid];
						console.log("Destroyed scope for call", peerid, id);
					}
				});
				console.log("Created stream scope", id);

				// If stream is a dummy, mark us in callscope.
				if (DummyStream.is(stream)) {
					callscope.dummy = stream;
				}

				// Add created scope.
				streams[id] = subscope;

				// Render template.
				peerTemplate(subscope, function (clonedElement, scope) {
					clonedElement.data("peerid", scope.peerid);
					scope.element = clonedElement;
					scope.attachStream = function (stream) {
						if (DummyStream.is(stream)) {
							scope.withvideo = false;
							scope.onlyaudio = true;
							$timeout(function () {
								scope.$emit("active", currentcall);
							});
							return;
						} else {
							var video = clonedElement.find("video")[0];
							$window.attachMediaStream(video, stream);
							// Waiter callbacks also count as connected, as browser support (FireFox 25) is not setting state changes properly.
							videoWaiter.wait(video, stream, function (withvideo) {
								if (scope.destroyed) {
									console.log("Abort wait for video on destroyed scope.");
									return;
								}
								if (withvideo) {
									scope.$apply(function ($scope) {
										$scope.withvideo = true;
										$scope.onlyaudio = false;
									});
								} else {
									console.info("Incoming stream has no video tracks.");
									scope.$apply(function ($scope) {
										$scope.withvideo = false;
										$scope.onlyaudio = true;
									});
								}
								scope.$emit("active", currentcall);

							}, function () {
								if (scope.destroyed) {
									console.log("No longer wait for video on destroyed scope.");
									return;
								}
								console.warn("We did not receive video data for remote stream", currentcall, stream, video);
								scope.$emit("active", currentcall);
							});
							scope.dummy = null;
						}
						scope.unattached = false;
					};
					scope.attachStream(stream);
					$($scope.remoteVideos).append(clonedElement);
				});

			};

			$scope.removeRemoteStream = function (stream, currentcall) {

				var id = currentcall.getStreamId(stream);
				console.log("Stream removed", id);

				var subscope = streams[id];
				if (subscope) {

					delete streams[id];
					if (subscope.element) {
						subscope.element.remove();
					}
					subscope.$destroy();
				}

			};

			$scope.$on("active", function (currentcall) {

				//console.log("active 2");
				if (!$scope.isActive) {
					$scope.isActive = true;
					$scope.remoteVideos.style.opacity = 1;
					$element.addClass("active");
				}

			});

			$scope.toggleFullscreen = function () {
				//console.log("Toggle full screen", BigScreen.enabled, $scope.isActive, $scope.hasUsermedia);
				if (BigScreen.enabled && ($scope.isActive || $scope.hasUsermedia)) {
					BigScreen.toggle($scope.layoutparent[0], function () {
						// onEnter
						$scope.layoutparent.addClass("fullscreen");
					}, function () {
						// onExit
						$scope.layoutparent.removeClass("fullscreen");
					});
				}
			};

			mediaStream.webrtc.e.on("usermedia", function (event, usermedia) {

				if (!usermedia || !usermedia.started) {
					return;
				}
			});

			mediaStream.webrtc.e.on("done stop", function (event) {

				safeApply($scope, function (scope) {
					if (!scope.isActive) {
						return;
					}
					scope.hasUsermedia = false;
					scope.isActive = false;

					if (BigScreen.enabled) {
						BigScreen.exit();
					}
					var removeVideos = function () {
						if (scope.isActive) {
							return;
						}
						$(scope.remoteVideos).children(".remoteVideo").remove();
					};
					if (event.type === "stop") {
						removeVideos();
					} else {
						$timeout(removeVideos, 1500);
					}
					scope.remoteVideos.style.opacity = 0;
					$element.removeClass('active');
					_.each(streams, function (streamscope, k) {
						streamscope.$destroy();
						delete streams[k];
					});

					scope.haveStreams = false;
				});

			});

			mediaStream.webrtc.e.on("streamadded", function (event, stream, currentcall) {

				console.log("Remote stream added.", stream, currentcall);
				if (stream === null) {
					// Inject dummy stream.
					stream = new DummyStream();
				}
				$scope.addRemoteStream(stream, currentcall);

			});

			mediaStream.webrtc.e.on("streamremoved", function (event, stream, currentcall) {

				console.log("Remote stream removed.", stream, currentcall);
				$scope.removeRemoteStream(stream, currentcall);

			});

			mediaStream.webrtc.e.on("statechange", function (event, iceConnectionState, currentcall) {

				if (!$scope.haveStreams || currentcall.closed) {
					return;
				}

				switch (iceConnectionState) {
					case "new":
					case "checking":
					case "connected":
					case "completed":
					case "failed":
						$scope.addRemoteStream(new DummyStream(), currentcall);
						break;
				}

			});

		}];

		var compile = function (tElement, tAttr) {

			return function (scope, iElement, iAttrs, controller) {

				//console.log("compile", arguments)
				iElement.on("doubletap dblclick", _.debounce(scope.toggleFullscreen, 100, true));
			}

		};

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			template: template,
			controller: controller,
			compile: compile
		}

	}];

});
