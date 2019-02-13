

"use strict";
define(['jquery', 'underscore', 'text!partials/audiovideo.html', 'webrtc.adapter', 'RecordRTC'], function ($, _, template) {

	return ["$window", "mediaStream", "safeApply", "$timeout", "dummyStream", "api", function ($window, mediaStream, safeApply, $timeout, DummyStream, api) {


		var controller = ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
			var recorder = null;

			$scope.isActive = false;

			$scope.attachStream = function (stream, currentcall) {
				console.log("audivideo.attachStream and start recording.stream videotracks:", stream.getVideoTracks().length, "\ncaller:\n", currentcall);


				// var video = $element.find("video")[0];
				// $window.attachMediaStream(video, stream);

				const video = document.querySelector('video');
				video.srcObject = stream;

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
			};

			$scope.removeRemoteStream = function (stream, currentcall) {
				console.log("audivideo.removeRemoteStream and save record file.");

				const video = document.querySelector('video');
				video.srcObject = stream;


				if (recorder !== null) {
					recorder.stopRecording(function () {
						let blob = recorder.getBlob();

						getSeekableBlob(blob, function (seekableBlob) {
							invokeSaveAsDialog(seekableBlob, "record-rtc-media.webm");
						})
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
					scope.isActive = false;

					if (event.type === "stop") {
						removeVideos();
					} else {
						$timeout(removeVideos, 1500);
					}
				});

			});

			mediaStream.webrtc.e.on("streamadded", function (event, stream, currentcall) {

				console.log("audivideo > on [webrtc.streamadded].");

				$scope.attachStream(stream, currentcall);

			});

			mediaStream.webrtc.e.on("streamremoved", function (event, stream, currentcall) {

				console.log("audivideo > on [webrtc.streamremoved].");
				$scope.removeRemoteStream(stream, currentcall);

			});

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
