

"use strict";
define([
	'underscore',
	'filters/displayuserid',
	'filters/displaynameforsession'], function (_, displayUserid, displayNameForSession) {

		var filters = {
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
