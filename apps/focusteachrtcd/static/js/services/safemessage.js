

"use strict";
define([], function() {

	// safeMessage
	return ["$sanitize", "enrichMessage", function($sanitize, enrichMessage) {

		return function(s) {
			return $sanitize(enrichMessage.all(s));
		}

	}];

});
