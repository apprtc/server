

"use strict";
define([], function() {

	// ContactsmanagereditController
	return ["$scope", "$modalInstance", "data", "contacts", 'buddyData', function($scope, $modalInstance, data, contacts, buddyData) {
		$scope.header = data.header;
		$scope.contact = data.contact ? data.contact : null;
		$scope.buddySyncable = false;

		var originalDisplayName = null;
		var setContactInfo = function(contact) {
			contacts.update(contact);
		};
		if ($scope.contact) {
			originalDisplayName = $scope.contact.Status.displayName;
			var scope = buddyData.lookup($scope.contact.Userid, false, false);
			if (scope) {
				var session = scope.session.get();
				$scope.buddySyncable = session && session.Type ? true : false;
			}
		}

		$scope.removeContact = function() {
			contacts.remove($scope.contact.Userid);
			$modalInstance.close();
		};

		$scope.syncContactInfo = function() {
			var scope = buddyData.lookup($scope.contact.Userid, false, false);
			if (scope) {
				var session = scope.session.get();
				$scope.contact.Status.displayName = session.Status.displayName;
			}
		};

		$scope.save = function() {
			setContactInfo($scope.contact);
			$modalInstance.close();
		};

		$scope.cancel = function(contact) {
			$scope.contact.Status.displayName = originalDisplayName;
			$modalInstance.dismiss();
		};

	}];

});
