

"use strict";
define([
	'underscore',

	'filters/displayname',
	'filters/displayuserid',
	'filters/displaynameforsession'], function (_, displayName, displayUserid, displayNameForSession) {

		var filters = {
			displayName: displayName,
			displayUserid: displayUserid,
			displayNameForSession: displayNameForSession
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
