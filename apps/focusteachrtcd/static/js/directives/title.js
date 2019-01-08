

"use strict";
define([], function() {
	return [function() {
		var link = function($scope, $element, attrs) {
			var originalText = $element.text();
			var updateTitle = function(roomName) {
				if (roomName) {
					$element.text(roomName+ " - " + originalText);
				} else {
					$element.text(originalText);
				}
			};

			$scope.$on("room.updated", function(ev, room) {
				updateTitle(room.Name);
			});

			$scope.$on("room.left", function(ev) {
				updateTitle();
			});
		};

		return {
			restrict: 'E',
			replace: false,
			link: link
		};
	}];
});
