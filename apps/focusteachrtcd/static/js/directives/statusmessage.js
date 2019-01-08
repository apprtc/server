

"use strict";
define(['text!partials/statusmessage.html'], function(template) {

	// statusMessage
	return [function() {

		return {
			restrict: 'E',
			replace: true,
			template: template,
			controller: "StatusmessageController"
		}

	}];

});
