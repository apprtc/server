

"use strict";
define([
	'underscore',
	'directives/buddylist',
	'directives/audiovideo',
	'directives/usability',
	'directives/audiolevel',
	'directives/ui'], function (_, buddyList,
		audioVideo, usability,
		audioLevel,
		ui) {

		var directives = {
			buddyList: buddyList,
			audioVideo: audioVideo,
			usability: usability,
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
