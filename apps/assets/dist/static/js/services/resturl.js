

"use strict";
define(["underscore"], function(_) {

	// restURL
	return ["globalContext", "$window", function(context, $window) {
		var RestURL = function() {};
		RestURL.prototype.room = function(name) {
			var url = this.encodeRoomURL(name);
			return $window.location.protocol + '//' + $window.location.host + context.Cfg.B + url;
		};
		RestURL.prototype.buddy = function(id) {
			return $window.location.protocol + '//' + $window.location.host + context.Cfg.B + "static/img/buddy/s46/" + id;
		};
		RestURL.prototype.api = function(path) {
			return (context.Cfg.B || "/") + "api/v1/" + path;
		};
		RestURL.prototype.encodeRoomURL = function(name, prefix, cb) {
			// Split parts so slashes are allowed.
			var parts = name.split("/");
			var url = [];
			var nn = [];
			if (typeof prefix !== "undefined") {
				url.push(prefix);
			}
			// Allow some things in room name parts.
			_.each(parts, function(p) {
				if (p === "") {
					// Skip empty parts, effectly stripping spurious slashes.
					return;
				}
				nn.push(p);
				// URL encode.
				p = $window.encodeURIComponent(p);
				// Encode back certain stuff we allow.
				p = p.replace(/^%40/, "@");
				p = p.replace(/^%24/, "$");
				p = p.replace(/^%2B/, "+");
				url.push(p);
			});
			if (cb) {
				cb(url.join("/"));
				return nn.join("/");
			}
			return url.join("/");
		};
		RestURL.prototype.createAbsoluteUrl = function(url) {
			var link = $window.document.createElement("a");
			link.href = url;
			return link.href;
		};
		return new RestURL();
	}];
});
