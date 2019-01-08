

"use strict";
define(['text!partials/socialshare.html'], function(template) {

	var urls = {
		email: "mailto:?subject=_TEXT_%20_URL_",
		facebook: "https://www.facebook.com/sharer.php?u=_URL_&t=_TEXT_",
		twitter: "https://twitter.com/share?url=_URL_&text=_TEXT_&via=_SITE_",
		google: "https://plus.google.com/share?url=_URL_",
		xing: "https://www.xing.com/app/user?op=share;url=_URL_"
	};

	// socialShare
	return ["$window", "translation", "rooms", "alertify", function($window, translation, rooms, alertify) {

		var title = $window.encodeURIComponent($window.document.title);
		var makeUrl = function(nw, target) {
			var url = urls[nw];
			if (url) {
				url = url.replace(/_URL_/, $window.encodeURIComponent(target)).replace(/_TEXT_/, $window.encodeURIComponent(translation._("Meet with me here:"))).replace(/_SITE_/, title);
			}
			return url;
		};

		return {
			scope: true,
			restrict: "E",
			template: template,
			replace: true,
			link: function($scope, $element, $attr) {
				$scope.$on("room.updated", function(ev, room) {
					$scope.roomlink = rooms.link(room);
				});
				$scope.$on("room.left", function(ev) {
					$scope.roomlink = null;
				});
				$element.find("a").on("click", function(event) {
					event.preventDefault();
					var nw = event.currentTarget.getAttribute("data-nw");
					var url = makeUrl(nw, $scope.roomlink);
					if (url) {
						if (nw === "email") {
							// Hack our way to disable unload popup for mail links.
							$scope.manualReloadApp(url);
						} else {
							$window.open(url, "social_" + nw, "menubar=no,toolbar=no,resizable=yes,width=600,height=600,scrollbars=yes");
						}
					} else {
						if (nw === "link") {
							//$window.alert("Room link: " + $scope.roomlink);
							alertify.dialog.notify(translation._("Room link"), '<a href="'+$scope.roomlink+'" rel="external" target="_blank">'+$scope.roomlink+'</a>');
						}
					}
				});
			}
		}

	}];

});
