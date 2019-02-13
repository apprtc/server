

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
	'services/constraints'
], function (_,
	safeApply,
	connector,
	api,
	webrtc,
	mediaStream,
	appData,
	continueConnector,
	rooms,
	constraints
) {

		var services = {
			safeApply: safeApply,
			connector: connector,
			api: api,
			webrtc: webrtc,
			mediaStream: mediaStream,
			appData: appData,
			continueConnector: continueConnector,
			rooms: rooms,
			constraints: constraints
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
