

"use strict";
define([
	'underscore',

	'directives/onenter',
	'directives/onescape',
	'directives/buddylist',
	'directives/settings',
	'directives/chat',
	'directives/audiovideo',
	'directives/usability',
	'directives/audiolevel',
	'directives/fileinfo',
	'directives/contactrequest',

	'directives/bfi',
	'directives/title',
	'directives/welcome',
	'directives/menu',
	'directives/ui'], function (_, onEnter, onEscape, buddyList,
		settings, chat, audioVideo, usability,
		audioLevel,
		fileInfo,
		contactRequest,
		bfi, title, welcome, menu, ui) {

		var directives = {
			onEnter: onEnter,
			onEscape: onEscape,
			buddyList: buddyList,
			settings: settings,
			chat: chat,
			audioVideo: audioVideo,
			usability: usability,
			audioLevel: audioLevel,
			fileInfo: fileInfo,
			contactRequest: contactRequest,
			bfi: bfi,
			title: title,
			welcome: welcome,
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
