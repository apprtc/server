

"use strict";
define([
	'underscore',
	'services/safeapply',
	'services/connector',
	'services/api',
	'services/webrtc',
	'services/mediastream',
	'services/appdata',
	'services/buddydata',
	'services/enrichmessage',
	'services/safemessage',
	'services/toastr',
	'services/visibility',
	'services/translation',
	'services/mediasources',
	'services/randomgen',
	'services/videowaiter',
	'services/videolayout',
	'services/buddysession',
	'services/localstorage',
	'services/animationframe',
	'services/continueconnector',
	'services/localstatus',
	'services/rooms',
	'services/resturl',
	'services/constraints',
	'services/modules',
	'services/mediadevices',
	'services/dummystream',
	'services/usermedia',
	'services/playpromise'], function (_,
		safeApply,
		connector,
		api,
		webrtc,
		mediaStream,
		appData,
		buddyData,
		enrichMessage,
		safeMessage,
		toastr,
		visibility,
		translation,
		mediaSources,
		randomGen,
		videoWaiter,
		videoLayout,
		buddySession,
		localStorage,
		animationFrame,
		continueConnector,
		localStatus,
		rooms,
		restURL,
		constraints,
		modules,
		mediaDevices,
		dummyStream,
		userMedia,
		playPromise) {

		var services = {
			safeApply: safeApply,
			connector: connector,
			api: api,
			webrtc: webrtc,
			mediaStream: mediaStream,
			appData: appData,
			buddyData: buddyData,
			enrichMessage: enrichMessage,
			safeMessage: safeMessage,
			toastr: toastr,
			visibility: visibility,
			translation: translation,
			mediaSources: mediaSources,
			randomGen: randomGen,
			videoWaiter: videoWaiter,
			videoLayout: videoLayout,
			buddySession: buddySession,
			localStorage: localStorage,
			animationFrame: animationFrame,
			continueConnector: continueConnector,
			localStatus: localStatus,
			rooms: rooms,
			restURL: restURL,
			constraints: constraints,
			modules: modules,
			mediaDevices: mediaDevices,
			dummyStream: dummyStream,
			userMedia: userMedia,
			playPromise: playPromise
		};

		var initialize = function (angModule) {
			_.each(services, function (service, name) {
				angModule.factory(name, service);
			});
		};

		return {
			initialize: initialize
		};

	});
