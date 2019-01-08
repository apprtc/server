

"use strict";
define(['jquery', 'underscore'], function($, _) {

	return ["translation", "buddyData", "contacts", function(translation, buddyData, contacts) {

		var controller = ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {

			$scope.state = "request";
			$scope.doAccept = function() {
				$scope.state = "accepted";
				$scope.doContact(true);
			};

			$scope.doReject = function() {
				$scope.state = "rejected";
				$scope.doContact(false);
			};

			$scope.doContact = function(success) {
				var r = $scope.request;
				r.Success = !!success;
				$scope.sendChatServer($scope.id, "Contact request answer", {
					ContactRequest: r
				});
			};

			$scope.addContact = function(request, status) {
				contacts.add(request, status)
			};

			// Add support for contacts on controller creation.
			var request = $scope.request;
			if (request.Success && request.Userid && request.Token) {
				var buddy = buddyData.lookup($scope.id);
				var status = {};
				if (buddy) {
					$.extend(status, buddy.status);
				}
				$scope.addContact(request, status);
			}

		}];

		return {
			scope: true,
			restrict: 'EAC',
			controller: controller,
			replace: false
		}

	}];

});
