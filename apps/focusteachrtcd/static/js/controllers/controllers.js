

"use strict";
define([
	'underscore',

	'controllers/uicontroller',
	'controllers/usersettingscontroller',
	'controllers/contactsmanagercontroller',
	'controllers/appcontroller'], function(_, UiController, UsersettingsController, ContactsmanagerController, AppController) {

	var controllers = {
		UiController: UiController,
		UsersettingsController: UsersettingsController,
		ContactsmanagerController: ContactsmanagerController,
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
