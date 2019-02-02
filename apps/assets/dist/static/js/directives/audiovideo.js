

"use strict";
define(['jquery', 'underscore', 'text!partials/audiovideo.html', 'webrtc.adapter', 'RecordRTC'], function ($, _, template) {

	return ["$window", "$compile", "mediaStream", "safeApply", "$timeout", "dummyStream", function ($window, $compile, mediaStream, safeApply, $timeout, DummyStream) {


		var controller = ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

			var streams = this.streams = {};
			var calls = {};

			$scope.isActive = false;
			$scope.haveStreams = false;


			var recorder = null;

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
					console.log("xxx create call scope", currentcall.id, id);
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


				$scope.attachStream(stream, currentcall);
			};

			$scope.attachStream = function (stream, currentcall) {

				console.log("attachStream", stream, currentcall);
				if (DummyStream.is(stream)) {
					$timeout(function () {
						$scope.$emit("active", currentcall);
					});
					return;
				} else {
					// var video = $element.find("video")[0];
					// $window.attachMediaStream(video, stream);

					const video = document.querySelector('video');
					video.srcObject = stream;

					$scope.dummy = null;


					recorder = RecordRTC(stream, {
						// audio, video, canvas, gif
						type: 'video',

						// audio/webm
						// video/webm;codecs=vp9
						// video/webm;codecs=vp8
						// video/webm;codecs=h264
						// video/x-matroska;codecs=avc1
						// video/mpeg -- NOT supported by any browser, yet
						// video/mp4  -- NOT supported by any browser, yet
						// audio/wav
						// audio/ogg  -- ONLY Firefox
						// demo: simple-demos/isTypeSupported.html
						mimeType: 'video/webm',

						// MediaStreamRecorder, StereoAudioRecorder, WebAssemblyRecorder
						// CanvasRecorder, GifRecorder, WhammyRecorder
						recorderType: MediaStreamRecorder,

						// disable logs
						disableLogs: true,

						// get intervals based blobs
						// value in milliseconds
						timeSlice: 1000,

						// requires timeSlice above
						// returns blob via callback function
						ondataavailable: function (blob) { },

						// auto stop recording if camera stops
						checkForInactiveTracks: false,

						// requires timeSlice above
						onTimeStamp: function (timestamp) { },

						// both for audio and video tracks
						bitsPerSecond: 128000,

						// only for audio track
						audioBitsPerSecond: 128000,

						// only for video track
						videoBitsPerSecond: 128000,

						// used by CanvasRecorder and WhammyRecorder
						// it is kind of a "frameRate"
						frameInterval: 90,

						// if you are recording multiple streams into single file
						// this helps you see what is being recorded
						previewStream: function (stream) { },

						// used by CanvasRecorder and WhammyRecorder
						// you can pass {width:640, height: 480} as well
						video: HTMLVideoElement,

						// used by CanvasRecorder and WhammyRecorder
						canvas: {
							width: 640,
							height: 480
						},

						// used by StereoAudioRecorder
						// the range 22050 to 96000.
						sampleRate: 96000,

						// used by StereoAudioRecorder
						// the range 22050 to 96000.
						// let us force 16khz recording:
						desiredSampRate: 16000,

						// used by StereoAudioRecorder
						// Legal values are (256, 512, 1024, 2048, 4096, 8192, 16384).
						bufferSize: 16384,

						// used by StereoAudioRecorder
						// 1 or 2
						numberOfAudioChannels: 2,

						// used by WebAssemblyRecorder
						frameRate: 30,

						// used by WebAssemblyRecorder
						bitrate: 128000
					});
					recorder.startRecording();

				}
				$scope.unattached = false;
			};

			$scope.removeRemoteStream = function (stream, currentcall) {

				var id = currentcall.getStreamId(stream);
				console.log("Stream removed", id);

				var subscope = streams[id];
				if (subscope) {

					delete streams[id];
					subscope.$destroy();

					if (recorder !== null) {
						recorder.stopRecording(function () {
							let blob = recorder.getBlob();


							getSeekableBlob(blob, function(seekableBlob) {
								invokeSaveAsDialog(seekableBlob);
							})							
						});
					}


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
					scope.isActive = false;

					if (event.type === "stop") {
						removeVideos();
					} else {
						$timeout(removeVideos, 1500);
					}

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


		return {
			restrict: 'E',
			replace: true,
			scope: true,
			template: template,
			controller: controller
		}

	}];

});
