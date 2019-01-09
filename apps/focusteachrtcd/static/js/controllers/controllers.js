

"use strict";
define([
	'underscore',

	'controllers/uicontroller',
	'controllers/chatroomcontroller',
	'controllers/usersettingscontroller',
	'controllers/contactsmanagercontroller',
	'controllers/contactsmanagereditcontroller',
	'controllers/appcontroller'], function(_, UiController, ChatroomController, UsersettingsController, ContactsmanagerController, ContactsmanagereditController, AppController) {

	var controllers = {
		UiController: UiController,
		ChatroomController: ChatroomController,
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
