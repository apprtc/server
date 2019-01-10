

"use strict";
define([
	'underscore',

	'directives/onenter',
	'directives/onescape',
	'directives/buddylist',
	'directives/settings',
	'directives/audiovideo',
	'directives/usability',
	'directives/audiolevel',
	'directives/fileinfo',
	'directives/contactrequest',

	'directives/bfi',
	'directives/title',
	'directives/menu',
	'directives/ui'], function (_, onEnter, onEscape, buddyList,
		settings, audioVideo, usability,
		audioLevel,
		fileInfo,
		contactRequest,
		bfi, title, 
		menu, ui) {

		var directives = {
			onEnter: onEnter,
			onEscape: onEscape,
			buddyList: buddyList,
			settings: settings,
			audioVideo: audioVideo,
			usability: usability,
			audioLevel: audioLevel,
			fileInfo: fileInfo,
			contactRequest: contactRequest,
			bfi: bfi,
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
