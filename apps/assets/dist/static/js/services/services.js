

"use strict";
define([
	'underscore',
	'services/safeapply',
	'services/connector',
	'services/api',
	'services/webrtc',
	'services/mediastream',
	'services/appdata',
	'services/randomgen',
	'services/continueconnector',
	'services/localstatus',
	'services/rooms',
	'services/constraints',
	'services/modules',
	'services/dummystream',
	'services/playpromise'], function (_,
		safeApply,
		connector,
		api,
		webrtc,
		mediaStream,
		appData,
		randomGen,
		continueConnector,
		localStatus,
		rooms,
		constraints,
		modules,
		dummyStream,
		playPromise) {

		var services = {
			safeApply: safeApply,
			connector: connector,
			api: api,
			webrtc: webrtc,
			mediaStream: mediaStream,
			appData: appData,
			randomGen: randomGen,
			continueConnector: continueConnector,
			localStatus: localStatus,
			rooms: rooms,
			constraints: constraints,
			modules: modules,
			dummyStream: dummyStream,
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
