

"use strict";
define([
	'underscore',

	'filters/displayname',
	'filters/displayconference',
	'filters/displayuserid',
	'filters/displaynameforsession',
	'filters/formatbase1000'], function (_, displayName, displayConference, displayUserid, displayNameForSession, formatBase1000) {

		var filters = {
			displayName: displayName,
			displayConference: displayConference,
			displayUserid: displayUserid,
			displayNameForSession: displayNameForSession,
			formatBase1000: formatBase1000
		};

		var initialize = function (angModule) {
			_.each(filters, function (filter, name) {
				angModule.filter(name, filter);
			})
		}

		return {
			initialize: initialize
		};

	});
