

"use strict";
define(["underscore"], function(_) {

	// Create URLs for blobs.
	var blobToObjectURL = function(blob) {
		return URL.createObjectURL(blob);
	};

	var revokeBlobURL = function(url) {
		return URL.revokeObjectURL(url);
	};

	// buddyImageSrc
	return ["buddyData", "buddyPicture", "appData", function(buddyData, buddyPicture, appData) {

		// Cache created blob urls.
		var urls = {};
		var revokeURL = function(id, url) {
			delete urls[id];
			revokeBlobURL(url);
		};

		// Cleanup helper.
		window.setInterval(function() {
			_.each(urls, function(url, id) {
				if (!buddyData.get(id)) {
					revokeURL(id, url);
				}
			});
		}, 5000);

		return function(id, display) {

			if (typeof(display) === "undefined") {
				var scope = buddyData.lookup(id, false, true);
				if (scope) {
					display = scope.display;
				}
			}
			if (display) {
				if (display.buddyPictureLocalUrl) {
					return display.buddyPictureLocalUrl;
				} else if (display.buddyPicture) {
					var url = urls[id];
					if (url) {
						revokeURL(id, url);
					}
					// No existing data. Check if service does find something.
					buddyPicture.update(display);
					if (display.buddyPictureLocalUrl) {
						return display.buddyPictureLocalUrl;
					}
					// Check if we should handle it as blob.
					url = display.buddyPicture;
					if (url.indexOf("data:") === 0) {
						var blob = buddyPicture.toBlob(url);
						url = display.buddyPictureLocalUrl = urls[id] = blobToObjectURL(blob);
						return url;
					}
					return null;
				}
			} else {
				var data = appData.get();
				if (data) {
					if (id === data.id) {
						if (data.master.buddyPicture) {
							return data.master.buddyPicture;
						}
					}
				}
			}
			return "";
		};

	}];

});
