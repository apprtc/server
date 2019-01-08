

"use strict";
define(["bootstrap-file-input"], function() {

	// bfi
	return ["$timeout", function($timeout) {
		return {
			restrict: "A",
			link: function(scope, element, attrs) {
				$timeout(function() {
					// XXX(longsleep): Hack to make translation work.
					element.bootstrapFileInput();
				});
			}
		}
	}];

});
