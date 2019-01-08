

"use strict";
define([], function() {

	// displayConference
	return ["safeDisplayName", "translation", function(safeDisplayName, translation) {
		return function(peers) {
			if (!peers || peers.length === 0) {
				return "";
			}
			if (peers.length === 1) {
				return " " + translation._("and %s", safeDisplayName(peers[0]));
			} else {
				return " " + translation._("and %d others", peers.length);
			}
		};
	}];

});
