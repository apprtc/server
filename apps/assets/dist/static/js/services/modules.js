

"use strict";
define([], function() {

	// modules
	return ["mediaStream", function(mediaStream) {

		var enabledModules = mediaStream.config.Modules || [];

		// Public api.
		return {
			withModule: function(m) {
				return enabledModules.indexOf(m) !== -1;
			}
		}

	}];
});
