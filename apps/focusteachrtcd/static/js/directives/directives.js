

"use strict";
define([
	'underscore',

	'directives/onenter',
	'directives/onescape',
	'directives/statusmessage',
	'directives/buddylist',
	'directives/buddypicturecapture',
	'directives/buddypictureupload',
	'directives/settings',
	'directives/chat',
	'directives/audiovideo',
	'directives/usability',
	'directives/audiolevel',
	'directives/fileinfo',
	// 'directives/screenshare',
	'directives/roombar',
	'directives/page',
	'directives/contactrequest',
	'directives/defaultdialog',
	'directives/pdfcanvas',
	'directives/odfcanvas',
	'directives/presentation',
	'directives/youtubevideo',
	'directives/bfi',
	'directives/title',
	'directives/welcome',
	'directives/menu',
	'directives/ui'], function(_, onEnter, onEscape, statusMessage, buddyList, buddyPictureCapture, buddyPictureUpload, settings, chat, audioVideo, usability, audioLevel, fileInfo, 
		// screenshare, 
		roomBar, 
		page, contactRequest, defaultDialog, 
		pdfcanvas, odfcanvas, presentation, youtubevideo, 
		bfi, title, welcome, menu, ui) {

	var directives = {
		onEnter: onEnter,
		onEscape: onEscape,
		statusMessage: statusMessage,
		buddyList: buddyList,
		buddyPictureCapture: buddyPictureCapture,
		buddyPictureUpload: buddyPictureUpload,
		settings: settings,
		chat: chat,
		audioVideo: audioVideo,
		usability: usability,
		audioLevel: audioLevel,
		fileInfo: fileInfo,
		// screenshare: screenshare,
		roomBar: roomBar,
		page: page,
		contactRequest: contactRequest,
		defaultDialog: defaultDialog,
		pdfcanvas: pdfcanvas,
		odfcanvas: odfcanvas,
		presentation: presentation,
		youtubevideo: youtubevideo,
		bfi: bfi,
		title: title,
		welcome: welcome,
		menu: menu,
		ui: ui
	};

	var initialize = function(angModule) {
		_.each(directives, function(directive, name) {
			angModule.directive(name, directive);
		});
	};

	return {
		initialize: initialize
	};

});
