

"use strict";
 define([], function() {

	// buddyPicture
	return ["$window", "restURL", function($window, restURL) {

		var buddyPicture = {

			update: function(data, url) {

				if (typeof(url) !== "undefined") {
					data.buddyPicture = url;
				} else {
					url = data.buddyPicture;
				}
				if (!url) {
					return;
				}

				if (url.indexOf("img:") === 0) {
					data.buddyPicture = data.buddyPictureLocalUrl = restURL.buddy(url.substr(4));
				}

			},

			toString: function(img, mime_type) {

				if (img) {
					if (typeof(mime_type) === "undefined") {
						mime_type = "image/jpeg";
					}
					var canvas = $window.document.createElement("canvas");
					canvas.width = img.naturalWidth;
					canvas.height = img.naturalHeight;
					var ctx = canvas.getContext("2d");
					ctx.drawImage(img, 0, 0);
					return canvas.toDataURL(mime_type);
				}
				return null;

			},

			toBlob: function(dataUrl, img, mime_type) {

				if (img) {
					dataUrl = buddyPicture.toString(img, mime_type);
				}

				var byteString = atob(dataUrl.split(",")[1]);
				var mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
				var ab = new ArrayBuffer(byteString.length);
				var ia = new Uint8Array(ab);
				for (var i = 0; i < byteString.length; i++) {
					ia[i] = byteString.charCodeAt(i);
				}
				return new Blob([ab], {type: mimeString});

			}

		};

		return buddyPicture;

	}];

 });
