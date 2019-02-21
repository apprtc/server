

"use strict";
define([
	'underscore',

	'controllers/uicontroller'], function (_, UiController) {

		var controllers = {
			UiController: UiController,

		};

		var initialize = function (angModule) {
			_.each(controllers, function (controller, name) {
				angModule.controller(name, controller);
			})
		}

		return {
			initialize: initialize
		};

	});
