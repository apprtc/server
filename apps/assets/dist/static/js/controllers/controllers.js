

"use strict";
define([
	'underscore',

	'controllers/uicontroller',
	'controllers/appcontroller'], function(_, UiController, AppController) {

	var controllers = {
		UiController: UiController,
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
