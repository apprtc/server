

"use strict";
define([], function() {

	// onEscape
	return [function() {
		return {
			restrict: "A",
			link: function(scope, element, attrs) {
				var c = attrs.onEscape;
				element.bind("keydown keypress", function(event) {
					if (event.which === 27) {
						// On escape.
						event.preventDefault();
						scope.$eval(c);
						scope.$apply();
					}
				});
			}
		}
	}];

});
