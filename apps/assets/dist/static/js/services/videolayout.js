

"use strict";
define(["jquery", "underscore", "modernizr", "injectCSS"], function ($, _, Modernizr) {

	var renderers = {};
	var defaultSize = {
		width: 640,
		height: 360
	};
	var defaultAspectRatio = defaultSize.width / defaultSize.height;

	var getRemoteVideoSize = function (videos, streams) {
		var size = {
			width: defaultSize.width,
			height: defaultSize.height
		}
		if (videos.length) {
			if (videos.length === 1) {
				var remoteVideo = streams[videos[0]].element.find("video")[0];
				if (remoteVideo) {
					size.width = remoteVideo.videoWidth;
					size.height = remoteVideo.videoHeight;
					console.log("Remote video size: ", size);
				}
			}
		}
		return size;
	};

	var dynamicCSSContainer = "audiovideo-dynamic";
	var injectCSS = function (css) {
		$.injectCSS(css, {
			containerName: dynamicCSSContainer,
			truncateFirst: true,
			useRawValues: true
		});
	};

	var objectFitSupport = Modernizr["object-fit"] && true;

	// videoLayout
	return ["$window", "playPromise", function ($window, playPromise) {

		// Invisible layout (essentially shows nothing).
		var Invisible = function (container, scope, controller) { };
		Invisible.prototype.name = "invisible";
		Invisible.prototype.render = function () { };
		Invisible.prototype.close = function () { };


		// Video layout with all videos rendered the same size.
		var OnePeople = function (container, scope, controller) { };

		OnePeople.prototype.name = "onepeople";

		OnePeople.prototype.render = function (container, size, scope, videos, streams) {

			if (this.closed) {
				return;
			}

			var videoWidth;
			var videoHeight;

			if (videos.length) {
				var remoteSize = getRemoteVideoSize(videos, streams);
				videoWidth = remoteSize.width;
				videoHeight = remoteSize.height;
			}

			if (!videos.length) {
				return;
			}

			if (!videoWidth) {
				videoWidth = defaultSize.width;
			}
			if (!videoHeight) {
				videoHeight = defaultSize.height;
			}

			if (this.countSelfAsRemote) {
				videos.unshift(null);
			}

			var innerHeight = size.height;
			var innerWidth = size.width;

			// We use the same aspect ratio to make all videos look the same.
			var aspectRatio = defaultAspectRatio;

			console.log("resize", innerHeight, innerWidth);
			console.log("resize", container, videos.length, aspectRatio, innerHeight, innerWidth);

			console.log("doc size", document.documentElement.clientWidth, document.documentElement.clientHeight);
			var extraCSS = {};

			var space = innerHeight * innerWidth; // square pixels
			var videoSpace = space / videos.length;
			var singleVideoWidthOptimal = Math.pow(videoSpace * aspectRatio, 0.5);
			var videosPerRow = Math.ceil(innerWidth / singleVideoWidthOptimal);
			if (videosPerRow > videos.length) {
				videosPerRow = videos.length;
			}
			var singleVideoWidth = Math.ceil(innerWidth / videosPerRow);
			var singleVideoHeight = Math.ceil(singleVideoWidth / aspectRatio);
			var newContainerWidth = (videosPerRow * singleVideoWidth);
			var newContainerHeight = Math.ceil(videos.length / videosPerRow) * singleVideoHeight;
			if (newContainerHeight > innerHeight) {
				var tooHigh = (newContainerHeight - innerHeight) / Math.ceil(videos.length / videosPerRow);
				singleVideoHeight -= tooHigh;
				singleVideoWidth = singleVideoHeight * aspectRatio;
			}

			console.log("space", space);
			console.log("videospace", videoSpace);
			console.log("singleVideoWidthOptimal", singleVideoWidthOptimal);
			console.log("videosPerRow", videosPerRow);
			console.log("singleVideoWidth", singleVideoWidth);
			console.log("singleVideoHeight", singleVideoHeight);

			container.style.width = newContainerWidth + "px";
			container.style.left = ((innerWidth - newContainerWidth) / 2) + 'px';
			extraCSS[".renderer-" + this.name + " .remoteVideos"] = {
				">div": {
					width: singleVideoWidth + "px",
					height: singleVideoHeight + "px"
				}
			};

			injectCSS(extraCSS);

		};

		OnePeople.prototype.close = function (container, scope, controller) {

			this.closed = true;

		};



		// Register renderers.
		renderers[Invisible.prototype.name] = Invisible;
		renderers[OnePeople.prototype.name] = OnePeople;

		// Helper for class name generation.
		var makeName = function (prefix, n, camel) {
			var r = prefix;
			if (camel) {
				r = r + n.charAt(0).toUpperCase() + n.slice(1);
			} else {
				r = r + "-" + n;
			}
			return r;
		};

		// Public api.
		var current = null;
		var body = $("body");
		return {
			update: function (name, size, scope, controller) {

				var videos = _.keys(controller.streams);
				var streams = controller.streams;
				var container = scope.container;
				var layoutparent = scope.layoutparent;

				if (!current) {
					current = new renderers[name](container, scope, controller)
					console.log("Created new video layout renderer", name, current);
					$(layoutparent).addClass(makeName("renderer", name));
					body.addClass(makeName("videolayout", name, true));
					return true;
				} else if (current && current.name !== name) {
					current.close(container, scope, controller);
					$(container).removeAttr("style");
					$(layoutparent).removeClass(makeName("renderer", current.name));
					body.removeClass(makeName("videolayout", current.name, true));
					current = new renderers[name](container, scope, controller)
					$(layoutparent).addClass(makeName("renderer", name));
					body.addClass(makeName("videolayout", name, true));
					console.log("Switched to new video layout renderer", name, current);
					return true;
				}

				return current.render(container, size, scope, videos, streams);

			},
			register: function (name, impl) {
				renderers[name] = impl;
			},
			layouts: function () {
				return _.keys(renderers);
			}
		}

	}];

});
