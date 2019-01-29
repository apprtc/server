

"use strict";
define(['angular', 'underscore'], function(angular, _) {

	// localStatus
	return ["mediaStream", "$window", function(mediaStream, $window) {

		var current = null;
		var commit = false;

		var localStatus = {
			update: function(status) {
				// Put into current.
				if (current && _.isEqual(status, current)) {
					return;
				}
				//console.log("Status update", status);
				current = angular.copy(status);
				if (!commit) {
					commit = true;
					$window.setTimeout(localStatus.commit, 1000)
				}
			},
			commit: function() {
				// TODO(longsleep): Delay the commit until connection has been established for a while and authentication is complete.
				if (commit) {
					commit = false;
					//console.log("Status update commit", current);
					mediaStream.api.updateStatus(current);
				}
			},
			clear: function() {
				current = null;
			},
			get: function() {
				return current;
			}
		};

		return localStatus;

	}];

});
