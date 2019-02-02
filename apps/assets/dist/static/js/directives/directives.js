

"use strict";
define([
	'underscore',
	'directives/audiovideo',
	'directives/ui'], function (_,
		audioVideo,
		ui) {

		var directives = {
			audioVideo: audioVideo,
			ui: ui
		};

		var initialize = function (angModule) {
			_.each(directives, function (directive, name) {
				angModule.directive(name, directive);
			});
		};

		return {
			initialize: initialize
		};

	});
