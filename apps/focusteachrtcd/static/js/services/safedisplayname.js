

"use strict";
define([], function() {

	// safeDisplayName
	return ["safeMessage", "$filter", function(safeMessage, $filter) {

		var displayName = $filter("displayName");
		return function() {
			var s = displayName.apply(this, arguments);
			return safeMessage(s);
		}

	}];

});
