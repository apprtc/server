

"use strict";
define([
	'underscore',
	'filters/displayuserid'
], function (_, displayUserid) {

	var filters = {
		displayUserid: displayUserid,
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
