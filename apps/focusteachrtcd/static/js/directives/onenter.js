

"use strict";
define([], function() {

	// onEnter
	return [function() {
		return {
			restrict: "A",
			link: function(scope, element, attrs) {
				var c = attrs.onEnter;
				element.bind("keydown keypress", function(event) {
					if (event.which === 13 && !event.shiftKey && !event.ctrlKey) {
						// On enter whithout shift or ctrl.
						event.preventDefault();
						scope.$eval(c);
						scope.$apply();
					}
				});
			}
		}
	}];

});
