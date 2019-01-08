

"use strict";
define(['text!partials/page.html', 'text!partials/page/welcome.html'], function(template, welcome) {

	return ["$templateCache", "$timeout", "rooms", function($templateCache, $timeout, rooms) {

		$templateCache.put('page/welcome.html', welcome);

		var link = function($scope, $element, attrs) {
			$scope.$on("room.joined", function(event) {
				// Show no page when joined a room.
				$scope.page = null;
			});
			$scope.$on("room.random", function(ev, roomdata) {
				// Show welcome page on room random events.
				$scope.layout.roombar = false;
				$timeout(function() {
					$scope.page = "page/welcome.html";
				});
			});
		};

		return {
			restrict: 'E',
			replace: true,
			template: template,
			link: link
		};
	}];

});
