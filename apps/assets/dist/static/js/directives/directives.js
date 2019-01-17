

"use strict";
define([
	'underscore',
	'directives/buddylist',
	'directives/audiovideo',
	'directives/audiolevel',
	'directives/ui'], function (_, buddyList,
		audioVideo,
		audioLevel,
		ui) {

		var directives = {
			buddyList: buddyList,
			audioVideo: audioVideo,
			audioLevel: audioLevel,
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
