

"use strict";
define(["jquery"], function($) {

	// displayNameForSession
	return ["$filter", function($filter) {

		return function(displayName, id) {
			if ($.trim(displayName) !== "") {
				return displayName;
			}
			return $filter("displayName")(id)
		};

	}];

});
