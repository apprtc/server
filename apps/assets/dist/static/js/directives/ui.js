

"use strict";
define(['text!partials/ui.html'], function(template) {

	// ui
	return [function() {

		return {
			restrict: 'E',
			replace: true,
			scope: false,
			controller: 'UiController',
			template: template
		}

	}];

});
