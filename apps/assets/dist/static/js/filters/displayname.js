

"use strict";
define([], function() {

	// displayName
	return ["buddyData", "appData", "translation", function(buddyData, appData, translation) {
		var group_chat_id = "";
		var someones = {
			count: 1
		};
		var user_text = translation._("User");
		var someone_text = translation._("Someone");
		var me_text = translation._("Me");
		var filter = function(id, me_ok) {
			if (id === group_chat_id) {
				return "";
			}
			var scope = buddyData.lookup(id, false, true);
			if (scope) {
				if (scope.display.displayName) {
					return scope.display.displayName;
				}
				return user_text + " " + scope.buddyIndex;
			} else {
				var data = appData.get();
				if (data) {
					if (id === data.id) {
						if (me_ok) {
							return me_text;
						}
						if (data.master.displayName) {
							return data.master.displayName;
						}
						return me_text;
					}
				}
				var someone = someones[id];
				if (!someone) {
					someone = someone_text + " " + someones.count++;
					someones[id] = someone;
				}
				return someone;
			}
		};
		// TODO(evan) Improve filter to reduce need for constant calling as name may change but id didn't.
		// https://github.com/angular/angular.js/commit/fca6be71274e537c7df86ae9e27a3bd1597e9ffa
		filter.$stateful = true;
		return filter;
	}];

});
