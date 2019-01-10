

"use strict";
define([], function() {

	// ContactsmanagerController
	return ["$scope", "$modalInstance", "contactData", "data", "contacts", "dialogs", "translation", "mediaStream", "buddyData", function($scope, $modalInstance, contactData, data, contacts, dialogs, translation, mediaStream, buddyData) {
		var getContactSessionId = function(userid) {
			var session = null;
			var scope = buddyData.lookup(userid, false, false);
			if (scope) {
				session = scope.session.get();
			}
			return session && session.Id ? session.Id : null;
		};
		$scope.header = data.header;
		$scope.contacts = [];
		$scope.openContactsManagerEdit = function(contact) {
			return dialogs.create(
				"/contactsmanager/edit.html",
				"ContactsmanagereditController",
				{
					header: translation._("Edit Contact"),
					contact: contact,
				}, {
					wc: "contactsmanager contactsmanageredit"
				}
			);
		};
		var updateContacts = function() {
			$scope.contacts = contactData.getAll();
		};
		updateContacts();
		contacts.e.on('contactadded', function() {
			updateContacts();
		});
		contacts.e.on('contactupdated', function() {
			updateContacts();
		});
		contacts.e.on('contactremoved', function() {
			updateContacts();
		});
		$scope.doCall = function(contact) {
			mediaStream.webrtc.doCall(getContactSessionId(contact.Userid));
			$modalInstance.close();
		};
	}];

});
