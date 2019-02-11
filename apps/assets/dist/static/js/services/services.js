

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
	'services/rooms',
	'services/constraints',
	'services/dummystream'], function (_,
		safeApply,
		connector,
		api,
		webrtc,
		mediaStream,
		appData,
		continueConnector,
		rooms,
		constraints,
		dummyStream) {

		var services = {
			safeApply: safeApply,
			connector: connector,
			api: api,
			webrtc: webrtc,
			mediaStream: mediaStream,
			appData: appData,
			continueConnector: continueConnector,
			rooms: rooms,
			constraints: constraints,
			dummyStream: dummyStream,
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
