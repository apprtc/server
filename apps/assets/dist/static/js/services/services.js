

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
	'services/visibility',
	'services/mediasources',
	'services/randomgen',
	'services/videowaiter',
	'services/buddysession',
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
		visibility,
		mediaSources,
		randomGen,
		videoWaiter,
		buddySession,
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
			visibility: visibility,
			mediaSources: mediaSources,
			randomGen: randomGen,
			videoWaiter: videoWaiter,
			buddySession: buddySession,
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
