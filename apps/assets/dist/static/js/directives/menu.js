

"use strict";
define(['text!partials/menu.html'], function(template) {

	// menu
	return ["modules", function(modules) {

		var link = function($scope, $element) {
			$scope.withModule = modules.withModule;
		};

		return {
			restrict: 'E',
			replace: true,
			template: template,
			link: link
		}

	}];

});
