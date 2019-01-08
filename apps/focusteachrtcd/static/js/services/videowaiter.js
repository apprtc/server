

"use strict";
define(["underscore"], function(_) {

	return ["$window", function($window) {

		var Waiter = function() {
			this.stop = false;
			this.count = 0;
			this.retries = 100;
		};
		Waiter.prototype.start = function(video, stream, cb, err_cb) {
			if (this.stop) {
				if (err_cb) {
					err_cb(video, stream);
				}
				return;
			}
			var videoTracks = stream && stream.getVideoTracks() || [];
			//console.log("wait for video", videoTracks.length, video.currentTime, video.videoHeight, video);
			if (videoTracks.length === 0 && this.count >= 10) {
				cb(false, video, stream);
			} else if (video.currentTime > 0 && video.videoHeight > 0) {
				cb(true, video, stream);
			} else {
				if (videoTracks.length > 0 && this.count >= 10) {
					var videoTrack = videoTracks[0];
					if (videoTrack.enabled === true && videoTrack.muted === true) {
						cb(false, video, stream);
						return;
					}
				}
				this.count++;
				if (this.count < this.retries) {
					$window.setTimeout(_.bind(this.start, this, video, stream, cb, err_cb), 100);
				} else {
					if (err_cb) {
						err_cb(video, stream);
					}
				}
			}
		};
		Waiter.prototype.stop = function() {
			this.stop = true;
		};

		// videoWaiter wait
		return {
			wait: function(video, stream, cb, err_cb) {
				var waiter = new Waiter();
				_.defer(function() {
					waiter.start(video, stream, cb, err_cb);
				});
				return waiter;
			}
		}

	}]


});
