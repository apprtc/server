

"use strict";
define([
	'underscore',
	'directives/buddylist',
	'directives/settings',
	'directives/audiovideo',
	'directives/usability',
	'directives/audiolevel',
	'directives/title',
	'directives/menu',
	'directives/ui'], function (_, buddyList,
		settings, audioVideo, usability,
		audioLevel,
		title,
		menu, ui) {

		var directives = {
			buddyList: buddyList,
			settings: settings,
			audioVideo: audioVideo,
			usability: usability,
			audioLevel: audioLevel,
			title: title,
			menu: menu,
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
