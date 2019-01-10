

"use strict";
define([
	'underscore',

	'controllers/uicontroller',
	'controllers/usersettingscontroller',
	'controllers/contactsmanagercontroller',
	'controllers/contactsmanagereditcontroller',
	'controllers/appcontroller'], function(_, UiController, UsersettingsController, ContactsmanagerController, ContactsmanagereditController, AppController) {

	var controllers = {
		UiController: UiController,
		UsersettingsController: UsersettingsController,
		ContactsmanagerController: ContactsmanagerController,
		ContactsmanagereditController: ContactsmanagereditController,
		AppController: AppController
	};

	var initialize = function(angModule) {
		_.each(controllers, function(controller, name) {
			angModule.controller(name, controller);
		})
	}

	return {
		initialize: initialize
	};

});
