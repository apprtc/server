

"use strict";
define(['underscore', 'modernizr'], function(_, Modernizr) {

	var supported = Modernizr.geolocation;

	// geolocation
	return [function() {

		var defaults = {
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0
		};

		return {
			getCurrentPosition: function(success, error, options) {
				if (!supported) {
					if (error) {
						error(new Error("geolocation api is not supported"));
					}
					return
				}
				var opts = _.extend({}, defaults, options);
				navigator.geolocation.getCurrentPosition(success, error, opts);
			}
		}

	}];

});
