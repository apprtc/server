

"use strict";
define([
	'underscore',
	'services/safeapply',
	'services/connector',
	'services/api',
	'services/webrtc',
	'services/mediastream',
	'services/appdata',
	'services/continueconnector',
	'services/localstatus',
	'services/rooms',
	'services/constraints',
	'services/dummystream',
	'services/playpromise'], function (_,
		safeApply,
		connector,
		api,
		webrtc,
		mediaStream,
		appData,
		continueConnector,
		localStatus,
		rooms,
		constraints,
		dummyStream,
		playPromise) {

		var services = {
			safeApply: safeApply,
			connector: connector,
			api: api,
			webrtc: webrtc,
			mediaStream: mediaStream,
			appData: appData,
			continueConnector: continueConnector,
			localStatus: localStatus,
			rooms: rooms,
			constraints: constraints,
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
