

"use strict";
define(['visibly'], function(visibly) {
	// Visibility
	return [function() {
		var supported = visibly.isSupported();
		return {
			onVisible: visibly.onVisible,
			onHidden: visibly.onHidden,
			hidden: visibly.hidden,
			visibilityState: visibly.visibilityState,
			visibilitychange: visibly.visibilitychange,
			afterPrerendering: function(callback) {
				// Callback triggered as soon as the visibility state is not prerender.
				if (!supported || visibly.visibilityState() !== 'prerender') {
					callback();
					return false;
				}
				var complete = false;
				visibly.visibilitychange(function(state) {
					if (complete) {
						return;
					}
					if (state !== "prerender") {
						complete = true;
						callback();
					}
				});
				return true;
			}
		};
	}];
});
