

"use strict";
define([
	'underscore',

	'controllers/uicontroller',
	'controllers/usersettingscontroller',
	'controllers/appcontroller'], function(_, UiController, UsersettingsController, AppController) {

	var controllers = {
		UiController: UiController,
		UsersettingsController: UsersettingsController,
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
