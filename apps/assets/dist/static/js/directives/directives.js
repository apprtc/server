

"use strict";
define([
	'underscore',
	'directives/buddylist',
	'directives/audiovideo',
	'directives/ui'], function (_, buddyList,
		audioVideo,
		ui) {

		var directives = {
			buddyList: buddyList,
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
